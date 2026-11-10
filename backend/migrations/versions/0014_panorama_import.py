"""Panorama workbook import batches and client-awaiting capture jobs.

Revision ID: 0014_panorama_import
Revises: 0013_agent_workflow
"""
from alembic import op
from sqlalchemy import text

revision = "0014_panorama_import"
down_revision = "0013_agent_workflow"
branch_labels = None
depends_on = None

UPGRADE_SQL = """
ALTER TABLE eea_capture_job DROP CONSTRAINT IF EXISTS ck_capture_job_status;
ALTER TABLE eea_capture_job ADD CONSTRAINT ck_capture_job_status
    CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'awaiting_client'));

ALTER TABLE eea_capture_job DROP CONSTRAINT IF EXISTS ck_capture_job_stage;
ALTER TABLE eea_capture_job ADD CONSTRAINT ck_capture_job_stage
    CHECK (stage IN (
        'queued', 'fetching', 'processing', 'completed', 'failed', 'cancelled',
        'awaiting_client', 'capturing'
    ));

ALTER TABLE eea_capture_job ADD COLUMN IF NOT EXISTS import_batch_id uuid;

CREATE TABLE IF NOT EXISTS eea_panorama_import_batch (
    id uuid PRIMARY KEY,
    sha256 char(64) NOT NULL,
    filename text,
    workbook_object_key text NOT NULL,
    snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'capturing',
    error text,
    signals_retained integer NOT NULL DEFAULT 0,
    signals_failed integer NOT NULL DEFAULT 0,
    demands_created integer NOT NULL DEFAULT 0,
    functions_published integer NOT NULL DEFAULT 0,
    structure_started_at timestamptz,
    structure_finished_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_panorama_import_sha256 UNIQUE (sha256),
    CONSTRAINT ck_panorama_import_status CHECK (
        status IN ('capturing', 'structuring', 'completed', 'failed')
    )
);

ALTER TABLE eea_capture_job
    DROP CONSTRAINT IF EXISTS fk_capture_job_import_batch;
ALTER TABLE eea_capture_job
    ADD CONSTRAINT fk_capture_job_import_batch
    FOREIGN KEY (import_batch_id) REFERENCES eea_panorama_import_batch(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS eea_panorama_import_url (
    id uuid PRIMARY KEY,
    batch_id uuid NOT NULL REFERENCES eea_panorama_import_batch(id) ON DELETE CASCADE,
    url text NOT NULL,
    url_normalized text NOT NULL,
    contexts jsonb NOT NULL DEFAULT '[]'::jsonb,
    channel_code text,
    is_pdf boolean NOT NULL DEFAULT false,
    capture_job_id uuid REFERENCES eea_capture_job(id) ON DELETE SET NULL,
    signal_id uuid REFERENCES eea_signal(id) ON DELETE SET NULL,
    CONSTRAINT uq_panorama_import_url UNIQUE (batch_id, url_normalized)
);

CREATE INDEX IF NOT EXISTS eea_panorama_import_batch_status_idx
    ON eea_panorama_import_batch (status, created_at DESC);
CREATE INDEX IF NOT EXISTS eea_capture_job_awaiting_client_idx
    ON eea_capture_job (status, created_at)
    WHERE status = 'awaiting_client';
"""

DOWNGRADE_SQL = """
DROP TABLE IF EXISTS eea_panorama_import_url;
ALTER TABLE eea_capture_job DROP CONSTRAINT IF EXISTS fk_capture_job_import_batch;
ALTER TABLE eea_capture_job DROP COLUMN IF EXISTS import_batch_id;
DROP TABLE IF EXISTS eea_panorama_import_batch;

ALTER TABLE eea_capture_job DROP CONSTRAINT IF EXISTS ck_capture_job_status;
ALTER TABLE eea_capture_job ADD CONSTRAINT ck_capture_job_status
    CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled'));

ALTER TABLE eea_capture_job DROP CONSTRAINT IF EXISTS ck_capture_job_stage;
ALTER TABLE eea_capture_job ADD CONSTRAINT ck_capture_job_stage
    CHECK (stage IN ('queued', 'fetching', 'processing', 'completed', 'failed', 'cancelled'));
"""


def upgrade() -> None:
    op.get_bind().execute(text(UPGRADE_SQL))


def downgrade() -> None:
    op.get_bind().execute(text(DOWNGRADE_SQL))
