import uuid
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Response, UploadFile
from fastapi.responses import JSONResponse, PlainTextResponse
from anyio import to_thread
from sqlalchemy import func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.db.base import get_db
from app.models.models import DemandPoint, Document, Signal, SignalTag, TechTheme, Vocab
from app.schemas.schemas import (
    SignalAssistantMessageIn,
    SignalAssistantMessageOut,
    SignalBase,
    ThemeOut,
    SignalCreate,
    SignalDetail,
    SignalFigureOut,
    SignalOut,
    SignalStudioIn,
    SignalUpdate,
    TagAssignment,
    TagSuggestion,
    ThemeAssignment,
)
from app.services.audit import record_correction
from app.services.doc_summary import build_document_body_summary
from app.services.html_snapshot import (
    enrich_snapshot_figures,
    figure_data_urls,
    parse_html_snapshot,
    prepare_archive_replay_html,
)
from app.services.judgment import judge_stage, select_best_theme
from app.services.llm import suggest_tags_with_llm
from app.services.llm_gateway import (
    LLMNoModelError,
    LLMNotConfiguredError,
    LLMUpstreamError,
    chat_completion,
)
from app.services.objectstore import load_body, load_bytes, save_body, save_bytes
from app.services.refcodes import codes, normalize as normalize_ref_code
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
    obj = (
        await db.execute(
            select(Signal)
            # populate_existing: expire_on_commit=False keeps identity-mapped state
            # across commit, so a reload after an FK/relationship change must
            # refresh already-loaded attributes (e.g. theme after auto-aggregate).
            .options(
                selectinload(Signal.tags).selectinload(SignalTag.vocab),
                selectinload(Signal.theme),
                selectinload(Signal.document),
            )
            .where(Signal.id == sid)
            .execution_options(populate_existing=True)
        )
    ).scalar_one_or_none()
    if obj is None:
        raise HTTPException(404, "signal not found")
    return obj


async def _match_theme(db: AsyncSession, tag_names: set[str]) -> tuple[uuid.UUID | None, str]:
    """REQ-SIG-08: match the signal's tags against every theme's display tags."""
    rows = (await db.execute(text("SELECT tech_theme_id, tag_name FROM eea_v_tech_theme_display_tags"))).all()
    theme_tags: dict[uuid.UUID, set] = {}
    for theme_id, tag_name in rows:
        theme_tags.setdefault(theme_id, set()).add(tag_name)
    return select_best_theme(theme_tags, tag_names)


def _to_out(s: Signal) -> SignalOut:
    out = SignalOut(**SignalBase.model_validate(s).model_dump())
    out.tags = [st.vocab.name for st in s.tags]
    return out


async def _linked_demand_points(db: AsyncSession, theme_id: uuid.UUID | None) -> list[DemandPoint]:
    """S1-3 来源栏「关联需求」：demand points sourced from the signal's theme."""
    if theme_id is None:
        return []
    return list(
        (
            await db.execute(
                select(DemandPoint)
                .where(DemandPoint.source_tech_theme_id == theme_id)
                .order_by(DemandPoint.created_at)
            )
        ).scalars()
    )


def _to_detail(s: Signal) -> SignalDetail:
    out = SignalDetail(
        **SignalBase.model_validate(s).model_dump(),
        body_object_key=s.body_object_key,
        body_sha256=s.body_sha256,
        snapshot_html_object_key=s.snapshot_html_object_key,
        theme=ThemeOut.model_validate(s.theme) if s.theme else None,
    )
    out.tags = [st.vocab.name for st in s.tags]
    return out


