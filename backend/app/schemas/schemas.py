import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, computed_field, field_serializer, field_validator

from app.domains.vocab.refcodes import codes, normalize

Phase = Literal["设计", "制造", "运营"]
ConstraintType = Literal["工程化", "经济性", "安全合规"]
Classification = Literal["前瞻布局", "短期可落地", "产业投资/生态合作"]

_REF_CODE_FIELDS = (
    "channel_code",
    "value_chain_stage_code",
    "signal_type_code",
    "evolution_node_code",
    "evidence_status_code",
)


class RefCodeValidated(BaseModel):
    """CONV-CLOSED-VOCAB: *_code fields must belong to their closed eea_ref_code
    domain. Codes, labels and fixture aliases are accepted on input and normalized
    to the canonical code; unknown values are rejected (422) instead of being
    stored as new domain values (docs/platform-implementation-plan.md:584).
    """

    @field_validator(*_REF_CODE_FIELDS, check_fields=False)
    @classmethod
    def _normalize_ref_code(cls, v: str | None, info: ValidationInfo) -> str | None:
        if v is None:
            return None
        domain = (info.field_name or "").removesuffix("_code")
        code = normalize(domain, v)
        if code is None:
            raise ValueError(
                f"{info.field_name}={v!r} 不在封闭词表 '{domain}' 内（CONV-CLOSED-VOCAB），"
                f"可选值: {', '.join(codes(domain))}"
            )
        return code


class RefCodeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    domain: str
    code: str
    label: str
    fixture_alias: str | None = None


class VocabOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    kind: str
    name: str
    created_at: datetime


class VocabCreate(BaseModel):
    kind: Literal["tech_tag", "domain", "recommendation_level", "target_domain"]
    name: str = Field(min_length=1, max_length=200)

    @field_validator("name")
    @classmethod
    def _nonblank_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("词表名称不能为空")
        return value


class VocabUsageOut(BaseModel):
    """GET /vocab/usage row: a vocab with its signal frequency (图2-3 左侧).
    Typed response model so /openapi.json (and the docs generated from it)
    documents the shape instead of an untyped object list."""

    id: uuid.UUID
    kind: str
    name: str
    frequency: int


class ThemeCreate(RefCodeValidated):
    working_name: str
    value_chain_stage_code: str | None = None


class ThemeUpdate(RefCodeValidated):
    working_name: str | None = None
    value_chain_stage_code: str | None = None


class ThemeNameSuggestionIn(BaseModel):
    """Selected signals for a working-name suggestion. Nothing is written."""

    signal_ids: list[uuid.UUID] = Field(min_length=1, max_length=24)


class ThemeNameSuggestionOut(BaseModel):
    working_name: str
    value_chain_stage_code: str | None = None
    source: Literal["llm", "fallback"]


class ThemeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    working_name: str
    value_chain_stage_code: str | None
    created_at: datetime


class ThemeMetrics(BaseModel):
    theme_id: uuid.UUID
    signal_frequency: int
    source_count: int


class ThemeDetail(ThemeOut):
    metrics: ThemeMetrics | None = None
    display_tags: list[str] = []


class TagDistributionItem(BaseModel):
    """A technical-direction tag's support inside a sample or a proposed cluster."""

    tag: str
    support: int
    cluster_share: float
    corpus_share: float
    lift: float


class ClusterMemberOut(BaseModel):
    signal_id: uuid.UUID
    title: str
    tags: list[str]
    value_chain_stage_code: str | None
    updated_at: datetime
    source_host: str
    assigned: bool = False
    url: str = ""


class ThemeClusterProposal(BaseModel):
    """One agglomerative tag family. Confirmation still creates or moves the theme."""

    key: str
    members: list[ClusterMemberOut]
    shared_tags: list[str]
    tag_distribution: list[TagDistributionItem]
    cohesion: float
    signal_count: int
    source_count: int
    value_chain_stage_code: str | None


class SignalNeighborOut(BaseModel):
    signal_id: uuid.UUID
    title: str
    tags: list[str]
    similarity: float
    shared_tags: list[str]
    value_chain_stage_code: str | None
    updated_at: datetime
    source_host: str
    assigned: bool = False
    url: str = ""


class ThemeClusterMapRegion(BaseModel):
    """Bounding ellipse for one cluster on the map canvas (canvas units, not pixels)."""

    cluster_key: str
    index: int
    label: str
    cx: float
    cy: float
    rx: float
    ry: float
    count: int


