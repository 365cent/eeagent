from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.domains.evidence.event_dates import event_date_from_published
from app.domains.evidence.theme_match import match_theme
from app.models.models import Signal, SignalTag
from app.services.judgment import judge_stage
from app.services.llm import suggest_tags_with_llm
from app.platform.objectstore import save_body
from app.services.signal_duplicate import disambiguate_title_for_url
from app.services.signal_sources import ensure_primary_source
from app.services.skills import apply_skill_rules
from app.services.tagging import (
    TAG_FINAL_MAX,
    get_or_create_vocab,
    normalize_url,
    sha256_text,
    suggest_tags,
    suggest_tech_tags,
    text_for_tagging,
)

__all__ = ["create_signal_record"]

logger = logging.getLogger(__name__)

#: One shared budget for the model calls made while a signal is created. Each
#: call has its own request timeout, but the client retries and the pipeline
#: makes two calls (tag suggestion, then the candidate pick), so without this
#: the create request stalls for ~25 s on a flapping gateway. A timeout keeps
#: the deterministic skill/jieba result and leaves the model tags as candidates.
INGEST_TAGGING_BUDGET_SECONDS = 12


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
    tagging_text: str | None = None,
) -> Signal:
    """Shared post-ingest pipeline for capture and document-derived signals.

    ``tagging_text`` lets a document-derived signal be tagged from the converted
    MarkItDown body (captions included) while its stored body stays a summary.
    High-confidence suggestions are applied automatically (``auto_tag_min_confidence``);
    weaker ones are recorded as candidates for human review.
    """
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
    tag_confidence: float | None = None
    candidate_tags: list[str] = []
    source_text = tagging_text or body_text
    if source_text:
        tagging_text_for_tags = text_for_tagging(title, source_text)
        llm_body = tagging_text_for_tags or (source_text or "")[:6000]
        tag_names = list(skill_decision.tech_tags)
        tag_source = "skill" if tag_names else "none"
        try:
            async with asyncio.timeout(INGEST_TAGGING_BUDGET_SECONDS):
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
                auto_tags, auto_source, auto_score = await suggest_tech_tags(title, source_text)
                candidate_tags = list(auto_tags)
                tag_confidence = auto_score
                threshold = float(getattr(get_settings(), "auto_tag_min_confidence", 0.8))
                # Only a confident suggestion is written; the rest wait for a human.
                # Without a rerank service there is no confidence to compare: the
                # jieba pre-tag (REQ-TAG-05) keeps its previous ingest behaviour.
                if auto_score is None or auto_score > threshold:
                    for name in auto_tags:
                        if name not in tag_names and len(tag_names) < TAG_FINAL_MAX:
                            tag_names.append(name)
                    if auto_tags:
                        tag_source = ("skill+" if skill_decision.tech_tags else "") + auto_source
        except TimeoutError:
            logger.warning(
                "入库打标超过 %ss，保留 skill/jieba 结果: %s",
                INGEST_TAGGING_BUDGET_SECONDS,
                title,
            )
            # Never leave a signal without its deterministic tags just because
            # the gateway is slow (REQ-TAG-05).
            if not candidate_tags:
                fallback = suggest_tags(tagging_text_for_tags or source_text, limit=TAG_FINAL_MAX)
                candidate_tags = list(fallback)
                for name in fallback:
                    if name not in tag_names and len(tag_names) < TAG_FINAL_MAX:
                        tag_names.append(name)
                if fallback:
                    tag_source = ("skill+" if skill_decision.tech_tags else "") + "jieba-frequency"
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
    threshold = float(getattr(get_settings(), "auto_tag_min_confidence", 0.8))
    basis["auto_tag"] = {
        "candidates": candidate_tags,
        "confidence": tag_confidence,
        "threshold": threshold,
        "applied": bool(candidate_tags) and (tag_confidence is None or tag_confidence > threshold),
        "reviewed_by_human": False,
    }
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
