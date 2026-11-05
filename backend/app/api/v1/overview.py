from fastapi import APIRouter, Depends
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.models.models import (
    DemandPoint,
    Signal,
    StrategicAssessment,
    TechLandingPoint,
    TechTheme,
    VehicleFunction,
)
from app.schemas.schemas import OverviewStats

router = APIRouter(tags=["overview"])


@router.get("/overview", response_model=OverviewStats)
async def overview(db: AsyncSession = Depends(get_db)):
    async def count(q) -> int:
        return (await db.execute(q)).scalar_one()

    return OverviewStats(
        signals=await count(select(func.count(Signal.id))),
        signals_pending_review=await count(
            # canonical code, not the label '待人工复核' — eea_signal stores codes (app/seed.py)
            select(func.count(Signal.id)).where(Signal.evidence_status_code == "pending_review")
        ),
        tech_themes=await count(select(func.count(TechTheme.id))),
        demand_points=await count(select(func.count(DemandPoint.id))),
        vehicle_functions=await count(select(func.count(VehicleFunction.id))),
        landing_points=await count(select(func.count(TechLandingPoint.id))),
        funnel_pool=await count(
            select(func.count(StrategicAssessment.id)).where(StrategicAssessment.is_current)
        ),
    )
