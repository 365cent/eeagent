from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import CaptureJob, PanoramaImportBatch
from app.schemas.schemas import PanoramaImportBatchOut


async def panorama_batch_out(db: AsyncSession, batch: PanoramaImportBatch) -> PanoramaImportBatchOut:
    total = (
        await db.execute(
            select(func.count()).select_from(CaptureJob).where(CaptureJob.import_batch_id == batch.id)
        )
    ).scalar_one()
    pending = (
        await db.execute(
            select(func.count())
            .select_from(CaptureJob)
            .where(
                CaptureJob.import_batch_id == batch.id,
                CaptureJob.status.in_(("awaiting_client", "running", "queued")),
            )
        )
    ).scalar_one()
    base = PanoramaImportBatchOut.model_validate(batch)
    return base.model_copy(update={"capture_jobs_total": total, "capture_jobs_pending": pending})
