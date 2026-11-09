import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.core.identity import OperatorIdentity, get_operator_identity
from app.models.models import DemandPoint, TechTheme, VehicleFunction
from app.schemas.schemas import DemandCreate, DemandOut, DemandUpdate
from app.services.audit import record_correction
from app.services.demand_validation import (
    validate_demand_cross_validation,
    validate_demand_trace,
)

router = APIRouter(prefix="/demands", tags=["demands"])


async def _enrich(db: AsyncSession, d: DemandPoint) -> DemandOut:
    out = DemandOut.model_validate(d)
    out.function_count = (
        await db.execute(
            select(func.count(VehicleFunction.id)).where(VehicleFunction.demand_point_id == d.id)
        )
    ).scalar_one()
    if d.source_tech_theme_id:
        # REQ-DEM-14: 与 /themes 共用 eea_v_tech_theme_metrics 的同一统计口径
        # （排除已归档信号，见 migrations/versions/0002_canonical_codes.py）
        row = (
            await db.execute(
                text(
                    "SELECT signal_frequency, source_count FROM eea_v_tech_theme_metrics WHERE tech_theme_id = :tid"
                ),
                {"tid": d.source_tech_theme_id},
            )
        ).one_or_none()
        out.signal_frequency = row.signal_frequency if row else 0
        out.source_count = row.source_count if row else 0
    return out


@router.get("", response_model=list[DemandOut])
async def list_demands(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(DemandPoint).order_by(DemandPoint.created_at))).scalars().all()
    return [await _enrich(db, d) for d in rows]


@router.post("", response_model=DemandOut, status_code=201)
async def create_demand(payload: DemandCreate, db: AsyncSession = Depends(get_db)):
    if payload.review_status == "confirmed":
        raise HTTPException(
            422,
            "需求点必须先保存为待复核，再由具备权限的人员确认（REQ-DEM-13）",
        )
    if payload.source_tech_theme_id and await db.get(TechTheme, payload.source_tech_theme_id) is None:
        raise HTTPException(404, "theme not found")
    trace_error = await validate_demand_trace(
        db, payload.derivation_trace, payload.source_tech_theme_id
    )
    if trace_error:
        raise HTTPException(422, trace_error)
    values = payload.model_dump(exclude={"review_status"})
    d = DemandPoint(**values, review_status="pending")
    db.add(d)
    await db.commit()
    return await _enrich(db, d)


@router.get("/{demand_id}", response_model=DemandOut)
async def get_demand(demand_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    d = await db.get(DemandPoint, demand_id)
    if d is None:
        raise HTTPException(404, "demand not found")
    return await _enrich(db, d)


@router.patch("/{demand_id}", response_model=DemandOut)
async def update_demand(
    demand_id: uuid.UUID,
    payload: DemandUpdate,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    d = await db.get(DemandPoint, demand_id)
    if d is None:
        raise HTTPException(404, "demand not found")
    data = payload.model_dump(exclude_unset=True)
    if data.get("review_status") == "confirmed" and actor.role not in {
        "taxonomy_admin",
        "platform_admin",
    }:
        raise HTTPException(403, "只有方法论或平台管理员可以确认需求点（REQ-DEM-13）")
    substantive_fields = {
        "name",
        "source_tech_theme_id",
        "value_chain_stage_code",
        "derivation_trace",
        "cross_validation",
        "time_series",
    }
    substantive_changed = any(
        field in data and data[field] != getattr(d, field) for field in substantive_fields
    )
    if substantive_changed and data.get("review_status") == "confirmed":
        raise HTTPException(
            422,
            "修改需求推导或证据后须先保存为待复核，再由复核人单独确认（REQ-DEM-13）",
        )
    if substantive_changed and d.review_status == "confirmed":
        data["review_status"] = "pending"

    if "derivation_trace" in data or "source_tech_theme_id" in data:
        proposed_trace = data.get("derivation_trace", d.derivation_trace)
        proposed_theme_id = data.get("source_tech_theme_id", d.source_tech_theme_id)
        if proposed_theme_id and await db.get(TechTheme, proposed_theme_id) is None:
            raise HTTPException(404, "theme not found")
        trace_error = await validate_demand_trace(db, proposed_trace, proposed_theme_id)
        if trace_error:
            raise HTTPException(422, trace_error)

    if data.get("review_status") == "confirmed":
        proposed = data.get("cross_validation", d.cross_validation)
        proposed_theme_id = data.get("source_tech_theme_id", d.source_tech_theme_id)
        cross_validation_error = await validate_demand_cross_validation(
            db, proposed, proposed_theme_id
        )
        if cross_validation_error:
            raise HTTPException(422, cross_validation_error)
    invalidate_functions = False
    for field, value in data.items():
        old = getattr(d, field)
        if value == old:
            continue  # no-op stays clean
        await record_correction(db, "demand_point", d.id, field, old, value, actor)
        if field in substantive_fields or field == "review_status":
            invalidate_functions = True
        setattr(d, field, value)
    if invalidate_functions:
        published_functions = (
            await db.execute(
                select(VehicleFunction)
                .where(
                    VehicleFunction.demand_point_id == d.id,
                    VehicleFunction.published.is_(True),
                )
                .with_for_update()
            )
        ).scalars().all()
        for vehicle_function in published_functions:
            await record_correction(
                db,
                "vehicle_function",
                vehicle_function.id,
                "published",
                True,
                False,
                actor,
            )
            vehicle_function.published = False
    await db.commit()
    return await _enrich(db, d)
