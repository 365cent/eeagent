"""Durable capture queue and worker operations.

Capture payload bytes live in the object store; the database retains the
submission fingerprint, source metadata and lifecycle state. Signal creation
continues to use the shared capture pipeline and its submission key, so a
worker restart after the signal commit does not create a duplicate signal.
"""
from __future__ import annotations

import asyncio
import logging
import os
import socket
import uuid
from datetime import datetime, timedelta, timezone
from functools import partial

from anyio import to_thread
from fastapi import HTTPException

from app.platform.errors import DomainError
from sqlalchemy import and_, or_, select, update

from app.core.config import get_settings
from app.db.base import SessionLocal
from app.models.models import CaptureJob, Signal
from app.services.objectstore import load_bytes
from app.services.url_fetch import FetchError, RetryableFetchError, fetch_url

logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _is_client_browser_capture(job: CaptureJob) -> bool:
    """Jobs held for EEA Capture upload before bytes are attached."""
    return job.stage == "capturing" and not job.payload_object_key


async def reclaim_stale_client_captures(now: datetime | None = None) -> int:
    """Return client-held import jobs whose lease expired without a payload upload."""
    now = now or _now()
    async with SessionLocal() as db:
        result = await db.execute(
            select(CaptureJob)
            .where(
                CaptureJob.status == "running",
                CaptureJob.stage == "capturing",
                CaptureJob.payload_object_key.is_(None),
                or_(CaptureJob.lease_until.is_(None), CaptureJob.lease_until <= now),
            )
            .with_for_update(skip_locked=True)
        )
        rows = result.scalars().all()
        if not rows:
            await db.commit()
            return 0
        batch_ids: set[uuid.UUID] = set()
        for row in rows:
            if row.import_batch_id is not None:
                batch_ids.add(row.import_batch_id)
            row.status = "awaiting_client"
            row.stage = "awaiting_client"
            row.worker_id = None
            row.lease_until = None
            row.error = (row.error or "Client capture interrupted; re-queued for EEA Capture.").strip()
        await db.commit()
        if batch_ids:
            from app.services.panorama_import import refresh_batch_capture_stats

            async with SessionLocal() as refresh_db:
                for batch_id in batch_ids:
                    await refresh_batch_capture_stats(refresh_db, batch_id)
        return len(rows)


async def claim_next_job(worker_id: str) -> uuid.UUID | None:
    """Claim one ready job; expired leases are eligible for recovery."""
    settings = get_settings()
    now = _now()
    await reclaim_stale_client_captures(now)
    lease_until = now + timedelta(seconds=max(settings.capture_worker_lease_seconds, 60))
    async with SessionLocal() as db:
        expired = await db.execute(
            select(CaptureJob)
            .where(
                CaptureJob.status == "running",
                CaptureJob.lease_until <= now,
                CaptureJob.attempt_count >= settings.capture_worker_max_attempts,
            )
            .with_for_update(skip_locked=True)
        )
        for row in expired.scalars():
            if _is_client_browser_capture(row):
                row.status = "awaiting_client"
                row.stage = "awaiting_client"
                row.worker_id = None
                row.lease_until = None
                row.error = "Client capture lease expired; re-queued for EEA Capture."
                continue
            row.status = "failed"
            row.stage = "failed"
            row.error = "Worker lease expired after the automatic retry limit."
            row.finished_at = now
            row.lease_until = None
            row.worker_id = None

        eligible = and_(
            or_(
                and_(CaptureJob.status == "queued", CaptureJob.available_at <= now),
                and_(
                    CaptureJob.status == "running",
                    CaptureJob.lease_until <= now,
                    CaptureJob.payload_object_key.isnot(None),
                ),
            ),
            CaptureJob.status != "awaiting_client",
        )
        result = await db.execute(
            select(CaptureJob)
            .where(eligible, CaptureJob.attempt_count < settings.capture_worker_max_attempts)
            .order_by(CaptureJob.available_at, CaptureJob.created_at)
            .limit(1)
            .with_for_update(skip_locked=True)
        )
        job = result.scalar_one_or_none()
        if job is None:
            await db.commit()
            return None
        job.status = "running"
        job.stage = "processing"
        job.attempt_count += 1
        job.worker_id = worker_id
        job.lease_until = lease_until
        job.heartbeat_at = now
        job.started_at = job.started_at or now
        job.finished_at = None
        await db.commit()
        return job.id


async def _is_cancel_requested(job_id: uuid.UUID) -> bool:
    async with SessionLocal() as db:
        job = await db.get(CaptureJob, job_id)
        return job is not None and job.cancel_requested_at is not None


