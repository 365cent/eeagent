"""Server-side validation for evidence-backed five-step demand derivation."""
from __future__ import annotations

import uuid
from collections.abc import Mapping
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Signal, SignalTag, TechTheme, Vocab

DEMAND_STEP_KEYS = (
    "fact_identification",
    "frequency_consensus",
    "similarity_analysis",
    "stakeholder_attribution",
    "demand_naming",
)
_ACCEPTABLE_EVIDENCE_STATES = {"retained"}


def validate_demand_trace_shape(trace: Any) -> tuple[str | None, set[uuid.UUID]]:
    """Check all five ordered steps and collect their evidence signal IDs."""
    if not isinstance(trace, Mapping):
        return "需求推导必须包含五步及原始证据引用（REQ-DEM-01/03）", set()
    steps = trace.get("steps")
    if not isinstance(steps, list) or len(steps) != len(DEMAND_STEP_KEYS):
        return "需求推导必须按固定顺序完整填写五步（REQ-DEM-01）", set()

    signal_ids: set[uuid.UUID] = set()
    for expected_key, step in zip(DEMAND_STEP_KEYS, steps, strict=True):
        if not isinstance(step, Mapping) or step.get("key") != expected_key:
            return "需求推导五步顺序或字段不正确（REQ-DEM-01）", set()
        content = step.get("content")
        if not isinstance(content, str) or not content.strip():
            return f"需求推导步骤 {expected_key} 缺少内容，不能保存（REQ-DEM-01）", set()
        raw_ids = step.get("evidence_signal_ids")
        if not isinstance(raw_ids, list) or not raw_ids:
            return f"需求推导步骤 {expected_key} 必须关联原始信号证据（REQ-DEM-03）", set()
        step_ids: set[uuid.UUID] = set()
        for raw_id in raw_ids:
            try:
                signal_id = uuid.UUID(str(raw_id))
            except (ValueError, TypeError, AttributeError):
                return f"需求推导步骤 {expected_key} 包含无效的证据 ID（REQ-DEM-03）", set()
            step_ids.add(signal_id)
        if len(step_ids) != len(raw_ids):
            return f"需求推导步骤 {expected_key} 存在重复证据 ID（REQ-DEM-03）", set()
        signal_ids.update(step_ids)
    return None, signal_ids


async def validate_demand_trace(
    db: AsyncSession,
    trace: Any,
    source_theme_id: uuid.UUID | None,
) -> str | None:
    """Validate trace shape and ensure every referenced signal is live evidence from its theme."""
    error, signal_ids = validate_demand_trace_shape(trace)
    if error:
        return error
    if source_theme_id is None:
        return "需求推导必须关联来源主题（REQ-DEM-03）"
    if await db.get(TechTheme, source_theme_id) is None:
        return "来源主题不存在（REQ-DEM-03）"

    rows = (
        await db.execute(
            select(Signal.id, Signal.tech_theme_id, Signal.evidence_status_code).where(
                Signal.id.in_(signal_ids)
            )
        )
    ).all()
    found = {row.id: row for row in rows}
    if signal_ids - found.keys():
        return "需求推导引用了不存在的原始信号（REQ-DEM-03）"
    if any(row.tech_theme_id != source_theme_id for row in rows):
        return "需求推导引用的信号必须归属于所选来源主题（REQ-DEM-03）"
    if any(row.evidence_status_code not in _ACCEPTABLE_EVIDENCE_STATES for row in rows):
        return "需求推导只能引用已留存且未归档的信号（REQ-DEM-03）"
    return None


