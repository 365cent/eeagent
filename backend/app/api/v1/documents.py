"""Document upload and ingest (W2 B4 storage, W4 MarkItDown + vision).

POST /documents/raw stores the bytes verbatim, then (W4) runs MarkItDown and
captions embedded figures with the gateway vision model. The raw blob remains
the evidence; canonical Markdown is an object-store artifact referenced by
`canonical_md_object_key`. A failed parse never fails the upload — the row is
returned with `ingest_status='failed'` and can be retried by
POST /documents/{id}/ingest.
"""
from __future__ import annotations

import mimetypes
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.platform.launchdarkly import EVIDENCE_CAPTURE, require_feature, track_workflow_success
from app.db.base import get_db
from app.models.models import Document
from app.models.agent_models import DocumentFigure
from app.schemas.schemas import DocumentDetail, DocumentFigureOut, DocumentKeywordOut, DocumentRawOut
from app.services.agent_rag import ensure_document_index
from app.services.objectstore import load_body
from app.services.tagging import suggest_tech_tags, text_for_tagging
from app.domains.evidence.document_pipeline import (
    doc_limits,
    document_raw_out,
    get_or_create_document_by_sha256,
    ingest_stored_document,
    mib_label,
)
from app.services.doc_ingest import ingest_document, normalize_document_mime
from app.services.doc_pdf_preview import (
    DocumentPreviewError,
    UnsupportedDocumentPreviewError,
    build_pdf_preview_bytes,
    document_pdf_preview_supported,
)
from starlette.concurrency import run_in_threadpool

from app.services.objectstore import load_bytes, sha256_bytes
from app.services.pptx_deck_preview import (
    PptxDeckPreviewError,
    PptxDeckPreviewUnavailableError,
    build_pptx_deck_preview,
    deck_preview_html_is_legacy,
    deck_preview_index_key,
    deck_preview_prefix,
    inject_deck_preview_base_href,
    pptx_deck_preview_supported,
)

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
    dependencies=[Depends(require_feature(EVIDENCE_CAPTURE))],
)

def _raw_out(doc: Document) -> DocumentRawOut:
    return document_raw_out(doc)


def _detail(doc: Document) -> DocumentDetail:
    return DocumentDetail(
        **_raw_out(doc).model_dump(),
        created_at=doc.created_at,
        ingested_at=doc.ingested_at,
        has_canonical=bool(doc.canonical_md_object_key),
        ingest_error=doc.ingest_error,
    )


async def _ingest(
    db: AsyncSession,
    doc: Document,
    data: bytes,
    *,
    vision_captions: bool = True,
) -> None:
    await ingest_stored_document(db, doc, data, vision_captions=vision_captions)


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
    max_upload, _ = doc_limits()
    data = await file.read(max_upload + 1)
    if not data:
        raise HTTPException(422, "file 为空：拒绝存储空文档（REQ-SIG-10 证据留存原则）")
    if len(data) > max_upload:
        raise HTTPException(
            413,
            f"file 过大：{len(data)} 字节超过上限 {max_upload}（{mib_label(max_upload)}）",
        )
    digest = sha256_bytes(data)
    mime = normalize_document_mime(file.filename, file.content_type) or "application/octet-stream"
    doc = await get_or_create_document_by_sha256(
        db,
        digest=digest,
        data=data,
        filename=file.filename,
        mime=mime,
    )

    if doc.ingest_status != "parsed":
        await _ingest(db, doc, data)
    track_workflow_success(EVIDENCE_CAPTURE)
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


