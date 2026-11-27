import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.platform.launchdarkly import DEMAND_EXTRACTION, require_feature, track_workflow_success
from app.core.identity import OperatorIdentity, get_operator_identity
from app.models.models import DemandPoint, TechTheme, VehicleFunction
from app.schemas.schemas import (
    DemandAssistantMessageIn,
    DemandAssistantMessageOut,
    DemandCreate,
    DemandDraftProposalOut,
    DemandDraftProposeIn,
    DemandOut,
    DemandUpdate,
)
from app.platform.audit import record_correction
from app.domains.demand.draft import demand_assistant_reply, propose_demand_draft
from app.domains.demand.serialization import enrich_demand_out as _enrich
from app.domains.demand.validation import (
    validate_demand_cross_validation,
    validate_demand_trace,
)

router = APIRouter(
    prefix="/demands",
    tags=["demands"],
    dependencies=[Depends(require_feature(DEMAND_EXTRACTION))],
)


@router.get("", response_model=list[DemandOut])
async def list_demands(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(DemandPoint).order_by(DemandPoint.created_at))).scalars().all()
    return [await _enrich(db, d) for d in rows]


@router.post("", response_model=DemandOut, status_code=201)
async def create_demand(payload: DemandCreate, db: AsyncSession = Depends(get_db)):
    if payload.review_status == "confirmed":
        raise HTTPException(
            422,
            "需求点必须先保存为待复核，再由具备权限的人员确认（REQ-DEM-13）",
        )
    if payload.source_tech_theme_id and await db.get(TechTheme, payload.source_tech_theme_id) is None:
        raise HTTPException(404, "theme not found")
    trace_error = await validate_demand_trace(
        db, payload.derivation_trace, payload.source_tech_theme_id
    )
    if trace_error:
        raise HTTPException(422, trace_error)
    if payload.low_freq_strong_signal and not (payload.low_freq_strong_signal_reason or "").strip():
        raise HTTPException(422, "低频强信号必须填写理由")
    values = payload.model_dump(exclude={"review_status"})
    if not payload.low_freq_strong_signal:
        values["low_freq_strong_signal_reason"] = None
    d = DemandPoint(**values, review_status="pending")
    db.add(d)
    await db.commit()
    track_workflow_success(DEMAND_EXTRACTION)
    return await _enrich(db, d)


def _draft_out(raw: dict) -> DemandDraftProposalOut:
    return DemandDraftProposalOut(
        name=str(raw.get("name") or "").strip(),
        value_chain_stage_code=str(raw.get("value_chain_stage_code") or ""),
        source_tech_theme_id=uuid.UUID(str(raw["source_tech_theme_id"])),
        derivation_trace=raw.get("derivation_trace"),
        cross_validation=raw.get("cross_validation"),
        time_series=raw.get("time_series") or [],
        source=raw.get("source"),
        llm_note=raw.get("llm_note"),
    )


@router.post("/assistant/draft", response_model=DemandDraftProposalOut)
async def propose_demand_draft_endpoint(
    payload: DemandDraftProposeIn,
    db: AsyncSession = Depends(get_db),
):
    """From a tech theme's retained signals, propose a demand-point draft (环节三)."""
    raw = await propose_demand_draft(
        db,
        payload.source_tech_theme_id,
        user_hint=payload.user_hint,
        use_llm=payload.use_llm,
        selected_signal_ids=payload.selected_signal_ids or None,
    )
    return _draft_out(raw)


@router.post("/assistant/messages", response_model=DemandAssistantMessageOut)
async def demand_assistant_message(
    payload: DemandAssistantMessageIn,
    db: AsyncSession = Depends(get_db),
):
    history = [{"role": t.role, "content": t.content} for t in payload.history]
    reply, model, draft = await demand_assistant_reply(
        db,
        payload.source_tech_theme_id,
        payload.message,
        history,
        selected_signal_ids=payload.selected_signal_ids or None,
    )
    return DemandAssistantMessageOut(
        reply=reply,
        model=model,
        draft=_draft_out(draft) if draft else None,
    )


