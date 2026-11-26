"""Capture job progress percent plus the finer ingest stages (import panel).

Reports how far a capture job has actually got, so the upload panel can show the
current stage and a real percentage instead of a fixed spinner. The stage check
constraint is widened to the new ingest stages.
"""

from alembic import op
import sqlalchemy as sa

revision = "0027_capture_job_progress"
down_revision = "0026_maintenance_run"
branch_labels = None
depends_on = None

_OLD_STAGES = (
    "stage IN ('queued', 'fetching', 'processing', 'completed', 'failed', 'cancelled', "
    "'awaiting_client', 'capturing')"
)
_NEW_STAGES = (
    "stage IN ('queued', 'fetching', 'processing', 'parsing', 'captioning', 'indexing', "
    "'completed', 'failed', 'cancelled', 'awaiting_client', 'capturing')"
)


def upgrade() -> None:
    # Idempotent: 0001_init creates the schema from the current models, so a
    # fresh install already has the column and the widened check constraint.
    op.execute(
        "ALTER TABLE eea_capture_job ADD COLUMN IF NOT EXISTS progress INTEGER NOT NULL DEFAULT 0"
    )
    op.execute("ALTER TABLE eea_capture_job DROP CONSTRAINT IF EXISTS ck_capture_job_stage")
    op.create_check_constraint("ck_capture_job_stage", "eea_capture_job", _NEW_STAGES)


def downgrade() -> None:
    # Rows left in a new stage would violate the narrower constraint.
    op.execute(
        "UPDATE eea_capture_job SET stage = 'processing' "
        "WHERE stage IN ('parsing', 'captioning', 'indexing')"
    )
    op.drop_constraint("ck_capture_job_stage", "eea_capture_job", type_="check")
    op.create_check_constraint("ck_capture_job_stage", "eea_capture_job", _OLD_STAGES)
    op.drop_column("eea_capture_job", "progress")
