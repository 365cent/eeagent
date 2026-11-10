"""Panorama workbook import API."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.base import get_db
from app.models.models import CaptureJob, PanoramaImportBatch
from app.schemas.schemas import CaptureUrlBatchIn, PanoramaImportBatchOut
from app.services.url_list_capture import create_url_list_capture_batch

router = APIRouter(prefix="/imports", tags=["imports"])

_XLSX_SUFFIX = {".xlsx", ".xlsm"}


async def _batch_out(db: AsyncSession, batch: PanoramaImportBatch) -> PanoramaImportBatchOut:
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


@router.post("/capture-urls", response_model=PanoramaImportBatchOut, status_code=201)
async def import_capture_url_list(
    body: CaptureUrlBatchIn,
    db: AsyncSession = Depends(get_db),
):
    """Queue browser capture jobs from a pasted URL list (one link per line)."""
    batch = await create_url_list_capture_batch(db, body.text)
    return await _batch_out(db, batch)


@router.post("/panorama", response_model=PanoramaImportBatchOut, status_code=201)
async def import_panorama_workbook(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Workbook import is not supported server-side; paste 数据来源 links in the UI."""
    _ = db, file
    raise HTTPException(
        422,
        "请在工作簿中复制「数据来源」里的链接，在平台「导入证据」中批量粘贴（每行一条），"
        "并由 EEA Capture 客户端自动采集；不再支持工作簿文件直传或 CLI --panorama-xlsx。",
    )


@router.get("/panorama/{batch_id}", response_model=PanoramaImportBatchOut)
async def get_panorama_import_batch(batch_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    batch = await db.get(PanoramaImportBatch, batch_id)
    if batch is None:
        raise HTTPException(404, "import batch not found")
    return await _batch_out(db, batch)


@router.get("/panorama", response_model=PanoramaImportBatchOut | None)
async def get_latest_panorama_import(db: AsyncSession = Depends(get_db)):
    batch = (
        await db.execute(
            select(PanoramaImportBatch).order_by(PanoramaImportBatch.created_at.desc()).limit(1)
        )
    ).scalar_one_or_none()
    if batch is None:
        return None
    return await _batch_out(db, batch)
