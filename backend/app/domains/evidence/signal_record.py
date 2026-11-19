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
from app.services.skills import apply_skill_rules
from app.services.tagging import (
    TAG_FINAL_MAX,
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
    if evidence_status_code == "retained" and not (body_text or "").strip():
        raise HTTPException(422, "retained signals require stored body text")
    stage_explicit = value_chain_stage_code
    signal_type_explicit = signal_type_code
    snapshot_for_rules = text_for_tagging(title, body_text)
    skill_decision = apply_skill_rules(title, snapshot_for_rules)
    stage_source = "explicit" if stage_explicit else None
    signal_type_source = "explicit" if signal_type_explicit else None
    if value_chain_stage_code is None:
        if skill_decision.value_chain_stage:
            value_chain_stage_code = skill_decision.value_chain_stage
            stage_source = "skill"
        else:
            value_chain_stage_code = judge_stage(title, snapshot_for_rules)
            stage_source = "keyword" if value_chain_stage_code else "unresolved"
    if signal_type_code is None and skill_decision.signal_type:
        signal_type_code = skill_decision.signal_type
        signal_type_source = "skill"
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
    tag_source = "none"
    if body_text:
        tagging_text = text_for_tagging(title, body_text)
        llm_body = tagging_text or (body_text or "")[:6000]
        llm_suggestion = await suggest_tags_with_llm(title, llm_body)
        if llm_suggestion is not None:
            if (
                stage_explicit is None
                and not skill_decision.value_chain_stage
                and llm_suggestion.value_chain_stage_code
            ):
                sig.value_chain_stage_code = value_chain_stage_code = llm_suggestion.value_chain_stage_code
                stage_source = "llm"
            if (
                signal_type_explicit is None
                and not skill_decision.signal_type
                and llm_suggestion.signal_type_code
            ):
                sig.signal_type_code = signal_type_code = llm_suggestion.signal_type_code
                signal_type_source = "llm"
        tag_names = list(skill_decision.tech_tags)
        tag_source = "skill" if tag_names else "none"
        if document_id is None:
            auto_tags, auto_source, _ = await suggest_tech_tags(title, body_text)
            for name in auto_tags:
                if name not in tag_names and len(tag_names) < TAG_FINAL_MAX:
                    tag_names.append(name)
            if auto_tags:
                tag_source = ("skill+" if skill_decision.tech_tags else "") + auto_source
        for name in tag_names:
            v = await get_or_create_vocab(db, "tech_tag", name)
            db.add(SignalTag(signal_id=sig.id, vocab_id=v.id))
        if document_id is None:
            theme_id, _ = await match_theme(db, set(tag_names))
            if theme_id is not None:
                sig.tech_theme_id = theme_id
    basis = skill_decision.basis()
    basis["sources"] = {
        "value_chain_stage": stage_source or "unresolved",
        "signal_type": signal_type_source or "unresolved",
        "tech_tags": tag_source,
    }
    basis["tag_candidates"] = list(tag_names)
    extra_conflicts: list[dict] = []
    stage_skill_rule = next((item for item in skill_decision.rules_applied if item.get("field") == "value_chain_stage"), None)
    type_skill_rule = next((item for item in skill_decision.rules_applied if item.get("field") == "signal_type"), None)
    if stage_explicit and skill_decision.value_chain_stage and stage_explicit != skill_decision.value_chain_stage:
        extra_conflicts.append({
            "field": "value_chain_stage",
            "kept": stage_explicit,
            "ignored": skill_decision.value_chain_stage,
            "kept_rule": {"source": "explicit input"},
            "ignored_rule": stage_skill_rule,
            "reason": "explicit operator value wins",
        })
    if signal_type_explicit and skill_decision.signal_type and signal_type_explicit != skill_decision.signal_type:
        extra_conflicts.append({
            "field": "signal_type",
            "kept": signal_type_explicit,
            "ignored": skill_decision.signal_type,
            "kept_rule": {"source": "explicit input"},
            "ignored_rule": type_skill_rule,
            "reason": "explicit operator value wins",
        })
    if extra_conflicts:
        basis["conflicts"] = list(skill_decision.conflicts) + extra_conflicts
    sig.classification_basis = basis
    await ensure_primary_source(db, sig)
    await db.commit()
    return sig