class ThemeClusterTagPoint(BaseModel):
    """A tag placed on the map canvas by the backend (no client-side layout).

    ``weight`` is 0..1 core-to-edge density: 1 at the cluster centre, lower toward
    the rim. The renderer maps it to marker radius like a bubble plot.
    ``assigned`` is false for noise: tags that did not join any proposed cluster.
    """

    tag: str
    support: int
    cluster_key: str | None = None
    cluster_index: int | None = None
    x: float
    y: float
    weight: float = 0.5
    assigned: bool = False


class ThemeClusterMap(BaseModel):
    """Ready-to-render 2-D map: canvas size, cluster regions and placed tags."""

    width: float
    height: float
    aspect: float
    points: list[ThemeClusterTagPoint]
    regions: list[ThemeClusterMapRegion]


class ThemeClusterReport(BaseModel):
    """Live-tag clustering report. Groups are suggestions; the client confirms before writing."""

    method: str
    metric: str
    linkage: str
    distance_threshold: float
    sample_size: int
    unassigned_count: int
    truncated: bool
    silhouette: float | None
    tag_distribution: list[TagDistributionItem]
    clusters: list[ThemeClusterProposal]
    neighbors: dict[str, list[SignalNeighborOut]]
    tag_map: ThemeClusterMap | None = None


class SignalCreate(RefCodeValidated):
    """Create a signal. Web capture / paste path: ``title`` + ``url`` required.

    S1-3 document path: pass ``document_id`` instead — ``title`` defaults to
    the document's filename stem, ``url`` to ``eea://document/{id}`` and the
    body to a server-built summary (filename + slide titles + notes), never
    the full canonical Markdown.
    """

    title: str | None = None
    url: str | None = None
    document_id: uuid.UUID | None = None
    channel_code: str
    publisher: str | None = None
    published_at: datetime | None = None
    value_chain_stage_code: str | None = None
    signal_type_code: str | None = None
    evolution_node_code: str | None = None
    evidence_status_code: str = "fetching"
    source_label: str | None = None
    excerpt: str | None = None
    body_text: str | None = None  # REQ-SIG-11 pasted-body fallback


class SignalSourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    url: str
    url_normalized: str
    is_primary: bool
    provenance: str | None


class SignalSourceCreate(BaseModel):
    url: str = Field(min_length=1)
    provenance: str | None = None


class SignalUpdate(RefCodeValidated):
    title: str | None = None
    value_chain_stage_code: str | None = None
    signal_type_code: str | None = None
    evolution_node_code: str | None = None
    evidence_status_code: str | None = None
    publisher: str | None = None
    source_label: str | None = None
    excerpt: str | None = None
    body_text: str | None = None
    expected_updated_at: datetime | None = None


class SignalBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    url: str
    url_normalized: str
    channel_code: str
    publisher: str | None
    published_at: datetime | None
    event_date_text: str | None = None
    event_date_precision: str | None = None
    value_chain_stage_code: str | None
    signal_type_code: str | None
    evolution_node_code: str | None
    evidence_status_code: str
    classification_basis: dict | None = None
    tech_theme_id: uuid.UUID | None
    document_id: uuid.UUID | None
    source_label: str | None
    excerpt: str | None
    captured_at: datetime | None
    created_at: datetime
    updated_at: datetime

    @field_serializer("published_at", "captured_at", when_used="json")
    def _serialize_event_times(self, value: datetime | None) -> str | None:
        if value is None:
            return None
        from zoneinfo import ZoneInfo

        tz_cn = ZoneInfo("Asia/Shanghai")
        if value.tzinfo is None:
            value = value.replace(tzinfo=tz_cn)
        return value.astimezone(tz_cn).isoformat()


class SignalOut(SignalBase):
    tags: list[str] = []  # populated manually from the tag relationship
    url_duplicate_renamed: bool = Field(
        False,
        description="Title was auto-suffixed because this url_normalized was already retained",
    )


class LinkedDemandPointOut(BaseModel):
    """A demand point this signal's theme feeds (evidence 来源栏「关联需求」)."""

    id: uuid.UUID
    name: str
    value_chain_stage_code: str
    review_status: str | None
    source_tech_theme_id: uuid.UUID | None


