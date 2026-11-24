"""Hooks after capture jobs finish for panorama import batches."""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import SessionLocal
from app.models.models import PanoramaImportBatch
from app.services.panorama_import import capture_jobs_idle_for_batch, refresh_batch_capture_stats
from app.services.panorama_import_graph import run_panorama_structure
from app.services.panorama_import_signals import sync_import_url_signal

logger = logging.getLogger(__name__)


async def _finalize_capture_phase(db: AsyncSession, batch_id: uuid.UUID) -> None:
    """Close the capture phase once no job is pending, whatever the outcome.

    A success is not assumed: when every URL failed the batch must leave
    the "capturing" state too, otherwise the dashboard shows a progress
    banner forever.
    """
    await refresh_batch_capture_stats(db, batch_id)
    if not await capture_jobs_idle_for_batch(db, batch_id):
        return
    batch = await db.get(PanoramaImportBatch, batch_id)
    if batch is None or batch.status != "capturing":
        return
    now = datetime.now(timezone.utc)
    if (batch.snapshot_json or {}).get("kind") == "url-list":
        batch.status = "completed" if batch.signals_retained else "failed"
        batch.error = None if batch.signals_retained else "所有链接采集失败，未留存任何信号。"
        batch.structure_finished_at = now
        await db.commit()
        logger.info("url-list batch %s closed as %s", batch_id, batch.status)
        return
    if not batch.signals_retained:
        batch.status = "failed"
        batch.error = "所有链接采集失败，无法生成需求草稿。"
        batch.structure_finished_at = now
        await db.commit()
        logger.info("panorama batch %s closed as failed (no captured source)", batch_id)
        return
    await run_panorama_structure(db, batch_id)


async def on_import_capture_job_succeeded(
    batch_id: uuid.UUID | None, job_id: uuid.UUID, signal_id: uuid.UUID
) -> None:
    if batch_id is None:
        return
    async with SessionLocal() as db:
        await sync_import_url_signal(db, batch_id=batch_id, job_id=job_id, signal_id=signal_id)
        await _finalize_capture_phase(db, batch_id)


async def on_import_capture_job_closed(batch_id: uuid.UUID | None) -> None:
    """Failure/cancel hook: refresh counters and close an idle batch."""
    if batch_id is None:
        return
    async with SessionLocal() as db:
        await _finalize_capture_phase(db, batch_id)
