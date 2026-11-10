"""Registered BE-14 agent tools."""

from __future__ import annotations

import uuid

from pydantic_ai import RunContext
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.agent_models import AgentPatch, AgentSession
from app.models.models import Signal, SignalTag, TechTheme
from app.services.agent_citations import make_signal_citation
from app.services.agent_contract import (
    AgentDeps,
    ApplyPatchRequest,
    ApplyPatchResult,
    DraftTraceReportRequest,
    DraftTraceReportResult,
    ProposePatchRequest,
    ProposePatchResult,
    SearchEvidenceRequest,
    SearchEvidenceHit,
    SearchEvidenceResult,
    SearchRagHit,
    SearchRagRequest,
    SearchRagResult,
    TagSuggestionToolResult,
    ThemeSuggestionToolResult,
)
from app.services.agent_patches import apply_confirmed_patch, propose_signal_patch
from app.services.agent_rag import search_document_chunks
from app.services.body_excerpt import text_for_tagging
from app.services.judgment import judge_signal_type, judge_stage, rank_theme_overlaps
from app.services.llm import suggest_tags_with_llm
from app.services.objectstore import load_body
from app.services.tagging import suggest_tech_tags
from app.services.tagging_guard import human_corrected_fields


async def search_evidence_tool(
    ctx: RunContext[AgentDeps], payload: SearchEvidenceRequest
) -> SearchEvidenceResult:
    like = f"%{payload.keyword.strip()}%"
    q = (
        select(Signal)
        .options(selectinload(Signal.tags).selectinload(SignalTag.vocab))
        .where(or_(Signal.title.ilike(like), Signal.excerpt.ilike(like), Signal.publisher.ilike(like)))
        .order_by(Signal.created_at.desc())
        .limit(payload.limit)
    )
    if payload.value_chain_stage:
        q = q.where(Signal.value_chain_stage_code == payload.value_chain_stage)
    rows = (await ctx.deps.db.execute(q)).scalars().all()
    hits: list[SearchEvidenceHit] = []
    for signal in rows:
        summary = signal.excerpt or signal.title
        citation = ctx.deps.ledger.register(
            make_signal_citation(signal_id=signal.id, title=signal.title, summary=summary)
        )
        hits.append(SearchEvidenceHit(citation=citation, signal_id=signal.id))
    return SearchEvidenceResult(hits=hits)


async def search_rag_tool(ctx: RunContext[AgentDeps], payload: SearchRagRequest) -> SearchRagResult:
    citations, degraded, reason = await search_document_chunks(
        ctx.deps.db, keyword=payload.keyword, limit=payload.limit
    )
    hits = []
    for citation in citations:
        registered = ctx.deps.ledger.register(citation)
        hits.append(SearchRagHit(citation=registered))
    return SearchRagResult(hits=hits, degraded=degraded, degraded_reason=reason)


async def _load_signal_detail(db: AsyncSession, signal_id: uuid.UUID) -> Signal:
    signal = (
        await db.execute(
            select(Signal)
            .options(selectinload(Signal.tags).selectinload(SignalTag.vocab))
            .where(Signal.id == signal_id)
        )
    ).scalar_one_or_none()
    if signal is None:
        raise ValueError("signal not found")
    return signal


async def suggest_signal_tags_tool(
    ctx: RunContext[AgentDeps], signal_id: uuid.UUID
) -> TagSuggestionToolResult:
    signal = await _load_signal_detail(ctx.deps.db, signal_id)
    protected = sorted(await human_corrected_fields(ctx.deps.db, signal.id))
    body = load_body(signal.body_object_key) if signal.body_object_key else None
    tagging_text = text_for_tagging(signal.title, body)
    tags, _source, _score = await suggest_tech_tags(signal.title, body or tagging_text or signal.excerpt or "")
    llm = await suggest_tags_with_llm(signal.title, (tagging_text or signal.excerpt or signal.title)[:6000])
    stage = (
        llm.value_chain_stage_code
        if llm and llm.value_chain_stage_code
        else judge_stage(signal.title, tagging_text or signal.excerpt or "")
    )
    sig_type = (
        llm.signal_type_code
        if llm and llm.signal_type_code
        else judge_signal_type(signal.title, tagging_text or signal.excerpt or "")
    )
    citation = ctx.deps.ledger.register(
        make_signal_citation(signal_id=signal.id, title=signal.title, summary=signal.excerpt or signal.title)
    )
    if "tech_tags" in protected:
        tags = []
    if "value_chain_stage_code" in protected:
        stage = None
    if "signal_type_code" in protected:
        sig_type = None
    return TagSuggestionToolResult(
        signal_id=signal.id,
        value_chain_stage_code=stage,
        signal_type_code=sig_type,
        suggested_tags=tags,
        protected_fields=protected,
        citations=[citation],
    )