@router.get("/{demand_id}", response_model=DemandOut)
async def get_demand(demand_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    d = await db.get(DemandPoint, demand_id)
    if d is None:
        raise HTTPException(404, "demand not found")
    return await _enrich(db, d)


@router.patch("/{demand_id}", response_model=DemandOut)
async def update_demand(
    demand_id: uuid.UUID,
    payload: DemandUpdate,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    d = await db.get(DemandPoint, demand_id)
    if d is None:
        raise HTTPException(404, "demand not found")
    data = payload.model_dump(exclude_unset=True)
    proposed_low_freq = data.get("low_freq_strong_signal", d.low_freq_strong_signal)
    proposed_reason = data.get("low_freq_strong_signal_reason", d.low_freq_strong_signal_reason)
    if proposed_low_freq and not (proposed_reason or "").strip():
        raise HTTPException(422, "低频强信号必须填写理由")
    if not proposed_low_freq:
        data["low_freq_strong_signal_reason"] = None
    if data.get("review_status") == "confirmed" and actor.role not in {
        "taxonomy_admin",
        "platform_admin",
    }:
        raise HTTPException(403, "只有方法论或平台管理员可以确认需求点（REQ-DEM-13）")
    substantive_fields = {
        "name",
        "source_tech_theme_id",
        "value_chain_stage_code",
        "derivation_trace",
        "cross_validation",
        "time_series",
    }
    substantive_changed = any(
        field in data and data[field] != getattr(d, field) for field in substantive_fields
    )
    if substantive_changed and data.get("review_status") == "confirmed":
        raise HTTPException(
            422,
            "修改需求推导或证据后须先保存为待复核，再由复核人单独确认（REQ-DEM-13）",
        )
    if substantive_changed and d.review_status == "confirmed":
        data["review_status"] = "pending"

    if "derivation_trace" in data or "source_tech_theme_id" in data:
        proposed_trace = data.get("derivation_trace", d.derivation_trace)
        proposed_theme_id = data.get("source_tech_theme_id", d.source_tech_theme_id)
        if proposed_theme_id and await db.get(TechTheme, proposed_theme_id) is None:
            raise HTTPException(404, "theme not found")
        trace_error = await validate_demand_trace(db, proposed_trace, proposed_theme_id)
        if trace_error:
            raise HTTPException(422, trace_error)

    if data.get("review_status") == "confirmed":
        proposed = data.get("cross_validation", d.cross_validation)
        proposed_theme_id = data.get("source_tech_theme_id", d.source_tech_theme_id)
        cross_validation_error = await validate_demand_cross_validation(
            db, proposed, proposed_theme_id
        )
        if cross_validation_error:
            raise HTTPException(422, cross_validation_error)
    if data.get("review_status") == "confirmed" and d.review_status != "confirmed":
        # Same clock as DemandPoint.updated_at (onupdate=func.now()): comparing a
        # Python timestamp against a Postgres one misreads a fresh row as stale
        # whenever the two clocks drift apart.
        d.confirmed_at = func.now()
        d.confirmed_by_subject = actor.subject
    invalidate_functions = False
    for field, value in data.items():
        old = getattr(d, field)
        if value == old:
            continue  # no-op stays clean
        await record_correction(db, "demand_point", d.id, field, old, value, actor)
        if field in substantive_fields or field == "review_status":
            invalidate_functions = True
        setattr(d, field, value)
    if invalidate_functions:
        published_functions = (
            await db.execute(
                select(VehicleFunction)
                .where(
                    VehicleFunction.demand_point_id == d.id,
                    VehicleFunction.published.is_(True),
                )
                .with_for_update()
            )
        ).scalars().all()
        for vehicle_function in published_functions:
            await record_correction(
                db,
                "vehicle_function",
                vehicle_function.id,
                "published",
                True,
                False,
                actor,
            )
            vehicle_function.published = False
    await db.commit()
    return await _enrich(db, d)


@router.delete("/{demand_id}", status_code=204)
async def delete_demand(
    demand_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    """Remove a demand point and the vehicle functions derived from it."""
    demand = await db.get(DemandPoint, demand_id)
    if demand is None:
        raise HTTPException(404, "demand not found")
    await db.execute(
        text(
            """
            DELETE FROM eea_strategic_funnel
            WHERE tech_landing_point_id IN (
                SELECT lp.id
                FROM eea_tech_landing_point AS lp
                JOIN eea_vehicle_function AS fn ON fn.id = lp.vehicle_function_id
                WHERE fn.demand_point_id = :demand_id
            )
            """
        ),
        {"demand_id": demand.id},
    )
    landing_ids = """
        SELECT lp.id
        FROM eea_tech_landing_point AS lp
        JOIN eea_vehicle_function AS fn ON fn.id = lp.vehicle_function_id
        WHERE fn.demand_point_id = :demand_id
    """
    await db.execute(
        text(f"DELETE FROM eea_deployment_standard WHERE tech_landing_point_id IN ({landing_ids})"),
        {"demand_id": demand.id},
    )
    await db.execute(
        text(f"DELETE FROM eea_strategic_assessment WHERE tech_landing_point_id IN ({landing_ids})"),
        {"demand_id": demand.id},
    )
    await db.execute(
        text(f"DELETE FROM eea_tech_landing_point WHERE id IN ({landing_ids})"),
        {"demand_id": demand.id},
    )
    await db.execute(
        text("DELETE FROM eea_vehicle_function WHERE demand_point_id = :demand_id"),
        {"demand_id": demand.id},
    )
    await db.execute(
        text("DELETE FROM eea_chain_report WHERE demand_point_id = :demand_id"),
        {"demand_id": demand.id},
    )
    await record_correction(
        db,
        "demand_point",
        demand.id,
        "deleted",
        {"name": demand.name},
        None,
        actor,
        reason="删除需求点",
    )
    await db.delete(demand)
    await db.commit()
    track_workflow_success(DEMAND_EXTRACTION)
