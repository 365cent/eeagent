import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, computed_field, field_validator

from app.services.refcodes import codes, normalize

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
    kind: Literal["tech_tag", "domain"]
    name: str


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
    operator_subject: str = "local-admin"
    operator_role: str = "方法论/词表管理员"


class SignalBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    url: str
    url_normalized: str
    channel_code: str
    publisher: str | None
    published_at: datetime | None
    value_chain_stage_code: str | None
    signal_type_code: str | None
    evolution_node_code: str | None
    evidence_status_code: str
    tech_theme_id: uuid.UUID | None
    document_id: uuid.UUID | None
    source_label: str | None
    excerpt: str | None
    captured_at: datetime | None
    created_at: datetime
    updated_at: datetime


class SignalOut(SignalBase):
    tags: list[str] = []  # populated manually from the tag relationship


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


class SignalFigureOut(BaseModel):
    """Inlined content image from the stored HTML archive (index matches `> 图 N：` in body_md)."""

    index: int
    mime: str
    src: str


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


SignalStudioKind = Literal["audio", "mindmap", "report", "infographic"]


class SignalStudioIn(BaseModel):
    """证据工作室生成请求（POST /signals/{id}/studio）。

    Contract is shared with frontend `fetchSignalStudio` (lib/api/eea-api.ts):
    report → text/markdown, the other kinds → JSON in the shapes below.
    """

    kind: SignalStudioKind


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


class LlmStatusOut(BaseModel):
    configured: bool
    model: str | None = None


class TagAssignment(BaseModel):
    tag_names: list[str]
    operator_subject: str = "local-admin"


class ThemeAssignment(BaseModel):
    tech_theme_id: uuid.UUID | None  # None = 移出归集
    operator_subject: str = "local-admin"


class DemandCreate(RefCodeValidated):
    name: str
    source_tech_theme_id: uuid.UUID | None = None
    value_chain_stage_code: str
    cross_validation: dict | None = None
    time_series: list | None = None
    review_status: str | None = None


class DemandUpdate(RefCodeValidated):
    name: str | None = None
    value_chain_stage_code: str | None = None
    cross_validation: dict | None = None
    time_series: list | None = None
    review_status: str | None = None


class DemandOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    source_tech_theme_id: uuid.UUID | None
    value_chain_stage_code: str
    cross_validation: dict | None
    time_series: list | None
    review_status: str | None
    created_at: datetime
    function_count: int = 0
    signal_frequency: int = 0
    source_count: int = 0


class FunctionCreate(RefCodeValidated):
    demand_point_id: uuid.UUID
    name: str
    value_chain_stage_code: str | None = None
    forward_trace: dict | None = None
    reverse_trace: dict | None = None


class FunctionUpdate(RefCodeValidated):
    name: str | None = None
    value_chain_stage_code: str | None = None
    forward_trace: dict | None = None
    reverse_trace: dict | None = None
    published: bool | None = None


class FunctionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    demand_point_id: uuid.UUID
    name: str
    value_chain_stage_code: str | None
    forward_trace: dict | None
    reverse_trace: dict | None
    published: bool
    created_at: datetime


class LandingPointCreate(BaseModel):
    vehicle_function_id: uuid.UUID
    domain: str  # vocab name; created on the fly (REQ-TECH-02)
    name: str
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
    requirement_text: str | None = None


class StandardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    tech_landing_point_id: uuid.UUID
    phase: str
    constraint_type: str
    requirement_text: str | None


class StandardGrid(BaseModel):
    cells: list[StandardOut]
    # full 3x3 grid: missing cells mean 留空 (REQ-STD-02), returned as None text


class AssessmentCreate(BaseModel):
    funnel_step: int = Field(ge=1, le=4)
    score_business: int = Field(ge=1, le=5)
    score_maturity: int = Field(ge=1, le=5)
    score_moat: int = Field(ge=1, le=5)
    score_supply_chain: int = Field(ge=1, le=5)
    score_feasibility: int = Field(ge=1, le=5)
    classification: Classification
    strategy_note: str | None = None
    operator_subject: str = "local-admin"


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
    operator_subject: str | None
    assessed_at: datetime
    is_current: bool


class AuditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    entity_type: str
    entity_id: uuid.UUID
    field_name: str
    machine_value: dict | list | str | None
    human_value: dict | list | str | None
    operator_subject: str
    operator_role: str
    corrected_at: datetime


class TagSuggestion(BaseModel):
    suggested_tags: list[str]
    source: str = "jieba-frequency"


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


class OverviewStats(BaseModel):
    signals: int
    signals_pending_review: int
    tech_themes: int
    demand_points: int
    vehicle_functions: int
    landing_points: int
    funnel_pool: int


class TraceChain(BaseModel):
    """REQ-RULE-03: 落脚点 → 功能 → 需求点 → 主题 → 信号 分段追溯"""
    landing_point: LandingPointOut
    standards: list[StandardOut]
    assessment: AssessmentOut | None
    vehicle_function: FunctionOut | None
    demand_point: DemandOut | None
    theme: ThemeOut | None
    signals: list[SignalOut]
