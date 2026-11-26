"""Shared capture bytes → signal (+ optional document) through the post-ingest pipeline."""
from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.capture.document_path import create_signal_from_document
from app.domains.capture.submission import _is_html
from app.domains.evidence.html_capture import _signal_from_html
from app.models.models import Signal
from app.schemas.schemas import DocumentRawOut


async def ingest_capture_payload(
    db: AsyncSession,
    *,
    data: bytes,
    source_url: str | None,
    filename: str | None,
    mime: str | None,
    channel_code: str | None = None,
    publisher: str | None = None,
    source_label: str | None = None,
    capture_submission_id: uuid.UUID | None = None,
    capture_submission_sha256: str | None = None,
    figure_vision_captions: bool = True,
    document_vision_captions: bool = False,
    on_progress: "ProgressCallback | None" = None,
) -> tuple[Signal, DocumentRawOut | None]:
    """HTML or document bytes through ``create_signal_record`` (stage, tags, theme)."""
    if _is_html(mime=mime, filename=filename):
        url = source_url
        if not url:
            if capture_submission_id is not None:
                url = f"eea://capture/html/{capture_submission_id}"
            else:
                raise HTTPException(422, "HTML 采集缺少来源 URL")
        signal = await _signal_from_html(
            db,
            url=url,
            data=data,
            channel_code=channel_code,
            html_label="file",
            capture_submission_id=capture_submission_id,
            capture_submission_sha256=capture_submission_sha256,
            figure_vision_captions=figure_vision_captions,
        )
        return signal, None

    signal, document_out = await create_signal_from_document(
        db,
        data=data,
        filename=filename,
        mime=mime,
        source_url=source_url,
        publisher=publisher,
        source_label=source_label,
        channel_code=channel_code,
        capture_submission_id=capture_submission_id,
        capture_submission_sha256=capture_submission_sha256,
        vision_captions=document_vision_captions,
        on_progress=on_progress,
    )
    return signal, document_out


async def on_capture_job_signal_created(
    batch_id: uuid.UUID | None,
    job_id: uuid.UUID,
    signal_id: uuid.UUID,
) -> None:
    """Post-capture hooks after a durable job produces a signal (panorama import today)."""
    if batch_id is None:
        return
    from app.services.panorama_import_hooks import on_import_capture_job_succeeded

    await on_import_capture_job_succeeded(batch_id, job_id, signal_id)

