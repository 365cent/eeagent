"""证据工作室生成（backend/TODO.md 八）: prompt + parse + validate per kind.

The route lives next to the evidence assistant in `app/api/v1/signals.py`
(POST /signals/{id}/studio). This module owns the LLM-facing half:

- four prompts (audio / mindmap / report / infographic), each reusing the same
  signal context block the assistant sends;
- JSON extraction that tolerates markdown code fences and stray prose;
- contract validation (frontend `StudioAudioPayload` etc.): audio quotes must
  be literal substrings of the snapshot body, mindmap depth ≤ 3, infographic
  strings only. Invalid output → None → caller retries once → 422.

Nothing here touches the database: results are generated per request and the
frontend caches the last success per (signal, kind).
"""
from __future__ import annotations

import json
import re

from app.schemas.schemas import (
    SignalStudioKind,
    StudioAudioPayload,
    StudioInfographicPayload,
    StudioMindmapNode,
    StudioMindmapPayload,
)

#: The quote of an audio segment must appear verbatim in the snapshot body;
#: compare on whitespace-collapsed text so line wraps don't cause false misses.
_WS = re.compile(r"\s+")

MIN_AUDIO_SEGMENTS = 4
MAX_AUDIO_SEGMENTS = 12

_BASE_SYSTEM = (
    "你是 EEA 前瞻技术扫描平台的证据工作室生成器。只依据提供的信号上下文生成内容，"
    "不引入上下文之外的事实、数字或引用。输出简体中文。"
)

_KIND_INSTRUCTIONS: dict[str, str] = {
    "audio": (
        "生成一段 6–10 句的口播稿，供研究者快速了解这条证据。"
        "只输出 JSON 对象："
        '{"segments":[{"text":"口播句（12–60 字，自然口语，可连读）",'
        '"quote":"正文中的原文短句，逐字摘录 8–40 字，不得改写"}]}。'
        "quote 必须能在信号正文中找到原样文字；找不到原文就换一句正文里有的。"
    ),
    "mindmap": (
        "把这条证据梳理成思维导图。只输出 JSON 对象："
        '{"title":"根节点（不超过 20 字）","children":[{"label":"一级分支","children":'
        '[{"label":"二级分支"}]}]}。'
        "深度最多 3 层（根 → 一级 → 二级），一级分支 2–4 个，标签简洁，不加解释文字。"
    ),
    "report": (
        "写一份 Markdown 简报，直接用 Markdown 输出、不要代码块包裹。结构："
        "## 一句话结论；## 关键要点（3–5 条）；## 对前瞻扫描的含义；## 局限。"
        "事实只来自信号上下文，信息不足处明确写「上下文未提供」。"
    ),
    "infographic": (
        "把这条证据组织成信息图数据。只输出 JSON 对象："
        '{"headline":"一句话标题（不超过 24 字）",'
        '"stats":[{"label":"指标名","value":"指标值"}],'
        '"points":[{"title":"要点标题","body":"一两句说明"}]}。'
        "stats 2–4 条，points 2–4 条。value 里的数字只能来自信号上下文，"
        "上下文没有的数字不要编造（宁可少给一条 stat）。"
    ),
}

_RETRY_SUFFIX = (
    "\n\n上一次输出无法按约定解析。请只输出符合约定的 JSON 对象本身："
    "不要 Markdown 代码块，不要解释文字，不要多余前后缀。"
)


def build_messages(kind: SignalStudioKind, context: str, *, retry: bool = False) -> list[dict[str, str]]:
    """System + user messages for one studio generation attempt."""
    system = f"{_BASE_SYSTEM}\n\n--- 信号上下文 ---\n{context}"
    user = _KIND_INSTRUCTIONS[kind]
    if retry and kind != "report":
        user += _RETRY_SUFFIX
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


class StudioParseError(ValueError):
    """The model answered, but not with the contracted shape."""


def _strip_fences(text: str) -> str:
    body = text.strip()
    fence = re.match(r"^```(?:json|markdown|md)?\s*\n(.*?)\n?```$", body, re.DOTALL)
    if fence:
        return fence.group(1).strip()
    # tolerate prose around the payload: take the outermost {...}
    start, end = body.find("{"), body.rfind("}")
    if start != -1 and end > start:
        return body[start : end + 1]
    return body


