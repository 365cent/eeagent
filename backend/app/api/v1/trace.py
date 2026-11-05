import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.base import get_db
from app.models.models import (
    CorrectionAudit,
    DemandPoint,
    DeploymentStandard,
    Signal,
    SignalTag,
    StrategicAssessment,
    TechLandingPoint,
    TechTheme,
    VehicleFunction,
)
from app.schemas.schemas import AuditOut, SignalBase, SignalOut, TraceChain
from app.api.v1.landing_points import _to_out as lp_out
from app.api.v1.demands import _enrich as demand_enrich

router = APIRouter(tags=["trace"])


@router.get("/trace/landing-points/{lp_id}", response_model=TraceChain)
async def trace_from_landing_point(lp_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """REQ-RULE-03: 落脚点 → 功能 → 需求点 → 主题 → 信号。"""
    lp = (
        await db.execute(
            select(TechLandingPoint)
            .options(
                selectinload(TechLandingPoint.domain),
                selectinload(TechLandingPoint.standards),
                selectinload(TechLandingPoint.assessments),
                selectinload(TechLandingPoint.vehicle_function).selectinload(
                    VehicleFunction.demand_point
                ),
                selectinload(TechLandingPoint.vehicle_function)
                .selectinload(VehicleFunction.demand_point)
                .selectinload(DemandPoint.functions),
            )
            .where(TechLandingPoint.id == lp_id)
        )
    ).scalar_one_or_none()
    if lp is None:
        raise HTTPException(404, "landing point not found")

    func = lp.vehicle_function
    demand = func.demand_point if func else None
    theme = (await db.get(TechTheme, demand.source_tech_theme_id)) if demand and demand.source_tech_theme_id else None
    signals = []
    if theme:
        rows = (
            await db.execute(
                select(Signal)
                .options(selectinload(Signal.tags).selectinload(SignalTag.vocab))
                .where(Signal.tech_theme_id == theme.id)
                .order_by(Signal.published_at)
            )
        ).scalars().all()
        sig_list = []
        for s in rows:
            so = SignalOut(**SignalBase.model_validate(s).model_dump())
            so.tags = [st.vocab.name for st in s.tags]
            sig_list.append(so)
        signals = sig_list

    current = next((a for a in lp.assessments if a.is_current), None)
    demand_out = await demand_enrich(db, demand) if demand else None
    return TraceChain(
        landing_point=lp_out(lp),
        standards=[s for s in lp.standards],
        assessment=current,
        vehicle_function=func,
        demand_point=demand_out,
        theme=theme,
        signals=signals,
    )


@router.get("/audit", response_model=list[AuditOut])
async def list_audit(entity_id: uuid.UUID | None = None, db: AsyncSession = Depends(get_db)):
    q = select(CorrectionAudit).order_by(CorrectionAudit.corrected_at.desc()).limit(200)
    if entity_id:
        q = q.where(CorrectionAudit.entity_id == entity_id)
    return (await db.execute(q)).scalars().all()
