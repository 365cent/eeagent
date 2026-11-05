import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.models.models import DemandPoint, TechTheme, VehicleFunction
from app.schemas.schemas import DemandCreate, DemandOut, DemandUpdate
from app.services.audit import record_correction

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
    if payload.source_tech_theme_id and await db.get(TechTheme, payload.source_tech_theme_id) is None:
        raise HTTPException(404, "theme not found")
    d = DemandPoint(**payload.model_dump())
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
async def update_demand(demand_id: uuid.UUID, payload: DemandUpdate, db: AsyncSession = Depends(get_db)):
    d = await db.get(DemandPoint, demand_id)
    if d is None:
        raise HTTPException(404, "demand not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        old = getattr(d, field)
        if value == old:
            continue  # no-op stays clean
        # REQ-RULE-02: 人工对价值链环节的纠偏必须留痕
        if field == "value_chain_stage_code":
            await record_correction(db, "demand_point", d.id, field, old, value)
        setattr(d, field, value)
    await db.commit()
    return await _enrich(db, d)
