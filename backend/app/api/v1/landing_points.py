import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.identity import OperatorIdentity, get_operator_identity
from app.db.base import get_db
from app.platform.launchdarkly import TECHNOLOGY_DECOMPOSITION, require_feature, track_workflow_success
from app.models.models import DemandPoint, DeploymentStandard, TechLandingPoint, VehicleFunction, Vocab
from app.schemas.schemas import LandingPointCreate, LandingPointOut, LandingPointUpdate
from app.services.audit import record_correction
from app.services.demand_validation import validate_confirmed_demand
from app.domains.landing.serialization import landing_point_out as _to_out
from app.services.tagging import get_or_create_vocab

router = APIRouter(
    prefix="/landing-points",
    tags=["landing-points"],
    dependencies=[Depends(require_feature(TECHNOLOGY_DECOMPOSITION))],
)


async def _get_landing_point(db: AsyncSession, lp_id: uuid.UUID) -> TechLandingPoint | None:
    # eager-load relationships: lazy loads are not awaitable in async sessions
    return (
        await db.execute(
            select(TechLandingPoint)
            .options(selectinload(TechLandingPoint.domain), selectinload(TechLandingPoint.standards))
            .where(TechLandingPoint.id == lp_id)
        )
    ).scalar_one_or_none()


@router.get("", response_model=list[LandingPointOut])
async def list_landing_points(
    vehicle_function_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(TechLandingPoint)
        .options(selectinload(TechLandingPoint.domain), selectinload(TechLandingPoint.standards))
        .order_by(TechLandingPoint.created_at)
    )
    if vehicle_function_id:
        q = q.where(TechLandingPoint.vehicle_function_id == vehicle_function_id)
    rows = (await db.execute(q)).scalars().all()
    return [_to_out(lp) for lp in rows]


@router.post("", response_model=LandingPointOut, status_code=201)
async def create_landing_point(
    payload: LandingPointCreate,
    db: AsyncSession = Depends(get_db),
):
    vehicle_function = await db.get(VehicleFunction, payload.vehicle_function_id)
    if vehicle_function is None:
        raise HTTPException(404, "vehicle function not found")
    if not vehicle_function.published:
        raise HTTPException(422, "技术落脚点只能关联已发布功能")
    demand = await db.get(DemandPoint, vehicle_function.demand_point_id)
    if demand is None:
        raise HTTPException(422, "需求点不存在，不能继续拆解技术落脚点")
    validation_error = await validate_confirmed_demand(db, demand)
    if validation_error:
        raise HTTPException(422, f"{validation_error}，不能继续拆解技术落脚点")
    domain = await get_or_create_vocab(db, "domain", payload.domain)  # user-approved five names; open vocabulary remains compatible
    lp = TechLandingPoint(
        vehicle_function_id=payload.vehicle_function_id,
        domain_vocab_id=domain.id,
        name=payload.name,
        role_description=payload.role_description,
    )
    db.add(lp)
    await db.commit()
    # re-select with eager loads: the fresh instance has unloaded relationships,
    # and touching them after commit would raise MissingGreenlet in the async session
    lp = await _get_landing_point(db, lp.id)
    track_workflow_success(TECHNOLOGY_DECOMPOSITION)
    return _to_out(lp)


@router.get("/{lp_id}", response_model=LandingPointOut)
async def get_landing_point(lp_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    lp = await _get_landing_point(db, lp_id)
    if lp is None:
        raise HTTPException(404, "landing point not found")
    return _to_out(lp)


@router.patch("/{lp_id}", response_model=LandingPointOut)
async def update_landing_point(
    lp_id: uuid.UUID,
    payload: LandingPointUpdate,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    lp = (
        await db.execute(
            select(TechLandingPoint)
            .where(TechLandingPoint.id == lp_id)
            .with_for_update()
        )
    ).scalar_one_or_none()
    if lp is None:
        raise HTTPException(404, "landing point not found")

    vehicle_function = await db.get(VehicleFunction, lp.vehicle_function_id)
    if vehicle_function is None or not vehicle_function.published:
        raise HTTPException(422, "技术落脚点只能编辑已发布功能下的记录")
    demand = await db.get(DemandPoint, vehicle_function.demand_point_id)
    if demand is None:
        raise HTTPException(422, "需求点不存在，不能编辑技术落脚点")
    validation_error = await validate_confirmed_demand(db, demand)
    if validation_error:
        raise HTTPException(422, f"{validation_error}，不能编辑技术落脚点")

    data = payload.model_dump(exclude_unset=True)
    if "name" in data:
        if data["name"] is None or not data["name"].strip():
            raise HTTPException(422, "技术落脚点名称不能为空")
        data["name"] = data["name"].strip()
    if "domain" in data:
        if data["domain"] is None or not data["domain"].strip():
            raise HTTPException(422, "技术域不能为空")
        domain = await get_or_create_vocab(db, "domain", data.pop("domain"))
        if domain.id != lp.domain_vocab_id:
            old_domain = await db.get(Vocab, lp.domain_vocab_id)
            await record_correction(
                db,
                "tech_landing_point",
                lp.id,
                "domain",
                old_domain.name if old_domain else None,
                domain.name,
                actor,
            )
            lp.domain_vocab_id = domain.id

    for field, value in data.items():
        old_value = getattr(lp, field)
        if old_value == value:
            continue
        await record_correction(db, "tech_landing_point", lp.id, field, old_value, value, actor)
        setattr(lp, field, value)
    await db.commit()
    updated = await _get_landing_point(db, lp_id)
    return _to_out(updated)
