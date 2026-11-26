"""Key capture client claim quotas by client instance."""

from alembic import op
import sqlalchemy as sa

revision = "0025_capture_client_claim_worker"
down_revision = "0024_capture_client_claim"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Idempotent: 0001_init creates this table from the current models, so a
    # fresh install already has the column.
    op.execute(
        "ALTER TABLE eea_capture_client_claim "
        "ADD COLUMN IF NOT EXISTS client_worker_id TEXT"
    )
    # These rows are short-lived quota events, not business records; reset them
    # so the new per-instance key starts from a clean window.
    op.execute("DELETE FROM eea_capture_client_claim")
    op.create_index(
        "eea_capture_client_claim_worker_idx",
        "eea_capture_client_claim",
        ["client_worker_id", "claimed_at"],
        if_not_exists=True,
    )
    op.drop_index(
        "eea_capture_client_claim_window_idx", table_name="eea_capture_client_claim"
    )


def downgrade() -> None:
    op.create_index(
        "eea_capture_client_claim_window_idx",
        "eea_capture_client_claim",
        ["client_subject", "claimed_at"],
        if_not_exists=True,
    )
    op.drop_index(
        "eea_capture_client_claim_worker_idx", table_name="eea_capture_client_claim"
    )
    op.drop_column("eea_capture_client_claim", "client_worker_id")