@router.get("", response_model=list[SignalOut])
async def list_signals(
    keyword: str | None = None,
    value_chain_stage: str | None = None,
    channel: str | None = None,
    evidence_status: str | None = None,
    theme_id: uuid.UUID | None = None,
    source: str | None = None,  # 来源 (REQ-SIG-04, 图2-1-1 筛选：价值链环节、来源、关键词)
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Signal)
        .options(selectinload(Signal.tags).selectinload(SignalTag.vocab))
        .order_by(Signal.created_at.desc())
    )
    if keyword:
        like = f"%{keyword}%"
        q = q.where(or_(Signal.title.ilike(like), Signal.excerpt.ilike(like), Signal.publisher.ilike(like)))
    if value_chain_stage:
        q = q.where(Signal.value_chain_stage_code == _query_code("value_chain_stage", value_chain_stage))
    if channel:
        q = q.where(Signal.channel_code == _query_code("channel", channel))
    if evidence_status:
        q = q.where(Signal.evidence_status_code == _query_code("evidence_status", evidence_status))
    if theme_id:
        q = q.where(Signal.tech_theme_id == theme_id)
    if source:
        q = q.where(Signal.publisher.ilike(f"%{source}%"))
    rows = (await db.execute(q.limit(limit).offset(offset))).scalars().all()
    return [_to_out(s) for s in rows]


async def _create_signal_record(
    db: AsyncSession,
    *,
    title: str,
    url: str,
    channel_code: str,
    evidence_status_code: str,
    publisher: str | None = None,
    published_at: datetime | None = None,
    value_chain_stage_code: str | None = None,
    signal_type_code: str | None = None,
    evolution_node_code: str | None = None,
    source_label: str | None = None,
    excerpt: str | None = None,
    body_text: str | None = None,
    snapshot_html_object_key: str | None = None,
    document_id: uuid.UUID | None = None,
) -> Signal:
    """Shared post-ingest pipeline for both ingestion paths (B3/B5): persist
    the signal row, persist the body snapshot when one is present, pre-tag
    (REQ-TAG-05) and auto-aggregate (REQ-SIG-08), and commit.

    The JSON path (REQ-SIG-11) and the capture path (TODO.md B3 step 3) feed
    the same function so the post-creation logic cannot drift apart.

    S1-3 document sources (document_id set): tags come only from the LLM
    suggestion — no jieba fallback — and automatic theme aggregation is
    skipped (tech_theme_id stays null until a manual PUT /theme); a whole
    deck poured into jieba otherwise re-creates the demo-theme
    misattribution (backend/TODO.md W4.1).
    """
    stage_explicit = value_chain_stage_code
    # REQ-TAG-04: 平台按标题与证据快照初判价值链环节（人工可纠偏）
    if value_chain_stage_code is None:
        value_chain_stage_code = judge_stage(title, body_text or "")
    sig = Signal(
        title=title,
        url=url,
        url_normalized=normalize_url(url),
        channel_code=channel_code,
        publisher=publisher,
        published_at=published_at,
        value_chain_stage_code=value_chain_stage_code,
        signal_type_code=signal_type_code,
        evolution_node_code=evolution_node_code,
        evidence_status_code=evidence_status_code,
        source_label=source_label,
        excerpt=excerpt,
        body_object_key=save_body(body_text) if body_text else None,
        body_sha256=sha256_text(body_text) if body_text else None,
        captured_at=func.now() if body_text else None,
        snapshot_html_object_key=snapshot_html_object_key,
        document_id=document_id,
    )
    db.add(sig)
    await db.flush()
    # REQ-TAG-05: machine pre-tagging from snapshot text
    tag_names: list[str] = []
    if body_text:
        # W3 (TODO.md 1.3): LLM 优先，jieba 兜底 — suggest_tags_with_llm returns
        # None on any LLM failure (unset model / timeout / invalid output) and
        # the jieba result keeps the pre-tagging behavior unchanged.
        llm_suggestion = await suggest_tags_with_llm(title, body_text)
        if llm_suggestion is not None:
            if stage_explicit is None and llm_suggestion.value_chain_stage_code:
                # advisory LLM stage when the client did not set one (人工可纠偏, REQ-TAG-04)
                sig.value_chain_stage_code = value_chain_stage_code = llm_suggestion.value_chain_stage_code
            tag_names = llm_suggestion.tech_tags or (suggest_tags(title + "\n" + body_text) if document_id is None else [])
        elif document_id is None:
            tag_names = suggest_tags(title + "\n" + body_text)
        for name in tag_names:
            v = await get_or_create_vocab(db, "tech_tag", name)
            db.add(SignalTag(signal_id=sig.id, vocab_id=v.id))
        if document_id is None:
            # REQ-SIG-08: 抓取后自动预标，并按标签向上归集（人工 PUT /theme 仍可纠偏）
            theme_id, _ = await _match_theme(db, set(tag_names))
            if theme_id is not None:
                sig.tech_theme_id = theme_id
    await db.commit()
    return sig


