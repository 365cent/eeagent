from __future__ import annotations

import uuid

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
from app.models.models import Signal
from app.schemas.schemas import DocumentRawOut
from app.services.body_excerpt import lead_excerpt_from_markdown
from app.services.doc_summary import build_document_body_summary
from app.services.objectstore import load_bytes, sha256_bytes


async def _document_path(
    db: AsyncSession,
    *,
    data: bytes,
    filename: str | None,
    mime: str | None,
    source_url: str | None,
    publisher: str | None = None,
    source_label: str | None = None,
    channel_code: str | None = None,
    capture_submission_id: uuid.UUID | None = None,
    capture_submission_sha256: str | None = None,
    vision_captions: bool = False,
) -> tuple[Signal, DocumentRawOut]:
    """Document bytes → raw blob + ingest + derived signal (mirrors
    POST /documents/raw dedupe + POST /signals document_id path)."""
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
    if doc.ingest_status != "parsed":
        await ingest_stored_document(db, doc, data, vision_captions=vision_captions)
    canonical = ""
    if doc.canonical_md_object_key:
        blob = load_bytes(doc.canonical_md_object_key)
        if blob is not None:
            canonical = blob.decode("utf-8", errors="replace")
    body_text = build_document_body_summary(doc.filename or "", canonical)
    url = source_url or f"eea://document/{doc.id}"
    title = document_title(doc)
    sig = await create_signal_record(
        db,
        title=title,
        url=url,
        evidence_status_code="retained" if body_text else "fetching",
        channel_code=channel_code or (_infer_channel_code(source_url) if source_url else "web"),
        publisher=publisher,
        source_label=source_label,
        excerpt=lead_excerpt_from_markdown(title, body_text) if body_text else None,
        body_text=body_text or None,
        document_id=doc.id,
        capture_submission_id=capture_submission_id,
        capture_submission_sha256=capture_submission_sha256,
    )
    return sig, document_raw_out(doc)
