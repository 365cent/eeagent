"""Delete terminal capture jobs past the retention window (BE-01)."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import CaptureJob, PanoramaImportUrl
from app.services.objectstore import delete_object, object_mtime

TERMINAL_STATUSES = ("succeeded", "failed", "cancelled")


@dataclass(frozen=True)
class CaptureJobPruneResult:
    """What one retention scan saw and removed."""

    scanned: int
    pruned: int
    payloads_deleted: int
    payloads_kept: int
    cutoff: datetime


async def prune_terminal_capture_jobs(
    db: AsyncSession,
    *,
    retention_days: int,
    limit: int = 200,
    apply: bool = True,
    now: datetime | None = None,
) -> CaptureJobPruneResult:
    """Delete terminal jobs older than ``retention_days``.

    Payloads are content-addressed, so a blob is only unlinked when no
    remaining job references it and it was not written in the last hour; that
    prevents racing a new upload that has written bytes but not yet committed
    its job row. Panorama import rows keep
    their signal link but lose the deleted job reference.
    """
    now_value = now or datetime.now(timezone.utc)
    cutoff = now_value - timedelta(days=retention_days)
    fresh_cutoff = now_value - timedelta(hours=1)
    age = func.coalesce(CaptureJob.finished_at, CaptureJob.updated_at)
    jobs = (
        (
            await db.execute(
                select(CaptureJob)
                .where(
                    CaptureJob.status.in_(TERMINAL_STATUSES),
                    age < cutoff,
                )
                .order_by(age)
                .limit(limit)
                .with_for_update(skip_locked=True)
            )
        )
        .scalars()
        .all()
    )
    if not apply:
        return CaptureJobPruneResult(len(jobs), len(jobs), 0, 0, cutoff)

    job_ids = [job.id for job in jobs]
    if not job_ids:
        return CaptureJobPruneResult(0, 0, 0, 0, cutoff)
    payload_keys = sorted({job.payload_object_key for job in jobs if job.payload_object_key})

    await db.execute(
        update(PanoramaImportUrl)
        .where(PanoramaImportUrl.capture_job_id.in_(job_ids))
        .values(capture_job_id=None)
    )
    await db.execute(delete(CaptureJob).where(CaptureJob.id.in_(job_ids)))
    await db.flush()

    deleted = kept = 0
    for key in payload_keys:
        still_used = (
            await db.execute(
                select(CaptureJob.id)
                .where(CaptureJob.payload_object_key == key)
                .limit(1)
            )
        ).scalar_one_or_none() is not None
        mtime = object_mtime(key)
        if still_used or mtime is None or mtime >= fresh_cutoff.timestamp():
            kept += 1
            continue
        if delete_object(key):
            deleted += 1
        else:
            kept += 1

    return CaptureJobPruneResult(len(jobs), len(job_ids), deleted, kept, cutoff)