def _document_title(document: Document) -> str:
    if document.filename:
        return Path(document.filename).stem or document.filename
    return f"文档 {document.sha256[:8]}"


def _document_summary_body(document: Document) -> str:
    """S1-3 正文策略：文档来源信号默认写入摘要（文件名 + 标题 + 讲稿摘录），
    不把整份 canonical Markdown 灌入 body_text。"""
    canonical = ""
    if document.canonical_md_object_key:
        data = load_bytes(document.canonical_md_object_key)
        if data is not None:
            canonical = data.decode("utf-8", errors="replace")
    return build_document_body_summary(document.filename or "", canonical)


@router.post("", response_model=SignalDetail, status_code=201)
async def create_signal(payload: SignalCreate, db: AsyncSession = Depends(get_db)):
    document = None
    if payload.document_id is not None:
        document = await db.get(Document, payload.document_id)
        if document is None:
            raise HTTPException(404, "document not found")
    if document is not None:
        # S1-3 文档来源：title/url/body 有服务端默认值，body 是摘要而非 canonical 全文
        title = payload.title or _document_title(document)
        url = payload.url or f"eea://document/{document.id}"
        body_text = payload.body_text or _document_summary_body(document)
        excerpt = payload.excerpt or body_text[:200]
        published_at = payload.published_at or document.created_at
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
        document_id=document.id if document is not None else None,
    )
    return await get_signal(sig.id, db)


def _infer_channel_code(url: str) -> str:
    """Capture default channel (TODO.md B3): the weixin mp host maps to
    wechat_mp, every other origin to web — the two closed-vocab channels."""
    return "wechat_mp" if urlparse(url).netloc.lower() == "mp.weixin.qq.com" else "web"


async def _signal_from_html(
    db: AsyncSession,
    *,
    url: str,
    data: bytes,
    channel_code: str | None = None,
    html_label: str = "archive_html",
) -> Signal:
    """HTML bytes → signal: snapshot parse, object-store archive, shared
    post-ingest pipeline. Feeds POST /signals/capture (extension upload) and
    the unified POST /capture (uploaded html file or server-fetched page)."""
    if not data:
        raise HTTPException(422, f"{html_label} 文件为空")
    if channel_code is None:
        channel_code = _infer_channel_code(url)
    else:
        channel_code = _query_code("channel", channel_code)
    # parse_html_snapshot is synchronous, CPU-heavy parsing (bs4 + MarkItDown
    # over the article fragment; multi-MB SingleFile pages can take ~0.5s). Run it in
    # a worker thread so one large capture cannot stall the event loop (and
    # with it every concurrent request).
    snap = await to_thread.run_sync(parse_html_snapshot, data)
    snap = await enrich_snapshot_figures(snap)
    if not snap.body_md:
        # 有正文时不得在未落盘情况下标「已留存」的反面：无正文的页面不落行
        raise HTTPException(422, "无法从 archive_html 抽出正文（body_md 为空），未创建信号")
    # 1. 存 HTML → snapshot_html_object_key（TODO.md B3 处理顺序）
    html_key = save_bytes(data, folder="signals", ext="html")
    # 2+3. html_snapshot 正文 + 共用创建后逻辑（judge_stage/suggest_tags/归集）
    return await _create_signal_record(
        db,
        title=snap.title or url,
        url=url,
        channel_code=channel_code,
        evidence_status_code="retained",
        publisher=snap.publisher,
        published_at=snap.published_at,
        excerpt=snap.body_md[:200],
        body_text=snap.body_md,
        snapshot_html_object_key=html_key,
    )


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
    data = await archive_html.read()
    sig = await _signal_from_html(db, url=url, data=data, channel_code=channel_code)
    # 4. 返回 SignalDetail（含 snapshot_html_object_key）
    return await get_signal(sig.id, db)


