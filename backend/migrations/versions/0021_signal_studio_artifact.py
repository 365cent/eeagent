"""Persist evidence studio generations per signal and kind."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "0021_signal_studio_artifact"
down_revision = "0020_signal_classification_basis"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "eea_signal_studio_artifact",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("signal_id", UUID(as_uuid=True), nullable=False),
        sa.Column("kind", sa.Text(), nullable=False),
        sa.Column("content_json", JSONB(), nullable=True),
        sa.Column("content_text", sa.Text(), nullable=True),
        sa.Column("source_body_sha256", sa.CHAR(length=64), nullable=True),
        sa.Column("llm_model", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["signal_id"], ["eea_signal.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("signal_id", "kind", name="uq_signal_studio_kind"),
        if_not_exists=True,
    )
    op.create_index(
        "eea_signal_studio_signal_idx", "eea_signal_studio_artifact", ["signal_id"], if_not_exists=True
    )


def downgrade() -> None:
    op.drop_index("eea_signal_studio_signal_idx", table_name="eea_signal_studio_artifact")
    op.drop_table("eea_signal_studio_artifact")