def _json_object(raw: str) -> dict:
    text = _strip_fences(raw)
    try:
        data = json.loads(text)
    except ValueError as exc:
        raise StudioParseError(f"不是合法 JSON：{exc}") from exc
    if not isinstance(data, dict):
        raise StudioParseError("顶层不是 JSON 对象")
    return data


def _collapsed(text: str) -> str:
    return _WS.sub(" ", text).strip()


def _sanitize_audio(data: dict, *, body: str) -> StudioAudioPayload:
    """Keep only segments whose quote is a literal snapshot-body substring."""
    haystack = _collapsed(body)
    try:
        payload = StudioAudioPayload.model_validate(data)
    except ValueError as exc:
        raise StudioParseError(f"audio 结构不符合契约：{exc}") from exc
    kept = [
        seg
        for seg in payload.segments
        if seg.text.strip()
        and seg.quote.strip()
        and _collapsed(seg.quote) in haystack
    ]
    if len(kept) < MIN_AUDIO_SEGMENTS:
        raise StudioParseError(
            f"可用口播句只有 {len(kept)} 条（需 ≥{MIN_AUDIO_SEGMENTS}），"
            "quote 未能逐字命中正文"
        )
    return StudioAudioPayload(segments=kept[:MAX_AUDIO_SEGMENTS])


def _trim_depth(node: StudioMindmapNode, depth: int) -> StudioMindmapNode:
    """深度 ≤ 3（根=1）：保留到第二层分支，砍掉更深的后代。"""
    if depth >= 3:
        return StudioMindmapNode(label=node.label.strip(), children=[])
    return StudioMindmapNode(
        label=node.label.strip(),
        children=[_trim_depth(child, depth + 1) for child in node.children if child.label.strip()],
    )


def _sanitize_mindmap(data: dict, *, fallback_title: str) -> StudioMindmapPayload:
    try:
        payload = StudioMindmapPayload.model_validate(data)
    except ValueError as exc:
        raise StudioParseError(f"mindmap 结构不符合契约：{exc}") from exc
    title = payload.title.strip() or fallback_title
    children = [_trim_depth(c, 2) for c in payload.children if c.label.strip()]
    if not children:
        raise StudioParseError("mindmap 没有一级分支")
    return StudioMindmapPayload(title=title[:60], children=children)


def _sanitize_infographic(data: dict) -> StudioInfographicPayload:
    try:
        payload = StudioInfographicPayload.model_validate(data)
    except ValueError as exc:
        raise StudioParseError(f"infographic 结构不符合契约：{exc}") from exc
    headline = payload.headline.strip()
    stats = [s for s in payload.stats if s.label.strip() and str(s.value).strip()]
    points = [p for p in payload.points if p.title.strip() and p.body.strip()]
    if not headline or not points:
        raise StudioParseError("infographic 缺少 headline 或 points")
    return StudioInfographicPayload(headline=headline[:80], stats=stats[:4], points=points[:6])


def parse_studio_payload(
    kind: SignalStudioKind,
    raw: str,
    *,
    body: str,
    fallback_title: str,
) -> dict:
    """Model output → contracted payload dict. Raises StudioParseError.

    `body` is the snapshot body used for the audio quote-substring check;
    pass the same excerpt the prompt saw.
    """
    data = _json_object(raw)
    if kind == "audio":
        return _sanitize_audio(data, body=body).model_dump()
    if kind == "mindmap":
        return _sanitize_mindmap(data, fallback_title=fallback_title).model_dump()
    if kind == "infographic":
        return _sanitize_infographic(data).model_dump()
    raise StudioParseError(f"kind={kind!r} 不走 JSON 解析")


def strip_report_markdown(raw: str) -> str:
    """Report is already Markdown; only unwrap a stray code fence."""
    text = raw.strip()
    fence = re.match(r"^```(?:markdown|md)?\s*\n(.*?)\n?```$", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    if not text:
        raise StudioParseError("报告内容为空")
    return text + ("\n" if not text.endswith("\n") else "")
