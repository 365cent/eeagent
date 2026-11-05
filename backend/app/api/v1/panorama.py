"""REQ-TECH-04 / 图2-5: 技术全景图 — 按价值链环节展开需求点 → 车辆功能 → 技术落脚点。"""

import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.base import get_db
from app.models.models import DemandPoint, RefCode, TechLandingPoint, VehicleFunction

router = APIRouter(tags=["panorama"])


class PanoramaLandingPoint(BaseModel):
    """功能下带域芯片的技术落脚点，并带有关联标准的数量（REQ-TECH-02、REQ-TECH-03）。"""

    id: uuid.UUID
    name: str
    domain_name: str
    standard_count: int


class PanoramaFunction(BaseModel):
    id: uuid.UUID
    name: str
    landing_points: list[PanoramaLandingPoint]


class PanoramaDemandPoint(BaseModel):
    id: uuid.UUID
    name: str
    functions: list[PanoramaFunction]


class PanoramaStage(BaseModel):
    """环节行上有需求数、功能数、技术落脚点数（图2-5）。"""

    stage_code: str
    stage_label: str
    demand_count: int
    function_count: int
    landing_point_count: int
    demand_points: list[PanoramaDemandPoint]


@router.get("/panorama", response_model=list[PanoramaStage])
async def tech_panorama(db: AsyncSession = Depends(get_db)):
    stages = (
        await db.execute(
            select(RefCode).where(RefCode.domain == "value_chain_stage").order_by(RefCode.code)
        )
    ).scalars().all()

    demands = (
        await db.execute(
            select(DemandPoint)
            .options(
                selectinload(DemandPoint.functions)
                .selectinload(VehicleFunction.landing_points)
                .selectinload(TechLandingPoint.domain),
                selectinload(DemandPoint.functions)
                .selectinload(VehicleFunction.landing_points)
                .selectinload(TechLandingPoint.standards),
            )
            .order_by(DemandPoint.created_at)
        )
    ).scalars().all()

    by_stage: dict[str, list[DemandPoint]] = {}
    for d in demands:
        by_stage.setdefault(d.value_chain_stage_code, []).append(d)

    rows: list[PanoramaStage] = []
    for stage in stages:
        stage_demands = by_stage.get(stage.code, [])
        function_count = 0
        landing_point_count = 0
        demand_points: list[PanoramaDemandPoint] = []
        for d in stage_demands:
            functions = sorted(d.functions, key=lambda f: f.created_at)
            function_count += len(functions)
            func_rows: list[PanoramaFunction] = []
            for f in functions:
                landing_points = sorted(f.landing_points, key=lambda lp: lp.created_at)
                landing_point_count += len(landing_points)
                func_rows.append(
                    PanoramaFunction(
                        id=f.id,
                        name=f.name,
                        landing_points=[
                            PanoramaLandingPoint(
                                id=lp.id,
                                name=lp.name,
                                domain_name=lp.domain.name if lp.domain else "",
                                standard_count=len(lp.standards),
                            )
                            for lp in landing_points
                        ],
                    )
                )
            demand_points.append(PanoramaDemandPoint(id=d.id, name=d.name, functions=func_rows))
        rows.append(
            PanoramaStage(
                stage_code=stage.code,
                stage_label=stage.label,
                demand_count=len(stage_demands),
                function_count=function_count,
                landing_point_count=landing_point_count,
                demand_points=demand_points,
            )
        )
    return rows
