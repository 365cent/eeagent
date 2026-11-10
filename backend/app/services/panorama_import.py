"""Panorama workbook import: batch creation and capture job orchestration."""
from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.capture import _submission_fingerprint
from app.models.models import CaptureJob, PanoramaImportBatch, PanoramaImportUrl, Signal
from app.services.objectstore import save_bytes, sha256_bytes
from app.services.panorama_workbook import PanoramaWorkbook, parse_panorama_workbook

logger = logging.getLogger(__name__)


async def get_batch_by_sha(db: AsyncSession, digest: str) -> PanoramaImportBatch | None:
    return (
        await db.execute(select(PanoramaImportBatch).where(PanoramaImportBatch.sha256 == digest))
    ).scalar_one_or_none()


async def create_panorama_import(
    db: AsyncSession,
    file: UploadFile,
    data: bytes,
) -> PanoramaImportBatch:
    if not data:
        raise HTTPException(422, "workbook 为空")
    digest = sha256_bytes(data)
    existing = await get_batch_by_sha(db, digest)
    if existing is not None:
        return existing

    try:
        workbook = parse_panorama_workbook(data)
    except KeyError as exc:
        raise HTTPException(422, f"工作簿缺少预期工作表: {exc}") from exc
    except Exception as exc:
        raise HTTPException(422, f"无法解析工作簿: {exc}") from exc

    object_key = save_bytes(data, folder="panorama-imports", ext="xlsx")
    batch = PanoramaImportBatch(
        sha256=digest,
        filename=file.filename,
        workbook_object_key=object_key,
        snapshot_json=json.loads(workbook.model_dump_json()),
        status="capturing",
    )
    db.add(batch)
    await db.flush()

    url_rows: dict[str, PanoramaImportUrl] = {}
    for source in workbook.sources:
        fingerprint = _submission_fingerprint(
            url=source.url,
            data=b"",
            filename=None,
            mime=None,
            channel_code=source.channel_code,
            publisher=None,
            source_label="panorama-import",
        )
        job = CaptureJob(
            id=uuid.uuid4(),
            submission_id=uuid.uuid4(),
            fingerprint=fingerprint,
            source_url=source.url,
            channel_code=source.channel_code,
            source_label="panorama-import",
            via="client-capture",
            status="awaiting_client",
            stage="awaiting_client",
            import_batch_id=batch.id,
            filename="capture.pdf" if source.is_pdf else None,
            mime="application/pdf" if source.is_pdf else None,
        )
        db.add(job)
        await db.flush()
        contexts = [ctx.model_dump() for ctx in source.contexts]
        url_row = PanoramaImportUrl(
            batch_id=batch.id,
            url=source.url,
            url_normalized=source.url_normalized,
            contexts=contexts,
            channel_code=source.channel_code,
            is_pdf=source.is_pdf,
            capture_job_id=job.id,
        )
        url_rows[source.url_normalized] = url_row
        db.add(url_row)

    await db.commit()
    await db.refresh(batch)
    logger.info(
        "panorama import %s: %s unique urls, %s chain rows",
        batch.id,
        len(url_rows),
        len(workbook.chain_rows),
    )
    return batch


async def refresh_batch_capture_stats(db: AsyncSession, batch_id: uuid.UUID) -> None:
    batch = await db.get(PanoramaImportBatch, batch_id)
    if batch is None:
        return
    rows = (
        await db.execute(
            select(CaptureJob.status, func.count())
            .where(CaptureJob.import_batch_id == batch_id)
            .group_by(CaptureJob.status)
        )
    ).all()
    counts = {status: count for status, count in rows}
    retained = counts.get("succeeded", 0)
    failed = counts.get("failed", 0) + counts.get("cancelled", 0)
    batch.signals_retained = retained
    batch.signals_failed = failed
    batch.updated_at = datetime.now(timezone.utc)
    await db.commit()


async def capture_jobs_idle_for_batch(db: AsyncSession, batch_id: uuid.UUID) -> bool:
    pending = (
        await db.execute(
            select(func.count())
            .select_from(CaptureJob)
            .where(
                CaptureJob.import_batch_id == batch_id,
                CaptureJob.status.in_(("awaiting_client", "queued", "running")),
            )
        )
    ).scalar_one()
    return pending == 0


async def load_workbook_model(batch: PanoramaImportBatch) -> PanoramaWorkbook:
    return PanoramaWorkbook.model_validate(batch.snapshot_json)
