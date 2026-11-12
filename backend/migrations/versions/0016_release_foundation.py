"""Release foundation: capture ownership/cancel, audit provenance, signal sources, cache, demands.

Revision ID: 0016_release_foundation
Revises: 0015_agent_run_usage
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "0016_release_foundation"
down_revision = "0015_agent_run_usage"
branch_labels = None
depends_on = None

_ADD_COLUMNS = [
    "ALTER TABLE eea_capture_job ADD COLUMN IF NOT EXISTS owner_subject TEXT",
    "ALTER TABLE eea_capture_job ADD COLUMN IF NOT EXISTS cancel_requested_at TIMESTAMPTZ",
    "ALTER TABLE eea_vehicle_function ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()",
    "ALTER TABLE eea_signal ADD COLUMN IF NOT EXISTS event_date_text TEXT",
    "ALTER TABLE eea_signal ADD COLUMN IF NOT EXISTS event_date_precision TEXT",
    "ALTER TABLE eea_demand_point ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()",
    "ALTER TABLE eea_demand_point ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ",
    "ALTER TABLE eea_demand_point ADD COLUMN IF NOT EXISTS confirmed_by_subject TEXT",
    "ALTER TABLE eea_demand_point ADD COLUMN IF NOT EXISTS low_freq_strong_signal BOOLEAN NOT NULL DEFAULT false",
    "ALTER TABLE eea_demand_point ADD COLUMN IF NOT EXISTS low_freq_strong_signal_reason TEXT",
    "ALTER TABLE eea_correction_audit ADD COLUMN IF NOT EXISTS reason TEXT",
    "ALTER TABLE eea_correction_audit ADD COLUMN IF NOT EXISTS model_version TEXT",
    "ALTER TABLE eea_correction_audit ADD COLUMN IF NOT EXISTS rule_version TEXT",
    "ALTER TABLE eea_correction_audit ADD COLUMN IF NOT EXISTS skill_version TEXT",
    "ALTER TABLE eea_correction_audit ADD COLUMN IF NOT EXISTS score_source TEXT",
]


def upgrade() -> None:
    bind = op.get_bind()
    for stmt in _ADD_COLUMNS:
        bind.execute(text(stmt))

    op.create_table(
        "eea_embedding_cache",
        sa.Column("content_sha256", sa.CHAR(length=64), primary_key=True, nullable=False),
        sa.Column("model_version", sa.Text(), primary_key=True, nullable=False),
        sa.Column("vocab_fingerprint", sa.CHAR(length=64), primary_key=True, nullable=False),
        sa.Column("vector_json", JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        if_not_exists=True,
    )

    op.create_table(
        "eea_signal_source",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("signal_id", UUID(as_uuid=True), sa.ForeignKey("eea_signal.id", ondelete="CASCADE"), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("url_normalized", sa.Text(), nullable=False),
        sa.Column("is_primary", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("provenance", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("signal_id", "url_normalized", name="uq_signal_source_url"),
        if_not_exists=True,
    )
    op.create_index(
        "eea_signal_source_signal_idx",
        "eea_signal_source",
        ["signal_id"],
        if_not_exists=True,
    )

    op.create_table(
        "eea_stored_object_orphan",
        sa.Column("object_key", sa.Text(), primary_key=True, nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        if_not_exists=True,
    )

    op.create_table(
        "eea_chain_report",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("demand_point_id", UUID(as_uuid=True), sa.ForeignKey("eea_demand_point.id"), nullable=True),
        sa.Column("landing_point_id", UUID(as_uuid=True), sa.ForeignKey("eea_tech_landing_point.id"), nullable=True),
        sa.Column("status", sa.Text(), server_default="queued", nullable=False),
        sa.Column("format", sa.Text(), nullable=False),
        sa.Column("object_key", sa.Text(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("data_snapshot_json", JSONB(), nullable=True),
        sa.Column("requested_by_subject", sa.Text(), nullable=False),
        sa.Column("requested_by_role", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "(demand_point_id IS NOT NULL) <> (landing_point_id IS NOT NULL)",
            name="ck_chain_report_target",
        ),
        if_not_exists=True,
    )

    # Backfill primary signal sources from existing signals.
    op.execute(
        """
        INSERT INTO eea_signal_source (id, signal_id, url, url_normalized, is_primary, provenance)
        SELECT gen_random_uuid(), s.id, s.url, s.url_normalized, true, 'primary'
        FROM eea_signal s
        WHERE NOT EXISTS (
            SELECT 1 FROM eea_signal_source ss WHERE ss.signal_id = s.id AND ss.is_primary
        )
        """
    )


def downgrade() -> None:
    op.drop_table("eea_chain_report")
    op.drop_table("eea_stored_object_orphan")
    op.drop_index("eea_signal_source_signal_idx", table_name="eea_signal_source")
    op.drop_table("eea_signal_source")
    op.drop_table("eea_embedding_cache")
    op.drop_column("eea_correction_audit", "score_source")
    op.drop_column("eea_correction_audit", "skill_version")
    op.drop_column("eea_correction_audit", "rule_version")
    op.drop_column("eea_correction_audit", "model_version")
    op.drop_column("eea_correction_audit", "reason")
    op.drop_column("eea_demand_point", "low_freq_strong_signal_reason")
    op.drop_column("eea_demand_point", "low_freq_strong_signal")
    op.drop_column("eea_demand_point", "confirmed_by_subject")
    op.drop_column("eea_demand_point", "confirmed_at")
    op.drop_column("eea_demand_point", "updated_at")
    op.drop_column("eea_vehicle_function", "updated_at")
    op.drop_column("eea_signal", "event_date_precision")
    op.drop_column("eea_signal", "event_date_text")
    op.drop_column("eea_capture_job", "cancel_requested_at")
    op.drop_column("eea_capture_job", "owner_subject")
