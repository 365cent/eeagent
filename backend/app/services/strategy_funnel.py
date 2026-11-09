"""Sequential strategic-funnel gates and append-only assessment finalization."""

from __future__ import annotations

from datetime import datetime, timezone
import uuid

from fastapi import HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import OperatorIdentity
from app.models.models import (
    DeploymentStandard,
    StrategicAssessment,
    StrategicFunnel,
    TechLandingPoint,
)
from app.services.audit import record_correction
from app.schemas.schemas import (
    AssessmentCreate,
    AssessmentOut,
    StrategyFunnelOut,
    StrategyFunnelPatch,
    StrategyScoreDrafts,
    StrategyScoreDraft,
)


SCORE_DIMENSIONS = {
    "business": ("score_business", "rationale_business"),
    "maturity": ("score_maturity", "rationale_maturity"),
    "moat": ("score_moat", "rationale_moat"),
    "supply_chain": ("score_supply_chain", "rationale_supply_chain"),
    "feasibility": ("score_feasibility", "rationale_feasibility"),
}
SCAN_FIELDS = {"scan_scope", "scan_sources"}
ADAPTATION_FIELDS = {
    "tier1_current_business_relation",
    "tier1_future_business_relation",
    "valuable_role",
    "adaptation_decision",
    "adaptation_reason",
}
SCORE_FIELDS = {field for pair in SCORE_DIMENSIONS.values() for field in pair}
CLASSIFICATION_FIELDS = {"classification", "strategy_note"}
AUDIT_FIELDS = SCAN_FIELDS | ADAPTATION_FIELDS | SCORE_FIELDS | CLASSIFICATION_FIELDS
TIER1_REQUIRED_FIELDS = (
    "tier1_current_business_relation",
    "tier1_future_business_relation",
    "valuable_role",
    "adaptation_reason",
)
CLASSIFICATIONS = {"前瞻布局", "短期可落地", "产业投资/生态合作"}


def _clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def _scan_complete(record: StrategicFunnel | None) -> bool:
    return bool(
        record
        and _clean_text(record.scan_scope)
        and isinstance(record.scan_sources, list)
        and any(_clean_text(source) for source in record.scan_sources if isinstance(source, str))
    )


def _tier1_complete(record: StrategicFunnel) -> bool:
    return all(_clean_text(getattr(record, name)) for name in TIER1_REQUIRED_FIELDS)


def _scores_complete(record: StrategicFunnel) -> bool:
    return all(
        getattr(record, score_field) is not None
        and _clean_text(getattr(record, rationale_field))
        for score_field, rationale_field in SCORE_DIMENSIONS.values()
    )


def _current_step(
    record: StrategicFunnel | None,
    pool_eligible: bool,
    current_assessment: StrategicAssessment | None,
) -> str:
    if not pool_eligible:
        return "pool_entry_blocked"
    if not _scan_complete(record):
        return "industry_scan"
    if record is None or not record.adaptation_decision:
        return "tier1_adaptation"
    if record.adaptation_decision == "reject":
        return "rejected"
    if record.adaptation_decision != "pass" or not _tier1_complete(record):
        return "tier1_adaptation"
    if not _scores_complete(record):
        return "scoring"
    if record.classification not in CLASSIFICATIONS or not _clean_text(record.strategy_note):
        return "classification"
    if (
        record.finalized_at is not None
        and record.finalized_assessment_id is not None
        and current_assessment is not None
        and current_assessment.id == record.finalized_assessment_id
    ):
        return "complete"
    return "ready_to_finalize"


async def _get_lp(db: AsyncSession, lp_id: uuid.UUID, *, lock: bool = False) -> TechLandingPoint:
    query = select(TechLandingPoint).where(TechLandingPoint.id == lp_id)
    if lock:
        query = query.with_for_update()
    lp = (await db.execute(query)).scalar_one_or_none()
    if lp is None:
        raise HTTPException(404, "landing point not found")
    return lp


async def _get_record(
    db: AsyncSession, lp_id: uuid.UUID, *, lock: bool = False
) -> StrategicFunnel | None:
    query = select(StrategicFunnel).where(StrategicFunnel.tech_landing_point_id == lp_id)
    if lock:
        query = query.with_for_update()
    return (await db.execute(query)).scalar_one_or_none()


