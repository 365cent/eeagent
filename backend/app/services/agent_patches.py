"""Deferred agent patches with confirmation and audits."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.identity import OperatorIdentity
from app.models.agent_models import AgentPatch, AgentSession
from app.models.models import Signal, SignalTag, TechTheme, Vocab
from app.services.agent_citations import assert_citations_usable  # noqa: F401 — patch proposals
from app.services.agent_contract import CitationLedger, PatchFieldChange
from app.services.audit import record_correction
from app.services.tagging import get_or_create_vocab
from app.services.tagging_guard import PROTECTED_SUGGESTION_FIELDS, assert_expected_signal_revision, human_corrected_fields


PATCH_FIELDS = frozenset(PROTECTED_SUGGESTION_FIELDS)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


async def _load_signal(db: AsyncSession, signal_id: uuid.UUID) -> Signal:
    s = (
        await db.execute(
            select(Signal)
            .options(selectinload(Signal.tags).selectinload(SignalTag.vocab))
            .where(Signal.id == signal_id)
        )
    ).scalar_one_or_none()
    if s is None:
        raise HTTPException(404, "signal not found")
    return s


def _baseline_snapshot(signal: Signal) -> dict:
    return {
        "value_chain_stage_code": signal.value_chain_stage_code,
        "signal_type_code": signal.signal_type_code,
        "tech_tags": sorted(st.vocab.name for st in signal.tags),
        "tech_theme_id": str(signal.tech_theme_id) if signal.tech_theme_id else None,
        "updated_at": signal.updated_at.isoformat(),
    }


async def propose_signal_patch(
    db: AsyncSession,
    *,
    session: AgentSession,
    signal_id: uuid.UUID,
    changes: list[PatchFieldChange],
    reason: str,
    citation_refs: list[str],
    ledger: CitationLedger,
    run_id: uuid.UUID | None,
) -> AgentPatch:
    assert_citations_usable(ledger, citation_refs)
    signal = await _load_signal(db, signal_id)
    protected = await human_corrected_fields(db, signal.id)
    diff: dict = {}
    for change in changes:
        if change.field_name not in PATCH_FIELDS:
            raise HTTPException(422, f"不允许修改字段 {change.field_name}")
        if change.field_name in protected:
            raise HTTPException(409, f"字段 {change.field_name} 已由人工确认，不能自动覆盖")
        diff[change.field_name] = change.new_value
    if not diff:
        raise HTTPException(422, "变更单不能为空")
    ttl = timedelta(hours=get_settings().agent_patch_ttl_hours)
    patch = AgentPatch(
        session_id=session.id,
        run_id=run_id,
        signal_id=signal.id,
        operator_subject=session.operator_subject,
        status="pending",
        baseline_snapshot=_baseline_snapshot(signal),
        diff=diff,
        reason=reason,
        citation_refs=citation_refs,
        baseline_updated_at=signal.updated_at,
        expires_at=_utcnow() + ttl,
    )
    db.add(patch)
    await db.flush()
    return patch


async def apply_confirmed_patch(
    db: AsyncSession,
    *,
    patch: AgentPatch,
    actor: OperatorIdentity,
) -> AgentPatch:
    if patch.operator_subject != actor.subject:
        raise HTTPException(403, "无权确认此变更单")
    if patch.status == "applied":
        raise HTTPException(409, "变更单已应用")
    if patch.status != "pending":
        raise HTTPException(409, f"变更单状态为 {patch.status}")
    now = _utcnow()
    if patch.expires_at <= now:
        patch.status = "expired"
        patch.conflict_reason = "变更单已过期"
        await db.flush()
        raise HTTPException(409, "变更单已过期，请重新生成")

    signal = await _load_signal(db, patch.signal_id)
    assert_expected_signal_revision(signal, patch.baseline_updated_at)
    protected = await human_corrected_fields(db, signal.id)
    for field in patch.diff:
        if field in protected:
            patch.status = "conflict"
            patch.conflict_reason = f"字段 {field} 已被人工确认"
            await db.flush()
            raise HTTPException(409, patch.conflict_reason)

    for field, new_value in patch.diff.items():
        if field == "tech_tags":
            old = sorted(st.vocab.name for st in signal.tags)
            tag_names = list(dict.fromkeys(str(n).strip() for n in new_value if str(n).strip()))
            for st in list(signal.tags):
                await db.delete(st)
            await db.flush()
            for name in tag_names:
                vocab = await get_or_create_vocab(db, "tech_tag", name)
                db.add(SignalTag(signal_id=signal.id, vocab_id=vocab.id))
            if sorted(tag_names) != old:
                await record_correction(db, "signal", signal.id, "tech_tags", old, sorted(tag_names), actor)
        elif field == "tech_theme_id":
            old = signal.tech_theme_id
            theme_id = uuid.UUID(str(new_value)) if new_value else None
            if theme_id is not None and await db.get(TechTheme, theme_id) is None:
                raise HTTPException(404, "theme not found")
            signal.tech_theme_id = theme_id
            if old != theme_id:
                await record_correction(
                    db,
                    "signal",
                    signal.id,
                    "tech_theme_id",
                    str(old) if old else None,
                    str(theme_id) if theme_id else None,
                    actor,
                )
        else:
            old = getattr(signal, field)
            if old != new_value:
                await record_correction(db, "signal", signal.id, field, old, new_value, actor)
            setattr(signal, field, new_value)

    patch.status = "applied"
    patch.applied_at = now
    await db.flush()
    return patch


async def reject_patch(db: AsyncSession, patch: AgentPatch, actor: OperatorIdentity) -> AgentPatch:
    if patch.operator_subject != actor.subject:
        raise HTTPException(403, "无权拒绝此变更单")
    if patch.status != "pending":
        raise HTTPException(409, f"变更单状态为 {patch.status}")
    patch.status = "rejected"
    await db.flush()
    return patch


async def get_owned_patch(
    db: AsyncSession, session_id: uuid.UUID, patch_id: uuid.UUID, actor: OperatorIdentity
) -> AgentPatch:
    patch = (
        await db.execute(
            select(AgentPatch).where(
                AgentPatch.id == patch_id,
                AgentPatch.session_id == session_id,
            )
        )
    ).scalar_one_or_none()
    if patch is None:
        raise HTTPException(404, "patch not found")
    session = await db.get(AgentSession, session_id)
    if session is None or session.operator_subject != actor.subject:
        raise HTTPException(403, "无权访问该会话变更单")
    return patch