@router.get("/{signal_id}", response_model=SignalDetail)
async def get_signal(signal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    s = await _load_signal(db, signal_id)
    detail = _to_detail(s)
    detail.linked_demand_points = await _linked_demand_points(db, s.tech_theme_id)
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
    if not s.snapshot_html_object_key:
        return []
    data = load_bytes(s.snapshot_html_object_key)
    if data is None:
        raise HTTPException(
            404, f"html object {s.snapshot_html_object_key!r} missing from the object store"
        )
    snap = await to_thread.run_sync(parse_html_snapshot, data)
    settings = get_settings()
    figures = snap.figures[: settings.max_figures]
    return [SignalFigureOut(**item) for item in figure_data_urls(figures)]


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
async def get_signal_archive(signal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
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
    return Response(
        content=data,
        media_type="text/html",
        headers={"Content-Security-Policy": "script-src 'none'; object-src 'none'"},
    )


@router.get(
    "/{signal_id}/archive/",
    response_class=Response,
    include_in_schema=False,
)
async def get_signal_archive_trailing_slash(signal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await get_signal_archive(signal_id, db)


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

    system = (
        "你是 EEA 前瞻技术扫描平台的证据研究助手。仅根据提供的信号上下文回答；"
        "若信息不足请明确说明。不要伪造引用或数据。回答使用简体中文，简洁专业。"
        "\n\n--- 信号上下文 ---\n"
        f"{_signal_context_block(s, body_excerpt)}"
    )
    messages: list[dict[str, str]] = [{"role": "system", "content": system}]
    for turn in payload.history[-12:]:
        messages.append({"role": turn.role, "content": turn.content})
    messages.append({"role": "user", "content": payload.message.strip()})

    try:
        reply, model = await chat_completion(messages)
    except LLMNotConfiguredError as exc:
        raise HTTPException(
            503,
            "LLM 未配置：请在 backend/.env 设置 LLM_BASE_URL（及 LLM_API_KEY）后重启 API；"
            "LLM_MODEL 可留空，网关会自动挑选可用模型",
        ) from exc
    except LLMNoModelError as exc:
        raise HTTPException(
            503, f"LLM 网关没有可用的对话模型（已做单轮探测）：{exc}"
        ) from exc
    except LLMUpstreamError as exc:
        raise HTTPException(502, f"LLM 上游错误 ({exc.status}): {exc.detail}") from exc

    return SignalAssistantMessageOut(signal_id=s.id, reply=reply, model=model)


@router.post("/{signal_id}/studio")
async def signal_studio(
    signal_id: uuid.UUID,
    payload: SignalStudioIn,
    db: AsyncSession = Depends(get_db),
):
    """证据工作室生成（TODO.md 八）：导图 / 报告 / 信息图 / 口播稿。

    report 返回 text/markdown，其余三种返回与前端 `fetchSignalStudio` 约定的
    JSON 形状。不落库：前端按（信号, kind）缓存最近一次成功结果。解析失败
    重试一次，仍不符合契约则 422（错误映射与助手一致：503 未配置 / 502 上游）。
    """
    s = await _load_signal(db, signal_id)
    body = ""
    if s.body_object_key:
        body = load_body(s.body_object_key) or ""
    body_excerpt = body[:6000]
    context = _signal_context_block(s, body_excerpt)
    quote_source = body_excerpt or (s.excerpt or s.title)

    last_error = "模型未按约定返回内容"
    for attempt in range(2):
        messages = build_studio_messages(payload.kind, context, retry=attempt > 0)
        try:
            content, _model = await chat_completion(
                messages, temperature=0.2, max_tokens=1600
            )
        except LLMNotConfiguredError as exc:
            raise HTTPException(
                503,
                "LLM 未配置：请在 backend/.env 设置 LLM_BASE_URL（及 LLM_API_KEY）后重启 API；"
                "LLM_MODEL 可留空，网关会自动挑选可用模型",
            ) from exc
        except LLMNoModelError as exc:
            raise HTTPException(
                503, f"LLM 网关没有可用的对话模型（已做单轮探测）：{exc}"
            ) from exc
        except LLMUpstreamError as exc:
            raise HTTPException(502, f"LLM 上游错误 ({exc.status}): {exc.detail}") from exc

        if payload.kind == "report":
            try:
                return PlainTextResponse(
                    strip_report_markdown(content), media_type="text/markdown"
                )
            except StudioParseError as exc:
                last_error = str(exc)
                continue
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
        return JSONResponse(data)

    raise HTTPException(
        422, f"生成内容解析失败（已重试一次）：{last_error}"
    )


@router.post("/{signal_id}/auto-aggregate", response_model=SignalDetail)
async def auto_aggregate_signal(signal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """REQ-SIG-08: 抽屉「自动归集」动作 — re-run tag matching on the stored signal.

    Assigns the best-matching theme; 409 with a reason when no unique match
    exists. Manual PUT /{signal_id}/theme stays the audited override path.
    """
    s = await _load_signal(db, signal_id)
    if s.document_id is not None:
        # S1-3: document-sourced signals are themed only by the audited manual
        # PUT /theme — automatic aggregation stays off even on demand
        raise HTTPException(409, "文档来源信号不参与自动归集：请通过 PUT /signals/{id}/theme 人工指定主题")
    tag_names = {st.vocab.name for st in s.tags}
    theme_id, reason = await _match_theme(db, tag_names)
    if theme_id is None:
        raise HTTPException(409, f"无法自动归集：{reason}")
    s.tech_theme_id = theme_id
    await db.commit()
    return await get_signal(signal_id, db)


@router.patch("/{signal_id}", response_model=SignalDetail)
async def update_signal(signal_id: uuid.UUID, payload: SignalUpdate, db: AsyncSession = Depends(get_db)):
    s = await _load_signal(db, signal_id)
    data = payload.model_dump(exclude={"operator_subject", "operator_role"}, exclude_unset=True)
    body_text = data.pop("body_text", None)
    for field, value in data.items():
        old = getattr(s, field)
        if value == old:
            continue
        # REQ-RULE-02: audit human corrections of machine-classified fields
        if field in ("value_chain_stage_code", "signal_type_code", "evolution_node_code"):
            await record_correction(
                db, "signal", s.id, field, old, value, payload.operator_subject, payload.operator_role
            )
        setattr(s, field, value)
    if body_text:
        # REQ-SIG-11: PATCH pasted body persists to the object store as well
        s.body_object_key = save_body(body_text)
        s.body_sha256 = sha256_text(body_text)
        s.captured_at = func.now()
    await db.commit()
    return await get_signal(signal_id, db)


@router.put("/{signal_id}/tags", response_model=SignalDetail)
async def set_tags(signal_id: uuid.UUID, payload: TagAssignment, db: AsyncSession = Depends(get_db)):
    s = await _load_signal(db, signal_id)
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
        await record_correction(db, "signal", s.id, "tech_tags", old, sorted(tag_names), payload.operator_subject)
    await db.commit()
    return await get_signal(signal_id, db)


@router.put("/{signal_id}/theme", response_model=SignalDetail)
async def assign_theme(signal_id: uuid.UUID, payload: ThemeAssignment, db: AsyncSession = Depends(get_db)):
    s = await _load_signal(db, signal_id)
    if payload.tech_theme_id is not None:
        theme = await db.get(TechTheme, payload.tech_theme_id)
        if theme is None:
            raise HTTPException(404, "theme not found")
    old = s.tech_theme_id
    s.tech_theme_id = payload.tech_theme_id
    if old != payload.tech_theme_id:
        await record_correction(
            db, "signal", s.id, "tech_theme_id", str(old), str(payload.tech_theme_id), payload.operator_subject
        )
    await db.commit()
    return await get_signal(signal_id, db)


@router.get("/{signal_id}/tag-suggestions", response_model=TagSuggestion)
async def tag_suggestions(signal_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    s = await _load_signal(db, signal_id)
    text = " ".join(filter(None, [s.title, s.excerpt, s.source_label]))
    # W3 (TODO.md 1.3): LLM 优先（正文快照也在场时更准），失败则 jieba；
    # 返回结构不变，仅 source 标注来源
    body = load_body(s.body_object_key) if s.body_object_key else None
    llm = await suggest_tags_with_llm(s.title, (body or text)[:6000])
    if llm is not None and llm.tech_tags:
        return TagSuggestion(suggested_tags=llm.tech_tags, source="llm")
    return TagSuggestion(suggested_tags=suggest_tags(text), source="jieba-frequency")
