from __future__ import annotations

import uuid
from functools import partial

from anyio import to_thread
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.evidence.channel import _infer_channel_code
from app.domains.evidence.signal_record import create_signal_record
from app.models.models import Signal
from app.services.body_excerpt import resolve_signal_excerpt
from app.services.html_snapshot import enrich_snapshot_figures, parse_html_snapshot
from app.services.objectstore import save_bytes
from app.services.refcodes import codes, normalize as normalize_ref_code


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


async def _signal_from_html(
    db: AsyncSession,
    *,
    url: str,
    data: bytes,
    channel_code: str | None = None,
    html_label: str = "archive_html",
    capture_submission_id: uuid.UUID | None = None,
    capture_submission_sha256: str | None = None,
    figure_vision_captions: bool = True,
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
    snap = await to_thread.run_sync(partial(parse_html_snapshot, page_url=url), data)
    snap = await enrich_snapshot_figures(snap, vision_captions=figure_vision_captions)
    if not snap.body_md:
        # 有正文时不得在未落盘情况下标「已留存」的反面：无正文的页面不落行
        raise HTTPException(422, "无法从 archive_html 抽出正文（body_md 为空），未创建信号")
    # 1. 存 HTML → snapshot_html_object_key（TODO.md B3 处理顺序）
    html_key = save_bytes(data, folder="signals", ext="html")
    excerpt = await resolve_signal_excerpt(snap.title or url, snap.body_md)
    # 2+3. html_snapshot 正文 + 共用创建后逻辑（judge_stage/suggest_tags/归集）
    return await create_signal_record(
        db,
        title=snap.title or url,
        url=url,
        channel_code=channel_code,
        evidence_status_code="retained",
        publisher=snap.publisher,
        published_at=snap.published_at,
        excerpt=excerpt,
        body_text=snap.body_md,
        snapshot_html_object_key=html_key,
        capture_submission_id=capture_submission_id,
        capture_submission_sha256=capture_submission_sha256,
    )