async def _boundary_ids(db: AsyncSession, lp_id: uuid.UUID) -> list[uuid.UUID]:
    result = await db.execute(
        select(DeploymentStandard.id)
        .where(
            DeploymentStandard.tech_landing_point_id == lp_id,
            DeploymentStandard.requirement_text.is_not(None),
            func.length(func.trim(DeploymentStandard.requirement_text)) > 0,
        )
        .order_by(DeploymentStandard.id)
    )
    return list(result.scalars().all())


async def get_funnel_response(db: AsyncSession, lp_id: uuid.UUID) -> StrategyFunnelOut:
    await _get_lp(db, lp_id)
    record = await _get_record(db, lp_id)
    boundary_ids = await _boundary_ids(db, lp_id)
    current_assessment = (
        await db.execute(
            select(StrategicAssessment).where(
                StrategicAssessment.tech_landing_point_id == lp_id,
                StrategicAssessment.is_current.is_(True),
            )
        )
    ).scalar_one_or_none()

    drafts = {}
    for dimension, (score_field, rationale_field) in SCORE_DIMENSIONS.items():
        drafts[dimension] = StrategyScoreDraft(
            score=getattr(record, score_field) if record else None,
            rationale=getattr(record, rationale_field) if record else None,
        )
    total = (
        sum(getattr(record, score_field) for score_field, _ in SCORE_DIMENSIONS.values())
        if record and _scores_complete(record)
        else None
    )
    return StrategyFunnelOut(
        tech_landing_point_id=lp_id,
        current_step=_current_step(record, bool(boundary_ids), current_assessment),
        pool_eligible=bool(boundary_ids),
        deployment_boundary_evidence_ids=boundary_ids,
        scan_scope=record.scan_scope if record else None,
        scan_sources=record.scan_sources or [] if record else [],
        tier1_current_business_relation=record.tier1_current_business_relation if record else None,
        tier1_future_business_relation=record.tier1_future_business_relation if record else None,
        valuable_role=record.valuable_role if record else None,
        adaptation_decision=record.adaptation_decision if record else None,
        adaptation_reason=record.adaptation_reason if record else None,
        score_drafts=StrategyScoreDrafts(**drafts),
        score_total=total,
        classification=record.classification if record else None,
        strategy_note=record.strategy_note if record else None,
        finalized_assessment_id=record.finalized_assessment_id if record else None,
        finalized_at=record.finalized_at if record else None,
        updated_by=record.updated_by if record else None,
        updated_at=record.updated_at if record else None,
        latest_assessment=AssessmentOut.model_validate(current_assessment)
        if current_assessment
        else None,
    )


def _clear_scores(record: StrategicFunnel) -> None:
    for score_field, rationale_field in SCORE_DIMENSIONS.values():
        setattr(record, score_field, None)
        setattr(record, rationale_field, None)
    record.classification = None
    record.strategy_note = None
    _clear_finalization(record)


def _clear_classification(record: StrategicFunnel) -> None:
    record.classification = None
    record.strategy_note = None
    _clear_finalization(record)


def _clear_finalization(record: StrategicFunnel) -> None:
    record.finalized_assessment_id = None
    record.finalized_at = None


def _validate_tier1_decision(record: StrategicFunnel) -> None:
    if record.adaptation_decision and not _tier1_complete(record):
        raise HTTPException(
            422,
            "Tier1 决策需要当前业务关系、未来业务关系、有价值角色和判断依据",
        )


def _validate_score_pairs(record: StrategicFunnel) -> None:
    for score_field, rationale_field in SCORE_DIMENSIONS.values():
        score = getattr(record, score_field)
        rationale = _clean_text(getattr(record, rationale_field))
        if (score is None) != (rationale is None):
            raise HTTPException(422, f"{score_field} 与 {rationale_field} 必须同时填写或同时清空")


