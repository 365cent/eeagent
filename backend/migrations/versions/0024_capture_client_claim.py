"""Rolling claim ledger for capture client rate limits."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "0024_capture_client_claim"
down_revision = "0023_capture_client_claim_count"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "eea_capture_client_claim",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("client_subject", sa.Text(), nullable=False),
        sa.Column("job_id", UUID(as_uuid=True), nullable=False),
        sa.Column(
            "claimed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["job_id"], ["eea_capture_job.id"], ondelete="CASCADE"),
        if_not_exists=True,
    )
    op.create_index(
        "eea_capture_client_claim_window_idx",
        "eea_capture_client_claim",
        ["client_subject", "claimed_at"],
        if_not_exists=True,
    )


def downgrade() -> None:
    op.drop_index(
        "eea_capture_client_claim_window_idx", table_name="eea_capture_client_claim"
    )
    op.drop_table("eea_capture_client_claim")