class SignalDetail(SignalOut):
    body_object_key: str | None = None
    body_sha256: str | None = None
    # SingleFile HTML archive reference (B2/B7): the frontend drawer links to
    # GET /api/v1/signals/{id}/archive when this is set
    snapshot_html_object_key: str | None = None
    theme: ThemeOut | None = None
    # demand points sourced from this signal's theme; [] when unlinked (S1-3)
    linked_demand_points: list[LinkedDemandPointOut] = []


class DuplicateMemberOut(BaseModel):
    """One copy inside a redundant group."""

    id: uuid.UUID
    title: str
    url: str
    evidence_status_code: str
    publisher: str | None = None
    created_at: datetime
    tags: list[str] = []
    tech_theme_id: uuid.UUID | None = None
    has_archive: bool = False
    has_body: bool = False
    keep: bool = False
    identical_to_keep: bool = False


class DuplicateGroupOut(BaseModel):
    key: str
    # url_suspect: same url_normalized, titles marked (重复采集 #n), raw URL keys
    # differ (an unknown tracking parameter); never identical, a human decides.
    kind: Literal["url", "body", "url_suspect"]
    identical: bool
    different_fields: list[str] = []
    field_labels: dict[str, str] = {}
    values: dict[str, dict[str, Any]] = {}
    members: list[DuplicateMemberOut]


class DuplicateScanOut(BaseModel):
    """Redundant-signal scan; nothing here mutates data."""

    groups: list[DuplicateGroupOut]
    total_signals: int
    redundant_signals: int
    identical_groups: int
    different_groups: int


class DuplicateCleanupIn(BaseModel):
    delete_ids: list[uuid.UUID] = Field(min_length=1, max_length=500)
    reason: str | None = Field(default=None, max_length=500)


class DuplicateCleanupSkipOut(BaseModel):
    id: uuid.UUID
    reason: str


class DuplicateCleanupOut(BaseModel):
    deleted: list[uuid.UUID]
    skipped: list[DuplicateCleanupSkipOut]
    remaining_groups: int


class SignalFigureOut(BaseModel):
    """Inlined content image from the stored HTML archive (index matches `> 图 N：` in body_md)."""

    index: int
    mime: str
    src: str



class SignalRecaptionOut(BaseModel):
    """Figure captions regenerated for one whole signal article."""

    figures: int
    captioned: int
    failed: int


