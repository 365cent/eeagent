"""Key capture client claim quotas by client instance."""

from alembic import op
import sqlalchemy as sa

revision = "0025_capture_client_claim_worker"
down_revision = "0024_capture_client_claim"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "eea_capture_client_claim",
        sa.Column("client_worker_id", sa.Text(), nullable=True),
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
