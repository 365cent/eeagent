from __future__ import annotations

import hashlib
import mimetypes
import uuid
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.agent_models import DocumentChunk, DocumentFigure
from app.models.models import Document
from app.schemas.schemas import DocumentRawOut
from app.services.doc_ingest import ingest_document
from app.services.doc_structure import split_markdown_sections
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



def _review_state(figure) -> tuple[str, str | None]:
    caption = (figure.caption or "").strip()
    if not caption:
        return "needs_review", "视觉模型未返回描述"
    # PDF has no heading outline, so a page number is what locates its figures.
    if getattr(figure, "section_path", None) is None and getattr(figure, "page", None) is None:
        return "needs_review", "未在正文中定位图块"
    return "ready", None


async def persist_document_index(db: AsyncSession, doc: Document, result) -> None:
    """Replace chunks and figure assets only after a successful parse."""
    chunks = split_markdown_sections(
        result.canonical_md, max_chars=get_settings().agent_rag_chunk_size
    )
    figure_rows: list[DocumentFigure] = []
    for figure in result.figures:
        ext = (mimetypes.guess_extension(figure.mime or "") or ".bin").lstrip(".")
        object_key = save_bytes(figure.data, folder="documents", ext=ext)
        review_status, review_reason = _review_state(figure)
        figure_rows.append(
            DocumentFigure(
                document_id=doc.id,
                figure_index=figure.index,
                caption=(figure.caption or "").strip() or None,
                review_status=review_status,
                review_reason=review_reason,
                object_key=object_key,
                mime=figure.mime,
                source=figure.source,
                page=figure.page,
                position=getattr(figure, "position", None),
                section_path=getattr(figure, "section_path", None),
                occurrence_count=max(1, getattr(figure, "occurrence_count", 1)),
                confidence=getattr(figure, "confidence", None),
            )
        )
    await db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == doc.id))
    await db.execute(delete(DocumentFigure).where(DocumentFigure.document_id == doc.id))
    db.add_all(
        [
            DocumentChunk(
                document_id=doc.id,
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
    db.add_all(figure_rows)


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
        await persist_document_index(db, doc, result)
    except Exception as exc:  # noqa: BLE001 - storage succeeded; report parse failure
        await db.rollback()
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
