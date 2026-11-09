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

import json
import uuid
from datetime import datetime, timezone
from functools import partial
from pathlib import Path

from anyio import to_thread
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.base import get_db
from app.models.models import CaptureJob, Document, Signal
from app.schemas.schemas import CaptureJobOut, CaptureResult, DocumentRawOut
from app.services.doc_summary import build_document_body_summary
from app.services.objectstore import load_bytes, save_bytes
from app.services.objectstore import sha256_bytes
from app.services.refcodes import codes, normalize as normalize_ref_code
from app.services.url_fetch import FetchError, fetch_url

from app.api.v1.documents import _ingest as _ingest_document
from app.api.v1.documents import _raw_out
from app.api.v1.signals import (
    _create_signal_record,
    _document_title,
    _infer_channel_code,
    _signal_from_html,
    get_signal,
)

router = APIRouter(prefix="/capture", tags=["capture"])

_HTML_SUFFIXES = {".html", ".htm", ".xhtml"}


def _is_html(*, mime: str | None, filename: str | None) -> bool:
    # split off charset parameters ("text/html; charset=utf-8")
    base = (mime or "").split(";")[0].strip().lower()
    if base == "text/html":
        return True
    return bool(filename) and Path(filename).suffix.lower() in _HTML_SUFFIXES


def _submission_fingerprint(
    *,
    url: str | None,
    data: bytes,
    filename: str | None,
    mime: str | None,
    channel_code: str | None,
    publisher: str | None,
    source_label: str | None,
) -> str:
    payload = {
        "url": url,
        "content_sha256": sha256_bytes(data) if data else None,
        "filename": filename if data else None,
        "mime": mime if data else None,
        "channel_code": channel_code,
        "publisher": publisher,
        "source_label": source_label,
    }
    canonical = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return sha256_bytes(canonical.encode("utf-8"))


async def _capture_result(db: AsyncSession, signal: Signal, *, via: str) -> CaptureResult:
    document_out = None
    if signal.document_id is not None:
        document = await db.get(Document, signal.document_id)
        if document is not None:
            document_out = _raw_out(document)
    return CaptureResult(
        source="document" if signal.document_id is not None else "html-snapshot",
        via=via,
        signal=await get_signal(signal.id, db),
        document=document_out,
    )


async def _capture_job_out(db: AsyncSession, job: CaptureJob) -> CaptureJobOut:
    result = None
    if job.status == "succeeded" and job.signal_id is not None:
        signal = await db.get(Signal, job.signal_id)
        if signal is not None:
            result = await _capture_result(db, signal, via=job.via)
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
        signal_id=job.signal_id,
        error=job.error,
        result=result,
    )


async def _document_path(
    db: AsyncSession,
    *,
    data: bytes,
    filename: str | None,
    mime: str | None,
    source_url: str | None,
    publisher: str | None = None,
    source_label: str | None = None,
    channel_code: str | None = None,
    capture_submission_id: uuid.UUID | None = None,
    capture_submission_sha256: str | None = None,
) -> tuple[Signal, DocumentRawOut]:
    """Document bytes → raw blob + ingest + derived signal (mirrors
    POST /documents/raw dedupe + POST /signals document_id path)."""
    if not data:
        raise HTTPException(422, "file 为空：拒绝存储空文档（REQ-SIG-10 证据留存原则）")
    digest = sha256_bytes(data)
    doc = (
        await db.execute(select(Document).where(Document.sha256 == digest))
    ).scalar_one_or_none()
    if doc is None:
        object_key = save_bytes(data, folder="documents", ext="bin")
        stmt = (
            pg_insert(Document)
            .values(
                sha256=digest,
                mime=mime or "application/octet-stream",
                size=len(data),
                filename=filename,
                object_key=object_key,
                uploaded_by="local-admin",
            )
            .on_conflict_do_nothing(index_elements=["sha256"])
            .returning(Document)
        )
        inserted = (await db.execute(stmt)).scalar_one_or_none()
        if inserted is None:
            await db.rollback()
            doc = (
                await db.execute(select(Document).where(Document.sha256 == digest))
            ).scalar_one()
        else:
            await db.commit()
            await db.refresh(inserted)
            doc = inserted
    if doc.ingest_status != "parsed":
        await _ingest_document(db, doc, data)
    # derived signal (S1-3): summary body, server-default title/url
    canonical = ""
    if doc.canonical_md_object_key:
        blob = load_bytes(doc.canonical_md_object_key)
        if blob is not None:
            canonical = blob.decode("utf-8", errors="replace")
    body_text = build_document_body_summary(doc.filename or "", canonical)
    url = source_url or f"eea://document/{doc.id}"
    sig = await _create_signal_record(
        db,
        title=_document_title(doc),
        url=url,
        # documents have no host to infer from; the closed vocab only has the two channels
        evidence_status_code="retained" if body_text else "fetching",
        channel_code=channel_code or (_infer_channel_code(source_url) if source_url else "web"),
        publisher=publisher,
        source_label=source_label,
        excerpt=body_text[:200] if body_text else None,
        body_text=body_text or None,
        document_id=doc.id,
        capture_submission_id=capture_submission_id,
        capture_submission_sha256=capture_submission_sha256,
    )
    return sig, _raw_out(doc)


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
        mime = file.content_type if file is not None else None

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
    mime = file.content_type if file is not None and data else None
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
        )
    db.add(job)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
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


@router.get("/jobs/{job_id}", response_model=CaptureJobOut)
async def get_capture_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    job = await db.get(CaptureJob, job_id)
    if job is None:
        raise HTTPException(404, "capture job not found")
    return await _capture_job_out(db, job)


@router.post("/jobs/{job_id}/retry", response_model=CaptureJobOut, status_code=202)
async def retry_capture_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CaptureJob).where(CaptureJob.id == job_id).with_for_update()
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(404, "capture job not found")
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
async def cancel_capture_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CaptureJob).where(CaptureJob.id == job_id).with_for_update()
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(404, "capture job not found")
    if job.status != "queued":
        raise HTTPException(409, f"only queued jobs can be cancelled (status={job.status})")
    job.status = "cancelled"
    job.stage = "cancelled"
    job.error = None
    job.finished_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(job)
    return await _capture_job_out(db, job)
