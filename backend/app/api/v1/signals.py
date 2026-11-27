import asyncio
import uuid
from collections import defaultdict
from datetime import datetime
from functools import partial
from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Response, UploadFile
from fastapi.responses import JSONResponse, PlainTextResponse
from anyio import to_thread
from sqlalchemy import func, or_, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.identity import OperatorIdentity, get_operator_identity
from app.db.base import get_db
from app.platform.launchdarkly import SIGNAL_TAGGING, require_feature, track_workflow_success
from app.models.models import Document, Signal, SignalTag, TechTheme, Vocab
from app.models.agent_models import AgentPatch
from app.schemas.schemas import (
    DuplicateCleanupIn,
    DuplicateCleanupOut,
    DuplicateCleanupSkipOut,
    DuplicateGroupOut,
    DuplicateMemberOut,
    DuplicateScanOut,
    SignalAssistantMessageIn,
    SignalAssistantMessageOut,
    SignalCreate,
    SignalDetail,
    SignalFigureOut,
    SignalRecaptionOut,
    SignalOut,
    SignalStudioBundleOut,
    SignalStudioIn,
    SignalUpdate,
    TagAssignment,
    TagCandidateDetail,
    TagSuggestion,
    SignalSourceCreate,
    SignalSourceOut,
    ThemeAggregateCandidate,
    ThemeAggregatePreview,
    ThemeAssignment,
)
from app.domains.capture.document_path import create_signal_from_document
from app.domains.evidence.html_capture import _signal_from_html
from app.domains.evidence.signal_queries import find_signal, get_signal_detail, signal_out as _to_out
from app.domains.evidence.signal_record import create_signal_record as _create_signal_record
from app.domains.evidence.theme_match import match_theme as _match_theme, theme_display_tags
from app.platform.audit import record_correction
from app.services.demand_validation import confirmed_demand_citing
from app.services.signal_dedup import (
    FIELD_LABELS,
    DuplicateGroup,
    scan_duplicates,
)
from app.services.body_excerpt import resolve_signal_excerpt
from app.services.html_snapshot import (
    enrich_snapshot_figures,
    figure_data_urls,
    parse_html_snapshot,
    prepare_archive_replay_html,
)
from app.domains.evidence.judgment import (
    aggregation_structured_basis,
    judge_signal_type,
    judge_stage,
    rank_theme_overlaps,
    select_best_theme,
    structured_basis_consistent,
)
from app.services.signal_sources import add_supplementary_url, list_sources
from app.services.signal_recaption import recaption_signal_article
from app.domains.evidence.tagging_guard import assert_expected_signal_revision, human_corrected_fields
from app.services.llm import suggest_tags_with_llm
from app.services.llm_gateway import (
    LLMNoModelError,
    LLMNotConfiguredError,
    LLMUpstreamError,
    chat_completion,
    resolve_chat_model,
    studio_generation_slot,
)
from app.platform.objectstore import load_body, load_bytes, save_body, save_bytes
from app.domains.vocab.refcodes import codes, normalize as normalize_ref_code
from app.services.llm_prompts import evidence_assistant_system
from app.services.signal_studio_store import (
    get_studio_artifact,
    list_studio_artifacts,
    upsert_studio_artifact,
)
from app.services.studio import (
    StudioParseError,
    build_messages as build_studio_messages,
    parse_studio_payload,
    strip_report_markdown,
)
from app.services.tagging import (
    get_or_create_vocab,
    normalize_url,
    sha256_text,
    suggest_tags,
    suggest_tech_tags,
    text_for_tagging,
)

router = APIRouter(prefix="/signals", tags=["signals"])


def _query_code(domain: str, value: str) -> str:
    """Normalize a closed-vocabulary query param (code/label/alias) to its code."""
    code = normalize_ref_code(domain, value)
    if code is None:
        raise HTTPException(
            422,
            f"{domain}={value!r} 不在封闭词表 '{domain}' 内（CONV-CLOSED-VOCAB），"
            f"可选值: {', '.join(codes(domain))}",
        )
    return code


async def _load_signal(db: AsyncSession, sid: uuid.UUID) -> Signal:
    obj = await find_signal(db, sid)
    if obj is None:
        raise HTTPException(404, "signal not found")
    return obj


async def _signal_total(db: AsyncSession) -> int:
    return int((await db.execute(select(func.count()).select_from(Signal))).scalar_one() or 0)


async def _signal_has_agent_patches(db: AsyncSession, signal_id: uuid.UUID) -> bool:
    """``eea_agent_patch.signal_id`` has no ON DELETE rule, so a referenced
    signal cannot be removed; report it instead of failing the whole cleanup."""
    count = (
        await db.execute(
            select(func.count()).select_from(AgentPatch).where(AgentPatch.signal_id == signal_id)
        )
    ).scalar_one()
    return bool(count)


