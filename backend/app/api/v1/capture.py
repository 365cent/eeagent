"""Unified capture entry (P0-4): ONE input, any source.

`POST /api/v1/capture` (multipart) accepts a file (HTML snapshot / document)
or a URL plus a file. URL-only fetching is an explicit local-development
option and is always disabled in production. Routing:

- HTML bytes (uploaded html file, or a fetched text/html page)
    → snapshot path: parse + archive + signal (shared with /signals/capture)
- anything else (uploaded document, or a fetched non-HTML file)
    → document path: raw blob + MarkItDown/vision ingest + derived signal

Both paths reuse the existing pipelines verbatim (POST /signals/capture and
POST /documents/raw + POST /signals with document_id); this endpoint only
dispatches, so behavior and dedupe semantics stay identical. The old
endpoints remain for the browser extension and API callers.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from functools import partial

from anyio import to_thread
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile

from app.core.capture_identity import assert_capture_job_access, get_capture_identity
from app.core.identity import OperatorIdentity
from app.services.orphan_objects import record_orphan_object, resolve_orphan_object
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.platform.launchdarkly import EVIDENCE_CAPTURE, require_feature, track_workflow_success
from app.db.base import get_db
from app.models.models import CaptureJob, Document, Signal
from app.schemas.schemas import CaptureJobOut, CaptureResult
from app.services.doc_ingest import normalize_document_mime
from app.services.objectstore import save_bytes
from app.services.refcodes import codes, normalize as normalize_ref_code
from app.services.url_fetch import FetchError, fetch_url
from app.domains.capture.document_path import _document_path
from app.domains.capture.submission import _is_html, _submission_fingerprint
from app.domains.evidence.html_capture import _signal_from_html
from app.domains.evidence.signal_queries import get_signal_detail

from app.domains.evidence.document_pipeline import document_raw_out as _raw_out

router = APIRouter(
    prefix="/capture",
    tags=["capture"],
    dependencies=[Depends(require_feature(EVIDENCE_CAPTURE))],
)


async def _signal_detail(db: AsyncSession, signal_id: uuid.UUID):
    detail = await get_signal_detail(db, signal_id)
    if detail is None:
        raise HTTPException(404, "signal not found")
    return detail


async def _capture_result(db: AsyncSession, signal: Signal, *, via: str) -> CaptureResult:
    track_workflow_success(EVIDENCE_CAPTURE)
    document_out = None
    if signal.document_id is not None:
        document = await db.get(Document, signal.document_id)
        if document is not None:
            document_out = _raw_out(document)
    return CaptureResult(
        source="document" if signal.document_id is not None else "html-snapshot",
        via=via,
        signal=await _signal_detail(db, signal.id),
        document=document_out,
    )


async def _capture_job_out(db: AsyncSession, job: CaptureJob) -> CaptureJobOut:
    result = None
    if job.status == "succeeded" and job.signal_id is not None:
        signal = await db.get(Signal, job.signal_id)
        if signal is not None:
            try:
                result = await _capture_result(db, signal, via=job.via)
            except Exception as exc:  # noqa: BLE001 — job succeeded; omit result instead of 500
                import logging

                logging.getLogger(__name__).exception(
                    "capture job %s result assembly failed: %s",
                    job.id,
                    exc.__class__.__name__,
                )
    return CaptureJobOut(
        id=job.id,
        submission_id=job.submission_id,
        status=job.status,
        stage=job.stage,
        attempt_count=job.attempt_count,
        created_at=job.created_at,
        updated_at=job.updated_at,
        started_at=job.started_at,
        heartbeat_at=job.heartbeat_at,
        finished_at=job.finished_at,
        cancel_requested_at=job.cancel_requested_at,
        signal_id=job.signal_id,
        error=job.error,
        result=result,
        source_url=job.source_url,
        channel_code=job.channel_code,
        import_batch_id=job.import_batch_id,
    )


@router.post("", response_model=CaptureResult, status_code=201)
async def capture(
    url: str | None = Form(None),
    file: UploadFile | None = File(None),
    publisher: str | None = Form(None),
    source_label: str | None = Form(None),
    channel_code: str | None = Form(None),
    submission_id: uuid.UUID | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """One entry for everything: drop a file OR paste a link.

    - file=HTML (or url + html file, the extension case) → snapshot signal
    - file=document / url pointing at a document → document + derived signal
    - url only → optional local-development fetch; production requires a
      user-side browser snapshot upload
    """
    data = b""
    if file is not None:
        upload_limit = get_settings().doc_raw_upload_max_bytes
        data = await file.read(upload_limit + 1)
        if len(data) > upload_limit:
            raise HTTPException(413, f"capture file exceeds {upload_limit} bytes")
    if not data and not url:
        raise HTTPException(422, "请提供 file 或 url（二选一）")
    if channel_code is not None:
        normalized_channel = normalize_ref_code("channel", channel_code)
        if normalized_channel is None:
            raise HTTPException(
                422,
                f"channel_code 不在封闭词表内，可选值: {', '.join(codes('channel'))}",
            )
        channel_code = normalized_channel

    via = "upload" if data else "server-fetch"
    fingerprint = _submission_fingerprint(
        url=url,
        data=data,
        filename=file.filename if data and file is not None else None,
        mime=file.content_type if data and file is not None else None,
        channel_code=channel_code,
        publisher=publisher,
        source_label=source_label,
    )
    if submission_id is not None:
        existing_job = (
            await db.execute(
                select(CaptureJob).where(CaptureJob.submission_id == submission_id)
            )
        ).scalar_one_or_none()
        if existing_job is not None:
            if existing_job.fingerprint != fingerprint:
                raise HTTPException(409, "submission_id was already used for a different capture")
            if existing_job.status == "succeeded":
                response = await _capture_job_out(db, existing_job)
                if response.result is not None:
                    return response.result
                raise HTTPException(409, "capture job is complete but its signal is unavailable")
            raise HTTPException(
                409,
                f"submission is {existing_job.status}; poll or retry /api/v1/capture/jobs/{existing_job.id}",
            )
        existing = (
            await db.execute(
                select(Signal).where(Signal.capture_submission_id == submission_id)
            )
        ).scalar_one_or_none()
        if existing is not None:
            if existing.capture_submission_sha256 != fingerprint:
                raise HTTPException(409, "submission_id was already used for a different capture")
            return await _capture_result(db, existing, via=via)

    if not data:
        settings = get_settings()
        if settings.app_env == "production" or not settings.capture_server_fetch_enabled:
            raise HTTPException(
                422,
                "服务端 URL 抓取已禁用；请在用户侧浏览器采集页面并上传快照文件",
            )
        try:
            page = await fetch_url(url)
        except FetchError as exc:
            raise HTTPException(422, str(exc)) from exc
        data, filename, mime = page.data, page.filename, page.content_type
        url = page.final_url
    else:
        filename = file.filename if file is not None else None
        mime = (
            normalize_document_mime(filename, file.content_type)
            if file is not None
            else None
        )

    if len(data) > get_settings().doc_raw_upload_max_bytes:
        raise HTTPException(413, f"capture file exceeds {get_settings().doc_raw_upload_max_bytes} bytes")

    if _is_html(mime=mime, filename=filename):
        # html evidence needs a source url; uploaded html without one is its own origin
        source_url = url or f"eea://capture/html/{uuid.uuid4()}"
        sig = await _signal_from_html(
            db,
            url=source_url,
            data=data,
            channel_code=channel_code,
            html_label="file",
            capture_submission_id=submission_id,
            capture_submission_sha256=fingerprint if submission_id is not None else None,
        )
        return await _capture_result(db, sig, via=via)

    sig, _ = await _document_path(
        db,
        data=data,
        filename=filename,
        mime=mime,
        source_url=url,
        publisher=publisher,
        source_label=source_label,
        channel_code=channel_code,
        capture_submission_id=submission_id,
        capture_submission_sha256=fingerprint if submission_id is not None else None,
        vision_captions=True,
    )
    return await _capture_result(db, sig, via=via)


@router.post("/jobs", response_model=CaptureJobOut, status_code=202)
async def create_capture_job(
    url: str | None = Form(None),
    file: UploadFile | None = File(None),
    publisher: str | None = Form(None),
    source_label: str | None = Form(None),
    channel_code: str | None = Form(None),
    submission_id: uuid.UUID = Form(...),
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_capture_identity),
):
    """Persist a capture request and return before document parsing begins.

    The caller supplies a stable submission ID. Retrying this POST with the
    same ID and payload returns the existing durable job, including when the
    original response was lost.
    """
    settings = get_settings()
    data = b""
    if file is not None:
        data = await file.read(settings.doc_raw_upload_max_bytes + 1)
        if len(data) > settings.doc_raw_upload_max_bytes:
            raise HTTPException(413, f"capture file exceeds {settings.doc_raw_upload_max_bytes} bytes")
    if not data and not url:
        raise HTTPException(422, "请提供 file 或 url（二选一）")
    if channel_code is not None:
        channel_code = normalize_ref_code("channel", channel_code)
        if channel_code is None:
            raise HTTPException(
                422,
                f"channel_code 不在封闭词表内，可选值: {', '.join(codes('channel'))}",
            )
    via = "upload" if data else "server-fetch"
    if not data and (settings.app_env == "production" or not settings.capture_server_fetch_enabled):
        raise HTTPException(
            422,
            "服务端 URL 抓取已禁用；请在用户侧浏览器采集页面并上传快照文件",
        )

    filename = file.filename if file is not None and data else None
    mime = (
        normalize_document_mime(filename, file.content_type)
        if file is not None and data
        else None
    )
    fingerprint = _submission_fingerprint(
        url=url,
        data=data,
        filename=filename,
        mime=mime,
        channel_code=channel_code,
        publisher=publisher,
        source_label=source_label,
    )
    existing = (
        await db.execute(
            select(CaptureJob).where(CaptureJob.submission_id == submission_id)
        )
    ).scalar_one_or_none()
    if existing is not None:
        if existing.fingerprint != fingerprint:
            raise HTTPException(409, "submission_id was already used for a different capture")
        return await _capture_job_out(db, existing)

    payload_key: str | None = None
    existing_signal = (
        await db.execute(
            select(Signal).where(Signal.capture_submission_id == submission_id)
        )
    ).scalar_one_or_none()
    if existing_signal is not None:
        if existing_signal.capture_submission_sha256 != fingerprint:
            raise HTTPException(409, "submission_id was already used for a different capture")
        job = CaptureJob(
            id=uuid.uuid4(),
            submission_id=submission_id,
            fingerprint=fingerprint,
            via=via,
            status="succeeded",
            stage="completed",
            signal_id=existing_signal.id,
            attempt_count=0,
            finished_at=datetime.now(timezone.utc),
            owner_subject=actor.subject,
        )
    else:
        payload_key = (
            await to_thread.run_sync(partial(save_bytes, data, folder="capture-jobs", ext="bin"))
            if data
            else None
        )
        source_url = url
        if data and not source_url and _is_html(mime=mime, filename=filename):
            source_url = f"eea://capture/html/{submission_id}"
        job = CaptureJob(
            id=uuid.uuid4(),
            submission_id=submission_id,
            fingerprint=fingerprint,
            source_url=source_url,
            publisher=publisher,
            source_label=source_label,
            channel_code=channel_code,
            filename=filename,
            mime=mime,
            payload_object_key=payload_key,
            payload_size=len(data),
            via=via,
            status="queued",
            owner_subject=actor.subject,
        )
    db.add(job)
    try:
        await db.commit()
        if job.payload_object_key:
            await resolve_orphan_object(db, job.payload_object_key)
            await db.commit()
    except IntegrityError:
        await db.rollback()
        if payload_key:
            await record_orphan_object(db, payload_key, "capture job commit failed")
            await db.commit()
        existing = (
            await db.execute(
                select(CaptureJob).where(CaptureJob.submission_id == submission_id)
            )
        ).scalar_one_or_none()
        if existing is None:
            raise
        if existing.fingerprint != fingerprint:
            raise HTTPException(409, "submission_id was already used for a different capture")
        return await _capture_job_out(db, existing)
    await db.refresh(job)
    return await _capture_job_out(db, job)


@router.get("/jobs", response_model=list[CaptureJobOut])
async def list_capture_jobs(
    status: str | None = Query(None),
    import_batch_id: uuid.UUID | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_capture_identity),
):
    q = select(CaptureJob).order_by(CaptureJob.created_at).limit(limit)
    if actor.role != "platform_admin":
        q = q.where(CaptureJob.owner_subject == actor.subject)
    if status:
        q = q.where(CaptureJob.status == status)
    if import_batch_id is not None:
        q = q.where(CaptureJob.import_batch_id == import_batch_id)
    jobs = (await db.execute(q)).scalars().all()
    return [await _capture_job_out(db, job) for job in jobs]


@router.post("/jobs/{job_id}/claim", response_model=CaptureJobOut)
async def claim_capture_job_for_client(
    job_id: uuid.UUID,
    worker_id: str = Form("capture-client"),
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_capture_identity),
):
    result = await db.execute(
        select(CaptureJob).where(CaptureJob.id == job_id).with_for_update()
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(404, "capture job not found")
    assert_capture_job_access(job.owner_subject, actor)
    if job.status != "awaiting_client":
        raise HTTPException(409, f"job is not awaiting client capture (status={job.status})")
    now = datetime.now(timezone.utc)
    job.status = "running"
    job.stage = "capturing"
    job.worker_id = worker_id[:120]
    job.lease_until = now + timedelta(minutes=30)
    job.started_at = job.started_at or now
    await db.commit()
    await db.refresh(job)
    return await _capture_job_out(db, job)


def _worker_id_matches(job_worker: str | None, caller_worker: str) -> bool:
    if not job_worker:
        return True
    prefix = caller_worker.split(":")[0]
    return job_worker == caller_worker or job_worker.startswith(prefix)


@router.post("/jobs/{job_id}/client-release", response_model=CaptureJobOut)
async def client_release_capture_job(
    job_id: uuid.UUID,
    worker_id: str = Form("capture-client"),
    reason: str = Form("Client released job back to import queue."),
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_capture_identity),
):
    """Return a reserved import job to awaiting_client (abort, disconnect, retry)."""
    result = await db.execute(
        select(CaptureJob).where(CaptureJob.id == job_id).with_for_update()
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(404, "capture job not found")
    assert_capture_job_access(job.owner_subject, actor)
    if job.status != "running" or job.stage != "capturing":
        raise HTTPException(409, f"job is not held for client capture (status={job.status}, stage={job.stage})")
    if job.payload_object_key:
        raise HTTPException(409, "job already has an uploaded payload")
    if job.worker_id and not _worker_id_matches(job.worker_id, worker_id):
        raise HTTPException(409, "job is held by another client")
    job.status = "awaiting_client"
    job.stage = "awaiting_client"
    job.worker_id = None
    job.lease_until = None
    job.error = (reason or "Client released job back to import queue.")[:2000]
    await db.commit()
    await db.refresh(job)
    if job.import_batch_id is not None:
        from app.services.panorama_import import refresh_batch_capture_stats

        await refresh_batch_capture_stats(db, job.import_batch_id)
    return await _capture_job_out(db, job)


@router.post("/jobs/{job_id}/client-fail", response_model=CaptureJobOut)
async def client_fail_capture_job(
    job_id: uuid.UUID,
    worker_id: str = Form("capture-client"),
    error: str = Form(...),
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_capture_identity),
):
    """Record a terminal client-side capture failure (page load, captcha, etc.)."""
    result = await db.execute(
        select(CaptureJob).where(CaptureJob.id == job_id).with_for_update()
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(404, "capture job not found")
    assert_capture_job_access(job.owner_subject, actor)
    if job.status not in {"awaiting_client", "running"}:
        raise HTTPException(409, f"job cannot be failed from client (status={job.status})")
    if job.status == "running" and job.worker_id and not _worker_id_matches(job.worker_id, worker_id):
        raise HTTPException(409, "job is held by another client")
    now = datetime.now(timezone.utc)
    job.status = "failed"
    job.stage = "failed"
    job.error = error[:2000]
    job.worker_id = None
    job.lease_until = None
    job.finished_at = now
    await db.commit()
    await db.refresh(job)
    if job.import_batch_id is not None:
        from app.services.panorama_import import refresh_batch_capture_stats

        await refresh_batch_capture_stats(db, job.import_batch_id)
    return await _capture_job_out(db, job)


@router.post("/jobs/{job_id}/client-submit", response_model=CaptureJobOut)
async def client_submit_capture_job(
    job_id: uuid.UUID,
    file: UploadFile = File(...),
    worker_id: str = Form("capture-client"),
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_capture_identity),
):
    """Attach browser-captured bytes to a panorama import job and queue server processing."""
    settings = get_settings()
    data = await file.read(settings.doc_raw_upload_max_bytes + 1)
    if len(data) > settings.doc_raw_upload_max_bytes:
        raise HTTPException(413, f"capture file exceeds {settings.doc_raw_upload_max_bytes} bytes")
    result = await db.execute(
        select(CaptureJob).where(CaptureJob.id == job_id).with_for_update()
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(404, "capture job not found")
    assert_capture_job_access(job.owner_subject, actor)
    if job.status not in {"awaiting_client", "running"}:
        raise HTTPException(409, f"job cannot accept client upload (status={job.status})")
    if job.status == "running" and job.worker_id and not _worker_id_matches(job.worker_id, worker_id):
        raise HTTPException(409, "job is held by another client")
    filename = file.filename
    mime = normalize_document_mime(filename, file.content_type)
    payload_key = await to_thread.run_sync(partial(save_bytes, data, folder="capture-jobs", ext="bin"))
    job.payload_object_key = payload_key
    job.payload_size = len(data)
    job.filename = filename
    job.mime = mime
    job.via = "upload"
    job.status = "queued"
    job.stage = "queued"
    job.worker_id = None
    job.lease_until = None
    job.error = None
    job.available_at = datetime.now(timezone.utc)
    job.fingerprint = _submission_fingerprint(
        url=job.source_url,
        data=data,
        filename=filename,
        mime=mime,
        channel_code=job.channel_code,
        publisher=job.publisher,
        source_label=job.source_label,
    )
    await db.commit()
    await db.refresh(job)
    return await _capture_job_out(db, job)


@router.get("/jobs/{job_id}", response_model=CaptureJobOut)
async def get_capture_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_capture_identity),
):
    job = await db.get(CaptureJob, job_id)
    if job is None:
        raise HTTPException(404, "capture job not found")
    assert_capture_job_access(job.owner_subject, actor)
    return await _capture_job_out(db, job)


@router.post("/jobs/{job_id}/retry", response_model=CaptureJobOut, status_code=202)
async def retry_capture_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_capture_identity),
):
    result = await db.execute(
        select(CaptureJob).where(CaptureJob.id == job_id).with_for_update()
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(404, "capture job not found")
    assert_capture_job_access(job.owner_subject, actor)
    if job.status != "failed":
        raise HTTPException(409, f"only failed jobs can be retried (status={job.status})")
    job.status = "queued"
    job.stage = "queued"
    job.attempt_count = 0
    job.available_at = datetime.now(timezone.utc)
    job.lease_until = None
    job.worker_id = None
    job.error = None
    job.started_at = None
    job.finished_at = None
    await db.commit()
    await db.refresh(job)
    return await _capture_job_out(db, job)


@router.post("/jobs/{job_id}/cancel", response_model=CaptureJobOut)
async def cancel_capture_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_capture_identity),
):
    result = await db.execute(
        select(CaptureJob).where(CaptureJob.id == job_id).with_for_update()
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(404, "capture job not found")
    assert_capture_job_access(job.owner_subject, actor)
    if job.status == "queued":
        job.status = "cancelled"
        job.stage = "cancelled"
        job.error = None
        job.finished_at = datetime.now(timezone.utc)
    elif job.status == "running":
        job.cancel_requested_at = datetime.now(timezone.utc)
    else:
        raise HTTPException(409, f"job cannot be cancelled (status={job.status})")
    await db.commit()
    await db.refresh(job)
    return await _capture_job_out(db, job)
