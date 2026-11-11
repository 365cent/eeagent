import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import OperatorIdentity, get_operator_identity
from app.db.base import get_db
from app.platform.launchdarkly import STRATEGY_FUNNEL, require_feature, track_workflow_success
from app.models.models import StrategicAssessment
from app.schemas.schemas import (
    AssessmentCreate,
    AssessmentOut,
    StrategyFunnelOut,
    StrategyFunnelPatch,
)
from app.services.strategy_funnel import finalize_funnel, get_funnel_response, patch_funnel

router = APIRouter(
    prefix="/strategy",
    tags=["strategy"],
    dependencies=[Depends(require_feature(STRATEGY_FUNNEL))],
)


@router.get("/landing-points/{lp_id}/funnel", response_model=StrategyFunnelOut)
async def get_landing_point_funnel(
    lp_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Read the current funnel draft, gates, and latest finalized assessment."""
    return await get_funnel_response(db, lp_id)


@router.patch("/landing-points/{lp_id}/funnel", response_model=StrategyFunnelOut)
async def patch_landing_point_funnel(
    lp_id: uuid.UUID,
    payload: StrategyFunnelPatch,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    """Save exactly one funnel step or separately finalize its assessment."""
    return await patch_funnel(db, lp_id, payload, actor)


@router.get("/assessments", response_model=list[AssessmentOut])
async def list_assessments(
    lp_id: uuid.UUID | None = None,
    classification: str | None = None,
    current_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """筛选池（漏斗页）。current_only=False 时含历史版本（REQ-STR-07）。"""
    q = select(StrategicAssessment).order_by(StrategicAssessment.assessed_at.desc())
    if lp_id:
        q = q.where(StrategicAssessment.tech_landing_point_id == lp_id)
    if classification:
        q = q.where(StrategicAssessment.classification == classification)
    if current_only:
        q = q.where(StrategicAssessment.is_current)
    rows = (await db.execute(q)).scalars().all()
    return rows


@router.get("/assessments/{assessment_id}", response_model=AssessmentOut)
async def get_assessment(assessment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    a = await db.get(StrategicAssessment, assessment_id)
    if a is None:
        raise HTTPException(404, "assessment not found")
    return a


@router.post("/landing-points/{lp_id}/assessments", response_model=AssessmentOut, status_code=201)
async def create_assessment(
    lp_id: uuid.UUID,
    payload: AssessmentCreate,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    """Compatibility finalizer; the payload cannot skip saved funnel gates."""
    result = await finalize_funnel(db, lp_id, actor, legacy_payload=payload)
    track_workflow_success(STRATEGY_FUNNEL)
    return result


@router.get("/landing-points/{lp_id}/assessments/history", response_model=list[AssessmentOut])
async def assessment_history(lp_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    rows = (
        await db.execute(
            select(StrategicAssessment)
            .where(StrategicAssessment.tech_landing_point_id == lp_id)
            .order_by(StrategicAssessment.version)
        )
    ).scalars().all()
    return rows
