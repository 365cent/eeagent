import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.models.models import DemandPoint, VehicleFunction
from app.schemas.schemas import FunctionCreate, FunctionOut, FunctionUpdate
from app.services.audit import record_correction

router = APIRouter(prefix="/functions", tags=["functions"])

# 人工复核确认值：与种子数据约定一致（app/seed.py，review_status="confirmed"）
_REVIEW_CONFIRMED = "confirmed"


async def _ensure_demand_validated(
    db: AsyncSession, demand_point_id: uuid.UUID, *, gate: str
) -> DemandPoint:
    """REQ-DEM-10/REQ-DEM-13 环节四入口门槛：需求点须已通过交叉验证并经人工复核确认。

    交叉验证：demand.cross_validation 非空；人工复核确认：review_status == "confirmed"
    （实现约定的确认值，种子数据见 app/seed.py）。不满足时 422，detail 指明未满足的条件。
    """
    demand = await db.get(DemandPoint, demand_point_id)
    if demand is None:
        raise HTTPException(404, "demand not found")
    if not demand.cross_validation:
        raise HTTPException(422, f"未通过交叉验证的需求{gate}（REQ-DEM-10）")
    if demand.review_status != _REVIEW_CONFIRMED:
        raise HTTPException(422, f"需求未人工复核确认，{gate}（REQ-DEM-13）")
    return demand


@router.get("", response_model=list[FunctionOut])
async def list_functions(
    demand_point_id: uuid.UUID | None = None,
    published: bool | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(VehicleFunction).order_by(VehicleFunction.created_at)
    if demand_point_id:
        q = q.where(VehicleFunction.demand_point_id == demand_point_id)
    if published is not None:
        q = q.where(VehicleFunction.published == published)
    return (await db.execute(q)).scalars().all()


@router.post("", response_model=FunctionOut, status_code=201)
async def create_function(payload: FunctionCreate, db: AsyncSession = Depends(get_db)):
    """创建功能推导（环节四）。

    REQ-DEM-10/REQ-DEM-13 入口门槛：需求点须已通过交叉验证（cross_validation 非空）
    且经人工复核确认（review_status == "confirmed"，确认值与 app/seed.py 种子一致），
    否则 422 且不创建任何记录。
    """
    await _ensure_demand_validated(db, payload.demand_point_id, gate="不得进入功能推导")
    f = VehicleFunction(**payload.model_dump())
    db.add(f)
    await db.commit()
    return f


@router.get("/{function_id}", response_model=FunctionOut)
async def get_function(function_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    f = await db.get(VehicleFunction, function_id)
    if f is None:
        raise HTTPException(404, "function not found")
    return f


@router.patch("/{function_id}", response_model=FunctionOut)
async def update_function(function_id: uuid.UUID, payload: FunctionUpdate, db: AsyncSession = Depends(get_db)):
    f = await db.get(VehicleFunction, function_id)
    if f is None:
        raise HTTPException(404, "function not found")
    data = payload.model_dump(exclude_unset=True)
    # REQ-MAP-05: 只有正向与反向都有记录才能发布
    if data.get("published") is True:
        if not f.forward_trace or not f.reverse_trace:
            raise HTTPException(422, "正向推导与反向验证均有记录后才能发布（REQ-MAP-05）")
        # 阶段C：未通过交叉验证/未经人工复核确认的需求点不得产生已发布的功能映射
        await _ensure_demand_validated(db, f.demand_point_id, gate="不得发布功能映射")
    for field, value in data.items():
        old = getattr(f, field)
        if value == old:
            continue  # no-op stays clean
        # REQ-RULE-02: 人工对价值链环节的纠偏必须留痕
        if field == "value_chain_stage_code":
            await record_correction(db, "vehicle_function", f.id, field, old, value)
        setattr(f, field, value)
    await db.commit()
    return f
