"""Track repeated client claims on capture jobs."""

from alembic import op
import sqlalchemy as sa

revision = "0023_capture_client_claim_count"
down_revision = "0022_demand_review_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 0001_init builds the schema from the current models, so a fresh install
    # already carries this column. Keep the step idempotent for that path;
    # existing databases at 0022 still get the column added here.
    op.execute(
        "ALTER TABLE eea_capture_job "
        "ADD COLUMN IF NOT EXISTS client_claim_count INTEGER NOT NULL DEFAULT 0"
    )


def downgrade() -> None:
    op.drop_column("eea_capture_job", "client_claim_count")