def _duplicate_scan_out(groups: list[DuplicateGroup], total: int) -> DuplicateScanOut:
    out_groups: list[DuplicateGroupOut] = []
    for group in groups:
        members = [
            DuplicateMemberOut(
                id=member.signal.id,
                title=member.signal.title,
                url=member.signal.url,
                evidence_status_code=member.signal.evidence_status_code,
                publisher=member.signal.publisher,
                created_at=member.signal.created_at,
                tags=sorted(st.vocab.name for st in member.signal.tags if st.vocab),
                tech_theme_id=member.signal.tech_theme_id,
                has_archive=bool(member.signal.snapshot_html_object_key),
                has_body=bool(member.signal.body_sha256),
                keep=member.keep,
                identical_to_keep=member.identical_to_keep,
            )
            for member in group.members
        ]
        out_groups.append(
            DuplicateGroupOut(
                key=group.key,
                kind=group.kind,
                identical=group.identical,
                different_fields=group.different_fields,
                field_labels={name: FIELD_LABELS.get(name, name) for name in group.different_fields},
                values=group.values,
                members=members,
            )
        )
    return DuplicateScanOut(
        groups=out_groups,
        total_signals=total,
        redundant_signals=sum(len(group.members) - 1 for group in groups),
        identical_groups=sum(1 for group in groups if group.identical),
        different_groups=sum(1 for group in groups if not group.identical),
    )


def _apply_signal_list_filters(
    q,
    *,
    keyword: str | None,
    value_chain_stage: str | None,
    channel: str | None,
    evidence_status: str | None,
    theme_id: uuid.UUID | None,
    source: str | None,
    tag: str | None,
    include_archived: bool,
):
    if keyword:
        like = f"%{keyword}%"
        q = q.where(or_(Signal.title.ilike(like), Signal.excerpt.ilike(like), Signal.publisher.ilike(like)))
    if value_chain_stage:
        q = q.where(Signal.value_chain_stage_code == _query_code("value_chain_stage", value_chain_stage))
    if channel:
        q = q.where(Signal.channel_code == _query_code("channel", channel))
    if evidence_status:
        q = q.where(Signal.evidence_status_code == _query_code("evidence_status", evidence_status))
    elif not include_archived:
        q = q.where(Signal.evidence_status_code != "archived")
    if theme_id:
        q = q.where(Signal.tech_theme_id == theme_id)
    if source:
        q = q.where(Signal.publisher.ilike(f"%{source}%"))
    if tag:
        q = q.join(Signal.tags).join(Vocab).where(Vocab.name.ilike(f"%{tag.strip()}%"))
    return q


