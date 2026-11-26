"""The assistant must be able to quote a document's converted text and captions.

A document-derived signal only stores a summary, so a phrase that exists only in
the MarkItDown body or in a figure caption has to be reachable through the
evidence tool - otherwise the assistant answers "no evidence" about a document
it can actually see.
"""
from __future__ import annotations

import hashlib
import uuid

import pytest

from app.db.base import SessionLocal
from app.models.agent_models import DocumentChunk
from app.models.models import Document, Signal
from app.services.agent_contract import CitationLedger
from app.services.agent_tools import find_evidence_hits
from tests.support import create_signal

pytestmark = [pytest.mark.anyio, pytest.mark.db]

CAPTION_PHRASE = "六边形芯粒互连封装剖面"


async def test_document_text_and_caption_are_searchable_evidence(client):
    signal = await create_signal(
        client, url="https://example.com/chiplet-doc", title="chiplet 报告（标题不含图注词）"
    )
    document_id = uuid.uuid4()

    async with SessionLocal() as db:
        db.add(
            Document(
                id=document_id,
                sha256=hashlib.sha256(str(document_id).encode()).hexdigest(),
                mime="application/pdf",
                size=1024,
                filename="report.pdf",
                object_key=f"documents/{document_id}.pdf",
                uploaded_by="test",
                ingest_status="parsed",
            )
        )
        # Flush the document first: the chunk has no ORM relationship to order it.
        await db.flush()
        db.add(
            DocumentChunk(
                document_id=document_id,
                chunk_id=1,
                text=f"## 图块语义\n\n| 3 | 第 9 页 | {CAPTION_PHRASE}，标注散热通道与供电引脚。 |\n",
                content_sha256=hashlib.sha256(CAPTION_PHRASE.encode()).hexdigest(),
                section_path=["图块语义"],
                heading_level=2,
                ordinal=1,
                char_start=0,
                char_end=len(CAPTION_PHRASE),
                figure_indices=[3],
            )
        )
        await db.execute(
            Signal.__table__.update().where(Signal.id == uuid.UUID(signal["id"])).values(document_id=document_id)
        )
        await db.commit()

        hits = await find_evidence_hits(
            db, CitationLedger(), keyword=CAPTION_PHRASE, limit=5
        )

    kinds = [hit.citation.kind for hit in hits]
    assert "document_chunk" in kinds, f"document caption not reachable: {kinds}"
    assert any(hit.signal_id == uuid.UUID(signal["id"]) for hit in hits)


async def test_signal_fields_still_match_first(client):
    signal = await create_signal(client, url="https://example.com/plain", title="全域智能配电主题信号")

    async with SessionLocal() as db:
        hits = await find_evidence_hits(db, CitationLedger(), keyword="全域智能配电", limit=5)

    assert hits and hits[0].citation.kind == "signal"
    assert hits[0].signal_id == uuid.UUID(signal["id"])
