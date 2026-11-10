"""Citation ref builders and validation."""

from __future__ import annotations

import uuid

from app.services.agent_contract import AgentCitation, CitationLedger


def signal_ref_id(signal_id: uuid.UUID) -> str:
    return f"sig:{signal_id}"


def chunk_ref_id(document_id: uuid.UUID, chunk_id: int) -> str:
    return f"doc:{document_id}:{chunk_id}"


def figure_ref_id(document_id: uuid.UUID, figure_index: int) -> str:
    return f"fig:{document_id}:{figure_index}"


def make_signal_citation(*, signal_id: uuid.UUID, title: str, summary: str) -> AgentCitation:
    return AgentCitation(
        ref_id=signal_ref_id(signal_id),
        kind="signal",
        title=title,
        summary=summary,
        signal_id=signal_id,
    )


def make_chunk_citation(
    *, document_id: uuid.UUID, chunk_id: int, title: str, summary: str
) -> AgentCitation:
    return AgentCitation(
        ref_id=chunk_ref_id(document_id, chunk_id),
        kind="document_chunk",
        title=title,
        summary=summary,
        document_id=document_id,
        chunk_id=chunk_id,
    )


def make_figure_citation(
    *,
    document_id: uuid.UUID,
    figure_index: int,
    title: str,
    summary: str,
    review_status: str,
) -> AgentCitation:
    return AgentCitation(
        ref_id=figure_ref_id(document_id, figure_index),
        kind="document_figure",
        title=title,
        summary=summary,
        document_id=document_id,
        figure_index=figure_index,
        review_status=review_status,
    )


def assert_citations_usable(ledger: CitationLedger, refs: list[str]) -> None:
    invalid = ledger.validate_refs(refs)
    if invalid:
        joined = ", ".join(invalid)
        raise ValueError(f"无效或不可引用的 citation ref: {joined}")
