import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import OperatorIdentity, get_operator_identity
from app.db.base import get_db
from app.models.models import DeploymentStandard, TechLandingPoint
from app.schemas.schemas import StandardGrid, StandardOut, StandardUpsert
from app.services.audit import record_correction

router = APIRouter(prefix="/landing-points/{lp_id}/standards", tags=["standards"])


@router.get("", response_model=StandardGrid)
async def get_grid(lp_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """REQ-STD-02 网格：只返回已存在的行（已填写，或 requirement_text=None 的明确留空）。

    缺行即「尚未填写」：客户端以行的有无区分「明确留空」（行在、文本 NULL）与
    「尚未填写」（行不在）（std-empty-cell-representation / SCHEMA-STD-GRID）。
    """
    lp = await db.get(TechLandingPoint, lp_id)
    if lp is None:
        raise HTTPException(404, "landing point not found")
    rows = (
        await db.execute(
            select(DeploymentStandard).where(DeploymentStandard.tech_landing_point_id == lp_id)
        )
    ).scalars().all()
    return StandardGrid(cells=[StandardOut.model_validate(r) for r in rows])


@router.put("", response_model=StandardGrid)
async def upsert_cell(
    lp_id: uuid.UUID,
    payload: StandardUpsert,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    """写入一个格子（真 upsert：每个 (phase, constraint_type) 至多一行，UNIQUE 约束兜底）。

    requirement_text=None 不再删行，而是写入/保留一行 NULL 文本 —— 「明确留空」
    与「尚未填写」（行不存在）可区分（std-empty-cell-representation）。删行语义按计划省略。
    """
    lp = await db.get(TechLandingPoint, lp_id)
    if lp is None:
        raise HTTPException(404, "landing point not found")
    cell_key = f"eea-standard:{lp_id}:{payload.phase}:{payload.constraint_type}"
    await db.execute(
        select(func.pg_advisory_xact_lock(func.hashtextextended(cell_key, 0)))
    )
    row = (
        await db.execute(
            select(DeploymentStandard).where(
                DeploymentStandard.tech_landing_point_id == lp_id,
                DeploymentStandard.phase == payload.phase,
                DeploymentStandard.constraint_type == payload.constraint_type,
            ).with_for_update()
        )
    ).scalar_one_or_none()
    if row is None:
        db.add(DeploymentStandard(tech_landing_point_id=lp_id, **payload.model_dump()))
    else:
        if row.requirement_text != payload.requirement_text:
            await record_correction(
                db,
                "deployment_standard",
                row.id,
                f"requirement_text:{row.phase}:{row.constraint_type}",
                row.requirement_text,
                payload.requirement_text,
                actor,
            )
        row.requirement_text = payload.requirement_text
    await db.commit()
    return await get_grid(lp_id, db)
