"""Document-sourced signal body summaries (S1-3).

A signal created from an uploaded document (``POST /signals`` with
``document_id``) stores a SUMMARY — filename + document headings/slide titles
+ speaker-notes excerpts — instead of the whole canonical Markdown. Pouring a
1000-line deck into ``body_text`` used to feed the whole thing to jieba and
the theme matcher, which is exactly how demo themes got misattributed
(backend/TODO.md W4.1). The full canonical text stays reachable via
``GET /documents/{id}/canonical.md``; the signal links to it.
"""
from __future__ import annotations

import re

_MAX_TITLES = 20
_NOTES_CHARS = 240
_NOTES_MAX = 5
_TOTAL_CHARS = 4000

# pptx decks carry speaker notes as "### Notes:" sections; other formats use
# ATX headings. Both come straight from the MarkItDown canonical Markdown. A
# notes section ends at the next heading OR the next slide-number comment.
_HEADING = re.compile(r"^(#{1,3})\s+(.+?)\s*$", re.MULTILINE)
_NOTES = re.compile(r"^###\s*Notes:\s*\n(.*?)(?=^#{1,3}\s|^<!--|\Z)", re.MULTILINE | re.DOTALL)


def build_document_body_summary(filename: str, canonical_md: str) -> str:
    """Filename + section/slide titles + notes excerpts, capped.

    Deterministic, local, LLM-free: the summary only re-arranges text the
    canonical Markdown already contains, so creating a signal from a document
    never adds another network call on the ingest path.
    """
    lines: list[str] = []
    if filename:
        lines.append(f"来源文档：{filename}")

    headings = [
        text.strip()
        for _, text in _HEADING.findall(canonical_md or "")
        if text.strip() and not text.strip().startswith("Notes")
    ]
    if headings:
        lines.append("")
        lines.append("章节/幻灯片标题：")
        lines.extend(f"- {h}" for h in headings[:_MAX_TITLES])

    notes = [n.strip() for n in _NOTES.findall(canonical_md or "") if n.strip()]
    if notes:
        lines.append("")
        lines.append("讲稿摘录：")
        for note in notes[:_NOTES_MAX]:
            condensed = re.sub(r"\s+", " ", note).strip()[:_NOTES_CHARS]
            lines.append(f"- {condensed}")

    if len(lines) <= 1:
        # no headings and no notes (or an empty canonical): fall back to the
        # leading text so the signal still carries a non-empty body
        lead = re.sub(r"\s+", " ", (canonical_md or "").strip())[:600]
        if lead:
            lines.append("")
            lines.append(f"正文摘录：{lead}")
        else:
            lines.append("（文档未解析出可摘要内容，完整内容见 GET /documents/{id}/canonical.md）")
    return "\n".join(lines)[:_TOTAL_CHARS]