@router.get("", response_model=list[SignalOut])
async def list_signals(
    response: Response,
    db: AsyncSession = Depends(get_db),
    keyword: str | None = None,
    value_chain_stage: str | None = None,
    channel: str | None = None,
    evidence_status: str | None = None,
    theme_id: uuid.UUID | None = None,
    source: str | None = None,  # 来源 (REQ-SIG-04, 图2-1-1 筛选：价值链环节、来源、关键词)
    tag: str | None = Query(None, description="Technical tag substring filter"),
    include_archived: bool = Query(
        False,
        description="When false and evidence_status is unset, archived signals are omitted from the list.",
    ),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    q = (
        select(Signal)
        .options(selectinload(Signal.tags).selectinload(SignalTag.vocab))
        .order_by(Signal.created_at.desc())
    )
    q = _apply_signal_list_filters(
        q,
        keyword=keyword,
        value_chain_stage=value_chain_stage,
        channel=channel,
        evidence_status=evidence_status,
        theme_id=theme_id,
        source=source,
        tag=tag,
        include_archived=include_archived,
    )
    id_q = _apply_signal_list_filters(
        select(Signal.id),
        keyword=keyword,
        value_chain_stage=value_chain_stage,
        channel=channel,
        evidence_status=evidence_status,
        theme_id=theme_id,
        source=source,
        tag=tag,
        include_archived=include_archived,
    )
    total = int(
        (await db.execute(select(func.count()).select_from(id_q.distinct().subquery()))).scalar_one() or 0
    )
    rows = (await db.execute(q.limit(limit).offset(offset))).scalars().unique().all()
    response.headers["X-Total-Count"] = str(total)
    return [_to_out(s) for s in rows]


@router.post("", response_model=SignalDetail, status_code=201)
async def create_signal(payload: SignalCreate, db: AsyncSession = Depends(get_db)):
    document = None
    if payload.document_id is not None:
        document = await db.get(Document, payload.document_id)
        if document is None:
            raise HTTPException(404, "document not found")
    if document is not None:
        sig, _ = await create_signal_from_document(
            db,
            filename=document.filename,
            mime=document.mime,
            source_url=payload.url,
            document=document,
            title=payload.title,
            body_text=payload.body_text,
            excerpt=payload.excerpt,
            published_at=payload.published_at,
            channel_code=payload.channel_code,
            evidence_status_code=(
                payload.evidence_status_code
                if "evidence_status_code" in payload.model_fields_set
                else None
            ),
            value_chain_stage_code=payload.value_chain_stage_code,
            signal_type_code=payload.signal_type_code,
            evolution_node_code=payload.evolution_node_code,
            publisher=payload.publisher,
            source_label=payload.source_label,
            ingest=False,
        )
        return await get_signal(sig.id, db)
    else:
        if not payload.title or not payload.url:
            raise HTTPException(422, "title 与 url 必填；或改传 document_id 走文档来源路径")
        title = payload.title
        url = payload.url
        # REQ-SIG-11: pasted body fallback keeps original URL; the body is persisted
        # to the object store and the DB keeps only the reference (SCHEMA-SIGNAL-SNAPSHOT)
        body_text = payload.body_text or payload.excerpt
        excerpt = payload.excerpt
        published_at = payload.published_at
    if excerpt is None and body_text:
        excerpt = await resolve_signal_excerpt(title, body_text)
    # REQ-SIG-11: once the pasted body completes the snapshot the signal is
    # 已留存 (retained) — not 抓取中 — unless the client set an explicit status
    evidence_status = payload.evidence_status_code
    if body_text and "evidence_status_code" not in payload.model_fields_set:
        evidence_status = "retained"
    sig = await _create_signal_record(
        db,
        title=title,
        url=url,
        channel_code=payload.channel_code,
        evidence_status_code=evidence_status,
        publisher=payload.publisher,
        published_at=published_at,
        value_chain_stage_code=payload.value_chain_stage_code,
        signal_type_code=payload.signal_type_code,
        evolution_node_code=payload.evolution_node_code,
        source_label=payload.source_label,
        excerpt=excerpt,
        body_text=body_text,
    )
    return await get_signal(sig.id, db)


@router.post("/capture", response_model=SignalDetail, status_code=201)
async def capture_signal(
    url: str = Form(...),
    archive_html: UploadFile = File(...),
    channel_code: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """Capture a web page (multipart: url + SingleFile archive_html): store the
    HTML snapshot, extract body/metadata server-side, ingest through the shared
    pipeline and return the created signal (TODO.md B3, REQ-SIG-01).

    channel_code is optional — the server infers it from the URL host when
    omitted. The JSON POST /signals stays the paste fallback (REQ-SIG-11);
    the body is always generated server-side, never submitted.
    """
    upload_limit = get_settings().doc_raw_upload_max_bytes
    data = await archive_html.read(upload_limit + 1)
    if len(data) > upload_limit:
        raise HTTPException(413, f"archive_html exceeds {upload_limit} bytes")
    sig = await _signal_from_html(db, url=url, data=data, channel_code=channel_code)
    # 4. 返回 SignalDetail（含 snapshot_html_object_key）
    return await get_signal(sig.id, db)


@router.get("/duplicates", response_model=DuplicateScanOut)
async def scan_duplicate_signals(db: AsyncSession = Depends(get_db)):
    """Redundant signals grouped by source URL (and by identical body content).

    Read-only: identical groups can be emptied by the cleanup endpoint, while a
    group that differs carries a field-by-field comparison for a human decision.
    """
    groups = await scan_duplicates(db)
    return _duplicate_scan_out(groups, await _signal_total(db))


@router.post("/duplicates/cleanup", response_model=DuplicateCleanupOut)
async def cleanup_duplicate_signals(
    payload: DuplicateCleanupIn,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    """Delete redundant copies, never the last member of a group.

    Duplicate removal is its own path (2026-11-19 decision): the kept copy still
    holds the evidence, so a redundant copy does not have to be archived first.
    Every deletion is audited and groups are recomputed here rather than trusted
    from the client.
    """
    groups = await scan_duplicates(db)
    by_signal: dict[uuid.UUID, DuplicateGroup] = {
        member.signal.id: group for group in groups for member in group.members
    }
    requested = list(dict.fromkeys(payload.delete_ids))
    requested_per_group: dict[str, int] = defaultdict(int)
    for signal_id in requested:
        group = by_signal.get(signal_id)
        if group is not None:
            requested_per_group[group.key] += 1

    skipped: list[DuplicateCleanupSkipOut] = []
    deletable: list[tuple[Signal, DuplicateGroup]] = []
    for signal_id in requested:
        group = by_signal.get(signal_id)
        if group is None:
            skipped.append(
                DuplicateCleanupSkipOut(id=signal_id, reason="不在任何重复组内，未删除")
            )
            continue
        if requested_per_group[group.key] >= len(group.members):
            skipped.append(
                DuplicateCleanupSkipOut(
                    id=signal_id, reason="同一重复组必须至少保留一份，本次全部跳过"
                )
            )
            continue
        signal = next(m.signal for m in group.members if m.signal.id == signal_id)
        if await _signal_has_agent_patches(db, signal_id):
            skipped.append(
                DuplicateCleanupSkipOut(
                    id=signal_id, reason="该信号存在研究助手的待确认变更，请先在助手中处理"
                )
            )
            continue
        citing_demand = await confirmed_demand_citing(db, signal_id, signal.tech_theme_id)
        if citing_demand:
            skipped.append(
                DuplicateCleanupSkipOut(
                    id=signal_id,
                    reason=f"该信号被已确认需求「{citing_demand}」引用为证据，请先调整需求引用（REQ-DEM-03）",
                )
            )
            continue
        deletable.append((signal, group))

    deleted: list[uuid.UUID] = []
    for signal, group in deletable:
        await record_correction(
            db,
            "signal",
            signal.id,
            "signal_record",
            {
                "id": str(signal.id),
                "title": signal.title,
                "url": signal.url,
                "duplicate_group": group.key,
                "kept": str(group.survivor.id),
            },
            None,
            actor,
            reason=payload.reason or "清理重复信号",
        )
        await db.delete(signal)
        deleted.append(signal.id)
    await db.commit()

    return DuplicateCleanupOut(
        deleted=deleted,
        skipped=skipped,
        remaining_groups=len(await scan_duplicates(db)),
    )


@router.get("/{signal_id}", response_model=SignalDetail)
async def get_signal(signal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    detail = await get_signal_detail(db, signal_id)
    if detail is None:
        raise HTTPException(404, "signal not found")
    return detail


@router.get(
    "/{signal_id}/body",
    # The endpoint returns a raw text/plain Response (no JSON model), so
    # response_class sets the documented media type and the responses entry
    # below gives it a schema — the docs pages generated from /openapi.json
    # derive their response note from this.
    response_class=PlainTextResponse,
    responses={
        "200": {
            "description": "Snapshot body (text/plain)",
            "content": {"text/plain": {"schema": {"type": "string"}}},
        }
    },
)
async def get_signal_body(signal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """SCHEMA-SIGNAL-SNAPSHOT: serve the snapshot body by object-storage reference."""
    s = await _load_signal(db, signal_id)
    if not s.body_object_key:
        raise HTTPException(404, "no body stored for this signal")
    body = load_body(s.body_object_key)
    if body is None:
        raise HTTPException(404, f"body object {s.body_object_key!r} missing from the object store")
    return Response(content=body, media_type="text/plain")


@router.get("/{signal_id}/figures", response_model=list[SignalFigureOut])
async def get_signal_figures(signal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Content images lifted from the stored HTML archive (same order as body_md `> 图 N：` quotes)."""
    s = await _load_signal(db, signal_id)
    settings = get_settings()
    if s.snapshot_html_object_key:
        data = load_bytes(s.snapshot_html_object_key)
        if data is None:
            raise HTTPException(
                404, f"html object {s.snapshot_html_object_key!r} missing from the object store"
            )
        snap = await to_thread.run_sync(partial(parse_html_snapshot, page_url=s.url), data)
        figures = snap.figures[: settings.max_figures]
        return [SignalFigureOut(**item) for item in figure_data_urls(figures)]

    if s.document_id is None:
        return []
    doc = await db.get(Document, s.document_id)
    if doc is None:
        raise HTTPException(404, "document not found for this signal")
    if not doc.object_key:
        raise HTTPException(404, "document raw object is not stored")
    raw = load_bytes(doc.object_key)
    if raw is None:
        raise HTTPException(
            404, f"raw object {doc.object_key!r} missing from the object store"
        )
    from app.services.doc_ingest import extract_figures, normalize_document_mime, suffix_for

    mime = normalize_document_mime(doc.filename, doc.mime)
    suffix = suffix_for(doc.filename, mime)
    figures = await to_thread.run_sync(extract_figures, raw, suffix)
    return [SignalFigureOut(**item) for item in figure_data_urls(figures[: settings.max_figures])]


@router.post("/{signal_id}/recaption", response_model=SignalRecaptionOut)
async def recaption_signal(
    signal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    """Regenerate figure captions for the whole article in one pass.

    The article is the unit of work: capture captions every figure at once, so a
    retry does too. Cached captions are reused, so only failed figures call the
    gateway. The client re-reads GET /body afterwards.
    """
    if actor.role not in {"researcher", "taxonomy_admin", "platform_admin"}:
        raise HTTPException(403, "当前角色不能重生成图注")
    s = await _load_signal(db, signal_id)
    result = await recaption_signal_article(db, s)
    await record_correction(
        db,
        entity_type="signal",
        entity_id=s.id,
        field_name="figure_captions",
        old_value=None,
        new_value=f"{result.captioned}/{result.figures}",
        actor=actor,
        reason="整篇图注重生成",
    )
    await db.commit()
    return SignalRecaptionOut(
        figures=result.figures,
        captioned=result.captioned,
        failed=result.failed,
    )


@router.get(
    "/{signal_id}/archive",
    # Mirrors GET /{signal_id}/body above: a raw text/html Response (no JSON
    # model) — response_class documents the media type and the responses entry
    # gives it a schema, so /docs and /openapi.json carry it.
    response_class=Response,
    responses={
        "200": {
            "description": "Original captured HTML snapshot (text/html, byte-for-byte replay)",
            "content": {"text/html": {"schema": {"type": "string"}}},
        }
    },
)
async def get_signal_archive(
    signal_id: uuid.UUID,
    embed_origin: str | None = Query(
        default=None,
        max_length=200,
        description=(
            "Web origin of the embedding workspace, e.g. http://10.215.8.74:3000. "
            "Honoured only when it matches CORS_ORIGINS / CORS_ORIGIN_REGEX."
        ),
    ),
    db: AsyncSession = Depends(get_db),
):
    """Replay the captured SingleFile HTML (TODO.md B4): inject ``<base href>`` from
    the signal URL so relative assets resolve on the original site, not under
    ``/api/v1/signals/{id}/…``."""
    s = await _load_signal(db, signal_id)
    if not s.snapshot_html_object_key:
        raise HTTPException(404, "no html snapshot stored for this signal")
    data = load_bytes(s.snapshot_html_object_key)
    if data is None:
        raise HTTPException(404, f"html object {s.snapshot_html_object_key!r} missing from the object store")
    data = prepare_archive_replay_html(data, page_url=s.url)
    settings = get_settings()
    return Response(
        content=data,
        media_type="text/html; charset=utf-8",
        headers={
            "Content-Security-Policy": (
                "default-src 'none'; "
                "img-src 'self' data: blob: https: http:; "
                "style-src 'unsafe-inline' data:; "
                "font-src data:; "
                "base-uri https: http:; "
                "object-src 'none'; "
                "script-src 'none'; "
                # The workspace frames this replay in a sandboxed iframe and runs
                # on another port/origin than the API, so SAMEORIGIN (and thus
                # X-Frame-Options) would refuse the embed. Naming the web origin
                # (validated against the CORS allow-list) keeps framing off for
                # everyone else, including LAN access where CSP cannot name an IP
                # range.
                f"frame-ancestors {settings.archive_frame_ancestors_for(embed_origin)}"
            ),
        },
    )


@router.get(
    "/{signal_id}/archive/",
    response_class=Response,
    include_in_schema=False,
)
async def get_signal_archive_trailing_slash(
    signal_id: uuid.UUID,
    embed_origin: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    return await get_signal_archive(signal_id, embed_origin, db)


def _signal_context_block(s: Signal, body_excerpt: str) -> str:
    tag_names = [st.vocab.name for st in s.tags]
    theme_name = s.theme.working_name if s.theme else None
    lines = [
        f"标题: {s.title}",
        f"URL: {s.url}",
        f"发布方: {s.publisher or '—'}",
        f"环节: {s.value_chain_stage_code or '—'}",
        f"渠道: {s.channel_code}",
        f"标签: {', '.join(tag_names) if tag_names else '—'}",
        f"关联主题: {theme_name or '—'}",
        f"摘要: {s.excerpt or '—'}",
    ]
    if body_excerpt:
        lines.append(f"正文摘录:\n{body_excerpt}")
    return "\n".join(lines)


@router.post("/{signal_id}/assistant/messages", response_model=SignalAssistantMessageOut)
async def signal_assistant_message(
    signal_id: uuid.UUID,
    payload: SignalAssistantMessageIn,
    db: AsyncSession = Depends(get_db),
):
    """Evidence-detail 研究助手：基于信号快照上下文调用 LLM（OpenAI 兼容网关）。"""
    s = await _load_signal(db, signal_id)
    body_excerpt = ""
    if s.body_object_key:
        body = load_body(s.body_object_key)
        if body:
            body_excerpt = body[:6000]

    system = evidence_assistant_system(_signal_context_block(s, body_excerpt))
    messages: list[dict[str, str]] = [{"role": "system", "content": system}]
    for turn in payload.history[-12:]:
        messages.append({"role": turn.role, "content": turn.content})
    messages.append({"role": "user", "content": payload.message.strip()})

    try:
        reply, model = await chat_completion(
            messages,
            temperature=0.25,
            max_tokens=900,
            task="evidence_assistant",
        )
    except LLMNotConfiguredError as exc:
        raise HTTPException(
            503,
            "LLM 未配置：请在 backend/.env 设置 CHAT_BASE_URL（及 CHAT_API_KEY）后重启 API；"
            "CHAT_MODEL 可留空，网关会自动挑选可用模型",
        ) from exc
    except LLMNoModelError as exc:
        raise HTTPException(
            503, f"LLM 网关没有可用的对话模型（已做单轮探测）：{exc}"
        ) from exc
    except LLMUpstreamError as exc:
        try:
            mid = await resolve_chat_model()
        except Exception:
            mid = get_settings().chat_model_value or "unknown"
        raise HTTPException(
            502, f"LLM 上游错误 ({exc.status}, 模型 {mid}): {exc.detail}"
        ) from exc

    return SignalAssistantMessageOut(signal_id=s.id, reply=reply, model=model)


@router.get("/{signal_id}/studio", response_model=SignalStudioBundleOut)
async def signal_studio_bundle(signal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Return persisted studio outputs for this signal (empty fields when none saved)."""
    s = await _load_signal(db, signal_id)
    raw = await list_studio_artifacts(db, signal_id, body_sha256=s.body_sha256)
    return SignalStudioBundleOut.model_validate(raw)


@router.post("/{signal_id}/studio")
async def signal_studio(
    signal_id: uuid.UUID,
    payload: SignalStudioIn,
    db: AsyncSession = Depends(get_db),
):
    """证据工作室生成（TODO.md 八）：导图 / 报告 / 信息图 / 口播稿。

    report 返回 text/markdown，其余三种返回与前端 `fetchSignalStudio` 约定的
    JSON 形状。成功结果写入 ``eea_signal_studio_artifact``；默认返回已保存结果，
    ``regenerate=true`` 时重新调用模型。解析失败重试一次，仍不符合契约则 422。
    """
    s = await _load_signal(db, signal_id)
    body = ""
    if s.body_object_key:
        body = load_body(s.body_object_key) or ""
    body_excerpt = body[:6000]
    context = _signal_context_block(s, body_excerpt)
    quote_source = body_excerpt or (s.excerpt or s.title)

    if not payload.regenerate:
        cached = await get_studio_artifact(
            db, signal_id, payload.kind, body_sha256=s.body_sha256
        )
        if cached is not None:
            if payload.kind == "report":
                return PlainTextResponse(cached.content_text or "", media_type="text/markdown")
            return JSONResponse(cached.content_json)

    last_error = "模型未按约定返回内容"
    for attempt in range(2):
        messages = build_studio_messages(payload.kind, context, retry=attempt > 0)
        try:
            async with studio_generation_slot():
                content, _model = await chat_completion(
                    messages,
                    temperature=0.2,
                    max_tokens=1600,
                    max_model_attempts=3,
                    task=f"studio.{payload.kind}",
                    caller_attempt=attempt + 1,
                )
        except LLMNotConfiguredError as exc:
            raise HTTPException(
                503,
                "LLM 未配置：请在 backend/.env 设置 CHAT_BASE_URL（及 CHAT_API_KEY）后重启 API；"
                "CHAT_MODEL 可留空，网关会自动挑选可用模型",
            ) from exc
        except LLMNoModelError as exc:
            raise HTTPException(
                503, f"LLM 网关没有可用的对话模型（已做单轮探测）：{exc}"
            ) from exc
        except LLMUpstreamError as exc:
            raise HTTPException(
                502,
                f"LLM 上游错误（已尝试 3 个模型）({exc.status}): {exc.detail}",
            ) from exc

        if payload.kind == "report":
            try:
                report_md = strip_report_markdown(content)
            except StudioParseError as exc:
                last_error = str(exc)
                continue
            await upsert_studio_artifact(
                db,
                signal_id=signal_id,
                kind=payload.kind,
                body_sha256=s.body_sha256,
                llm_model=_model,
                content_text=report_md,
            )
            await db.commit()
            return PlainTextResponse(report_md, media_type="text/markdown")
        try:
            data = parse_studio_payload(
                payload.kind,
                content,
                body=quote_source,
                fallback_title=s.title,
            )
        except StudioParseError as exc:
            last_error = str(exc)
            continue
        await upsert_studio_artifact(
            db,
            signal_id=signal_id,
            kind=payload.kind,
            body_sha256=s.body_sha256,
            llm_model=_model,
            content_json=data,
        )
        await db.commit()
        return JSONResponse(data)

    raise HTTPException(
        422, f"生成内容解析失败（已重试一次）：{last_error}"
    )


@router.get("/{signal_id}/theme-aggregate-preview", response_model=ThemeAggregatePreview)
async def theme_aggregate_preview(signal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    s = await _load_signal(db, signal_id)
    if s.document_id is not None:
        return ThemeAggregatePreview(
            candidates=[],
            can_auto_assign=False,
            reason="文档来源信号不参与自动归集，请人工指定主题",
        )
    tag_names = {st.vocab.name for st in s.tags}
    theme_tags = await theme_display_tags(db)
    ranked = rank_theme_overlaps(theme_tags, tag_names)
    names: dict[uuid.UUID, str] = {}
    if ranked:
        theme_ids = [tid for tid, _ in ranked]
        name_rows = (
            await db.execute(
                select(TechTheme.id, TechTheme.working_name).where(TechTheme.id.in_(theme_ids))
            )
        ).all()
        names = {row.id: row.working_name for row in name_rows}
    candidates = [
        ThemeAggregateCandidate(theme_id=theme_id, working_name=names.get(theme_id, str(theme_id)), overlap=overlap)
        for theme_id, overlap in ranked
    ]
    recommended, reason = select_best_theme(theme_tags, tag_names)
    basis_reason = None
    if recommended is not None:
        consistent, basis_text = structured_basis_consistent(
            theme_tags.get(recommended, set()), tag_names
        )
        if not consistent:
            recommended = None
            reason = basis_text
            basis_reason = basis_text
    return ThemeAggregatePreview(
        candidates=candidates,
        recommended_theme_id=recommended,
        can_auto_assign=recommended is not None,
        reason=reason,
        structured_basis=aggregation_structured_basis(tag_names),
        basis_reason=basis_reason,
    )


@router.post("/{signal_id}/auto-aggregate", response_model=SignalDetail)
async def auto_aggregate_signal(signal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """REQ-SIG-08: 抽屉「自动归集」动作 — re-run tag matching on the stored signal.

    Assigns the best-matching theme; 409 with a reason when no unique match
    exists. Manual PUT /{signal_id}/theme stays the audited override path.
    """
    s = await _load_signal(db, signal_id)
    if s.evidence_status_code == "archived":
        raise HTTPException(409, "已归档信号不能自动归集")
    if s.document_id is not None:
        # S1-3: document-sourced signals are themed only by the audited manual
        # PUT /theme — automatic aggregation stays off even on demand
        raise HTTPException(409, "文档来源信号不参与自动归集：请通过 PUT /signals/{id}/theme 人工指定主题")
    if "tech_theme_id" in await human_corrected_fields(db, s.id):
        raise HTTPException(409, "主题已由人工调整，不能自动归集覆盖")
    if s.tech_theme_id is not None:
        raise HTTPException(409, "信号已在主题中，请先移出后再自动归集")
    tag_names = {st.vocab.name for st in s.tags}
    theme_id, reason = await _match_theme(db, tag_names)
    if theme_id is None:
        raise HTTPException(409, f"无法自动归集：{reason}")
    s.tech_theme_id = theme_id
    await db.commit()
    return await get_signal(signal_id, db)


@router.patch("/{signal_id}", response_model=SignalDetail)
async def update_signal(
    signal_id: uuid.UUID,
    payload: SignalUpdate,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    s = await _load_signal(db, signal_id)
    data = payload.model_dump(exclude={"operator_subject", "operator_role"}, exclude_unset=True)
    expected = data.pop("expected_updated_at", None)
    assert_expected_signal_revision(s, expected)
    body_text = data.pop("body_text", None)
    for field, value in data.items():
        old = getattr(s, field)
        if value == old:
            continue

        if field == "evidence_status_code":
            if value is None:
                raise HTTPException(422, "evidence_status_code cannot be null")
            if value == "retained" and not body_text and not (
                s.body_object_key and load_body(s.body_object_key)
            ):
                raise HTTPException(422, "retained signals require stored body text")
        # REQ-RULE-02: audit human corrections of machine-classified fields
        if field in (
            "value_chain_stage_code",
            "signal_type_code",
            "evolution_node_code",
            "evidence_status_code",
        ):
            await record_correction(
                db, "signal", s.id, field, old, value, actor
            )
        setattr(s, field, value)
    if body_text:
        # REQ-SIG-11: PATCH pasted body persists to the object store as well
        new_key = save_body(body_text)
        new_sha = sha256_text(body_text)
        old_body = (
            {"object_key": s.body_object_key, "sha256": s.body_sha256}
            if s.body_object_key or s.body_sha256
            else None
        )
        await record_correction(
            db,
            "signal",
            s.id,
            "body_text",
            old_body,
            {"object_key": new_key, "sha256": new_sha},
            actor,
            reason="修补正文",
        )
        s.body_object_key = new_key
        s.body_sha256 = new_sha
        s.captured_at = func.now()
    await db.commit()
    return await get_signal(signal_id, db)


@router.delete("/{signal_id}", status_code=204, response_class=Response)
async def delete_archived_signal(
    signal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    """Permanently remove a signal that has already been archived (停用)."""
    s = await _load_signal(db, signal_id)
    if s.evidence_status_code != "archived":
        raise HTTPException(409, "仅已归档停用的信号可永久删除")
    await record_correction(
        db,
        "signal",
        s.id,
        "signal_record",
        {"id": str(s.id), "title": s.title, "url": s.url},
        None,
        actor,
    )
    await db.delete(s)
    await db.commit()
    return Response(status_code=204)


@router.put("/{signal_id}/tags", response_model=SignalDetail)
async def set_tags(
    signal_id: uuid.UUID,
    payload: TagAssignment,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
    _feature: None = Depends(require_feature(SIGNAL_TAGGING)),
):
    s = await _load_signal(db, signal_id)
    assert_expected_signal_revision(s, payload.expected_updated_at)
    old = sorted(st.vocab.name for st in s.tags)
    # SCHEMA-SIGNAL-TAG: assigning the same tag twice never creates a second row
    # (dedupe on the stripped name — get_or_create_vocab normalizes the same way)
    tag_names = list(dict.fromkeys(n.strip() for n in payload.tag_names))
    for st in list(s.tags):
        await db.delete(st)
    await db.flush()
    for name in tag_names:
        v = await get_or_create_vocab(db, "tech_tag", name)  # REQ-TAG-06: new tags join global vocab
        db.add(SignalTag(signal_id=s.id, vocab_id=v.id))
    if sorted(tag_names) != old:
        await record_correction(db, "signal", s.id, "tech_tags", old, sorted(tag_names), actor)
    await db.commit()
    track_workflow_success(SIGNAL_TAGGING)
    return await get_signal(signal_id, db)


@router.put("/{signal_id}/theme", response_model=SignalDetail)
async def assign_theme(
    signal_id: uuid.UUID,
    payload: ThemeAssignment,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    s = await _load_signal(db, signal_id)
    assert_expected_signal_revision(s, payload.expected_updated_at)
    if payload.tech_theme_id is not None:
        theme = await db.get(TechTheme, payload.tech_theme_id)
        if theme is None:
            raise HTTPException(404, "theme not found")
    old = s.tech_theme_id
    if old is not None and old != payload.tech_theme_id:
        # A confirmed demand cites this signal as evidence from its theme. Moving
        # the signal would leave that demand unable to derive or publish anything,
        # with no way back from the UI.
        citing = await confirmed_demand_citing(db, s.id, old)
        if citing is not None:
            raise HTTPException(
                409,
                f"该信号是已确认需求「{citing}」的证据，移出主题后该需求无法再推导功能；请先调整需求证据或来源主题",
            )
    s.tech_theme_id = payload.tech_theme_id
    if old != payload.tech_theme_id:
        await record_correction(
            db, "signal", s.id, "tech_theme_id", str(old), str(payload.tech_theme_id), actor
        )
    await db.commit()
    return await get_signal(signal_id, db)


@router.get("/{signal_id}/tag-suggestions", response_model=TagSuggestion)
async def tag_suggestions(
    signal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _feature: None = Depends(require_feature(SIGNAL_TAGGING)),
):
    from app.core.config import get_settings

    s = await _load_signal(db, signal_id)
    protected = await human_corrected_fields(db, s.id)
    body = load_body(s.body_object_key) if s.body_object_key else None
    tagging_text = text_for_tagging(s.title, body)
    fallback_text = tagging_text or " ".join(filter(None, [s.title, s.excerpt, s.source_label]))
    # W3 (TODO.md 1.3): LLM 优先（正文快照也在场时更准），失败则 jieba；
    # 返回结构不变，仅 source 标注来源
    llm_body = tagging_text or fallback_text[:6000]
    tag_body = body or tagging_text or fallback_text
    # LLM tag pick + structured stage/type in parallel so tag-suggestions stays within proxy timeouts.
    (tags, tag_source, rerank_score), llm = await asyncio.gather(
        suggest_tech_tags(s.title, tag_body),
        suggest_tags_with_llm(s.title, llm_body[:6000]),
    )
    from app.services import llm_gateway, semantic_api

    stage = (
        llm.value_chain_stage_code
        if llm and llm.value_chain_stage_code
        else judge_stage(s.title, tagging_text or fallback_text)
    )
    sig_type = (
        llm.signal_type_code
        if llm and llm.signal_type_code
        else judge_signal_type(s.title, tagging_text or fallback_text)
    )
    chat_ready = llm_gateway.llm_configured()
    chat_cred = llm_gateway.chat_gateway_credentials_ready()
    rerank_ready = semantic_api.rerank_configured()
    degraded_reason: str | None = None
    if tag_source == "jieba-frequency":
        if not chat_ready and not rerank_ready:
            degraded_reason = "模型网关未配置（backend/.env 中 CHAT/RERANK），已使用词频建议。"
        elif not chat_cred and not rerank_ready:
            degraded_reason = "CHAT_API_KEY 与 RERANK_API_KEY 未设置，已使用词频建议。"
        elif not chat_cred:
            degraded_reason = "CHAT_API_KEY 未设置，对话模型不可用；精排失败或未配置，已使用词频建议。"
        elif not rerank_ready:
            degraded_reason = "RERANK 未配置，语义精排不可用；对话模型暂不可用，已使用词频建议。"
        elif chat_ready:
            degraded_reason = "对话模型或语义精排暂不可用，已使用词频建议。可运行 scripts/probe_model_gateways.py 排查。"
    elif tag_source == "embedding-rerank":
        # Branch on what the model actually returned: a monkeypatched or
        # injected model can answer even when no API key is configured.
        if llm is not None:
            degraded_reason = "标签精选暂不可用，已保留语义精排候选；环节与类型已由对话模型建议。"
        elif not chat_cred:
            degraded_reason = "对话模型未配置；标签已语义精排。"
        else:
            degraded_reason = "对话模型暂不可用；标签已语义精排，环节与类型见规则或单独 LLM。"
    elif chat_cred and tag_source != "llm-rerank-refine":
        degraded_reason = "标签精选模型暂不可用，已使用精排/词频结果。"
    elif not chat_ready and not semantic_api.semantic_configured():
        degraded_reason = "对话模型与语义服务未配置，已使用词频建议。"
    if tag_source == "llm-rerank-refine":
        degraded_reason = None
    snippet = (tagging_text or fallback_text or "")[:160] or None
    details = [
        TagCandidateDetail(
            name=name,
            rerank_score=rerank_score if index == 0 else None,
            evidence_snippet=snippet,
        )
        for index, name in enumerate(tags)
    ]
    suggestion = TagSuggestion(
        suggested_tags=tags,
        details=details,
        value_chain_stage_code=stage,
        signal_type_code=sig_type,
        source=tag_source,
        protected_fields=sorted(protected),
        degraded_reason=degraded_reason,
        rerank_score=rerank_score,
    )
    if "tech_tags" in protected:
        suggestion.suggested_tags = []
    if "value_chain_stage_code" in protected:
        suggestion.value_chain_stage_code = None
    if "signal_type_code" in protected:
        suggestion.signal_type_code = None
    return suggestion


@router.get("/{signal_id}/sources", response_model=list[SignalSourceOut])
async def get_signal_sources(signal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    await _load_signal(db, signal_id)
    rows = await list_sources(db, signal_id)
    return [SignalSourceOut.model_validate(row) for row in rows]


@router.post("/{signal_id}/sources", response_model=SignalSourceOut, status_code=201)
async def post_signal_source(
    signal_id: uuid.UUID,
    payload: SignalSourceCreate,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    if actor.role not in {"researcher", "taxonomy_admin", "platform_admin"}:
        raise HTTPException(403, "当前角色不能添加来源 URL")
    signal = await _load_signal(db, signal_id)
    if signal.evidence_status_code == "archived":
        raise HTTPException(409, "已归档信号不能新增来源")
    row = await add_supplementary_url(db, signal, payload.url, provenance=payload.provenance)
    await db.commit()
    await db.refresh(row)
    return SignalSourceOut.model_validate(row)


@router.post("/{signal_id}/auto-tag", response_model=SignalDetail)
async def auto_tag_signal(
    signal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
    _feature: None = Depends(require_feature(SIGNAL_TAGGING)),
):
    if actor.role not in {"researcher", "taxonomy_admin", "platform_admin"}:
        raise HTTPException(403, "当前角色不能写入标签建议")
    s = await _load_signal(db, signal_id)
    if s.evidence_status_code == "archived":
        raise HTTPException(409, "已归档信号不能自动打标")
    suggestion = await tag_suggestions(signal_id, db)
    protected = set(suggestion.protected_fields)
    data = {}
    if suggestion.value_chain_stage_code and "value_chain_stage_code" not in protected:
        data["value_chain_stage_code"] = suggestion.value_chain_stage_code
    if suggestion.signal_type_code and "signal_type_code" not in protected:
        data["signal_type_code"] = suggestion.signal_type_code
    if data:
        payload = SignalUpdate(**data)
        return await update_signal(signal_id, payload, db, actor)
    if suggestion.suggested_tags and "tech_tags" not in protected:
        payload = TagAssignment(tag_names=suggestion.suggested_tags, expected_updated_at=s.updated_at)
        return await set_tags(signal_id, payload, db, actor)
    return await get_signal(signal_id, db)
