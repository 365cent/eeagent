"""Document upload and ingest (W2 B4 storage, W4 MarkItDown + vision).

POST /documents/raw stores the bytes verbatim, then (W4) runs MarkItDown and
captions embedded figures with the gateway vision model. The raw blob remains
the evidence; canonical Markdown is an object-store artifact referenced by
`canonical_md_object_key`. A failed parse never fails the upload — the row is
returned with `ingest_status='failed'` and can be retried by
POST /documents/{id}/ingest.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.base import get_db
from app.models.models import Document
from app.schemas.schemas import DocumentDetail, DocumentRawOut
from app.services.doc_ingest import ingest_document
from app.services.objectstore import load_bytes, save_bytes, sha256_bytes

router = APIRouter(prefix="/documents", tags=["documents"])

EXCERPT_CHARS = 600


def _doc_limits() -> tuple[int, int]:
    """(max raw upload bytes, max MarkItDown parse bytes)."""
    s = get_settings()
    return s.doc_raw_upload_max_bytes, s.doc_ingest_max_bytes


def _mib_label(byte_count: int) -> str:
    mib = byte_count / (1024 * 1024)
    return f"{mib:.0f} MiB" if mib == int(mib) else f"{mib:.1f} MiB"


def _excerpt(doc: Document) -> str | None:
    if not doc.canonical_md_object_key:
        return None
    data = load_bytes(doc.canonical_md_object_key)
    if data is None:
        return None
    return data.decode("utf-8", errors="replace")[:EXCERPT_CHARS]


def _raw_out(doc: Document) -> DocumentRawOut:
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
        canonical_md_excerpt=_excerpt(doc),
    )


def _detail(doc: Document) -> DocumentDetail:
    return DocumentDetail(
        **_raw_out(doc).model_dump(),
        created_at=doc.created_at,
        ingested_at=doc.ingested_at,
        has_canonical=bool(doc.canonical_md_object_key),
        ingest_error=doc.ingest_error,
    )


async def _ingest(db: AsyncSession, doc: Document, data: bytes) -> None:
    _, max_parse = _doc_limits()
    if len(data) > max_parse:
        doc.ingest_status = "skipped"
        doc.ingest_error = (
            f"文件 {len(data)} 字节超过解析上限 {max_parse}（{_mib_label(max_parse)}），仅保留原始 blob"
        )
        doc.ingested_at = func.now()
        await db.commit()
        await db.refresh(doc)
        return
    try:
        result = await ingest_document(data, doc.filename, doc.mime)
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


async def _load(db: AsyncSession, document_id: uuid.UUID) -> Document:
    doc = (
        await db.execute(select(Document).where(Document.id == document_id))
    ).scalar_one_or_none()
    if doc is None:
        raise HTTPException(404, "document not found")
    return doc


@router.post("/raw", response_model=DocumentRawOut, status_code=201)
async def upload_raw_document(
    file: UploadFile = File(...), db: AsyncSession = Depends(get_db)
):
    """Store the blob, then ingest it into canonical Markdown (W4).

    Duplicate bytes return the existing row (same id, same canonical artifact);
    an earlier failed/skipped ingest is retried on the next upload.
    """
    max_upload, _ = _doc_limits()
    data = await file.read(max_upload + 1)
    if not data:
        raise HTTPException(422, "file 为空：拒绝存储空文档（REQ-SIG-10 证据留存原则）")
    if len(data) > max_upload:
        raise HTTPException(
            413,
            f"file 过大：{len(data)} 字节超过上限 {max_upload}（{_mib_label(max_upload)}）",
        )
    digest = sha256_bytes(data)
    existing = (
        await db.execute(select(Document).where(Document.sha256 == digest))
    ).scalar_one_or_none()
    if existing is not None:
        doc = existing
    else:
        object_key = save_bytes(data, folder="documents", ext="bin")
        stmt = (
            pg_insert(Document)
            .values(
                sha256=digest,
                mime=file.content_type or "application/octet-stream",
                size=len(data),
                filename=file.filename,
                object_key=object_key,
                uploaded_by="local-admin",
            )
            .on_conflict_do_nothing(index_elements=["sha256"])
            .returning(Document)
        )
        inserted = (await db.execute(stmt)).scalar_one_or_none()
        if inserted is None:
            await db.rollback()
            doc = (
                await db.execute(select(Document).where(Document.sha256 == digest))
            ).scalar_one()
        else:
            await db.commit()
            await db.refresh(inserted)
            doc = inserted

    if doc.ingest_status != "parsed":
        await _ingest(db, doc, data)
    return _raw_out(doc)


@router.get("/{document_id}", response_model=DocumentDetail)
async def get_document(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Ingest metadata + a short canonical-Markdown excerpt (full text via .md)."""
    return _detail(await _load(db, document_id))


@router.get("/{document_id}/canonical.md")
async def get_canonical_markdown(
    document_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    doc = await _load(db, document_id)
    if not doc.canonical_md_object_key:
        raise HTTPException(404, "no canonical markdown stored for this document")
    data = load_bytes(doc.canonical_md_object_key)
    if data is None:
        raise HTTPException(
            404, f"canonical object {doc.canonical_md_object_key!r} missing from the object store"
        )
    return Response(content=data, media_type="text/markdown; charset=utf-8")


@router.post("/{document_id}/ingest", response_model=DocumentDetail)
async def reingest_document(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Re-run MarkItDown + vision for an existing blob (retry or new vision model)."""
    doc = await _load(db, document_id)
    data = load_bytes(doc.object_key)
    if data is None:
        raise HTTPException(
            404, f"raw object {doc.object_key!r} missing from the object store"
        )
    await _ingest(db, doc, data)
    return _detail(doc)
