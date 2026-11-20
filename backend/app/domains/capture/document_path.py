from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.evidence.channel import _infer_channel_code
from app.domains.evidence.document_pipeline import (
    document_raw_out,
    document_title,
    get_or_create_document_by_sha256,
    ingest_stored_document,
)
from app.domains.evidence.signal_record import create_signal_record
from app.models.models import Document, Signal
from app.schemas.schemas import DocumentRawOut
from app.services.body_excerpt import lead_excerpt_from_markdown
from app.services.doc_summary import build_document_body_summary, excerpt_from_canonical
from app.services.objectstore import load_bytes, sha256_bytes


def canonical_markdown(document: Document) -> str:
    """Read the canonical Markdown once for both the summary and the excerpt."""
    if not document.canonical_md_object_key:
        return ""
    data = load_bytes(document.canonical_md_object_key)
    return data.decode("utf-8", errors="replace") if data is not None else ""


async def create_signal_from_document(
    db: AsyncSession,
    *,
    filename: str | None,
    mime: str | None,
    source_url: str | None,
    data: bytes | None = None,
    document: Document | None = None,
    title: str | None = None,
    body_text: str | None = None,
    excerpt: str | None = None,
    published_at: datetime | None = None,
    evidence_status_code: str | None = None,
    value_chain_stage_code: str | None = None,
    signal_type_code: str | None = None,
    evolution_node_code: str | None = None,
    publisher: str | None = None,
    source_label: str | None = None,
    channel_code: str | None = None,
    capture_submission_id: uuid.UUID | None = None,
    capture_submission_sha256: str | None = None,
    vision_captions: bool = False,
    ingest: bool = True,
) -> tuple[Signal, DocumentRawOut]:
    """Document bytes → raw blob + ingest + derived signal (mirrors
    POST /documents/raw dedupe + POST /signals document_id path)."""
    if document is None:
        if not data:
            raise HTTPException(422, "file 为空：拒绝存储空文档（REQ-SIG-10 证据留存原则）")
        digest = sha256_bytes(data)
        doc = await get_or_create_document_by_sha256(
            db,
            digest=digest,
            data=data,
            filename=filename,
            mime=mime,
        )
        if ingest and doc.ingest_status != "parsed":
            await ingest_stored_document(db, doc, data, vision_captions=vision_captions)
    else:
        doc = document
    if doc.ingest_status == "failed":
        # A failed parse (e.g. a scanned PDF without a text layer) must not
        # become retained evidence. The raw blob is already stored.
        raise HTTPException(422, doc.ingest_error or "文档解析失败，未生成信号")
    canonical = canonical_markdown(doc)
    body_text = body_text or build_document_body_summary(doc.filename or "", canonical)
    url = source_url or f"eea://document/{doc.id}"
    title = title or document_title(doc)
    excerpt = excerpt or (
        excerpt_from_canonical(title, canonical)
        if canonical
        else lead_excerpt_from_markdown(title, body_text)
    )
    sig = await create_signal_record(
        db,
        title=title,
        url=url,
        evidence_status_code=evidence_status_code or ("retained" if body_text else "fetching"),
        channel_code=channel_code or (_infer_channel_code(source_url) if source_url else "web"),
        publisher=publisher,
        source_label=source_label,
        published_at=published_at or doc.created_at,
        value_chain_stage_code=value_chain_stage_code,
        signal_type_code=signal_type_code,
        evolution_node_code=evolution_node_code,
        excerpt=excerpt if body_text else None,
        body_text=body_text or None,
        document_id=doc.id,
        capture_submission_id=capture_submission_id,
        capture_submission_sha256=capture_submission_sha256,
    )
    return sig, document_raw_out(doc)
