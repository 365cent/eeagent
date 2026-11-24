"""Track repeated client claims on capture jobs."""

from alembic import op
import sqlalchemy as sa

revision = "0023_capture_client_claim_count"
down_revision = "0022_demand_review_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "eea_capture_job",
        sa.Column("client_claim_count", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("eea_capture_job", "client_claim_count")
