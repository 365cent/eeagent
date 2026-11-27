"""Document upload and ingest (W2 B4 storage, W4 MarkItDown + vision).

POST /documents/raw stores the bytes verbatim, then (W4) runs MarkItDown and
captions embedded figures with the gateway vision model. The raw blob remains
the evidence; canonical Markdown is an object-store artifact referenced by
`canonical_md_object_key`. A failed parse never fails the upload — the row is
returned with `ingest_status='failed'` and can be retried by
POST /documents/{id}/ingest.
"""
from __future__ import annotations

import asyncio
import logging
import mimetypes
import time
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.identity import OperatorIdentity, get_operator_identity
from app.platform.http_headers import content_disposition
from app.platform.launchdarkly import EVIDENCE_CAPTURE, require_feature, track_workflow_success
from app.db.base import get_db
from app.models.models import Document
from app.models.agent_models import DocumentChunk, DocumentFigure
from app.schemas.schemas import (
    DocumentChunkOut,
    DocumentDetail,
    DocumentFigureOut,
    DocumentKeywordOut,
    DocumentRawOut,
    FigureRecaptionBatchOut,
)
from app.services.agent_rag import ensure_document_index
from app.platform.audit import record_correction
from app.services.figure_recaption import recaption_figure, recaption_pending_figures
from app.platform.objectstore import load_body
from app.services.tagging import suggest_tags, suggest_tech_tags, text_for_tagging
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

logger = logging.getLogger(__name__)

from app.platform.objectstore import load_bytes, sha256_bytes
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



def _figure_out(row: DocumentFigure, document_id: uuid.UUID) -> DocumentFigureOut:
    return DocumentFigureOut(
        figure_index=row.figure_index,
        caption=row.caption,
        review_status=row.review_status,
        review_reason=row.review_reason,
        source=row.source,
        page=row.page,
        position=row.position,
        section_path=row.section_path,
        occurrence_count=row.occurrence_count or 1,
        confidence=row.confidence,
        image_url=(
            f"/api/v1/documents/{document_id}/figures/{row.figure_index}/image"
            if row.object_key
            else None
        ),
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


@router.get("/{document_id}/preview.pdf")
@router.head("/{document_id}/preview.pdf", include_in_schema=False)
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
        # Headers are latin-1: a Chinese filename must travel as RFC 5987.
        "Content-Disposition": content_disposition(filename),
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
    """Re-run MarkItDown + vision for an existing blob (retry or new vision model).

    The vision batch inside an ingest shares one timeout window, so a large PDF
    can come back with figures the model never answered for. Those are finished
    here through the same per-figure path as the 重新识别 button.
    """
    doc = await _load(db, document_id)
    data = load_bytes(doc.object_key)
    if data is None:
        raise HTTPException(
            404, f"raw object {doc.object_key!r} missing from the object store"
        )
    await _ingest(db, doc, data)
    attempted, failed = await recaption_pending_figures(db, document_id)
    if attempted:
        await db.commit()
        logger.info(
            "reingest %s: retried %d pending figure(s), %d still empty",
            document_id,
            len(attempted),
            len(failed),
        )
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
                review_status="needs_review",
                review_reason="旧文档未保存图块位置，请重新解析",
                occurrence_count=1,
            )
            for index in range(1, doc.figure_count + 1)
        ]
    return [_figure_out(row, document_id) for row in rows]


@router.get("/{document_id}/figures/{figure_index}/image")
async def get_document_figure_image(
    document_id: uuid.UUID,
    figure_index: int,
    db: AsyncSession = Depends(get_db),
):
    doc = await _load(db, document_id)
    if figure_index < 1:
        raise HTTPException(404, "figure not found")
    row = (
        await db.execute(
            select(DocumentFigure).where(
                DocumentFigure.document_id == document_id,
                DocumentFigure.figure_index == figure_index,
            )
        )
    ).scalar_one_or_none()
    if row is None or not row.object_key:
        raise HTTPException(404, "figure image not stored; reingest the document")
    payload = load_bytes(row.object_key)
    if payload is None:
        raise HTTPException(404, f"figure object {row.object_key!r} missing from the object store")
    return Response(
        content=payload,
        media_type=row.mime or "application/octet-stream",
        headers={"Cache-Control": "private, max-age=3600"},
    )


