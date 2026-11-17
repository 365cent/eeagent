"""Suggest a theme working name from selected signals.

The model is asked first. Any failure — unset gateway, timeout, or an unusable
answer — returns the same tag-and-title name the topic page already shows.
Nothing here writes a theme.
"""

from __future__ import annotations

import asyncio
import re
import uuid
from collections import Counter

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import Signal, SignalTag
from app.schemas.schemas import ThemeNameSuggestionOut
from app.services.llm import suggest_theme_name_with_llm
from app.services.refcodes import code_to_label

_TITLE_PREFIX = re.compile(r"^【[^】]+】\s*")
_TITLE_TAIL = re.compile(r"\s*[-|｜—].*$")
_SPACES = re.compile(r"\s+")


def clean_signal_title(title: str) -> str:
    text = _TITLE_PREFIX.sub("", title or "")
    text = _TITLE_TAIL.sub("", text)
    return _SPACES.sub(" ", text).strip()


def short_stage_label(code: str | None) -> str | None:
    if not code:
        return None
    label = code_to_label("value_chain_stage").get(code)
    if not label:
        return None
    head, sep, _tail = label.partition("（")
    return head.strip() if sep else label


def majority_stage(codes: list[str | None]) -> str | None:
    counts = Counter(code for code in codes if code)
    if not counts:
        return None
    return counts.most_common(1)[0][0]


def fallback_working_name(titles: list[str], tags: list[str], stage_label: str | None) -> str:
    """Same shape as the page's local name: a short evidence title, or 环节 · 标签相关需求."""
    seen: list[str] = []
    for tag in tags:
        text = tag.strip()
        if text and text not in seen:
            seen.append(text)
    tags = seen[:8]
    ranked = []
    for title in titles:
        text = clean_signal_title(title)
        if len(text) < 6:
            continue
        ranked.append((text, sum(1 for tag in tags if tag in text), len(text)))
    ranked.sort(key=lambda row: (-row[1], row[2]))
    evidence = ranked[0][0] if ranked else None
    stage = stage_label if stage_label and stage_label != "待归因" else None

    if evidence:
        concise = evidence if len(evidence) <= 44 else f"{evidence[:41]}…"
        if not tags:
            return concise[:120]
        if all(tag in concise for tag in tags) and len(concise) <= 48:
            return concise
        if len(tags) == 1 and len(concise) <= 36:
            return concise
        if len(tags) >= 2 and sum(1 for tag in tags if tag in concise) >= 2 and len(concise) <= 48:
            return concise

    focus = "与".join(tags[:3])
    if stage:
        if len(tags) == 1:
            return f"{stage}侧{tags[0]}技术议题"
        if focus:
            return f"{stage} · {focus}相关需求"
    if len(tags) == 1:
        return f"围绕「{tags[0]}」的多源技术议题"
    if len(tags) == 2:
        return f"{focus}相关技术需求"
    if focus:
        return f"{focus}等综合技术议题"
    if evidence:
        return evidence[:120]
    return "未命名技术主题"


def _brief(signals: list[Signal], tags_by_id: dict[uuid.UUID, list[str]]) -> str:
    lines = ["以下是用户选中的信号。请只根据这些资料拟主题名。"]
    for index, signal in enumerate(signals, start=1):
        tags = "、".join(tags_by_id.get(signal.id) or []) or "无"
        lines.append(
            f"{index}. 标题: {signal.title}\n"
            f"   标签: {tags}\n"
            f"   环节: {signal.value_chain_stage_code or '未标'}"
        )
    return "\n".join(lines)


async def suggest_theme_name(db: AsyncSession, signal_ids: list[uuid.UUID]) -> ThemeNameSuggestionOut:
    ordered: list[uuid.UUID] = []
    seen: set[uuid.UUID] = set()
    for signal_id in signal_ids:
        if signal_id in seen:
            continue
        seen.add(signal_id)
        ordered.append(signal_id)
    rows = (
        (
            await db.execute(
                select(Signal)
                .options(selectinload(Signal.tags).selectinload(SignalTag.vocab))
                .where(Signal.id.in_(ordered))
            )
        )
        .scalars()
        .unique()
        .all()
    )
    by_id = {row.id: row for row in rows}
    signals = [by_id[signal_id] for signal_id in ordered if signal_id in by_id]
    if not signals:
        raise HTTPException(status_code=404, detail="signal not found")

    tags_by_id: dict[uuid.UUID, list[str]] = {}
    flat_tags: list[str] = []
    for signal in signals:
        names = []
        for tag in signal.tags:
            if tag.vocab is None or tag.vocab.kind != "tech_tag":
                continue
            name = tag.vocab.name.strip()
            if not name:
                continue
            names.append(name)
            if name not in flat_tags:
                flat_tags.append(name)
        tags_by_id[signal.id] = names

    stage_code = majority_stage([signal.value_chain_stage_code for signal in signals])
    fallback = fallback_working_name(
        [signal.title for signal in signals],
        flat_tags,
        short_stage_label(stage_code),
    )
    try:
        suggested = await asyncio.wait_for(
            suggest_theme_name_with_llm(_brief(signals, tags_by_id)),
            timeout=20,
        )
    except TimeoutError:
        suggested = None
    if suggested is None:
        return ThemeNameSuggestionOut(
            working_name=fallback,
            value_chain_stage_code=stage_code,
            source="fallback",
        )
    return ThemeNameSuggestionOut(
        working_name=suggested.working_name,
        value_chain_stage_code=suggested.value_chain_stage_code or stage_code,
        source="llm",
    )
