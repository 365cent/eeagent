"""Deterministic document chunks and keyword RAG search."""

from __future__ import annotations

import hashlib
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.agent_models import DocumentChunk, DocumentFigure
from app.models.models import Document
from app.services.agent_citations import make_chunk_citation, make_figure_citation
from app.services.agent_contract import AgentCitation
from app.services.objectstore import load_body


def _sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _chunk_text(text: str, *, size: int) -> list[str]:
    if not text.strip():
        return []
    return [text[i : i + size] for i in range(0, len(text), size)]


async def ensure_document_index(db: AsyncSession, document: Document) -> None:
    existing = (
        await db.execute(
            select(DocumentChunk.chunk_id).where(DocumentChunk.document_id == document.id).limit(1)
        )
    ).first()
    if existing:
        return
    if not document.canonical_md_object_key:
        return
    body = load_body(document.canonical_md_object_key) or ""
    size = get_settings().agent_rag_chunk_size
    chunks = _chunk_text(body, size=size)
    for idx, text in enumerate(chunks, start=1):
        db.add(
            DocumentChunk(
                document_id=document.id,
                chunk_id=idx,
                text=text,
                content_sha256=_sha256_text(text),
            )
        )
    for index in range(1, document.figure_count + 1):
        db.add(
            DocumentFigure(
                document_id=document.id,
                figure_index=index,
                caption=None,
                review_status="ready",
            )
        )
    await db.flush()


async def search_document_chunks(
    db: AsyncSession, *, keyword: str, limit: int
) -> tuple[list[AgentCitation], bool, str | None]:
    like = f"%{keyword.strip()}%"
    q = (
        select(DocumentChunk, Document)
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(DocumentChunk.text.ilike(like))
        .order_by(Document.created_at.desc())
        .limit(limit)
    )
    rows = (await db.execute(q)).all()
    citations: list[AgentCitation] = []
    for chunk, doc in rows:
        await ensure_document_index(db, doc)
        title = doc.filename or str(doc.id)
        summary = chunk.text[:400]
        citations.append(
            make_chunk_citation(
                document_id=doc.id,
                chunk_id=chunk.chunk_id,
                title=title,
                summary=summary,
            )
        )
    degraded = False
    reason = None
    from app.services import semantic_api

    if not rows and semantic_api.semantic_configured():
        degraded = True
        reason = "关键词未命中文档片段；语义重排未在本切片接入。"
    return citations, degraded, reason


async def load_figure_citation(
    db: AsyncSession, document_id: uuid.UUID, figure_index: int
) -> AgentCitation | None:
    row = (
        await db.execute(
            select(DocumentFigure, Document)
            .join(Document, Document.id == DocumentFigure.document_id)
            .where(
                DocumentFigure.document_id == document_id,
                DocumentFigure.figure_index == figure_index,
            )
        )
    ).first()
    if not row:
        return None
    figure, doc = row
    title = doc.filename or str(doc.id)
    summary = figure.caption or f"图 {figure_index}"
    return make_figure_citation(
        document_id=document_id,
        figure_index=figure_index,
        title=title,
        summary=summary,
        review_status=figure.review_status,
    )
