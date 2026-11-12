"""Deterministic chain Markdown export for demand or landing point."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import ChainReport, DemandPoint, TechLandingPoint
from app.services.agent_trace import build_signal_trace_markdown
from app.services.objectstore import save_bytes


async def create_chain_report(
    db: AsyncSession,
    *,
    demand_point_id: uuid.UUID | None,
    landing_point_id: uuid.UUID | None,
    fmt: str,
    subject: str,
    role: str,
) -> ChainReport:
    if bool(demand_point_id) == bool(landing_point_id):
        raise ValueError("specify exactly one of demand_point_id or landing_point_id")
    report = ChainReport(
        id=uuid.uuid4(),
        demand_point_id=demand_point_id,
        landing_point_id=landing_point_id,
        status="queued",
        format=fmt,
        requested_by_subject=subject,
        requested_by_role=role,
    )
    db.add(report)
    await db.flush()
    try:
        markdown = await _render_markdown(db, demand_point_id, landing_point_id)
        ext = "md" if fmt == "md" else "bin"
        key = save_bytes(markdown.encode("utf-8"), folder="reports", ext=ext)
        report.object_key = key
        report.status = "succeeded"
        report.finished_at = datetime.now(timezone.utc)
        report.data_snapshot_json = {"bytes": len(markdown), "format": fmt}
    except Exception as exc:  # noqa: BLE001
        report.status = "failed"
        report.error = str(exc)[:1000]
        report.finished_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(report)
    return report


async def _render_markdown(
    db: AsyncSession,
    demand_point_id: uuid.UUID | None,
    landing_point_id: uuid.UUID | None,
) -> str:
    if landing_point_id is not None:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload

        lp = (
            await db.execute(
                select(TechLandingPoint)
                .options(selectinload(TechLandingPoint.vehicle_function))
                .where(TechLandingPoint.id == landing_point_id)
            )
        ).scalar_one_or_none()
        if lp is None:
            raise ValueError("landing point not found")
        demand = await db.get(DemandPoint, lp.vehicle_function.demand_point_id)
        header = f"# 链路报告：{lp.name}\n\n"
    else:
        demand = await db.get(DemandPoint, demand_point_id)
        if demand is None:
            raise ValueError("demand not found")
        header = f"# 链路报告：{demand.name}\n\n"
    body = ""
    if demand and demand.source_tech_theme_id:
        from sqlalchemy import select
        from app.models.models import Signal

        signal = (
            await db.execute(
                select(Signal).where(Signal.tech_theme_id == demand.source_tech_theme_id).limit(1)
            )
        ).scalar_one_or_none()
        if signal is not None:
            trace_md, _citations = await build_signal_trace_markdown(db, signal.id)
            body = trace_md
    return header + (body or "_无可追溯信号_\n")
