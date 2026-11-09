"""Add durable capture jobs for restart-safe ingestion.

Revision ID: 0008
Revises: 0007
"""
from alembic import op
from sqlalchemy import text

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None

UPGRADE_SQL = """
CREATE TABLE IF NOT EXISTS eea_capture_job (
    id uuid PRIMARY KEY,
    submission_id uuid NOT NULL,
    fingerprint char(64) NOT NULL,
    source_url text,
    publisher text,
    source_label text,
    channel_code text,
    filename text,
    mime text,
    payload_object_key text,
    payload_size integer NOT NULL DEFAULT 0,
    via text NOT NULL,
    status text NOT NULL DEFAULT 'queued',
    stage text NOT NULL DEFAULT 'queued',
    attempt_count integer NOT NULL DEFAULT 0,
    available_at timestamptz NOT NULL DEFAULT now(),
    lease_until timestamptz,
    heartbeat_at timestamptz,
    worker_id text,
    signal_id uuid REFERENCES eea_signal(id) ON DELETE SET NULL,
    error text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    started_at timestamptz,
    finished_at timestamptz,
    CONSTRAINT uq_capture_job_submission UNIQUE (submission_id),
    CONSTRAINT ck_capture_job_status CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
    CONSTRAINT ck_capture_job_stage CHECK (stage IN ('queued', 'fetching', 'processing', 'completed', 'failed', 'cancelled')),
    CONSTRAINT ck_capture_job_attempt_count CHECK (attempt_count >= 0)
);
CREATE INDEX IF NOT EXISTS eea_capture_job_ready_idx
    ON eea_capture_job (status, available_at, created_at);
"""

DOWNGRADE_SQL = """
DROP TABLE IF EXISTS eea_capture_job;
"""


def upgrade() -> None:
    op.get_bind().execute(text(UPGRADE_SQL))


def downgrade() -> None:
    op.get_bind().execute(text(DOWNGRADE_SQL))
