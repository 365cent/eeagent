import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import OperatorIdentity, get_operator_identity
from app.db.base import get_db
from app.platform.launchdarkly import DEMAND_FUNCTION_MAPPING, require_feature, track_workflow_success
from app.models.models import DemandPoint, VehicleFunction, Vocab
from app.schemas.schemas import FunctionCreate, FunctionOut, FunctionUpdate
from app.services.audit import record_correction
from app.services.demand_validation import validate_confirmed_demand
from app.services.function_validation import (
    validate_forward_trace,
    validate_function_card,
    validate_reverse_trace,
)

router = APIRouter(
    prefix="/functions",
    tags=["functions"],
    dependencies=[Depends(require_feature(DEMAND_FUNCTION_MAPPING))],
)


async def _ensure_demand_validated(
    db: AsyncSession, demand_point_id: uuid.UUID, *, gate: str
) -> DemandPoint:
    """REQ-DEM-10/REQ-DEM-13 环节四入口门槛：需求点须已通过交叉验证并经人工复核确认。

    交叉验证会重新核验来源主题、留存状态、独立主体、渠道及技术标签；
    review_status 必须为 confirmed。不满足时 422，detail 指明未满足的条件。
    """
    demand = await db.get(DemandPoint, demand_point_id)
    if demand is None:
        raise HTTPException(404, "demand not found")
    validation_error = await validate_confirmed_demand(db, demand)
    if validation_error:
        raise HTTPException(422, f"{validation_error}，不能{gate}")
    return demand


async def _ensure_card_vocab(db: AsyncSession, field: str, value: str | None, kind: str) -> None:
    if value is None:
        return
    exists = await db.scalar(select(Vocab.id).where(Vocab.kind == kind, Vocab.name == value))
    if exists is None:
        raise HTTPException(422, f"{field} 不在 {kind} 词表中（REQ-MAP-07）")


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
async def create_function(
    payload: FunctionCreate,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    """创建功能推导（环节四）。

    REQ-DEM-10/REQ-DEM-13 入口门槛：需求点须已通过交叉验证（cross_validation 非空）
    且经人工复核确认（review_status == "confirmed"，确认值与 app/seed.py 种子一致），
    否则 422 且不创建任何记录。
    """
    await _ensure_demand_validated(db, payload.demand_point_id, gate="不得进入功能推导")
    error = validate_forward_trace(payload.forward_trace)
    if error:
        raise HTTPException(422, error)
    await _ensure_card_vocab(
        db, "recommendation_level", payload.recommendation_level, "recommendation_level"
    )
    await _ensure_card_vocab(db, "target_domain", payload.target_domain, "target_domain")
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
async def update_function(
    function_id: uuid.UUID,
    payload: FunctionUpdate,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    f = await db.get(VehicleFunction, function_id)
    if f is None:
        raise HTTPException(404, "function not found")
    data = payload.model_dump(exclude_unset=True)
    if "forward_trace" in data:
        error = validate_forward_trace(data["forward_trace"])
        if error:
            raise HTTPException(422, error)
    # Validate the proposed merged state before making any model or audit changes.
    merged = {
        "forward_trace": data.get("forward_trace", f.forward_trace),
        "reverse_trace": data.get("reverse_trace", f.reverse_trace),
        "published": data.get("published", f.published),
    }
    card = {
        field: data.get(field, getattr(f, field))
        for field in (
            "recommendation_level",
            "automation_levels",
            "target_domain",
            "recommendation_reason",
            "l2_l4_difference",
        )
    }
    review_fields = (
        "name",
        "value_chain_stage_code",
        "forward_trace",
        "reverse_trace",
        "recommendation_level",
        "automation_levels",
        "target_domain",
        "recommendation_reason",
        "l2_l4_difference",
    )
    review_changed = any(
        field in data and data[field] != getattr(f, field) for field in review_fields
    )
    if f.published and review_changed and data.get("published") is not True:
        merged["published"] = False
    if merged["published"]:
        if "forward_trace" not in data or "reverse_trace" not in data:
            raise HTTPException(422, "发布时须在本次提交中重新确认正向推导和反向验证（REQ-MAP-05）")
        error = validate_forward_trace(merged["forward_trace"])
        if error:
            raise HTTPException(422, error)
        error = validate_reverse_trace(merged["reverse_trace"], merged["forward_trace"])
        if error:
            raise HTTPException(422, error)
        error = validate_function_card(card)
        if error:
            raise HTTPException(422, error)
        await _ensure_card_vocab(
            db, "recommendation_level", card["recommendation_level"], "recommendation_level"
        )
        await _ensure_card_vocab(db, "target_domain", card["target_domain"], "target_domain")
        await _ensure_demand_validated(db, f.demand_point_id, gate="不得发布功能映射")
    else:
        for field, kind in (
            ("recommendation_level", "recommendation_level"),
            ("target_domain", "target_domain"),
        ):
            if field in data:
                await _ensure_card_vocab(db, field, data[field], kind)
    for field, value in data.items():
        old = getattr(f, field)
        if value == old:
            continue  # no-op stays clean
        # Keep every operator correction to the persisted derivation/card.
        if field in review_fields or field == "published":
            await record_correction(db, "vehicle_function", f.id, field, old, value, actor)
        setattr(f, field, value)
    if review_changed and data.get("published") is not True:
        if f.published:
            await record_correction(db, "vehicle_function", f.id, "published", True, False, actor)
        f.published = False
    elif data.get("published") is True:
        f.published = True
    await db.commit()
    if f.published:
        track_workflow_success(DEMAND_FUNCTION_MAPPING)
    return f
