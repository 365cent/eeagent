"""Backfill review baselines for confirmed demands (BE-11)."""

from alembic import op

revision = "0022_demand_review_baseline"
down_revision = "0021_signal_studio_artifact"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE eea_demand_point
        SET confirmed_at = updated_at
        WHERE review_status = 'confirmed' AND confirmed_at IS NULL
        """
    )


def downgrade() -> None:
    # The backfilled timestamp approximates the original review time; clearing
    # it would reintroduce unknown baselines without restoring lost data.
    pass
