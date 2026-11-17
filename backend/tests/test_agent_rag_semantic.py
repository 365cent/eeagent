"""Semantic RAG fallback: chunk embeddings, cosine ranking and rerank."""

from __future__ import annotations

import hashlib
import uuid

import pytest

from app.db.base import SessionLocal
from app.models.agent_models import DocumentChunk
from app.models.models import Document
from app.services import agent_rag, semantic_api

pytestmark = pytest.mark.anyio


async def _seed_chunks() -> None:
    async with SessionLocal() as db:
        doc = Document(
            sha256=uuid.uuid4().hex + uuid.uuid4().hex,
            mime="text/markdown",
            size=32,
            filename="semantic-rag.md",
            object_key="documents/semantic-rag.md",
        )
        db.add(doc)
        await db.flush()
        for chunk_id, text in enumerate(
            ["eFuse smart power distribution", "unrelated cooking recipe"], start=1
        ):
            db.add(
                DocumentChunk(
                    document_id=doc.id,
                    chunk_id=chunk_id,
                    text=text,
                    content_sha256=hashlib.sha256(text.encode()).hexdigest(),
                )
            )
        await db.commit()


async def test_semantic_fallback_embeds_then_reranks(monkeypatch):
    await _seed_chunks()
    monkeypatch.setattr(semantic_api, "embedding_configured", lambda: True)
    monkeypatch.setattr(semantic_api, "rerank_configured", lambda: True)

    async def fake_embed(texts, *, db=None, timeout=30.0):
        if texts == ["eFuse 智能配电"]:
            return [[1.0, 0.0]]
        return [[0.9, 0.1] if "eFuse" in text else [0.1, 0.9] for text in texts]

    async def fake_rerank(query, documents, *, timeout=30.0):
        return [(1, 0.99), (0, 0.1)]

    monkeypatch.setattr(semantic_api, "create_embeddings", fake_embed)
    monkeypatch.setattr(semantic_api, "rerank", fake_rerank)

    async with SessionLocal() as db:
        citations, degraded, reason = await agent_rag.search_document_chunks(
            db, keyword="eFuse 智能配电", limit=2
        )
    assert [citation.chunk_id for citation in citations] == [2, 1]
    assert degraded is False
    assert reason is None


async def test_semantic_rerank_failure_keeps_embedding_order(monkeypatch):
    await _seed_chunks()
    monkeypatch.setattr(semantic_api, "embedding_configured", lambda: True)
    monkeypatch.setattr(semantic_api, "rerank_configured", lambda: True)

    async def fake_embed(texts, *, db=None, timeout=30.0):
        if texts == ["eFuse 智能配电"]:
            return [[1.0, 0.0]]
        return [[0.9, 0.1] if "eFuse" in text else [0.1, 0.9] for text in texts]

    async def failing_rerank(query, documents, *, timeout=30.0):
        raise RuntimeError("rerank down")

    monkeypatch.setattr(semantic_api, "create_embeddings", fake_embed)
    monkeypatch.setattr(semantic_api, "rerank", failing_rerank)

    async with SessionLocal() as db:
        citations, degraded, reason = await agent_rag.search_document_chunks(
            db, keyword="eFuse 智能配电", limit=2
        )
    assert [citation.chunk_id for citation in citations] == [1, 2]
    assert degraded is True
    assert "embedding" in (reason or "")