async def validate_demand_cross_validation(
    db: AsyncSession,
    cross_validation: Any,
    source_theme_id: uuid.UUID | None,
) -> str | None:
    """Require reviewer confirmation to cite independent, theme-linked evidence.

    Independence checks use stored signal metadata and tag associations rather
    than accepting a caller's non-empty JSON assertion as proof.
    """
    if not isinstance(cross_validation, Mapping):
        return "确认需求前必须完成交叉验证（REQ-DEM-10/13）"
    if cross_validation.get("conclusion") != "通过":
        return "交叉验证结论须为通过才能确认需求（REQ-DEM-10/13）"
    perspectives = cross_validation.get("perspectives")
    if (
        not isinstance(perspectives, list)
        or len({item.strip() for item in perspectives if isinstance(item, str) and item.strip()}) < 2
    ):
        return "交叉验证至少要记录两个实际验证视角（REQ-DEM-10）"

    raw_ids = cross_validation.get("evidence_signal_ids")
    if not isinstance(raw_ids, list) or len(raw_ids) < 2:
        return "交叉验证必须引用至少两条独立原始信号（REQ-DEM-10）"
    try:
        signal_ids = [uuid.UUID(str(raw_id)) for raw_id in raw_ids]
    except (ValueError, TypeError, AttributeError):
        return "交叉验证包含无效的信号证据 ID（REQ-DEM-10）"
    if len(set(signal_ids)) != len(signal_ids):
        return "交叉验证不能重复引用同一条信号（REQ-DEM-10）"
    if source_theme_id is None or await db.get(TechTheme, source_theme_id) is None:
        return "交叉验证必须关联有效的来源主题（REQ-DEM-10）"

    rows = (
        await db.execute(
            select(
                Signal.id,
                Signal.tech_theme_id,
                Signal.evidence_status_code,
                Signal.publisher,
                Signal.channel_code,
                Signal.url_normalized,
            ).where(Signal.id.in_(signal_ids))
        )
    ).all()
    found = {row.id: row for row in rows}
    if set(signal_ids) - found.keys():
        return "交叉验证引用了不存在的原始信号（REQ-DEM-10）"
    if any(row.tech_theme_id != source_theme_id for row in rows):
        return "交叉验证信号必须归属于需求的来源主题（REQ-DEM-10）"
    if any(row.evidence_status_code != "retained" for row in rows):
        return "交叉验证只能引用已留存且未归档的信号（REQ-DEM-10）"
    if len({row.url_normalized for row in rows}) < 2:
        return "交叉验证必须来自不同的原始来源（REQ-DEM-10）"
    publishers = {row.publisher.strip().casefold() for row in rows if row.publisher and row.publisher.strip()}
    if len(publishers) < 2:
        return "交叉验证必须覆盖至少两个可区分的发布主体（REQ-DEM-10）"
    if len({row.channel_code for row in rows}) < 2:
        return "交叉验证必须覆盖不同的来源渠道（REQ-DEM-10）"

    tag_rows = (
        await db.execute(
            select(SignalTag.signal_id, Vocab.name)
            .join(Vocab, Vocab.id == SignalTag.vocab_id)
            .where(SignalTag.signal_id.in_(signal_ids), Vocab.kind == "tech_tag")
        )
    ).all()
    tags_by_signal: dict[uuid.UUID, set[str]] = {signal_id: set() for signal_id in signal_ids}
    for signal_id, tag_name in tag_rows:
        tags_by_signal[signal_id].add(tag_name)
    if any(not names for names in tags_by_signal.values()):
        return "交叉验证的每条信号都必须有已确认的技术标签（REQ-DEM-10）"
    if len({frozenset(names) for names in tags_by_signal.values()}) < 2:
        return "交叉验证证据的技术标签组合必须体现不同技术对象（REQ-DEM-10）"
    return None


async def validate_confirmed_demand(db: AsyncSession, demand: Any) -> str | None:
    """Recheck a saved decision against current evidence before downstream use."""
    trace_error = await validate_demand_trace(
        db,
        getattr(demand, "derivation_trace", None),
        getattr(demand, "source_tech_theme_id", None),
    )
    if trace_error:
        return trace_error
    cross_validation_error = await validate_demand_cross_validation(
        db,
        getattr(demand, "cross_validation", None),
        getattr(demand, "source_tech_theme_id", None),
    )
    if cross_validation_error:
        return cross_validation_error
    if getattr(demand, "review_status", None) != "confirmed":
        return "需求未经过有权限人员确认（REQ-DEM-13）"
    return None
