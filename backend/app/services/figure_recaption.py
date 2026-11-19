# -*- coding: utf-8 -*-
"""Re-caption one persisted figure without re-parsing the document (BE-12).

A failed figure keeps its stored image; only the caption is retried. The canonical
Markdown caption marker is rewritten in place, then chunks are rebuilt so the
section index matches the new caption text and offsets.
"""

from __future__ import annotations

import hashlib
import re
import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.agent_models import DocumentChunk, DocumentFigure
from app.models.models import Document
from app.services.doc_ingest import Figure, caption_figure
from app.services.doc_structure import split_markdown_sections
from app.services.llm_gateway import resolve_vision_model
from app.services.objectstore import load_bytes, save_bytes, sha256_bytes


def replace_figure_caption(markdown: str, figure_index: int, caption: str) -> str:
    """Replace only figure N's caption marker; leave every other byte intact."""
    pattern = re.compile(r"(>\s*图\s+" + str(figure_index) + r"[：:]\s*)([^\n]*)")
    replaced = pattern.sub(
        lambda match: match.group(1) + caption,
        markdown,
        count=1,
    )
    if replaced == markdown:
        pattern = re.compile(r"(>\s*图\s+" + str(figure_index) + r"\s+)([^\n]*)")
        replaced = pattern.sub(lambda match: match.group(1) + caption, markdown, count=1)
    return replaced


def figure_review_state(caption: str | None, section_path: list | None) -> tuple[str, str | None]:
    if not (caption or "").strip():
        return "needs_review", "视觉模型未返回描述"
    if section_path is None:
        return "needs_review", "未在正文中定位图块"
    return "ready", None


def _rebuild_chunks(db: AsyncSession, document_id: uuid.UUID, canonical: str) -> None:
    chunks = split_markdown_sections(
        canonical, max_chars=get_settings().agent_rag_chunk_size
    )
    db.add_all(
        [
            DocumentChunk(
                document_id=document_id,
                chunk_id=chunk.chunk_id,
                text=chunk.text,
                content_sha256=hashlib.sha256(chunk.text.encode("utf-8")).hexdigest(),
                section_path=chunk.section_path,
                heading_level=chunk.heading_level,
                ordinal=chunk.ordinal,
                char_start=chunk.char_start,
                char_end=chunk.char_end,
                figure_indices=chunk.figure_indices,
            )
            for chunk in chunks
        ]
    )


async def recaption_figure(
    db: AsyncSession, document_id: uuid.UUID, figure_index: int
) -> DocumentFigure | None:
    """Retry one figure's caption; returns the updated row or None when absent."""
    row = (
        await db.execute(
            select(DocumentFigure).where(
                DocumentFigure.document_id == document_id,
                DocumentFigure.figure_index == figure_index,
            )
        )
    ).scalar_one_or_none()
    if row is None:
        return None

    doc = (
        await db.execute(select(Document).where(Document.id == document_id))
    ).scalar_one_or_none()
    if doc is None:
        return None

    data = load_bytes(row.object_key) if row.object_key else None
    if data is None:
        row.review_status = "needs_review"
        row.review_reason = "图块图片未留存，需重新解析文档"
        await db.commit()
        await db.refresh(row)
        return row

    try:
        model = await resolve_vision_model()
    except Exception:  # noqa: BLE001 - unavailable model keeps the figure pending
        row.review_status = "needs_review"
        row.review_reason = "视觉模型不可用，未能重试识别"
        await db.commit()
        await db.refresh(row)
        return row

    figure = Figure(
        index=row.figure_index,
        source=row.source or "",
        mime=row.mime or "image/png",
        data=data,
        page=row.page,
    )
    figure.caption = await caption_figure(
        figure,
        model=model,
        retries=get_settings().vision_caption_retry,
    )
    row.caption = figure.caption.strip() or None
    row.review_status, row.review_reason = figure_review_state(
        row.caption, row.section_path
    )

    canonical = None
    if doc.canonical_md_object_key:
        raw = load_bytes(doc.canonical_md_object_key)
        if raw is not None:
            canonical = raw.decode("utf-8", errors="replace")
    if canonical is not None and row.caption:
        updated = replace_figure_caption(canonical, row.figure_index, row.caption)
        if updated == canonical:
            # No caption marker in canonical text: do not claim a ready figure.
            row.review_status = "needs_review"
            row.review_reason = "未在正文中定位图块"
            await db.commit()
            await db.refresh(row)
            return row
        payload = updated.encode("utf-8")
        doc.canonical_md_object_key = save_bytes(payload, folder="documents", ext="md")
        doc.canonical_md_sha256 = sha256_bytes(payload)
        await db.execute(
            delete(DocumentChunk).where(DocumentChunk.document_id == document_id)
        )
        _rebuild_chunks(db, document_id, updated)

    await db.commit()
    await db.refresh(row)
    return row
