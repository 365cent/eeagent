"""Signal excerpt: LLM summary when configured, else article lead (not head truncation)."""
from __future__ import annotations

import re

from app.services.llm import suggest_excerpt_with_llm
from app.services.tagging import text_for_tagging

_MD_LINK = re.compile(r"\[([^\]]*)\]\([^)]*\)")
_HEADING = re.compile(r"^#+\s*", re.MULTILINE)
_BLOCK_BREAK = re.compile(r"\n{2,}")
_TITLE_PREFIX = re.compile(r"^(新闻详情|文章详情|详情页?)[\-–—]\s*")

_NAV_HINTS = ("全部标签", "分享到", "微博", "微信", "首页", "登录", "注册")
# Portal tag rails: "模拟/混合信号 + 嵌入式系统 + …"
_NAV_RAIL = re.compile(r"(?:[\w\u4e00-\u9fff/.-]{2,24}\s*\+\s*){3,}")


def _strip_block(block: str) -> str:
    text = _MD_LINK.sub(r"\1", block)
    text = _HEADING.sub("", text)
    text = re.sub(r"[#*_>`|]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _strip_nav_prefix(plain: str) -> str:
    for marker in _NAV_HINTS:
        if marker in plain:
            plain = plain.split(marker, 1)[-1].strip()
    # Drop leading portal rail before the first long CJK sentence.
    match = re.search(r"[\u4e00-\u9fffA-Za-z][\s\S]{18,}[。；!?]", plain)
    if match and match.start() > 8:
        plain = plain[match.start() :]
    return plain.strip()


def _is_nav_or_chrome(block: str) -> bool:
    plain = _strip_block(block)
    if not plain:
        return True
    if plain.startswith(">") or plain.startswith("!["):
        return True
    if any(h in plain for h in _NAV_HINTS) and ("+" in plain or len(plain) < 200):
        return True
    if _NAV_RAIL.search(plain):
        return True
    plus = plain.count("+")
    if plus >= 4 and len(plain) < 480 and "。" not in plain:
        return True
    # Mostly menu tokens, little sentence punctuation.
    if len(plain) > 40 and plain.count("，") + plain.count("。") + plain.count("；") == 0 and plus >= 2:
        if sum(1 for part in plain.split("+") if 2 <= len(part.strip()) <= 20) >= 4:
            return True
    return False


def _title_plain(title: str | None) -> str:
    if not title:
        return ""
    return _TITLE_PREFIX.sub("", title.strip())


def lead_excerpt_from_markdown(title: str | None, body_md: str, *, max_len: int = 320) -> str:
    """First substantive prose block after skipping chrome; never raw [:200] cut."""
    title_plain = _title_plain(title)
    blocks = _BLOCK_BREAK.split(body_md or "")
    paragraphs: list[str] = []
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        if _is_nav_or_chrome(block):
            continue
        plain = _strip_nav_prefix(_strip_block(block))
        if len(plain) < 24:
            continue
        if title_plain and plain.startswith(title_plain[: min(24, len(title_plain))]):
            if len(plain) <= len(title_plain) + 12:
                continue
        if re.match(r"^[\s\S]{0,80}[\(（][^)）]{2,80}[\)）]\d{4}-\d{2}-\d{2}", plain):
            continue
        if "。" not in plain and "；" not in plain and len(plain) < 48:
            continue
        paragraphs.append(plain)
    if not paragraphs:
        for block in blocks:
            block = block.strip()
            if not block or _is_nav_or_chrome(block):
                continue
            plain = _strip_block(block)
            if len(plain) >= 48 and not (
                title_plain
                and plain.startswith(title_plain[: min(24, len(title_plain))])
                and len(plain) <= len(title_plain) + 12
            ):
                paragraphs.append(plain)
                break
    if not paragraphs:
        fallback = text_for_tagging(title, body_md)
        collapsed = fallback[:max_len] if fallback else ""
    else:
        collapsed = paragraphs[0]
        if len(paragraphs) > 1 and len(collapsed) < max_len // 2:
            collapsed = " ".join(paragraphs[:2])
    collapsed = collapsed.strip()
    if len(collapsed) <= max_len:
        return collapsed
    return f"{collapsed[: max_len - 1]}…"


async def resolve_signal_excerpt(title: str | None, body_md: str, *, max_len: int = 320) -> str | None:
    """Persisted excerpt: LLM when available, else deterministic lead paragraph."""
    body = (body_md or "").strip()
    if not body:
        return None
    llm_body = text_for_tagging(title, body) or body[:6000]
    generated = await suggest_excerpt_with_llm(title or "", llm_body)
    if generated:
        text = re.sub(r"\s+", " ", generated.strip())
        if len(text) > max_len:
            text = f"{text[: max_len - 1]}…"
        return text
    return lead_excerpt_from_markdown(title, body, max_len=max_len)
