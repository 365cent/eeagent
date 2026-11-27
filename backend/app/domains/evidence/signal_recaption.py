"""Regenerate every figure caption for one signal article (not one image).

An article is the unit of work: capture captions all of its figures in one pass,
so a retry must do the same. Captions already cached on disk are served without
a gateway call, so re-running a body only pays for the figures that failed.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from functools import partial

from anyio import to_thread
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Signal
from app.domains.evidence.body_excerpt import resolve_signal_excerpt
from app.domains.evidence.html_snapshot import enrich_snapshot_figures, parse_html_snapshot
from app.platform.objectstore import load_body, load_bytes, save_body

FIGURE_CAPTION_LINE = re.compile(r"^>\s*图\s*(\d+)\s*[：:]\s*(.*)$", re.MULTILINE)
FAILED_CAPTION_MARKERS = ("视觉模型未返回描述", "待视觉描述")


@dataclass(frozen=True)
class RecaptionResult:
    figures: int
    captioned: int
    failed: int


def caption_is_failed(text: str | None) -> bool:
    value = (text or "").strip()
    return not value or any(marker in value for marker in FAILED_CAPTION_MARKERS)


def failed_caption_indices(body: str) -> set[int]:
    """Figure numbers whose stored caption still has no description."""
    return {
        int(match.group(1))
        for match in FIGURE_CAPTION_LINE.finditer(body or "")
        if caption_is_failed(match.group(2))
    }


def count_failed_captions(body: str) -> tuple[int, int]:
    """Return (figure count, failed caption count) for a stored article body."""
    matches = list(FIGURE_CAPTION_LINE.finditer(body or ""))
    failed = sum(1 for match in matches if caption_is_failed(match.group(2)))
    return len(matches), failed


async def recaption_signal_article(db: AsyncSession, signal: Signal) -> RecaptionResult:
    """Re-run vision over every figure of this article and store the new body."""
    if not signal.snapshot_html_object_key:
        raise HTTPException(
            409,
            "该信号没有 HTML 归档，无法按整篇重生成图注",
        )
    if not signal.body_object_key:
        raise HTTPException(409, "信号没有解析快照正文，无法重写图注")

    html = load_bytes(signal.snapshot_html_object_key)
    if html is None:
        raise HTTPException(404, "HTML 归档文件缺失")

    previous_body = load_body(signal.body_object_key) or ""
    _, previous_failed = count_failed_captions(previous_body)
    pending = failed_caption_indices(previous_body)

    snap = await to_thread.run_sync(partial(parse_html_snapshot, page_url=signal.url), html)
    if not snap.figures:
        raise HTTPException(409, "正文中没有可重识别的图块")

    # Every figure goes through the caption call; the on-disk caption cache makes
    # previously successful figures free and only failed ones hit the gateway.
    # Retry the figures that are still missing a description; the caption cache
    # keeps anything already captioned free.
    snap = await enrich_snapshot_figures(
        snap, vision_captions=True, only_indices=pending or None
    )
    body = snap.body_md
    if not body.strip():
        raise HTTPException(422, "重新解析后正文为空，未写入")

    total, failed = count_failed_captions(body)
    signal.body_object_key = save_body(body)
    if failed < previous_failed:
        signal.excerpt = await resolve_signal_excerpt(signal.title, body)
    await db.commit()
    return RecaptionResult(figures=total, captioned=total - failed, failed=failed)
