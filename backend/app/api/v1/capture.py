"""Unified capture entry (P0-4): ONE input, any source.

`POST /api/v1/capture` (multipart) accepts either a file (HTML snapshot /
docx / pptx / pdf / xlsx / image) or a bare URL the server fetches itself —
the user never picks a "mode". Routing:

- HTML bytes (uploaded html file, or a fetched text/html page)
    → snapshot path: parse + archive + signal (shared with /signals/capture)
- anything else (uploaded document, or a fetched non-HTML file)
    → document path: raw blob + MarkItDown/vision ingest + derived signal

Both paths reuse the existing pipelines verbatim (POST /signals/capture and
POST /documents/raw + POST /signals with document_id); this endpoint only
dispatches, so behavior and dedupe semantics stay identical. The old
endpoints remain for the browser extension and API callers.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.models.models import Document, Signal
from app.schemas.schemas import CaptureResult, DocumentRawOut
from app.services.doc_summary import build_document_body_summary
from app.services.objectstore import load_bytes, save_bytes
from app.services.objectstore import sha256_bytes
from app.services.url_fetch import FetchError, fetch_url

from app.api.v1.documents import _ingest as _ingest_document
from app.api.v1.documents import _raw_out
from app.api.v1.signals import (
    _create_signal_record,
    _document_title,
    _signal_from_html,
    get_signal,
)

router = APIRouter(prefix="/capture", tags=["capture"])

_HTML_SUFFIXES = {".html", ".htm", ".xhtml"}


def _is_html(*, mime: str | None, filename: str | None) -> bool:
    # split off charset parameters ("text/html; charset=utf-8")
    base = (mime or "").split(";")[0].strip().lower()
    if base == "text/html":
        return True
    return bool(filename) and filename.rsplit(".", 1)[-1].lower() in _HTML_SUFFIXES


async def _document_path(
    db: AsyncSession,
    *,
    data: bytes,
    filename: str | None,
    mime: str | None,
    source_url: str | None,
    publisher: str | None = None,
    source_label: str | None = None,
) -> tuple[Signal, DocumentRawOut]:
    """Document bytes → raw blob + ingest + derived signal (mirrors
    POST /documents/raw dedupe + POST /signals document_id path)."""
    if not data:
        raise HTTPException(422, "file 为空：拒绝存储空文档（REQ-SIG-10 证据留存原则）")
    digest = sha256_bytes(data)
    doc = (
        await db.execute(select(Document).where(Document.sha256 == digest))
    ).scalar_one_or_none()
    if doc is None:
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
        await _ingest_document(db, doc, data)
    # derived signal (S1-3): summary body, server-default title/url
    canonical = ""
    if doc.canonical_md_object_key:
        blob = load_bytes(doc.canonical_md_object_key)
        if blob is not None:
            canonical = blob.decode("utf-8", errors="replace")
    body_text = build_document_body_summary(doc.filename or "", canonical)
    url = source_url or f"eea://document/{doc.id}"
    sig = await _create_signal_record(
        db,
        title=_document_title(doc),
        url=url,
        # documents have no host to infer from; the closed vocab only has the two channels
        channel_code="web",
        evidence_status_code="retained" if body_text else "fetching",
        publisher=publisher,
        source_label=source_label,
        excerpt=body_text[:200] if body_text else None,
        body_text=body_text or None,
        document_id=doc.id,
    )
    return sig, _raw_out(doc)


@router.post("", response_model=CaptureResult, status_code=201)
async def capture(
    url: str | None = Form(None),
    file: UploadFile | None = File(None),
    publisher: str | None = Form(None),
    source_label: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """One entry for everything: drop a file OR paste a link.

    - file=HTML (or url + html file, the extension case) → snapshot signal
    - file=document / url pointing at a document → document + derived signal
    - url only → the server fetches it first (static pages work end-to-end;
      JS-rendered pages come back with a clear "use the browser extension" 422)
    """
    data = b""
    if file is not None:
        data = await file.read()
    if not data:
        if not url:
            raise HTTPException(422, "请提供 file 或 url（二选一）")
        try:
            page = await fetch_url(url)
        except FetchError as exc:
            raise HTTPException(422, str(exc)) from exc
        data, filename, mime = page.data, page.filename, page.content_type
        url = page.final_url
        via = "server-fetch"
    else:
        filename = file.filename if file is not None else None
        mime = file.content_type if file is not None else None
        via = "upload"

    if _is_html(mime=mime, filename=filename):
        # html evidence needs a source url; uploaded html without one is its own origin
        source_url = url or f"eea://capture/html/{uuid.uuid4()}"
        sig = await _signal_from_html(
            db, url=source_url, data=data, html_label="file"
        )
        return CaptureResult(
            source="html-snapshot", via=via, signal=await get_signal(sig.id, db)
        )

    sig, doc_out = await _document_path(
        db,
        data=data,
        filename=filename,
        mime=mime,
        source_url=url,
        publisher=publisher,
        source_label=source_label,
    )
    return CaptureResult(
        source="document",
        via=via,
        signal=await get_signal(sig.id, db),
        document=doc_out,
    )