async def patch_funnel(
    db: AsyncSession,
    lp_id: uuid.UUID,
    patch: StrategyFunnelPatch,
    actor: OperatorIdentity,
) -> StrategyFunnelOut:
    values = patch.model_dump(exclude_unset=True)
    finalize = values.pop("finalize", False)
    if finalize:
        if values:
            raise HTTPException(422, "finalize 必须单独提交")
        await finalize_funnel(db, lp_id, actor)
        return await get_funnel_response(db, lp_id)
    if not values:
        raise HTTPException(422, "至少提交一个漏斗字段")

    await _get_lp(db, lp_id, lock=True)
    evidence_ids = await _boundary_ids(db, lp_id)
    if not evidence_ids:
        raise HTTPException(422, "至少保存一条非空部署边界标准后才能进入战略漏斗")

    record = await _get_record(db, lp_id, lock=True)
    groups = (
        ("scan", SCAN_FIELDS),
        ("adaptation", ADAPTATION_FIELDS),
        ("scores", SCORE_FIELDS),
        ("classification", CLASSIFICATION_FIELDS),
    )
    # Build one entry per matching stage. A mixed-stage PATCH produces more
    # than one match and is rejected below; a single-stage PATCH is appended once.
    touched_groups = [group for group, fields in groups if values.keys() & fields]
    if len(touched_groups) != 1:
        raise HTTPException(422, "一次 PATCH 只能保存一个漏斗步骤")
    group = touched_groups[0]

    if record is None:
        if group != "scan":
            raise HTTPException(422, "请先保存行业扫描范围和来源")
        record = StrategicFunnel(tech_landing_point_id=lp_id, updated_by=actor.subject)
        db.add(record)
    before_values = {field: getattr(record, field) for field in AUDIT_FIELDS}

    if group == "scan":
        previous = (record.scan_scope, record.scan_sources)
        for field, value in values.items():
            if field == "scan_scope":
                value = _clean_text(value)
            elif field == "scan_sources" and value is not None:
                value = [source.strip() for source in value]
                if any(not source for source in value):
                    raise HTTPException(422, "扫描来源不能包含空白项")
            setattr(record, field, value)
        if previous != (record.scan_scope, record.scan_sources):
            record.tier1_current_business_relation = None
            record.tier1_future_business_relation = None
            record.valuable_role = None
            record.adaptation_decision = None
            record.adaptation_reason = None
            _clear_scores(record)

    elif group == "adaptation":
        if not _scan_complete(record):
            raise HTTPException(422, "请先完成行业扫描范围和来源")
        before = tuple(getattr(record, field) for field in ADAPTATION_FIELDS)
        if "adaptation_decision" in values and values["adaptation_decision"] in {"pass", "reject"}:
            missing = [field for field in TIER1_REQUIRED_FIELDS if field not in values]
            if missing:
                raise HTTPException(422, "提交适配结论时须同时提交当前/未来业务关系、有价值角色和判断依据")
        for field, value in values.items():
            if field != "adaptation_decision":
                value = _clean_text(value)
            setattr(record, field, value)
        _validate_tier1_decision(record)
        after = tuple(getattr(record, field) for field in ADAPTATION_FIELDS)
        if before != after:
            _clear_scores(record)
        if record.adaptation_decision == "reject":
            _clear_scores(record)

    elif group == "scores":
        if record.adaptation_decision != "pass" or not _tier1_complete(record):
            raise HTTPException(422, "只有 Tier1 适配通过后才能录入评分")
        before = tuple(getattr(record, field) for field in SCORE_FIELDS)
        for field, value in values.items():
            if field.startswith("rationale_"):
                value = _clean_text(value)
            setattr(record, field, value)
        _validate_score_pairs(record)
        after = tuple(getattr(record, field) for field in SCORE_FIELDS)
        if before != after:
            _clear_classification(record)

    else:
        if record.adaptation_decision != "pass" or not _scores_complete(record):
            raise HTTPException(422, "五维评分及逐维依据完整后才能选择分类")
        before = (record.classification, record.strategy_note)
        for field, value in values.items():
            if field == "strategy_note":
                value = _clean_text(value)
            setattr(record, field, value)
        if before != (record.classification, record.strategy_note):
            _clear_finalization(record)

    for field in sorted(AUDIT_FIELDS):
        old_value = before_values[field]
        new_value = getattr(record, field)
        if old_value != new_value:
            await record_correction(
                db,
                "strategic_funnel",
                lp_id,
                field,
                old_value,
                new_value,
                actor,
            )

    record.updated_by = actor.subject
    record.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return await get_funnel_response(db, lp_id)