@router.post("/{document_id}/figures/recaption", response_model=FigureRecaptionBatchOut)
async def recaption_document_figures(
    document_id: uuid.UUID,
    only_missing: bool = True,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    """Re-run vision for every figure of one document, in order.

    A document parsed while the vision chain was unavailable keeps all of its
    text but marks every figure needs_review; this repairs them in one call
    instead of one request per figure. Failures stay needs_review.
    """
    if actor.role not in {"researcher", "taxonomy_admin", "platform_admin"}:
        raise HTTPException(403, "当前角色不能重试图块识别")

    rows = (
        await db.execute(
            select(DocumentFigure.figure_index, DocumentFigure.review_status)
            .where(DocumentFigure.document_id == document_id)
            .order_by(DocumentFigure.figure_index)
        )
    ).all()
    if not rows:
        raise HTTPException(404, "document has no figures")

    targets = [
        index
        for index, status in rows
        if not only_missing or status != "ready"
    ]
    ready = 0
    failed: list[int] = []
    for figure_index in targets:
        updated = await recaption_figure(db, document_id, figure_index)
        if updated is not None and updated.review_status == "ready":
            ready += 1
        else:
            failed.append(figure_index)

    await record_correction(
        db,
        entity_type="document",
        entity_id=str(document_id),
        field_name="figure_captions",
        old_value=None,
        new_value={"attempted": targets, "ready": ready, "failed": failed},
        actor=actor,
        reason="批量重新识别图块",
    )
    await db.commit()
    return FigureRecaptionBatchOut(
        document_id=document_id,
        attempted=len(targets),
        ready=ready,
        needs_review=len(failed),
        failed_indices=failed,
    )


@router.post("/{document_id}/figures/{figure_index}/recaption", response_model=DocumentFigureOut)
async def recaption_document_figure(
    document_id: uuid.UUID,
    figure_index: int,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    """Retry vision recognition for one figure; the stored image and text stay intact.

    OPS-03: role comes from the server identity, never from the caller payload.
    """
    if actor.role not in {"researcher", "taxonomy_admin", "platform_admin"}:
        raise HTTPException(403, "当前角色不能重试图块识别")
    if figure_index < 1:
        raise HTTPException(404, "figure not found")
    previous = (
        await db.execute(
            select(DocumentFigure.caption).where(
                DocumentFigure.document_id == document_id,
                DocumentFigure.figure_index == figure_index,
            )
        )
    ).scalar_one_or_none()
    row = await recaption_figure(db, document_id, figure_index)
    if row is None:
        raise HTTPException(404, "figure not found")
    await record_correction(
        db,
        entity_type="document_figure",
        entity_id=str(document_id),
        field_name=f"caption:{figure_index}",
        old_value=previous,
        new_value=row.caption,
        actor=actor,
        reason="单图重新识别",
    )
    await db.commit()
    return _figure_out(row, document_id)


@router.get("/{document_id}/chunks", response_model=list[DocumentChunkOut])
async def list_document_chunks(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    doc = await _load(db, document_id)
    await ensure_document_index(db, doc)
    await db.commit()
    rows = (
        await db.execute(
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_id)
        )
    ).scalars().all()
    return rows


_KEYWORD_LLM_TIMEOUT_SECONDS = 12.0
_KEYWORD_CACHE_TTL_SECONDS = 600.0
_keyword_cache: dict[uuid.UUID, tuple[str, float, list[DocumentKeywordOut]]] = {}


@router.get("/{document_id}/keywords", response_model=list[DocumentKeywordOut])
async def list_document_keywords(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    doc = await _load(db, document_id)
    await ensure_document_index(db, doc)
    await db.commit()
    text = ""
    if doc.canonical_md_object_key:
        text = load_body(doc.canonical_md_object_key) or ""
    if not text:
        raise HTTPException(409, "document has no canonical text; ingest or retry first")
    cache_key = doc.canonical_md_object_key or ""
    cached = _keyword_cache.get(document_id)
    if cached and cached[0] == cache_key and time.monotonic() - cached[1] < _KEYWORD_CACHE_TTL_SECONDS:
        return cached[2]
    chunks = (
        await db.execute(
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_id)
        )
    ).scalars().all()
    try:
        tags, source, top_score = await asyncio.wait_for(
            suggest_tech_tags(doc.filename or "", text),
            timeout=_KEYWORD_LLM_TIMEOUT_SECONDS,
        )
    except TimeoutError:
        tags = [tag for tag in suggest_tags(text) if any(ch.isalnum() for ch in tag)]
        source, top_score = "jieba-frequency", None

    def locate(term: str) -> DocumentChunk | None:
        needle = term.lower()
        for chunk in chunks:
            if needle in chunk.text.lower():
                return chunk
        return None

    out: list[DocumentKeywordOut] = []
    for index, name in enumerate(tags):
        chunk = locate(name)
        out.append(
            DocumentKeywordOut(
                term=name,
                score=top_score if index == 0 else None,
                chunk_id=chunk.chunk_id if chunk else None,
                section_path=chunk.section_path if chunk else None,
                heading_level=chunk.heading_level if chunk else None,
                source=source,
            )
        )
    if len(_keyword_cache) >= 64:
        oldest = min(_keyword_cache, key=lambda key: _keyword_cache[key][1])
        _keyword_cache.pop(oldest, None)
    _keyword_cache[document_id] = (cache_key, time.monotonic(), out)
    return out


@router.post("/{document_id}/extract-keywords", response_model=list[DocumentKeywordOut])
async def extract_document_keywords(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Recompute keyword candidates from canonical Markdown (same pipeline as GET keywords)."""
    return await list_document_keywords(document_id, db)
