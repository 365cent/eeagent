"""Persisted chain report jobs (Markdown/PDF placeholder)."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse, Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import OperatorIdentity, get_operator_identity
from app.db.base import get_db
from app.models.models import ChainReport
from app.services.chain_report import create_chain_report
from app.services.objectstore import load_bytes

router = APIRouter(prefix="/reports", tags=["reports"])


class ChainReportCreate(BaseModel):
    demand_point_id: uuid.UUID | None = None
    landing_point_id: uuid.UUID | None = None
    format: str = Field(default="md", pattern="^(md|pdf)$")


class ChainReportOut(BaseModel):
    id: uuid.UUID
    status: str
    format: str
    object_key: str | None
    error: str | None
    demand_point_id: uuid.UUID | None
    landing_point_id: uuid.UUID | None

    model_config = ConfigDict(from_attributes=True)


@router.post("", response_model=ChainReportOut, status_code=201)
async def post_chain_report(
    body: ChainReportCreate,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    try:
        report = await create_chain_report(
            db,
            demand_point_id=body.demand_point_id,
            landing_point_id=body.landing_point_id,
            fmt=body.format,
            subject=actor.subject,
            role=actor.role,
        )
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    return report


@router.get("", response_model=list[ChainReportOut])
async def list_chain_reports(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(ChainReport).order_by(ChainReport.created_at.desc()).limit(50))).scalars()
    return list(rows)


@router.get("/{report_id}", response_model=ChainReportOut)
async def get_chain_report(report_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    report = await db.get(ChainReport, report_id)
    if report is None:
        raise HTTPException(404, "report not found")
    return report


@router.get("/{report_id}/download")
async def download_chain_report(
    report_id: uuid.UUID,
    format: str = Query("md"),
    db: AsyncSession = Depends(get_db),
):
    report = await db.get(ChainReport, report_id)
    if report is None:
        raise HTTPException(404, "report not found")
    if report.status != "succeeded" or not report.object_key:
        raise HTTPException(409, f"report not ready (status={report.status})")
    data = load_bytes(report.object_key)
    if data is None:
        raise HTTPException(404, "report object missing from storage")
    if format == "pdf" or report.format == "pdf":
        return Response(content=data, media_type="application/pdf")
    return PlainTextResponse(content=data.decode("utf-8"), media_type="text/markdown; charset=utf-8")
