"""Server-issued capture upload tokens (CC-03)."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "0018_capture_tokens"
down_revision = "0017_theme_metrics_sources"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "eea_capture_token",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("subject", sa.Text(), nullable=False),
        sa.Column("role", sa.Text(), server_default="researcher", nullable=False),
        sa.Column("label", sa.Text()),
        sa.Column("token_sha256", sa.CHAR(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_by", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True)),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
        sa.Column("revoked_by", sa.Text()),
        sa.UniqueConstraint("token_sha256", name="uq_capture_token_sha256"),
        if_not_exists=True,
    )
    op.create_index(
        "eea_capture_token_subject_idx",
        "eea_capture_token",
        ["subject"],
        if_not_exists=True,
    )


def downgrade() -> None:
    op.drop_index("eea_capture_token_subject_idx", table_name="eea_capture_token")
    op.drop_table("eea_capture_token")