class DocumentRawOut(BaseModel):
    """Upload result: raw blob handle plus W4 ingest summary."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sha256: str
    mime: str
    size: int
    filename: str | None = None
    ingest_status: str = "stored"
    markitdown_version: str | None = None
    vision_model: str | None = None
    figure_count: int = 0
    canonical_md_excerpt: str | None = None


class AccessVisitIn(BaseModel):
    page: str | None = Field(default=None, max_length=200)


class AccessLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    ip: str
    ua_browser: str
    ua_os: str
    page: str | None = None
    created_at: datetime


class SessionOut(BaseModel):
    ip: str
    ua_browser: str
    ua_os: str
    visits: int
    first_seen: datetime | None = None
    last_seen: datetime | None = None


class DocumentDetail(DocumentRawOut):
    created_at: datetime
    ingested_at: datetime | None = None
    has_canonical: bool = False
    ingest_error: str | None = None


class DocumentFigureOut(BaseModel):
    figure_index: int
    caption: str | None = None
    review_status: str
    review_reason: str | None = None
    source: str | None = None
    page: int | None = None
    position: int | None = None
    section_path: list[str] | None = None
    occurrence_count: int = 1
    confidence: float | None = None
    image_url: str | None = None


class FigureRecaptionBatchOut(BaseModel):
    """Result of re-running vision for every figure of one document."""

    document_id: uuid.UUID
    attempted: int
    ready: int
    needs_review: int
    failed_indices: list[int] = []


class DocumentChunkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    chunk_id: int
    section_path: list[str] | None = None
    heading_level: int | None = None
    text: str
    char_start: int | None = None
    char_end: int | None = None
    figure_indices: list[int] | None = None
    content_sha256: str


class DocumentKeywordOut(BaseModel):
    term: str
    score: float | None = None
    chunk_id: int | None = None
    section_path: list[str] | None = None
    heading_level: int | None = None
    source: str = "heuristic"


class AssistantChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=8000)


class SignalAssistantMessageIn(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    history: list[AssistantChatTurn] = Field(default_factory=list, max_length=24)


class SignalAssistantMessageOut(BaseModel):
    signal_id: uuid.UUID
    reply: str
    model: str | None = None


class DemandDraftProposeIn(BaseModel):
    source_tech_theme_id: uuid.UUID
    user_hint: str | None = Field(default=None, max_length=4000)
    use_llm: bool = False
    selected_signal_ids: list[uuid.UUID] = Field(default_factory=list, max_length=50)


class DemandAssistantMessageIn(BaseModel):
    source_tech_theme_id: uuid.UUID
    message: str = Field(min_length=1, max_length=8000)
    history: list[AssistantChatTurn] = Field(default_factory=list, max_length=24)
    selected_signal_ids: list[uuid.UUID] = Field(default_factory=list, max_length=50)


class DemandDraftProposalOut(BaseModel):
    name: str
    value_chain_stage_code: str
    source_tech_theme_id: uuid.UUID
    derivation_trace: dict | None = None
    cross_validation: dict | None = None
    time_series: list | None = None
    source: str | None = None
    llm_note: str | None = None


class DemandAssistantMessageOut(BaseModel):
    reply: str
    model: str | None = None
    draft: DemandDraftProposalOut | None = None


SignalStudioKind = Literal["audio", "mindmap", "report", "infographic"]


class SignalStudioIn(BaseModel):
    """证据工作室生成请求（POST /signals/{id}/studio）。

    Contract is shared with frontend `fetchSignalStudio` (lib/api/eea-api.ts):
    report → text/markdown, the other kinds → JSON in the shapes below.
    """

    kind: SignalStudioKind
    regenerate: bool = False


class StudioAudioSegment(BaseModel):
    text: str
    quote: str


class StudioAudioPayload(BaseModel):
    segments: list[StudioAudioSegment]


class StudioMindmapNode(BaseModel):
    label: str
    children: list["StudioMindmapNode"] = Field(default_factory=list)


class StudioMindmapPayload(BaseModel):
    title: str
    children: list[StudioMindmapNode] = Field(default_factory=list)


class StudioInfographicStat(BaseModel):
    label: str
    value: str


class StudioInfographicPoint(BaseModel):
    title: str
    body: str


class StudioInfographicPayload(BaseModel):
    headline: str
    stats: list[StudioInfographicStat] = Field(default_factory=list)
    points: list[StudioInfographicPoint] = Field(default_factory=list)


class SignalStudioBundleOut(BaseModel):
    """Saved studio outputs for a signal (subset of kinds may be present)."""

    audio: StudioAudioPayload | None = None
    mindmap: StudioMindmapPayload | None = None
    report: str | None = None
    infographic: StudioInfographicPayload | None = None


class LlmSpeedOut(BaseModel):
    """One measured chat model, no prompts and no secrets."""

    model: str
    tps: float = 0.0
    samples: int = 0
    failures: int = 0
    age_s: float | None = None
    unavailable: bool = False


class LlmStatusOut(BaseModel):
    configured: bool
    model: str | None = None
    attempt_budget: int | None = None
    hedge_delay_seconds: float | None = None
    hedge_max_models: int | None = None
    speeds: list[LlmSpeedOut] = []


class TagAssignment(BaseModel):
    tag_names: list[str]
    expected_updated_at: datetime | None = None


class ThemeAssignment(BaseModel):
    tech_theme_id: uuid.UUID | None  # None = 移出归集
    expected_updated_at: datetime | None = None


class ThemeAggregateCandidate(BaseModel):
    theme_id: uuid.UUID
    working_name: str
    overlap: int


class ThemeAggregatePreview(BaseModel):
    candidates: list[ThemeAggregateCandidate]
    recommended_theme_id: uuid.UUID | None = None
    can_auto_assign: bool
    reason: str
    structured_basis: dict[str, str | None] | None = None
    basis_reason: str | None = None


class DemandCreate(RefCodeValidated):
    name: str
    source_tech_theme_id: uuid.UUID | None = None
    value_chain_stage_code: str
    derivation_trace: dict | None = None
    cross_validation: dict | None = None
    time_series: list | None = None
    review_status: Literal["pending", "confirmed"] | None = None
    low_freq_strong_signal: bool = False
    low_freq_strong_signal_reason: str | None = None


class DemandUpdate(RefCodeValidated):
    name: str | None = None
    value_chain_stage_code: str | None = None
    derivation_trace: dict | None = None
    cross_validation: dict | None = None
    time_series: list | None = None
    review_status: Literal["pending", "confirmed"] | None = None
    low_freq_strong_signal: bool | None = None
    low_freq_strong_signal_reason: str | None = None


class DemandOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    source_tech_theme_id: uuid.UUID | None
    value_chain_stage_code: str
    derivation_trace: dict | None
    cross_validation: dict | None
    time_series: list | None
    review_status: str | None
    created_at: datetime
    low_freq_strong_signal: bool
    low_freq_strong_signal_reason: str | None
    function_count: int = 0
    signal_frequency: int = 0
    source_count: int = 0


class FunctionCreate(RefCodeValidated):
    demand_point_id: uuid.UUID
    name: str
    value_chain_stage_code: str | None = None
    forward_trace: dict | None = None
    reverse_trace: dict | None = None
    recommendation_level: str | None = None
    automation_levels: list[Literal["L0", "L1", "L2", "L3", "L4", "L5"]] | None = None
    target_domain: str | None = None
    recommendation_reason: str | None = None
    l2_l4_difference: str | None = None


class FunctionUpdate(RefCodeValidated):
    expected_updated_at: datetime | None = None
    name: str | None = None
    value_chain_stage_code: str | None = None
    forward_trace: dict | None = None
    reverse_trace: dict | None = None
    recommendation_level: str | None = None
    automation_levels: list[Literal["L0", "L1", "L2", "L3", "L4", "L5"]] | None = None
    target_domain: str | None = None
    recommendation_reason: str | None = None
    l2_l4_difference: str | None = None
    published: bool | None = None


class FunctionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    demand_point_id: uuid.UUID
    name: str
    value_chain_stage_code: str | None
    forward_trace: dict | None
    reverse_trace: dict | None
    recommendation_level: str | None
    automation_levels: list[str] | None
    target_domain: str | None
    recommendation_reason: str | None
    l2_l4_difference: str | None
    published: bool
    created_at: datetime


class LandingPointCreate(BaseModel):
    vehicle_function_id: uuid.UUID
    domain: str  # vocab name; created on the fly (REQ-TECH-02)
    name: str
    role_description: str | None = None


class LandingPointUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    domain: str | None = Field(default=None, min_length=1)
    role_description: str | None = None


class LandingPointOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    vehicle_function_id: uuid.UUID
    domain_vocab_id: uuid.UUID
    name: str
    role_description: str | None
    created_at: datetime
    domain_name: str = ""
    standard_count: int = 0


class StandardUpsert(BaseModel):
    phase: Phase
    constraint_type: ConstraintType
    requirement_text: str | None = Field(...)


class StandardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    tech_landing_point_id: uuid.UUID
    phase: str
    constraint_type: str
    requirement_text: str | None


class StandardGrid(BaseModel):
    cells: list[StandardOut]
    # Only persisted cells are returned. Missing = not filled; a persisted row
    # with requirement_text=None = explicitly reviewed as having no content.


class AssessmentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    funnel_step: int = Field(strict=True, ge=1, le=4)
    score_business: int = Field(strict=True, ge=1, le=5)
    score_maturity: int = Field(strict=True, ge=1, le=5)
    score_moat: int = Field(strict=True, ge=1, le=5)
    score_supply_chain: int = Field(strict=True, ge=1, le=5)
    score_feasibility: int = Field(strict=True, ge=1, le=5)
    classification: Classification
    strategy_note: str | None = None


class AssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    tech_landing_point_id: uuid.UUID
    version: int
    funnel_step: int
    score_business: int
    score_maturity: int
    score_moat: int
    score_supply_chain: int
    score_feasibility: int
    score_total: int
    classification: str
    strategy_note: str | None
    score_rationales: dict[str, str] | None = None
    funnel_snapshot: dict | None = None
    operator_subject: str | None
    assessed_at: datetime
    is_current: bool


class StrategyScoreDraft(BaseModel):
    score: int | None
    rationale: str | None


class StrategyScoreDrafts(BaseModel):
    business: StrategyScoreDraft
    maturity: StrategyScoreDraft
    moat: StrategyScoreDraft
    supply_chain: StrategyScoreDraft
    feasibility: StrategyScoreDraft


class StrategyFunnelPatch(BaseModel):
    """One-stage-at-a-time edits to the strategic funnel work record."""

    model_config = ConfigDict(extra="forbid")

    scan_scope: str | None = None
    scan_sources: list[str] | None = None
    tier1_current_business_relation: str | None = None
    tier1_future_business_relation: str | None = None
    valuable_role: str | None = None
    adaptation_decision: Literal["pass", "reject"] | None = None
    adaptation_reason: str | None = None
    score_business: int | None = Field(default=None, strict=True, ge=1, le=5)
    rationale_business: str | None = None
    score_maturity: int | None = Field(default=None, strict=True, ge=1, le=5)
    rationale_maturity: str | None = None
    score_moat: int | None = Field(default=None, strict=True, ge=1, le=5)
    rationale_moat: str | None = None
    score_supply_chain: int | None = Field(default=None, strict=True, ge=1, le=5)
    rationale_supply_chain: str | None = None
    score_feasibility: int | None = Field(default=None, strict=True, ge=1, le=5)
    rationale_feasibility: str | None = None
    classification: Classification | None = None
    strategy_note: str | None = None
    finalize: bool = Field(default=False, strict=True)

    @field_validator(
        "scan_scope",
        "tier1_current_business_relation",
        "tier1_future_business_relation",
        "valuable_role",
        "adaptation_reason",
        "rationale_business",
        "rationale_maturity",
        "rationale_moat",
        "rationale_supply_chain",
        "rationale_feasibility",
        "strategy_note",
        mode="before",
    )
    @classmethod
    def _strip_optional_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("scan_sources")
    @classmethod
    def _strip_sources(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        return [source.strip() for source in value]


class StrategyFunnelOut(BaseModel):
    tech_landing_point_id: uuid.UUID
    current_step: Literal[
        "pool_entry_blocked",
        "industry_scan",
        "tier1_adaptation",
        "scoring",
        "classification",
        "ready_to_finalize",
        "rejected",
        "complete",
    ]
    pool_eligible: bool
    deployment_boundary_evidence_ids: list[uuid.UUID]
    scan_scope: str | None
    scan_sources: list[str]
    tier1_current_business_relation: str | None
    tier1_future_business_relation: str | None
    valuable_role: str | None
    adaptation_decision: Literal["pass", "reject"] | None
    adaptation_reason: str | None
    score_drafts: StrategyScoreDrafts
    score_total: int | None
    classification: Classification | None
    strategy_note: str | None
    finalized_assessment_id: uuid.UUID | None
    finalized_at: datetime | None
    updated_by: str | None
    updated_at: datetime | None
    latest_assessment: AssessmentOut | None


class AuditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    field_name: str
    machine_value: dict | list | str | int | float | bool | None
    human_value: dict | list | str | int | float | bool | None
    old_value: dict | list | str | int | float | bool | None = None
    new_value: dict | list | str | int | float | bool | None = None
    operator_subject: str
    operator_role: str
    corrected_at: datetime
    reason: str | None = None
    model_version: str | None = None
    rule_version: str | None = None
    skill_version: str | None = None
    score_source: str | None = None


class TagCandidateDetail(BaseModel):
    name: str
    frequency: int | None = None
    rerank_score: float | None = None
    evidence_snippet: str | None = None


class TagSuggestion(BaseModel):
    suggested_tags: list[str]
    details: list[TagCandidateDetail] = Field(default_factory=list)
    value_chain_stage_code: str | None = None
    signal_type_code: str | None = None
    source: str = "jieba-frequency"
    protected_fields: list[str] = Field(
        default_factory=list,
        description="Machine suggestions are withheld for fields the operator already corrected",
    )
    degraded_reason: str | None = Field(
        default=None,
        description="Set when the LLM path was unavailable and a rule-based fallback was used",
    )
    rerank_score: float | None = Field(
        default=None,
        description="Top candidate relevance score when the configured rerank model refined jieba recall",
    )


class CaptureResult(BaseModel):
    """Unified capture outcome (POST /api/v1/capture): one shape whether the
    input was an uploaded HTML snapshot, an uploaded document, or a URL the
    server fetched itself.

    source: what the bytes were — "html-snapshot" | "document"
    via:    where the bytes came from — "upload" | "server-fetch"
    document: set only on the document path (raw-blob handle + ingest summary)
    """

    source: str
    via: str
    signal: SignalDetail
    document: DocumentRawOut | None = None


class CaptureJobOut(BaseModel):
    """Durable capture job state returned by the asynchronous capture API."""

    id: uuid.UUID
    submission_id: uuid.UUID
    status: Literal["queued", "running", "succeeded", "failed", "cancelled", "awaiting_client"]
    stage: Literal[
        "queued",
        "fetching",
        "processing",
        "parsing",
        "captioning",
        "indexing",
        "completed",
        "failed",
        "cancelled",
        "awaiting_client",
        "capturing",
    ]
    # 0-100 ingest progress for the current stage.
    progress: int = 0
    attempt_count: int
    created_at: datetime
    updated_at: datetime
    started_at: datetime | None = None
    heartbeat_at: datetime | None = None
    finished_at: datetime | None = None
    cancel_requested_at: datetime | None = None
    signal_id: uuid.UUID | None = None
    error: str | None = None
    result: CaptureResult | None = None
    source_url: str | None = None
    channel_code: str | None = None
    import_batch_id: uuid.UUID | None = None


class CaptureUrlBatchIn(BaseModel):
    """Pasted http(s) links (one per line or wrapped text)."""

    text: str = Field(min_length=1, description="Raw pasted URL list")


class PanoramaImportBatchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sha256: str
    filename: str | None = None
    status: Literal["capturing", "structuring", "completed", "failed"]
    signals_retained: int
    signals_failed: int
    demands_created: int
    functions_published: int
    error: str | None = None
    created_at: datetime
    updated_at: datetime
    structure_started_at: datetime | None = None
    structure_finished_at: datetime | None = None
    capture_jobs_total: int = 0
    capture_jobs_pending: int = 0


class OverviewWeeklyNew(BaseModel):
    """Rows created since Monday 00:00 UTC of the current week, through as_of_utc."""

    signals: int = Field(description="eea_signal.created_at in the current UTC calendar week")
    tech_themes: int = Field(description="eea_tech_theme.created_at in the current UTC calendar week")
    demand_points: int = Field(description="eea_demand_point.created_at in the current UTC calendar week")
    vehicle_functions: int = Field(description="eea_vehicle_function.created_at in the current UTC calendar week")
    landing_points: int = Field(description="eea_tech_landing_point.created_at in the current UTC calendar week")
    strategic_assessments: int = Field(description="Assessment versions by assessed_at in the current UTC calendar week")
    documents: int = Field(description="eea_document.created_at in the current UTC calendar week")


class OverviewStrategyFunnelCounts(BaseModel):
    """Exclusive counts of landing points by their current persisted funnel step."""

    industry_scan: int = Field(description="Eligible landing points whose current step is industry_scan")
    tier1_adaptation: int = Field(description="Eligible landing points whose current step is tier1_adaptation")
    scoring: int = Field(description="Eligible, passed Tier1 landing points whose current step is scoring")
    classification: int = Field(
        description="Landing points at classification, ready_to_finalize, or complete; counted once per landing point"
    )
    rejected: int = Field(description="Landing points whose current Tier1 decision is reject")
    pool_entry_blocked: int = Field(description="Landing points without a substantive deployment-boundary standard")


class DataSyncStamp(BaseModel):
    """Cheap fingerprint so the web client can detect catalog changes without refetching every list."""

    changed_at: datetime = Field(
        description="Latest create/update instant across core catalog entities (signals, themes, demands, capture, funnel)"
    )
    fingerprint: str = Field(
        description="Opaque token; compare with the last seen value and invalidate TanStack Query caches when it differs"
    )


class OverviewStats(BaseModel):
    """Live counts. Entity totals count rows; source count is distinct normalized URLs."""

    signals: int = Field(description="All persisted signal rows, including any archived records")
    signal_sources: int = Field(description="Distinct non-empty Signal.url_normalized values across all signal rows")
    signals_retained: int = Field(description="Signals with evidence_status_code='retained'")
    signals_pending_review: int = Field(description="Signals with evidence_status_code='pending_review'")
    signals_fetching: int = Field(description="Signals with evidence_status_code='fetching'")
    signals_fetch_failed: int = Field(description="Signals with evidence_status_code='fetch_failed'")
    signals_archived: int = Field(description="Signals with evidence_status_code='archived'")
    demand_points_pending_review: int = Field(description="Demand points with review_status='pending'")
    capture_jobs_open: int = Field(description="Capture jobs whose persisted status is queued or running")
    capture_jobs_failed: int = Field(description="Capture jobs whose current persisted status is failed")
    documents_failed_ingest: int = Field(
        description=(
            "Documents with persisted ingest_status='failed'; this is the retryable document-ingest todo count"
        )
    )
    tech_themes: int = Field(description="All persisted theme rows")
    demand_points: int = Field(description="All persisted demand-point rows")
    vehicle_functions: int = Field(description="All persisted vehicle-function rows, published or draft")
    landing_points: int = Field(description="All persisted technology landing-point rows")
    substantive_standards: int = Field(
        description="Standards with non-NULL, non-whitespace requirement_text; explicit blanks are excluded"
    )
    funnel_pool: int = Field(description="Current StrategicAssessment versions, one per currently assessed landing point")
    weekly_window_start_utc: datetime = Field(description="Inclusive Monday 00:00 UTC start of the current calendar week")
    as_of_utc: datetime = Field(description="UTC instant through which weekly-created counts are measured")
    weekly_new: OverviewWeeklyNew
    strategy_funnel: OverviewStrategyFunnelCounts
    panorama_import: PanoramaImportBatchOut | None = Field(
        default=None,
        description="Most recent panorama workbook import batch progress, when one exists",
    )


class TraceDocumentOut(BaseModel):
    """Persisted document metadata; object-reference flags do not verify blob readability."""

    id: uuid.UUID
    filename: str | None
    mime: str
    size: int
    sha256: str
    ingest_status: str
    figure_count: int
    figure_indices: list[int] = Field(
        default_factory=list,
        description="Stored figure indices for this document, in display order",
    )
    created_at: datetime
    raw_object_reference_present: bool = Field(
        description="True when the document row has an object key; use the document API to verify/read the blob"
    )
    canonical_object_reference_present: bool = Field(
        description="True when the document row has a canonical Markdown object key; does not verify blob readability"
    )
    endpoint: str


class TraceSignalOut(SignalOut):
    """Signal source/evidence fields derived from the signal and document rows."""

    trace_relationships: list[Literal["theme_member", "demand_evidence"]]
    body_reference_present: bool = Field(
        description="True when body_object_key is stored; the body endpoint still verifies object availability"
    )
    archive_reference_present: bool = Field(
        description="True when snapshot_html_object_key is stored; the archive endpoint verifies object availability"
    )
    is_archived: bool = Field(
        description="True only when the persisted evidence_status_code is 'archived'"
    )
    body_endpoint: str | None
    archive_endpoint: str | None
    figures_endpoint: str | None
    document: TraceDocumentOut | None


class TraceCompleteness(BaseModel):
    """Structural chain completeness; optional file/image artifacts are surfaced separately."""

    complete: bool = Field(description="True only when no chain stage or cited evidence reference is missing")
    present_stages: list[Literal["landing_point", "vehicle_function", "demand_point", "theme", "signals"]]
    missing_stages: list[Literal["landing_point", "vehicle_function", "demand_point", "theme", "signals"]]
    unresolved_evidence_signal_ids: list[str] = Field(
        description="Persisted demand evidence IDs that do not resolve to a signal row"
    )
    unresolved_document_ids: list[str] = Field(
        description="Signal document IDs that do not resolve to a document row"
    )


class TraceChain(BaseModel):
    """REQ-RULE-03 chain with persisted review, evidence, archive references and assessment history."""

    landing_point: LandingPointOut
    standards: list[StandardOut]
    assessment: AssessmentOut | None = Field(description="Current assessment only; null if no current version exists")
    assessment_versions: list[AssessmentOut] = Field(
        description="All retained assessment versions ordered by version; is_current identifies the current row"
    )
    vehicle_function: FunctionOut | None
    demand_point: DemandOut | None
    theme: ThemeOut | None
    signals: list[TraceSignalOut]
    demand_review_status: str | None = Field(description="Persisted DemandPoint.review_status")
    demand_cross_validation_conclusion: str | None = Field(
        description="Persisted DemandPoint.cross_validation.conclusion, if present"
    )
    function_published: bool | None = Field(description="Persisted VehicleFunction.published")
    basis_freshness: Literal["fresh", "stale", "unconfirmed", "unknown_untracked"] = Field(
        description=(
            "Unknown: DemandPoint has no updated_at/confirmed_at baseline, so the API cannot "
            "reliably determine whether the evidence basis changed after review or assessment"
        )
    )
    completeness: TraceCompleteness
