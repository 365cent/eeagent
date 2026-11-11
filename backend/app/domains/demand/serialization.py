"""Demand DTO enrichment for API/trace consumers."""
from __future__ import annotations

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import DemandPoint, VehicleFunction
from app.schemas.schemas import DemandOut


async def enrich_demand_out(db: AsyncSession, d: DemandPoint) -> DemandOut:
    out = DemandOut.model_validate(d)
    out.function_count = (
        await db.execute(
            select(func.count(VehicleFunction.id)).where(VehicleFunction.demand_point_id == d.id)
        )
    ).scalar_one()
    if d.source_tech_theme_id:
        row = (
            await db.execute(
                text(
                    "SELECT signal_frequency, source_count FROM eea_v_tech_theme_metrics WHERE tech_theme_id = :tid"
                ),
                {"tid": d.source_tech_theme_id},
            )
        ).one_or_none()
        if row is not None:
            out.signal_frequency, out.source_count = row.signal_frequency, row.source_count
    return out
