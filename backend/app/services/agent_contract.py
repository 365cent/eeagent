"""Typed BE-14 agent contract (Pydantic AI)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator
from pydantic_ai import DeferredToolRequests
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import OperatorIdentity
from app.services.llm_prompts import DURABLE_AGENT_SYSTEM_INSTRUCTIONS

CitationKind = Literal["signal", "document_chunk", "document_figure"]

AGENT_SYSTEM_INSTRUCTIONS = DURABLE_AGENT_SYSTEM_INSTRUCTIONS

ALLOWED_AGENT_TOOLS = frozenset(
    {
        "search_evidence",
        "search_rag",
        "suggest_signal_tags",
        "suggest_theme_membership",
        "propose_db_patch",
        "apply_confirmed_patch",
        "draft_trace_report",
    }
)


class AgentCitation(BaseModel):
    ref_id: str
    kind: CitationKind
    title: str
    summary: str
    signal_id: uuid.UUID | None = None
    document_id: uuid.UUID | None = None
    chunk_id: int | None = None
    figure_index: int | None = None
    review_status: str | None = None


class CitationLedger:
    def __init__(self) -> None:
        self._items: dict[str, AgentCitation] = {}

    def register(self, citation: AgentCitation) -> AgentCitation:
        self._items[citation.ref_id] = citation
        return citation

    def get(self, ref_id: str) -> AgentCitation | None:
        return self._items.get(ref_id)

    def ref_ids(self) -> set[str]:
        return set(self._items)

    def validate_refs(self, refs: list[str]) -> list[str]:
        invalid: list[str] = []
        for ref in refs:
            if ref not in self._items:
                invalid.append(ref)
                continue
            c = self._items[ref]
            if c.kind == "document_figure" and c.review_status == "needs_review":
                invalid.append(ref)
        return invalid


@dataclass
class AgentDeps:
    db: AsyncSession
    actor: OperatorIdentity
    session_id: uuid.UUID
    project_key: str | None
    page_context: dict[str, Any] | None
    run_id: uuid.UUID | None = None
    ledger: CitationLedger = field(default_factory=CitationLedger)
    approved_patch_ids: set[uuid.UUID] = field(default_factory=set)


class AgentTurn(BaseModel):
    answer: str
    citation_refs: list[str] = Field(default_factory=list)
    patch_ids: list[uuid.UUID] = Field(default_factory=list)
    report_markdown: str | None = None

    @field_validator("citation_refs")
    @classmethod
    def _strip_refs(cls, value: list[str]) -> list[str]:
        return [v.strip() for v in value if v.strip()]


AgentRunOutput = AgentTurn | DeferredToolRequests


class SearchEvidenceRequest(BaseModel):
    keyword: str = Field(min_length=1, max_length=200)
    value_chain_stage: str | None = None
    limit: int = Field(default=10, ge=1, le=50)


class SearchEvidenceHit(BaseModel):
    citation: AgentCitation
    signal_id: uuid.UUID


class SearchEvidenceResult(BaseModel):
    hits: list[SearchEvidenceHit]
    degraded: bool = False
    degraded_reason: str | None = None


class SearchRagRequest(BaseModel):
    keyword: str = Field(min_length=1, max_length=200)
    limit: int = Field(default=8, ge=1, le=30)


class SearchRagHit(BaseModel):
    citation: AgentCitation


class SearchRagResult(BaseModel):
    hits: list[SearchRagHit]
    degraded: bool = False
    degraded_reason: str | None = None


class TagSuggestionToolResult(BaseModel):
    signal_id: uuid.UUID
    value_chain_stage_code: str | None = None
    signal_type_code: str | None = None
    suggested_tags: list[str] = Field(default_factory=list)
    protected_fields: list[str] = Field(default_factory=list)
    citations: list[AgentCitation] = Field(default_factory=list)
    degraded_reason: str | None = None


class ThemeSuggestionToolResult(BaseModel):
    signal_id: uuid.UUID
    candidates: list[dict[str, Any]] = Field(default_factory=list)
    citations: list[AgentCitation] = Field(default_factory=list)
    reason: str | None = None


class PatchFieldChange(BaseModel):
    field_name: Literal[
        "value_chain_stage_code",
        "signal_type_code",
        "tech_tags",
        "tech_theme_id",
    ]
    new_value: Any


class ProposePatchRequest(BaseModel):
    signal_id: uuid.UUID
    changes: list[PatchFieldChange] = Field(min_length=1)
    reason: str = Field(min_length=1, max_length=2000)
    citation_refs: list[str] = Field(min_length=1)


class ProposePatchResult(BaseModel):
    patch_id: uuid.UUID
    signal_id: uuid.UUID
    status: Literal["pending"] = "pending"
    expires_at: datetime


class ApplyPatchRequest(BaseModel):
    patch_id: uuid.UUID


class ApplyPatchResult(BaseModel):
    patch_id: uuid.UUID
    signal_id: uuid.UUID
    status: Literal["applied", "conflict", "rejected", "expired"]
    message: str


class DraftTraceReportRequest(BaseModel):
    signal_id: uuid.UUID


class DraftTraceReportResult(BaseModel):
    markdown: str
    citations: list[AgentCitation]
