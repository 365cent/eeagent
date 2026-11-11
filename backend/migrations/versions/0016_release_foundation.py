"""Release foundation: capture ownership/cancel, audit provenance, signal sources, cache, demands.

Revision ID: 0016_release_foundation
Revises: 0015_agent_run_usage
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "0016_release_foundation"
down_revision = "0015_agent_run_usage"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("eea_capture_job", sa.Column("owner_subject", sa.Text(), nullable=True))
    op.add_column(
        "eea_capture_job",
        sa.Column("cancel_requested_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.add_column(
        "eea_vehicle_function",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.add_column("eea_signal", sa.Column("event_date_text", sa.Text(), nullable=True))
    op.add_column("eea_signal", sa.Column("event_date_precision", sa.Text(), nullable=True))

    op.add_column(
        "eea_demand_point",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.add_column("eea_demand_point", sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("eea_demand_point", sa.Column("confirmed_by_subject", sa.Text(), nullable=True))
    op.add_column(
        "eea_demand_point",
        sa.Column("low_freq_strong_signal", sa.Boolean(), server_default="false", nullable=False),
    )
    op.add_column("eea_demand_point", sa.Column("low_freq_strong_signal_reason", sa.Text(), nullable=True))

    op.add_column("eea_correction_audit", sa.Column("reason", sa.Text(), nullable=True))
    op.add_column("eea_correction_audit", sa.Column("model_version", sa.Text(), nullable=True))
    op.add_column("eea_correction_audit", sa.Column("rule_version", sa.Text(), nullable=True))
    op.add_column("eea_correction_audit", sa.Column("skill_version", sa.Text(), nullable=True))
    op.add_column("eea_correction_audit", sa.Column("score_source", sa.Text(), nullable=True))

    op.create_table(
        "eea_embedding_cache",
        sa.Column("content_sha256", sa.CHAR(length=64), primary_key=True, nullable=False),
        sa.Column("model_version", sa.Text(), primary_key=True, nullable=False),
        sa.Column("vocab_fingerprint", sa.CHAR(length=64), primary_key=True, nullable=False),
        sa.Column("vector_json", JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
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
    )
    op.create_index("eea_signal_source_signal_idx", "eea_signal_source", ["signal_id"])

    op.create_table(
        "eea_stored_object_orphan",
        sa.Column("object_key", sa.Text(), primary_key=True, nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
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
