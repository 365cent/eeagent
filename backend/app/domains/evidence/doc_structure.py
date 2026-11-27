"""Heading-aware document sections and figure locations (BE-12)."""

from __future__ import annotations

from dataclasses import dataclass
import re

HEADING_RE = re.compile(r"^(#{1,6})\s+([^\n]+)")
FIGURE_MARKER_RE = re.compile(r">\s*图\s+(\d+)")
FIGURE_NUMBER_RE = re.compile(r">\s*图\s+(\d+)")

DEFAULT_MAX_CHARS = 4000


@dataclass(slots=True)
class SectionChunk:
    chunk_id: int
    section_path: list[str]
    heading_level: int | None
    text: str
    char_start: int
    char_end: int
    figure_indices: list[int]
    ordinal: int


def _heading_path(stack: list[tuple[int, str]]) -> list[str]:
    return [title for _, title in stack]


def _figure_indices(text: str) -> list[int]:
    seen: list[int] = []
    for match in FIGURE_NUMBER_RE.finditer(text):
        index = int(match.group(1))
        if index not in seen:
            seen.append(index)
    return seen


def _append_chunks(
    chunks: list[SectionChunk],
    text: str,
    *,
    absolute_start: int,
    section_path: list[str],
    heading_level: int | None,
    max_chars: int,
) -> None:
    if not text.strip():
        return
    cursor = 0
    while cursor < len(text):
        remaining = len(text) - cursor
        if remaining <= max_chars:
            take = remaining
        else:
            window = text[cursor : cursor + max_chars]
            paragraph = window.rfind("\n\n")
            newline = window.rfind("\n")
            take = paragraph if paragraph > 0 else newline
            if take <= 0:
                take = max_chars
        piece = text[cursor : cursor + take]
        if not piece.strip():
            cursor += take
            continue
        chunks.append(
            SectionChunk(
                chunk_id=len(chunks) + 1,
                section_path=section_path,
                heading_level=heading_level,
                text=piece,
                char_start=absolute_start + cursor,
                char_end=absolute_start + cursor + take,
                figure_indices=_figure_indices(piece),
                ordinal=len(chunks) + 1,
            )
        )
        cursor += take


def split_markdown_sections(
    markdown: str, *, max_chars: int = DEFAULT_MAX_CHARS
) -> list[SectionChunk]:
    """Split canonical Markdown by heading path, then by size.

    chunk_id and ordinal are 1-based document order. char_start and char_end
    are offsets in the original canonical Markdown, not the section.
    """
    if max_chars <= 0:
        raise ValueError("max_chars must be positive")
    chunks: list[SectionChunk] = []
    stack: list[tuple[int, str]] = []
    segment_start = 0
    segment_path: list[str] = []
    segment_level: int | None = None
    offset = 0

    for line in markdown.splitlines(keepends=True):
        match = HEADING_RE.match(line)
        if match is None:
            offset += len(line)
            continue
        if offset > segment_start:
            _append_chunks(
                chunks,
                markdown[segment_start:offset],
                absolute_start=segment_start,
                section_path=segment_path,
                heading_level=segment_level,
                max_chars=max_chars,
            )
        level = len(match.group(1))
        title = match.group(2).strip()
        while stack and stack[-1][0] >= level:
            stack.pop()
        stack.append((level, title))
        segment_start = offset
        segment_path = _heading_path(stack)
        segment_level = level
        offset += len(line)

    if segment_start < len(markdown):
        _append_chunks(
            chunks,
            markdown[segment_start:],
            absolute_start=segment_start,
            section_path=segment_path,
            heading_level=segment_level,
            max_chars=max_chars,
        )
    return chunks


def assign_figure_locations(markdown: str, figures: list) -> None:
    """Set figure.position and figure.section_path from figure markers.

    Figures without a marker keep position=None and section_path=None; callers
    mark them for review instead of inventing a chapter.
    """
    stack: list[tuple[int, str]] = []
    offset = 0
    for line in markdown.splitlines(keepends=True):
        match = HEADING_RE.match(line)
        if match is not None:
            level = len(match.group(1))
            title = match.group(2).strip()
            while stack and stack[-1][0] >= level:
                stack.pop()
            stack.append((level, title))
        for marker in FIGURE_MARKER_RE.finditer(line):
            index = int(marker.group(1))
            if 0 < index <= len(figures):
                figure = figures[index - 1]
                if getattr(figure, "position", None) is None:
                    figure.position = offset + marker.start()
                    figure.section_path = _heading_path(stack)
        offset += len(line)
