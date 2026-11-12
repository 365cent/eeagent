from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.models import Document
from app.schemas.schemas import DocumentRawOut
from app.services.doc_ingest import ingest_document
from app.services.objectstore import load_bytes, save_bytes, sha256_bytes

EXCERPT_CHARS = 600


def doc_limits() -> tuple[int, int]:
    """(max raw upload bytes, max MarkItDown parse bytes)."""
    s = get_settings()
    return s.doc_raw_upload_max_bytes, s.doc_ingest_max_bytes


def mib_label(byte_count: int) -> str:
    mib = byte_count / (1024 * 1024)
    return f"{mib:.0f} MiB" if mib == int(mib) else f"{mib:.1f} MiB"


def canonical_excerpt(doc: Document) -> str | None:
    if not doc.canonical_md_object_key:
        return None
    data = load_bytes(doc.canonical_md_object_key)
    if data is None:
        return None
    return data.decode("utf-8", errors="replace")[:EXCERPT_CHARS]


def document_raw_out(doc: Document) -> DocumentRawOut:
    return DocumentRawOut(
        id=doc.id,
        sha256=doc.sha256,
        mime=doc.mime,
        size=doc.size,
        filename=doc.filename,
        ingest_status=doc.ingest_status or "stored",
        markitdown_version=doc.markitdown_version,
        vision_model=doc.vision_model,
        figure_count=doc.figure_count or 0,
        canonical_md_excerpt=canonical_excerpt(doc),
    )


def document_title(document: Document) -> str:
    if document.filename:
        return Path(document.filename).stem or document.filename
    return f"文档 {document.sha256[:8]}"


async def ingest_stored_document(
    db: AsyncSession,
    doc: Document,
    data: bytes,
    *,
    vision_captions: bool = True,
) -> None:
    _, max_parse = doc_limits()
    if len(data) > max_parse:
        doc.ingest_status = "skipped"
        doc.ingest_error = (
            f"文件 {len(data)} 字节超过解析上限 {max_parse}（{mib_label(max_parse)}），仅保留原始 blob"
        )
        doc.ingested_at = func.now()
        await db.commit()
        await db.refresh(doc)
        return
    try:
        result = await ingest_document(
            data,
            doc.filename,
            doc.mime,
            vision_captions=vision_captions,
        )
        md_bytes = result.canonical_md.encode("utf-8")
        doc.canonical_md_object_key = save_bytes(md_bytes, folder="documents", ext="md")
        doc.canonical_md_sha256 = sha256_bytes(md_bytes)
        doc.markitdown_version = result.markitdown_version
        doc.figure_count = result.figure_count
        doc.vision_model = result.vision_model
        doc.ingest_status = "parsed"
        doc.ingest_error = None
    except Exception as exc:  # noqa: BLE001 - storage succeeded; report parse failure
        doc.ingest_status = "failed"
        doc.ingest_error = str(exc)[:500]
    doc.ingested_at = func.now()
    await db.commit()
    await db.refresh(doc)


async def get_or_create_document_by_sha256(
    db: AsyncSession,
    *,
    digest: str,
    data: bytes,
    filename: str | None,
    mime: str | None,
) -> Document:
    """Persist or reuse a document row by content hash without rolling back the caller session."""
    doc = (
        await db.execute(select(Document).where(Document.sha256 == digest))
    ).scalar_one_or_none()
    if doc is not None:
        return doc
    object_key = save_bytes(data, folder="documents", ext="bin")
    stmt = (
        pg_insert(Document)
        .values(
            sha256=digest,
            mime=mime or "application/octet-stream",
            size=len(data),
            filename=filename,
            object_key=object_key,
            uploaded_by="local-admin",
        )
        .on_conflict_do_nothing(index_elements=["sha256"])
        .returning(Document)
    )
    inserted = (await db.execute(stmt)).scalar_one_or_none()
    if inserted is not None:
        await db.commit()
        await db.refresh(inserted)
        return inserted
    doc = (
        await db.execute(select(Document).where(Document.sha256 == digest))
    ).scalar_one_or_none()
    if doc is None:
        raise HTTPException(503, "document dedupe race: concurrent insert left no row")
    return doc
