from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.evidence.event_dates import event_date_from_published
from app.domains.evidence.theme_match import match_theme
from app.models.models import Signal, SignalTag
from app.services.judgment import judge_stage
from app.services.llm import suggest_tags_with_llm
from app.services.objectstore import save_body
from app.services.signal_duplicate import disambiguate_title_for_url
from app.services.signal_sources import ensure_primary_source
from app.services.tagging import (
    get_or_create_vocab,
    normalize_url,
    sha256_text,
    suggest_tech_tags,
    text_for_tagging,
)

__all__ = ["create_signal_record"]


async def create_signal_record(
    db: AsyncSession,
    *,
    title: str,
    url: str,
    channel_code: str,
    evidence_status_code: str,
    publisher: str | None = None,
    published_at: datetime | None = None,
    value_chain_stage_code: str | None = None,
    signal_type_code: str | None = None,
    evolution_node_code: str | None = None,
    source_label: str | None = None,
    excerpt: str | None = None,
    body_text: str | None = None,
    snapshot_html_object_key: str | None = None,
    document_id: uuid.UUID | None = None,
    capture_submission_id: uuid.UUID | None = None,
    capture_submission_sha256: str | None = None,
) -> Signal:
    """Shared post-ingest pipeline for capture and document-derived signals."""
    stage_explicit = value_chain_stage_code
    signal_type_explicit = signal_type_code
    snapshot_for_rules = text_for_tagging(title, body_text)
    if value_chain_stage_code is None:
        value_chain_stage_code = judge_stage(title, snapshot_for_rules)
    url_norm = normalize_url(url)
    title, _dup_renamed = await disambiguate_title_for_url(db, title, url_norm)
    event_text, event_precision = event_date_from_published(published_at)
    sig = Signal(
        title=title,
        url=url,
        url_normalized=url_norm,
        channel_code=channel_code,
        publisher=publisher,
        published_at=published_at,
        event_date_text=event_text,
        event_date_precision=event_precision,
        value_chain_stage_code=value_chain_stage_code,
        signal_type_code=signal_type_code,
        evolution_node_code=evolution_node_code,
        evidence_status_code=evidence_status_code,
        source_label=source_label,
        excerpt=excerpt,
        body_object_key=save_body(body_text) if body_text else None,
        body_sha256=sha256_text(body_text) if body_text else None,
        captured_at=func.now() if body_text else None,
        snapshot_html_object_key=snapshot_html_object_key,
        document_id=document_id,
        capture_submission_id=capture_submission_id,
        capture_submission_sha256=capture_submission_sha256,
    )
    try:
        async with db.begin_nested():
            db.add(sig)
            await db.flush()
    except IntegrityError:
        if capture_submission_id is None:
            raise
        existing = (
            await db.execute(
                select(Signal).where(Signal.capture_submission_id == capture_submission_id)
            )
        ).scalar_one_or_none()
        if existing is None:
            raise
        if existing.capture_submission_sha256 != capture_submission_sha256:
            raise HTTPException(409, "submission_id was already used for a different capture")
        return existing
    tag_names: list[str] = []
    if body_text:
        tagging_text = text_for_tagging(title, body_text)
        llm_body = tagging_text or (body_text or "")[:6000]
        llm_suggestion = await suggest_tags_with_llm(title, llm_body)
        if llm_suggestion is not None:
            if stage_explicit is None and llm_suggestion.value_chain_stage_code:
                sig.value_chain_stage_code = value_chain_stage_code = llm_suggestion.value_chain_stage_code
            if signal_type_explicit is None and llm_suggestion.signal_type_code:
                sig.signal_type_code = llm_suggestion.signal_type_code
        if document_id is None:
            tag_names, _, _ = await suggest_tech_tags(title, body_text)
        for name in tag_names:
            v = await get_or_create_vocab(db, "tech_tag", name)
            db.add(SignalTag(signal_id=sig.id, vocab_id=v.id))
        if document_id is None:
            theme_id, _ = await match_theme(db, set(tag_names))
            if theme_id is not None:
                sig.tech_theme_id = theme_id
    await ensure_primary_source(db, sig)
    await db.commit()
    return sig