@router.api_route("/{document_id}/preview.pdf", methods=["GET", "HEAD"])
async def get_document_pdf_preview(
    request: Request,
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Inline PDF for evidence viewing. Native PDF is passthrough; Office formats need LibreOffice."""
    doc = await _load(db, document_id)
    if not document_pdf_preview_supported(doc.filename, doc.mime):
        raise HTTPException(415, "该文档类型不支持 PDF 预览")
    data = load_bytes(doc.object_key)
    if data is None:
        raise HTTPException(404, f"raw object {doc.object_key!r} missing from the object store")
    try:
        pdf_bytes = await run_in_threadpool(build_pdf_preview_bytes, data, doc.filename, doc.mime)
    except UnsupportedDocumentPreviewError as exc:
        raise HTTPException(415, str(exc)) from exc
    except DocumentPreviewError as exc:
        raise HTTPException(503, str(exc)) from exc
    filename = (doc.filename or "document").rsplit(".", 1)[0] + ".pdf"
    headers = {
        "Content-Disposition": f'inline; filename="{filename}"',
        "Content-Length": str(len(pdf_bytes)),
    }
    if request.method == "HEAD":
        return Response(status_code=200, media_type="application/pdf", headers=headers)
    return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)


@router.get("/{document_id}/deck-preview")
async def get_document_deck_preview_html(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """deckpeek HTML slide viewer (structure mode); assets under …/deck-preview/{path}."""
    doc = await _load(db, document_id)
    if not pptx_deck_preview_supported(doc.filename, doc.mime):
        raise HTTPException(415, "该文档不是 PPTX，无法使用幻灯片预览")
    data = load_bytes(doc.object_key)
    if data is None:
        raise HTTPException(404, f"raw object {doc.object_key!r} missing from the object store")
    try:
        await run_in_threadpool(build_pptx_deck_preview, data, doc.filename, doc.sha256)
    except PptxDeckPreviewUnavailableError as exc:
        raise HTTPException(503, str(exc)) from exc
    except PptxDeckPreviewError as exc:
        raise HTTPException(500, str(exc)) from exc

    html = load_bytes(deck_preview_index_key(doc.sha256))
    if html and deck_preview_html_is_legacy(html):
        try:
            await run_in_threadpool(
                lambda: build_pptx_deck_preview(data, doc.filename, doc.sha256, force=True)
            )
        except (PptxDeckPreviewUnavailableError, PptxDeckPreviewError):
            pass
        html = load_bytes(deck_preview_index_key(doc.sha256))
    if html is None:
        raise HTTPException(500, "幻灯片预览生成失败（index.html 缺失）")
    base_href = f"/api/v1/documents/{document_id}/deck-preview/"
    body = inject_deck_preview_base_href(html, base_href)
    return Response(
        content=body,
        media_type="text/html; charset=utf-8",
        headers={"Cache-Control": "no-store"},
    )


@router.get("/{document_id}/deck-preview/{asset_path:path}")
async def get_document_deck_preview_asset(
    document_id: uuid.UUID, asset_path: str, db: AsyncSession = Depends(get_db)
):
    doc = await _load(db, document_id)
    if not pptx_deck_preview_supported(doc.filename, doc.mime):
        raise HTTPException(415, "该文档不是 PPTX")
    if ".." in asset_path.split("/"):
        raise HTTPException(400, "invalid asset path")
    key = f"{deck_preview_prefix(doc.sha256)}/{asset_path.lstrip('/')}"
    payload = load_bytes(key)
    if payload is None:
        raise HTTPException(404, f"deck preview asset {asset_path!r} not found")
    media_type, _ = mimetypes.guess_type(asset_path)
    return Response(
        content=payload,
        media_type=media_type or "application/octet-stream",
        headers={"Cache-Control": "private, max-age=3600"},
    )


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


@router.get("/{document_id}/figures", response_model=list[DocumentFigureOut])
async def list_document_figures(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    doc = await _load(db, document_id)
    await ensure_document_index(db, doc)
    await db.commit()
    rows = (
        await db.execute(
            select(DocumentFigure)
            .where(DocumentFigure.document_id == document_id)
            .order_by(DocumentFigure.figure_index)
        )
    ).scalars().all()
    if not rows and doc.figure_count:
        rows = [
            DocumentFigure(
                document_id=document_id,
                figure_index=index,
                caption=None,
                review_status="ready",
            )
            for index in range(1, doc.figure_count + 1)
        ]
    return [
        DocumentFigureOut(
            figure_index=row.figure_index,
            caption=row.caption,
            review_status=row.review_status,
        )
        for row in rows
    ]


@router.get("/{document_id}/keywords", response_model=list[DocumentKeywordOut])
async def list_document_keywords(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    doc = await _load(db, document_id)
    await ensure_document_index(db, doc)
    text = ""
    if doc.canonical_md_object_key:
        text = load_body(doc.canonical_md_object_key) or ""
    if not text:
        raise HTTPException(409, "document has no canonical text; ingest or retry first")
    tags, source, top_score = await suggest_tech_tags(doc.filename or "", text)
    return [
        DocumentKeywordOut(
            term=name,
            score=top_score if index == 0 else None,
            chunk_id=None,
            source=source,
        )
        for index, name in enumerate(tags)
    ]


@router.post("/{document_id}/extract-keywords", response_model=list[DocumentKeywordOut])
async def extract_document_keywords(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Recompute keyword candidates from canonical Markdown (same pipeline as GET keywords)."""
    return await list_document_keywords(document_id, db)
