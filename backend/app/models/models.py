import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CHAR,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy import Computed
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RefCode(Base):
    # No explicit UniqueConstraint("domain", "code") here: the composite
    # PRIMARY KEY (domain, code) below already guarantees uniqueness, and a
    # second declared constraint makes `alembic check` emit a spurious
    # add_constraint for every future autogenerate (verified: pg_constraint
    # on eea/eea_test holds only eea_ref_code_pkey).
    __tablename__ = "eea_ref_code"

    domain: Mapped[str] = mapped_column(Text, primary_key=True)
    code: Mapped[str] = mapped_column(Text, primary_key=True)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    fixture_alias: Mapped[str | None] = mapped_column(Text)


class Vocab(Base):
    __tablename__ = "eea_vocab"
    __table_args__ = (
        UniqueConstraint("kind", "name"),
        CheckConstraint(
            "kind IN ('tech_tag', 'domain', 'recommendation_level', 'target_domain')",
            name="ck_vocab_kind",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kind: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TechTheme(Base):
    __tablename__ = "eea_tech_theme"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    working_name: Mapped[str] = mapped_column(Text, nullable=False)
    value_chain_stage_code: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    signals: Mapped[list["Signal"]] = relationship(back_populates="theme")


class DemandPoint(Base):
    __tablename__ = "eea_demand_point"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    source_tech_theme_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("eea_tech_theme.id")
    )
    value_chain_stage_code: Mapped[str] = mapped_column(Text, nullable=False)
    derivation_trace: Mapped[dict | None] = mapped_column(JSONB)
    cross_validation: Mapped[dict | None] = mapped_column(JSONB)
    time_series: Mapped[list | None] = mapped_column(JSONB)
    review_status: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    functions: Mapped[list["VehicleFunction"]] = relationship(back_populates="demand_point")


class Signal(Base):
    __tablename__ = "eea_signal"
    __table_args__ = (
        Index("eea_signal_theme_idx", "tech_theme_id"),
        Index("eea_signal_url_norm_idx", "url_normalized"),
        UniqueConstraint("capture_submission_id", name="uq_signal_capture_submission_id"),
        CheckConstraint(
            "(capture_submission_id IS NULL) = (capture_submission_sha256 IS NULL)",
            name="ck_signal_capture_submission_pair",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    url_normalized: Mapped[str] = mapped_column(Text, nullable=False)
    channel_code: Mapped[str] = mapped_column(Text, nullable=False)
    publisher: Mapped[str | None] = mapped_column(Text)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    value_chain_stage_code: Mapped[str | None] = mapped_column(Text)
    signal_type_code: Mapped[str | None] = mapped_column(Text)
    evolution_node_code: Mapped[str | None] = mapped_column(Text)
    evidence_status_code: Mapped[str] = mapped_column(Text, nullable=False)
    tech_theme_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("eea_tech_theme.id")
    )
    source_label: Mapped[str | None] = mapped_column(Text)
    excerpt: Mapped[str | None] = mapped_column(Text)
    body_object_key: Mapped[str | None] = mapped_column(Text)
    body_sha256: Mapped[str | None] = mapped_column(CHAR(64))
    # SingleFile HTML archive reference (B2); body_* above stay the derived
    # text snapshot — the archive is replayed via GET /signals/{id}/archive
    snapshot_html_object_key: Mapped[str | None] = mapped_column(Text)
    # S1-3: a signal created from an uploaded document (POST /signals with
    # document_id) references it; url defaults to eea://document/{id}
    document_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("eea_document.id", name="fk_eea_signal_document")
    )
    captured_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Optional idempotency receipt for POST /capture. Legacy signal routes leave
    # both fields NULL; a capture key is bound to one canonical request digest.
    capture_submission_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    capture_submission_sha256: Mapped[str | None] = mapped_column(CHAR(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    theme: Mapped[TechTheme | None] = relationship(back_populates="signals")
    document: Mapped["Document | None"] = relationship()
    tags: Mapped[list["SignalTag"]] = relationship(
        back_populates="signal", cascade="all, delete-orphan"
    )


class CaptureJob(Base):
    """Durable server-side queue entry for one user-side capture submission."""

    __tablename__ = "eea_capture_job"
    __table_args__ = (
        UniqueConstraint("submission_id", name="uq_capture_job_submission"),
        CheckConstraint(
            "status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')",
            name="ck_capture_job_status",
        ),
        CheckConstraint(
            "stage IN ('queued', 'fetching', 'processing', 'completed', 'failed', 'cancelled')",
            name="ck_capture_job_stage",
        ),
        CheckConstraint("attempt_count >= 0", name="ck_capture_job_attempt_count"),
        Index("eea_capture_job_ready_idx", "status", "available_at", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    fingerprint: Mapped[str] = mapped_column(CHAR(64), nullable=False)
    source_url: Mapped[str | None] = mapped_column(Text)
    publisher: Mapped[str | None] = mapped_column(Text)
    source_label: Mapped[str | None] = mapped_column(Text)
    channel_code: Mapped[str | None] = mapped_column(Text)
    filename: Mapped[str | None] = mapped_column(Text)
    mime: Mapped[str | None] = mapped_column(Text)
    payload_object_key: Mapped[str | None] = mapped_column(Text)
    payload_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    via: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="queued", server_default="queued")
    stage: Mapped[str] = mapped_column(Text, nullable=False, default="queued", server_default="queued")
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    available_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    lease_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    heartbeat_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    worker_id: Mapped[str | None] = mapped_column(Text)
    signal_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("eea_signal.id", ondelete="SET NULL")
    )
    error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Document(Base):
    """Uploaded document: raw blob (0003) plus W4 ingest artifacts (0004).

    Raw bytes always land in the object store; `canonical_md_object_key` points
    at the MarkItDown output enriched with vision captions. `ingest_status`
    is 'stored' (bytes only), 'parsed', 'failed' or 'skipped' (size limit)."""

    __tablename__ = "eea_document"
    __table_args__ = (UniqueConstraint("sha256", name="uq_document_sha256"),)

    # server_default mirrors 0003's real DDL (gen_random_uuid()/'local-admin')
    # so a fresh create_all database and a migrated one expose the same physical
    # schema — bare SQL inserts behave identically in both environments.
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid()
    )
    sha256: Mapped[str] = mapped_column(CHAR(64), nullable=False)
    mime: Mapped[str] = mapped_column(Text, nullable=False)
    size: Mapped[int] = mapped_column(Integer, nullable=False)
    filename: Mapped[str | None] = mapped_column(Text)
    object_key: Mapped[str] = mapped_column(Text, nullable=False)
    uploaded_by: Mapped[str] = mapped_column(
        Text, nullable=False, default="local-admin", server_default="local-admin"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    canonical_md_object_key: Mapped[str | None] = mapped_column(Text)
    canonical_md_sha256: Mapped[str | None] = mapped_column(CHAR(64))
    markitdown_version: Mapped[str | None] = mapped_column(Text)
    figure_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    vision_model: Mapped[str | None] = mapped_column(Text)
    ingest_status: Mapped[str] = mapped_column(
        Text, nullable=False, default="stored", server_default="stored"
    )
    ingest_error: Mapped[str | None] = mapped_column(Text)
    ingested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class AccessLog(Base):
    """Platform access history keyed by internal IP (no login system yet).

    The IP is the identity: every visit records the simplified browser/OS so
    the profile page can show a readable login history without storing raw
    fingerprints."""

    __tablename__ = "eea_access_log"
    __table_args__ = (Index("ix_eea_access_log_ip_created", "ip", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=func.gen_random_uuid()
    )
    ip: Mapped[str] = mapped_column(Text, nullable=False)
    ua_browser: Mapped[str] = mapped_column(Text, nullable=False)
    ua_os: Mapped[str] = mapped_column(Text, nullable=False)
    ua_raw: Mapped[str | None] = mapped_column(Text)
    page: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SignalTag(Base):
    __tablename__ = "eea_signal_tag"

    signal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("eea_signal.id", ondelete="CASCADE"), primary_key=True
    )
    vocab_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("eea_vocab.id"), primary_key=True)

    signal: Mapped[Signal] = relationship(back_populates="tags")
    vocab: Mapped[Vocab] = relationship()


class CorrectionAudit(Base):
    __tablename__ = "eea_correction_audit"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type: Mapped[str] = mapped_column(Text, nullable=False)
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    field_name: Mapped[str] = mapped_column(Text, nullable=False)
    machine_value: Mapped[dict | None] = mapped_column(JSONB)
    human_value: Mapped[dict | None] = mapped_column(JSONB)
    old_value: Mapped[dict | None] = mapped_column(JSONB)
    new_value: Mapped[dict | None] = mapped_column(JSONB)
    operator_subject: Mapped[str] = mapped_column(Text, nullable=False)
    operator_role: Mapped[str] = mapped_column(Text, nullable=False)
    corrected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class VehicleFunction(Base):
    __tablename__ = "eea_vehicle_function"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    demand_point_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("eea_demand_point.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    value_chain_stage_code: Mapped[str | None] = mapped_column(Text)
    forward_trace: Mapped[dict | None] = mapped_column(JSONB)
    reverse_trace: Mapped[dict | None] = mapped_column(JSONB)
    recommendation_level: Mapped[str | None] = mapped_column(Text)
    automation_levels: Mapped[list | None] = mapped_column(JSONB)
    target_domain: Mapped[str | None] = mapped_column(Text)
    recommendation_reason: Mapped[str | None] = mapped_column(Text)
    l2_l4_difference: Mapped[str | None] = mapped_column(Text)
    published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    demand_point: Mapped[DemandPoint] = relationship(back_populates="functions")
    landing_points: Mapped[list["TechLandingPoint"]] = relationship(
        back_populates="vehicle_function", cascade="all, delete-orphan"
    )


class TechLandingPoint(Base):
    __tablename__ = "eea_tech_landing_point"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_function_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("eea_vehicle_function.id", ondelete="CASCADE"), nullable=False
    )
    domain_vocab_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("eea_vocab.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    role_description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    vehicle_function: Mapped[VehicleFunction] = relationship(back_populates="landing_points")
    domain: Mapped[Vocab] = relationship()
    standards: Mapped[list["DeploymentStandard"]] = relationship(
        back_populates="landing_point", cascade="all, delete-orphan"
    )
    assessments: Mapped[list["StrategicAssessment"]] = relationship(
        back_populates="landing_point", cascade="all, delete-orphan"
    )


class DeploymentStandard(Base):
    __tablename__ = "eea_deployment_standard"
    __table_args__ = (
        UniqueConstraint("tech_landing_point_id", "phase", "constraint_type"),
        CheckConstraint("phase IN ('设计', '制造', '运营')", name="ck_std_phase"),
        CheckConstraint("constraint_type IN ('工程化', '经济性', '安全合规')", name="ck_std_constraint"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tech_landing_point_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("eea_tech_landing_point.id", ondelete="CASCADE"), nullable=False
    )
    phase: Mapped[str] = mapped_column(Text, nullable=False)
    constraint_type: Mapped[str] = mapped_column(Text, nullable=False)
    requirement_text: Mapped[str | None] = mapped_column(Text)

    landing_point: Mapped[TechLandingPoint] = relationship(back_populates="standards")


class StrategicAssessment(Base):
    __tablename__ = "eea_strategic_assessment"
    __table_args__ = (
        UniqueConstraint("tech_landing_point_id", "version"),
        CheckConstraint("version >= 1", name="ck_assess_version"),
        CheckConstraint("funnel_step BETWEEN 1 AND 4", name="ck_assess_funnel"),
        CheckConstraint("score_business BETWEEN 1 AND 5", name="ck_assess_business"),
        CheckConstraint("score_maturity BETWEEN 1 AND 5", name="ck_assess_maturity"),
        CheckConstraint("score_moat BETWEEN 1 AND 5", name="ck_assess_moat"),
        CheckConstraint("score_supply_chain BETWEEN 1 AND 5", name="ck_assess_supply"),
        CheckConstraint("score_feasibility BETWEEN 1 AND 5", name="ck_assess_feasibility"),
        CheckConstraint(
            "classification IN ('前瞻布局', '短期可落地', '产业投资/生态合作')",
            name="ck_assess_classification",
        ),
        Index(
            "eea_strategic_assessment_current_idx",
            "tech_landing_point_id",
            unique=True,
            postgresql_where="is_current",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tech_landing_point_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("eea_tech_landing_point.id", ondelete="CASCADE"), nullable=False
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    funnel_step: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    score_business: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    score_maturity: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    score_moat: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    score_supply_chain: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    score_feasibility: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    score_total: Mapped[int] = mapped_column(
        SmallInteger,
        Computed(
            "score_business + score_maturity + score_moat + score_supply_chain + score_feasibility"
        ),
    )
    classification: Mapped[str] = mapped_column(Text, nullable=False)
    strategy_note: Mapped[str | None] = mapped_column(Text)
    score_rationales: Mapped[dict | None] = mapped_column(JSONB)
    funnel_snapshot: Mapped[dict | None] = mapped_column(JSONB)
    operator_subject: Mapped[str | None] = mapped_column(Text)
    assessed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    is_current: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    landing_point: Mapped[TechLandingPoint] = relationship(back_populates="assessments")


class StrategicFunnel(Base):
    """Mutable work-in-progress funnel state, separate from final assessments."""

    __tablename__ = "eea_strategic_funnel"
    __table_args__ = (
        CheckConstraint(
            "adaptation_decision IS NULL OR adaptation_decision IN ('pass', 'reject')",
            name="ck_strategy_funnel_adaptation",
        ),
        CheckConstraint(
            "classification IS NULL OR classification IN ('前瞻布局', '短期可落地', '产业投资/生态合作')",
            name="ck_strategy_funnel_classification",
        ),
        CheckConstraint("score_business IS NULL OR score_business BETWEEN 1 AND 5", name="ck_strategy_funnel_business"),
        CheckConstraint("score_maturity IS NULL OR score_maturity BETWEEN 1 AND 5", name="ck_strategy_funnel_maturity"),
        CheckConstraint("score_moat IS NULL OR score_moat BETWEEN 1 AND 5", name="ck_strategy_funnel_moat"),
        CheckConstraint("score_supply_chain IS NULL OR score_supply_chain BETWEEN 1 AND 5", name="ck_strategy_funnel_supply"),
        CheckConstraint("score_feasibility IS NULL OR score_feasibility BETWEEN 1 AND 5", name="ck_strategy_funnel_feasibility"),
    )

    tech_landing_point_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("eea_tech_landing_point.id", ondelete="CASCADE"),
        primary_key=True,
    )
    scan_scope: Mapped[str | None] = mapped_column(Text)
    scan_sources: Mapped[list | None] = mapped_column(JSONB)
    tier1_current_business_relation: Mapped[str | None] = mapped_column(Text)
    tier1_future_business_relation: Mapped[str | None] = mapped_column(Text)
    valuable_role: Mapped[str | None] = mapped_column(Text)
    adaptation_decision: Mapped[str | None] = mapped_column(Text)
    adaptation_reason: Mapped[str | None] = mapped_column(Text)
    score_business: Mapped[int | None] = mapped_column(SmallInteger)
    rationale_business: Mapped[str | None] = mapped_column(Text)
    score_maturity: Mapped[int | None] = mapped_column(SmallInteger)
    rationale_maturity: Mapped[str | None] = mapped_column(Text)
    score_moat: Mapped[int | None] = mapped_column(SmallInteger)
    rationale_moat: Mapped[str | None] = mapped_column(Text)
    score_supply_chain: Mapped[int | None] = mapped_column(SmallInteger)
    rationale_supply_chain: Mapped[str | None] = mapped_column(Text)
    score_feasibility: Mapped[int | None] = mapped_column(SmallInteger)
    rationale_feasibility: Mapped[str | None] = mapped_column(Text)
    classification: Mapped[str | None] = mapped_column(Text)
    strategy_note: Mapped[str | None] = mapped_column(Text)
    finalized_assessment_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    finalized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_by: Mapped[str] = mapped_column(Text, nullable=False)