async def _mark_cancelled(job_id: uuid.UUID, worker_id: str) -> None:
    now = _now()
    async with SessionLocal() as db:
        await db.execute(
            update(CaptureJob)
            .where(CaptureJob.id == job_id, CaptureJob.worker_id == worker_id)
            .values(
                status="cancelled",
                stage="cancelled",
                error="Cancelled by operator request.",
                lease_until=None,
                worker_id=None,
                finished_at=now,
                updated_at=now,
            )
        )
        await db.commit()


async def heartbeat(job_id: uuid.UUID, worker_id: str) -> bool:
    """Extend a live worker lease; return false when ownership was lost."""
    lease_until = _now() + timedelta(seconds=max(get_settings().capture_worker_lease_seconds, 60))
    async with SessionLocal() as db:
        result = await db.execute(
            update(CaptureJob)
            .where(
                CaptureJob.id == job_id,
                CaptureJob.status == "running",
                CaptureJob.worker_id == worker_id,
            )
            .values(lease_until=lease_until, heartbeat_at=_now(), updated_at=_now())
        )
        await db.commit()
        return result.rowcount == 1


async def _heartbeat_loop(job_id: uuid.UUID, worker_id: str) -> None:
    interval = max(10, get_settings().capture_worker_lease_seconds // 3)
    while True:
        await asyncio.sleep(interval)
        try:
            if await _is_cancel_requested(job_id):
                await _mark_cancelled(job_id, worker_id)
                return
            if not await heartbeat(job_id, worker_id):
                return
        except Exception as exc:
            logger.warning("capture worker heartbeat failed for %s (%s)", job_id, exc.__class__.__name__)


def _failure_text(exc: Exception) -> str:
    if isinstance(exc, (HTTPException, DomainError)):
        detail = exc.detail
        message = detail if isinstance(detail, str) else str(detail)
    elif isinstance(exc, FetchError):
        message = str(exc)
    elif isinstance(exc, FileNotFoundError) and str(exc):
        message = str(exc)
    else:
        message = f"Processing failed ({exc.__class__.__name__}); inspect worker logs using the job ID."
    return message[:2000]


async def _mark_failed(job_id: uuid.UUID, worker_id: str, exc: Exception) -> None:
    now = _now()
    settings = get_settings()
    async with SessionLocal() as db:
        result = await db.execute(
            select(CaptureJob)
            .where(
                CaptureJob.id == job_id,
                CaptureJob.status == "running",
                CaptureJob.worker_id == worker_id,
            )
            .with_for_update()
        )
        job = result.scalar_one_or_none()
        if job is None:
            return
        client_error = isinstance(exc, HTTPException) or isinstance(exc, DomainError)
        permanent = (isinstance(exc, FetchError) and not isinstance(exc, RetryableFetchError)) or (
            client_error
            and 400 <= exc.status_code < 500
            and exc.status_code != 429
        )
        can_retry = not permanent and job.attempt_count < settings.capture_worker_max_attempts
        job.status = "queued" if can_retry else "failed"
        job.stage = "queued" if can_retry else "failed"
        job.error = _failure_text(exc)
        job.available_at = now + timedelta(seconds=min(300, 2 ** max(job.attempt_count, 1)))
        job.lease_until = None
        job.worker_id = None
        job.finished_at = None if can_retry else now
        await db.commit()


async def _mark_succeeded(job_id: uuid.UUID, worker_id: str, signal_id: uuid.UUID) -> None:
    now = _now()
    async with SessionLocal() as db:
        await db.execute(
            update(CaptureJob)
            .where(
                CaptureJob.id == job_id,
                CaptureJob.status == "running",
                CaptureJob.worker_id == worker_id,
            )
            .values(
                status="succeeded",
                stage="completed",
                signal_id=signal_id,
                error=None,
                lease_until=None,
                worker_id=None,
                finished_at=now,
                heartbeat_at=now,
                updated_at=now,
            )
        )
        await db.commit()


async def _execute_capture(job_id: uuid.UUID, worker_id: str) -> None:
    # Import the established pipeline lazily to avoid a router/service cycle.
    from app.domains.capture.document_path import _document_path
    from app.domains.capture.submission import _is_html
    from app.domains.evidence.html_capture import _signal_from_html

    if await _is_cancel_requested(job_id):
        await _mark_cancelled(job_id, worker_id)
        return

    async with SessionLocal() as db:
        job = await db.get(CaptureJob, job_id)
        if job is None or job.status != "running" or job.worker_id != worker_id:
            return
        submission_id = job.submission_id
        fingerprint = job.fingerprint
        object_key = job.payload_object_key
        source_url = job.source_url
        filename = job.filename
        mime = job.mime
        channel_code = job.channel_code
        publisher = job.publisher
        source_label = job.source_label
        import_batch_id = job.import_batch_id
        existing = (
            await db.execute(
                select(Signal).where(Signal.capture_submission_id == submission_id)
            )
        ).scalar_one_or_none()
        if existing is not None:
            if existing.capture_submission_sha256 != fingerprint:
                raise HTTPException(409, "submission_id was already used for a different capture")
            signal_id = existing.id
            batch_id = job.import_batch_id
            await db.commit()
            await _mark_succeeded(job_id, worker_id, signal_id)
            if batch_id is not None:
                from app.services.panorama_import_hooks import on_import_capture_job_succeeded

                await on_import_capture_job_succeeded(batch_id, job_id, signal_id)
            return

        await db.commit()
        data = await to_thread.run_sync(partial(load_bytes, object_key)) if object_key else b""
        if object_key and data is None:
            root = get_settings().object_dir
            raise FileNotFoundError(
                f"capture payload object is missing under OBJECT_DIR ({root}): {object_key}. "
                "Ensure the API and capture worker use the same OBJECT_DIR."
            )
        if not data:
            settings = get_settings()
            if not source_url or settings.app_env == "production" or not settings.capture_server_fetch_enabled:
                raise HTTPException(422, "此采集任务没有可处理的上传文件")
            await _set_stage(job_id, worker_id, "fetching")
            try:
                page = await fetch_url(source_url)
            except FetchError:
                raise
            data, filename, mime, source_url = page.data, page.filename, page.content_type, page.final_url

        await _set_stage(job_id, worker_id, "processing")
        if await _is_cancel_requested(job_id):
            await _mark_cancelled(job_id, worker_id)
            return
        # Bulk import batches: skip per-figure vision LLM (96 URLs × many figures would stall the queue).
        vision_captions = import_batch_id is None
        if _is_html(mime=mime, filename=filename):
            signal = await _signal_from_html(
                db,
                url=source_url or f"eea://capture/html/{submission_id}",
                data=data,
                channel_code=channel_code,
                html_label="file",
                capture_submission_id=submission_id,
                capture_submission_sha256=fingerprint,
                figure_vision_captions=vision_captions,
            )
        else:
            signal, _ = await _document_path(
                db,
                data=data,
                filename=filename,
                mime=mime,
                source_url=source_url,
                publisher=publisher,
                source_label=source_label,
                channel_code=channel_code,
                capture_submission_id=submission_id,
                capture_submission_sha256=fingerprint,
                vision_captions=False,
            )
        signal_id = signal.id
        await _mark_succeeded(job_id, worker_id, signal_id)
        if import_batch_id is not None:
            from app.services.panorama_import_hooks import on_import_capture_job_succeeded

            await on_import_capture_job_succeeded(import_batch_id, job_id, signal_id)
        return


async def run_claimed_job(job_id: uuid.UUID, worker_id: str) -> None:
    lease_task = asyncio.create_task(_heartbeat_loop(job_id, worker_id))
    try:
        await _execute_capture(job_id, worker_id)
    except Exception as exc:
        logger.error("capture job %s failed (%s)", job_id, exc.__class__.__name__)
        try:
            await _mark_failed(job_id, worker_id, exc)
        except Exception as mark_exc:
            logger.error(
                "capture job %s failure could not be recorded (%s); lease recovery will retry it",
                job_id,
                mark_exc.__class__.__name__,
            )
    finally:
        lease_task.cancel()
        try:
            await lease_task
        except asyncio.CancelledError:
            pass


async def _set_stage(job_id: uuid.UUID, worker_id: str, stage: str) -> None:
    now = _now()
    async with SessionLocal() as db:
        await db.execute(
            update(CaptureJob)
            .where(
                CaptureJob.id == job_id,
                CaptureJob.status == "running",
                CaptureJob.worker_id == worker_id,
            )
            .values(stage=stage, heartbeat_at=now, updated_at=now)
        )
        await db.commit()


def make_worker_id() -> str:
    return f"{socket.gethostname()}:{os.getpid()}:{uuid.uuid4().hex[:8]}"


async def worker_loop(stop_event: asyncio.Event | None = None) -> None:
    """Poll PostgreSQL and process jobs until stopped; safe for systemd use."""
    worker_id = make_worker_id()
    pause = max(get_settings().capture_worker_poll_seconds, 0.1)
    while stop_event is None or not stop_event.is_set():
        try:
            job_id = await claim_next_job(worker_id)
        except Exception as exc:
            logger.error("capture worker could not claim a job (%s)", exc.__class__.__name__)
            await asyncio.sleep(pause)
            continue
        if job_id is None:
            try:
                if stop_event is None:
                    await asyncio.sleep(pause)
                else:
                    await asyncio.wait_for(stop_event.wait(), timeout=pause)
            except asyncio.TimeoutError:
                pass
            continue
        await run_claimed_job(job_id, worker_id)
