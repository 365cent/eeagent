import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.base import get_db
from app.models.models import DeploymentStandard, TechLandingPoint, VehicleFunction, Vocab
from app.schemas.schemas import LandingPointCreate, LandingPointOut
from app.services.tagging import get_or_create_vocab

router = APIRouter(prefix="/landing-points", tags=["landing-points"])


def _to_out(lp: TechLandingPoint) -> LandingPointOut:
    out = LandingPointOut.model_validate(lp)
    out.domain_name = lp.domain.name if lp.domain else ""
    out.standard_count = len(lp.standards)
    return out


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
async def create_landing_point(payload: LandingPointCreate, db: AsyncSession = Depends(get_db)):
    if await db.get(VehicleFunction, payload.vehicle_function_id) is None:
        raise HTTPException(404, "vehicle function not found")
    domain = await get_or_create_vocab(db, "domain", payload.domain)  # REQ-TECH-02: 域词表可扩展
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
    return _to_out(lp)


@router.get("/{lp_id}", response_model=LandingPointOut)
async def get_landing_point(lp_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    lp = await _get_landing_point(db, lp_id)
    if lp is None:
        raise HTTPException(404, "landing point not found")
    return _to_out(lp)