def _validate_ready_for_finalization(record: StrategicFunnel, evidence_ids: list[uuid.UUID]) -> None:
    if not evidence_ids:
        raise HTTPException(422, "至少保存一条非空部署边界标准后才能进入战略漏斗")
    if not _scan_complete(record):
        raise HTTPException(422, "行业扫描范围和来源未完成")
    if record.adaptation_decision == "reject":
        raise HTTPException(422, "Tier1 适配已拒绝，不能评分或形成分类")
    if record.adaptation_decision != "pass" or not _tier1_complete(record):
        raise HTTPException(422, "Tier1 适配尚未通过")
    if not _scores_complete(record):
        raise HTTPException(422, "五维评分和逐维依据必须完整")
    if record.classification not in CLASSIFICATIONS or not _clean_text(record.strategy_note):
        raise HTTPException(422, "请选择有效分类并填写策略备注")


async def finalize_funnel(
    db: AsyncSession,
    lp_id: uuid.UUID,
    actor: OperatorIdentity,
    legacy_payload: AssessmentCreate | None = None,
) -> StrategicAssessment:
    await _get_lp(db, lp_id, lock=True)
    evidence_ids = await _boundary_ids(db, lp_id)
    if not evidence_ids:
        raise HTTPException(422, "至少保存一条非空部署边界标准后才能进入战略漏斗")
    record = await _get_record(db, lp_id, lock=True)
    if record is None:
        raise HTTPException(422, "战略漏斗尚未开始")
    _validate_ready_for_finalization(record, evidence_ids)

    if legacy_payload is not None:
        if legacy_payload.funnel_step != 4:
            raise HTTPException(422, "完成战略漏斗后才能创建第 4 步研判版本")
        expected = {
            "score_business": record.score_business,
            "score_maturity": record.score_maturity,
            "score_moat": record.score_moat,
            "score_supply_chain": record.score_supply_chain,
            "score_feasibility": record.score_feasibility,
            "classification": record.classification,
            "strategy_note": record.strategy_note,
        }
        supplied = legacy_payload.model_dump(exclude={"funnel_step"})
        if supplied != expected:
            raise HTTPException(422, "旧研判接口内容必须与已保存的漏斗评分和分类一致")

    await db.execute(
        update(StrategicAssessment)
        .where(
            StrategicAssessment.tech_landing_point_id == lp_id,
            StrategicAssessment.is_current.is_(True),
        )
        .values(is_current=False)
    )
    await db.flush()
    max_version = (
        await db.execute(
            select(func.max(StrategicAssessment.version)).where(
                StrategicAssessment.tech_landing_point_id == lp_id
            )
        )
    ).scalar_one()
    rationales = {
        dimension: getattr(record, rationale_field)
        for dimension, (_, rationale_field) in SCORE_DIMENSIONS.items()
    }
    score_drafts = {
        dimension: {
            "score": getattr(record, score_field),
            "rationale": getattr(record, rationale_field),
        }
        for dimension, (score_field, rationale_field) in SCORE_DIMENSIONS.items()
    }
    snapshot = {
        "scan_scope": record.scan_scope,
        "scan_sources": record.scan_sources or [],
        "deployment_boundary_evidence_ids": [str(value) for value in evidence_ids],
        "tier1_current_business_relation": record.tier1_current_business_relation,
        "tier1_future_business_relation": record.tier1_future_business_relation,
        "valuable_role": record.valuable_role,
        "adaptation_decision": record.adaptation_decision,
        "adaptation_reason": record.adaptation_reason,
        "score_drafts": score_drafts,
        "classification": record.classification,
        "strategy_note": record.strategy_note,
    }
    assessment = StrategicAssessment(
        tech_landing_point_id=lp_id,
        version=(max_version or 0) + 1,
        funnel_step=4,
        score_business=record.score_business,
        score_maturity=record.score_maturity,
        score_moat=record.score_moat,
        score_supply_chain=record.score_supply_chain,
        score_feasibility=record.score_feasibility,
        classification=record.classification,
        strategy_note=record.strategy_note,
        score_rationales=rationales,
        funnel_snapshot=snapshot,
        operator_subject=actor.subject,
        is_current=True,
    )
    db.add(assessment)
    await db.flush()
    await db.refresh(assessment)
    record.finalized_assessment_id = assessment.id
    record.finalized_at = datetime.now(timezone.utc)
    record.updated_by = actor.subject
    record.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(assessment)
    return assessment
