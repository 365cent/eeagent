from __future__ import annotations

import hashlib
import mimetypes
import uuid
import re
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
from app.domains.evidence.doc_structure import split_markdown_sections
from app.platform.objectstore import load_bytes, save_bytes, sha256_bytes

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


def document_title(document: Document, canonical: str | None = None) -> str:
    """Human title for a document-derived signal.

    A camera/scan filename is usually a number or a hash and says nothing, so an
    extracted title (MarkItDown heading or the first title lines) wins whenever
    the file name looks arbitrary. A meaningful file name still wins over a
    noisy first paragraph.
    """
    stem = Path(document.filename).stem if document.filename else ""
    extracted = extract_title_from_markdown(canonical) if canonical else ""
    if extracted and _looks_arbitrary(stem):
        return extracted
    return stem or extracted or f"文档 {document.sha256[:8]}"


_TITLE_ORG = re.compile(
    r"(委员会|公司|大学|研究院|研究所|协会|中心|集团|学会|有限|Inc\.|Ltd\.|University|Institute|Consortium)"
)
_TITLE_DATE = re.compile(r"^(\d{4}\s*年?)(\s*\d{1,2}\s*月)?(\s*\d{1,2}\s*日)?$")
_ARBITRARY_STEM = re.compile(r"^[\d\W_]+$|^[0-9a-f]{8,}$")


def _looks_arbitrary(stem: str) -> bool:
    """Scanner names, numeric ids and hashes carry no meaning worth keeping."""
    candidate = stem.strip()
    return not candidate or len(candidate) < 6 or bool(_ARBITRARY_STEM.match(candidate))


def extract_title_from_markdown(markdown: str, max_len: int = 80) -> str:
    """A document's own title: first heading, else its first title-like lines.

    PDF text has no heading markup, so the first paragraph is used while its
    lines stay short and before an organisation or date line appears (the
    pattern of a cover page: title lines, then issuer, then date).
    """
    lines = [line.strip() for line in (markdown or "").splitlines()]
    for line in lines[:40]:
        if line.startswith("#"):
            heading = line.lstrip("#").strip()
            if heading:
                return heading[:max_len]

    parts: list[str] = []
    for line in lines[:30]:
        if not line:
            if parts:
                break
            continue
        if _TITLE_DATE.match(line) or _TITLE_ORG.search(line):
            break
        if len(line) > 60:
            if not parts:
                parts.append(line[:max_len])
            break
        if sum(len(part) for part in parts) + len(line) > max_len:
            break
        parts.append(line)
        if len(parts) >= 3:
            break
    return _join_title_lines(parts)[:max_len]


def _join_title_lines(parts: list[str]) -> str:
    """Join wrapped title lines: no space inside CJK, one space between words."""
    joined = ""
    for part in parts:
        if not joined:
            joined = part
        elif joined[-1].isascii() and part[:1].isascii():
            joined += " " + part
        else:
            joined += part
    return joined.strip()



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
    on_progress: "ProgressCallback | None" = None,
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
            on_progress=on_progress,
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