async def suggest_theme_membership_tool(
    ctx: RunContext[AgentDeps], signal_id: uuid.UUID
) -> ThemeSuggestionToolResult:
    signal = await _load_signal_detail(ctx.deps.db, signal_id)
    if "tech_theme_id" in await human_corrected_fields(ctx.deps.db, signal.id):
        return ThemeSuggestionToolResult(
            signal_id=signal.id,
            candidates=[],
            reason="主题归属已由人工确认，不再自动建议",
            citations=[],
        )
    tag_names = {st.vocab.name for st in signal.tags}
    themes = (await ctx.deps.db.execute(select(TechTheme))).scalars().all()
    theme_tags: dict[uuid.UUID, set[str]] = {t.id: {t.working_name} for t in themes}
    ranked = rank_theme_overlaps(theme_tags, tag_names)
    candidates = []
    for theme_id, overlap in ranked[:5]:
        theme = next(t for t in themes if t.id == theme_id)
        candidates.append(
            {
                "tech_theme_id": str(theme_id),
                "working_name": theme.working_name,
                "overlap_count": overlap,
            }
        )
    citation = ctx.deps.ledger.register(
        make_signal_citation(signal_id=signal.id, title=signal.title, summary=signal.excerpt or signal.title)
    )
    reason = "无候选主题" if not candidates else None
    return ThemeSuggestionToolResult(
        signal_id=signal.id, candidates=candidates, citations=[citation], reason=reason
    )


async def propose_db_patch_tool(
    ctx: RunContext[AgentDeps], payload: ProposePatchRequest
) -> ProposePatchResult:
    session = await ctx.deps.db.get(AgentSession, ctx.deps.session_id)
    if session is None:
        raise ValueError("session not found")
    patch = await propose_signal_patch(
        ctx.deps.db,
        session=session,
        signal_id=payload.signal_id,
        changes=payload.changes,
        reason=payload.reason,
        citation_refs=payload.citation_refs,
        ledger=ctx.deps.ledger,
        run_id=ctx.deps.run_id,
    )
    return ProposePatchResult(patch_id=patch.id, signal_id=patch.signal_id, expires_at=patch.expires_at)


async def apply_confirmed_patch_tool(
    ctx: RunContext[AgentDeps], payload: ApplyPatchRequest
) -> ApplyPatchResult:
    patch = (
        await ctx.deps.db.execute(
            select(AgentPatch).where(
                AgentPatch.id == payload.patch_id,
                AgentPatch.session_id == ctx.deps.session_id,
            )
        )
    ).scalar_one_or_none()
    if patch is None:
        raise ValueError("变更单不存在")
    if patch.id not in ctx.deps.approved_patch_ids and not ctx.tool_call_approved:
        from pydantic_ai import ApprovalRequired

        raise ApprovalRequired(metadata={"patch_id": str(patch.id)})
    try:
        patch = await apply_confirmed_patch(ctx.deps.db, patch=patch, actor=ctx.deps.actor)
        return ApplyPatchResult(
            patch_id=patch.id,
            signal_id=patch.signal_id,
            status="applied",
            message="变更已应用",
        )
    except Exception as exc:  # noqa: BLE001 — surface tool-visible status
        status = getattr(patch, "status", "rejected")
        return ApplyPatchResult(
            patch_id=payload.patch_id,
            signal_id=patch.signal_id if patch else payload.patch_id,
            status=status if status in {"conflict", "expired", "rejected"} else "rejected",
            message=str(exc),
        )


async def draft_trace_report_tool(
    ctx: RunContext[AgentDeps], payload: DraftTraceReportRequest
) -> DraftTraceReportResult:
    signal = await _load_signal_detail(ctx.deps.db, payload.signal_id)
    citation = ctx.deps.ledger.register(
        make_signal_citation(signal_id=signal.id, title=signal.title, summary=signal.excerpt or signal.title)
    )
    theme_line = "未关联主题"
    if signal.tech_theme_id:
        theme = await ctx.deps.db.get(TechTheme, signal.tech_theme_id)
        if theme:
            theme_line = theme.working_name
    tags = ", ".join(st.vocab.name for st in signal.tags) or "—"
    markdown = (
        f"# 信号链路摘要\n\n"
        f"- 信号：{signal.title} ({signal.id})\n"
        f"- 主题：{theme_line}\n"
        f"- 环节：{signal.value_chain_stage_code or '—'}\n"
        f"- 标签：{tags}\n\n"
        f"## 局限\n\n仅包含当前已关联且可核验的信号节点；未展开需求点/功能/落脚点除非后端链路已持久化。"
    )
    return DraftTraceReportResult(markdown=markdown, citations=[citation])
