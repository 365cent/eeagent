"""Theme clustering runs (background report snapshots).

The clustering report used to be computed inside GET /themes/cluster-report, so
a new signal only appeared after a reload and the page's 重放聚类 button just
replayed the cached graph. Runs are now queued in this table (a signal insert
queues one) and computed by a background Python job.

Idempotent because 0001_init builds the schema from the current models: a fresh
install already has the table and the index.
"""

from alembic import op

revision = "0028_theme_cluster_run"
down_revision = "0027_capture_job_progress"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS eea_theme_cluster_run (
            id UUID PRIMARY KEY,
            trigger TEXT NOT NULL DEFAULT 'signal',
            status TEXT NOT NULL DEFAULT 'queued',
            payload JSONB,
            signal_count INTEGER,
            cluster_count INTEGER,
            error TEXT,
            requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            started_at TIMESTAMPTZ,
            finished_at TIMESTAMPTZ
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_theme_cluster_run_requested_at "
        "ON eea_theme_cluster_run (requested_at)"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS eea_theme_cluster_run")
