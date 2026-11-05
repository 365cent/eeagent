import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.models.models import DeploymentStandard, StrategicAssessment, TechLandingPoint
from app.schemas.schemas import AssessmentCreate, AssessmentOut

router = APIRouter(prefix="/strategy", tags=["strategy"])


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
async def create_assessment(lp_id: uuid.UUID, payload: AssessmentCreate, db: AsyncSession = Depends(get_db)):
    """改判追加新版本：旧版本 is_current=false，新版本 version=max+1（REQ-STR-07）。"""
    lp = await db.get(TechLandingPoint, lp_id)
    if lp is None:
        raise HTTPException(404, "landing point not found")
    # 进入条件：已有部署边界记录的技术落脚点，进入筛选池（funnel-pool-entry）
    std_count = (
        await db.execute(
            select(func.count(DeploymentStandard.id)).where(DeploymentStandard.tech_landing_point_id == lp_id)
        )
    ).scalar_one()
    if std_count == 0:
        raise HTTPException(422, "无部署边界记录的落脚点不得进入筛选池")
    max_v = (
        await db.execute(
            select(func.max(StrategicAssessment.version)).where(
                StrategicAssessment.tech_landing_point_id == lp_id
            )
        )
    ).scalar_one()
    next_v = (max_v or 0) + 1
    await db.execute(
        update(StrategicAssessment)
        .where(StrategicAssessment.tech_landing_point_id == lp_id, StrategicAssessment.is_current)
        .values(is_current=False)
    )
    a = StrategicAssessment(
        tech_landing_point_id=lp_id, version=next_v, is_current=True, **payload.model_dump()
    )
    db.add(a)
    await db.commit()
    return a


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
