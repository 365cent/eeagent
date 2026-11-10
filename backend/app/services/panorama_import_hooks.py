"""Hooks after capture jobs complete for panorama import batches."""
from __future__ import annotations

import logging
import uuid

from app.db.base import SessionLocal
from app.services.panorama_import import capture_jobs_idle_for_batch, refresh_batch_capture_stats
from app.services.panorama_import_graph import run_panorama_structure
from app.services.panorama_import_signals import sync_import_url_signal

logger = logging.getLogger(__name__)


async def on_import_capture_job_succeeded(
    batch_id: uuid.UUID | None, job_id: uuid.UUID, signal_id: uuid.UUID
) -> None:
    if batch_id is None:
        return
    async with SessionLocal() as db:
        await sync_import_url_signal(db, batch_id=batch_id, job_id=job_id, signal_id=signal_id)
        await refresh_batch_capture_stats(db, batch_id)
        if not await capture_jobs_idle_for_batch(db, batch_id):
            return
        from app.models.models import PanoramaImportBatch

        batch = await db.get(PanoramaImportBatch, batch_id)
        if batch is not None and (batch.snapshot_json or {}).get("kind") == "url-list":
            from datetime import datetime, timezone

            batch.status = "completed"
            batch.structure_finished_at = datetime.now(timezone.utc)
            await db.commit()
            logger.info("url-list batch %s capture complete (no structure import)", batch_id)
            return
        logger.info("panorama batch %s capture idle; starting structure", batch_id)
        await run_panorama_structure(db, batch_id)
