"""Deterministic document chunks and keyword + semantic RAG search."""

from __future__ import annotations

import hashlib
import logging
import uuid

import numpy as np
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.agent_models import DocumentChunk, DocumentFigure
from app.models.models import Document
from app.services import semantic_api
from app.services.agent_citations import make_chunk_citation, make_figure_citation
from app.services.agent_contract import AgentCitation
from app.services.doc_structure import split_markdown_sections
from app.platform.objectstore import load_body

logger = logging.getLogger(__name__)

SEMANTIC_CANDIDATE_LIMIT = 120
SEMANTIC_RERANK_POOL = 32


def _sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _chunk_text(text: str, *, size: int) -> list[str]:
    if not text.strip():
        return []
    return [text[i : i + size] for i in range(0, len(text), size)]


def _cosine_scores(query: list[float], vectors: list[list[float]]) -> list[float]:
    q = np.asarray(query, dtype=np.float32)
    matrix = np.asarray(vectors, dtype=np.float32)
    norms = np.linalg.norm(matrix, axis=1) * np.linalg.norm(q)
    numerator = matrix @ q
    return np.divide(numerator, norms, out=np.zeros_like(numerator), where=norms > 0).tolist()


def _chunk_citation(chunk: DocumentChunk, doc: Document) -> AgentCitation:
    return make_chunk_citation(
        document_id=doc.id,
        chunk_id=chunk.chunk_id,
        title=doc.filename or str(doc.id),
        summary=chunk.text[:400],
        section_path=chunk.section_path,
    )

async def _semantic_search_document_chunks(
    db: AsyncSession, *, keyword: str, limit: int
) -> tuple[list[AgentCitation], bool, str | None]:
    rows = (
        await db.execute(
            select(DocumentChunk, Document)
            .join(Document, Document.id == DocumentChunk.document_id)
            .order_by(Document.created_at.desc())
            .limit(SEMANTIC_CANDIDATE_LIMIT)
        )
    ).all()
    if not rows:
        return [], False, None

    texts = [chunk.text for chunk, _ in rows]
    try:
        vectors: list[list[float]] = []
        for offset in range(0, len(texts), semantic_api.MAX_BATCH):
            vectors.extend(
                await semantic_api.create_embeddings(
                    texts[offset : offset + semantic_api.MAX_BATCH], db=db
                )
            )
        query_vector = (await semantic_api.create_embeddings([keyword], db=db))[0]
    except Exception as exc:
        logger.warning("semantic document search unavailable: %s", exc)
        return [], True, f"语义检索不可用：{exc.__class__.__name__}"

    scores = _cosine_scores(query_vector, vectors)
    embedding_order = sorted(range(len(rows)), key=lambda i: scores[i], reverse=True)
    order = embedding_order
    degraded = False
    reason = None
    if semantic_api.rerank_configured():
        pool = embedding_order[:SEMANTIC_RERANK_POOL]
        try:
            ranked = await semantic_api.rerank(keyword, [texts[i] for i in pool])
            reranked = [pool[i] for i, _ in ranked if 0 <= i < len(pool)]
            seen = set(reranked)
            order = reranked + [i for i in embedding_order if i not in seen]
        except Exception as exc:
            logger.warning("semantic rerank unavailable: %s", exc)
            degraded = True
            reason = f"rerank 不可用，使用 embedding 排序：{exc.__class__.__name__}"

    citations = [_chunk_citation(rows[i][0], rows[i][1]) for i in order[:limit]]
    return citations, degraded, reason


async def ensure_document_index(db: AsyncSession, document: Document) -> None:
    existing = (
        await db.execute(
            select(DocumentChunk.section_path)
            .where(DocumentChunk.document_id == document.id)
            .limit(1)
        )
    ).first()
    if existing is not None and existing.section_path is not None:
        return
    if not document.canonical_md_object_key:
        return
    body = load_body(document.canonical_md_object_key) or ""
    if existing is not None:
        await db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document.id))
    chunks = split_markdown_sections(
        body, max_chars=get_settings().agent_rag_chunk_size
    )
    for chunk in chunks:
        db.add(
            DocumentChunk(
                document_id=document.id,
                chunk_id=chunk.chunk_id,
                text=chunk.text,
                content_sha256=_sha256_text(chunk.text),
                section_path=chunk.section_path,
                heading_level=chunk.heading_level,
                ordinal=chunk.ordinal,
                char_start=chunk.char_start,
                char_end=chunk.char_end,
                figure_indices=chunk.figure_indices,
            )
        )
    figure_rows = (
        await db.execute(
            select(DocumentFigure.figure_index)
            .where(DocumentFigure.document_id == document.id)
            .limit(1)
        )
    ).first()
    if figure_rows is None:
        for index in range(1, document.figure_count + 1):
            db.add(
                DocumentFigure(
                    document_id=document.id,
                    figure_index=index,
                    caption=None,
                    review_status="needs_review",
                    review_reason="旧文档未保存图块位置，请重新解析",
                    occurrence_count=1,
                )
            )
    else:
        await db.execute(
            update(DocumentFigure)
            .where(
                DocumentFigure.document_id == document.id,
                DocumentFigure.object_key.is_(None),
            )
            .values(
                review_status="needs_review",
                review_reason="旧文档未保存图块位置，请重新解析",
            )
        )
    await db.flush()


async def search_document_chunks(
    db: AsyncSession, *, keyword: str, limit: int
) -> tuple[list[AgentCitation], bool, str | None]:
    keyword = keyword.strip()
    like = f"%{keyword}%"
    q = (
        select(DocumentChunk, Document)
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(DocumentChunk.text.ilike(like))
        .order_by(Document.created_at.desc())
        .limit(limit)
    )
    rows = (await db.execute(q)).all()

    if rows:
        return [_chunk_citation(chunk, doc) for chunk, doc in rows], False, None

    if semantic_api.embedding_configured():
        return await _semantic_search_document_chunks(db, keyword=keyword, limit=limit)

    return [], False, None


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
