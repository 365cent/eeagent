"""Capture snapshots and raw documents (W2 B1/B2/B4).

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-28

- eea_signal.snapshot_html_object_key: object-store reference to the uploaded
  SingleFile HTML archive (nullable; replayed by GET /signals/{id}/archive).
- eea_document: raw uploaded document blobs (POST /documents/raw). W2 stores
  bytes only; parsing stays W4 eea-doc-ingest.

Every DDL carries IF NOT EXISTS: 0001 runs Base.metadata.create_all driven by
the CURRENT models, so a fresh database already contains the new column and
table by the time 0003 upgrades — 0003 must stay idempotent (no duplicate
column/table errors) while still adding them to pre-0003 databases.
"""
from alembic import op
from sqlalchemy import text

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

UPGRADE_SQL = """
ALTER TABLE eea_signal ADD COLUMN IF NOT EXISTS snapshot_html_object_key text;

CREATE TABLE IF NOT EXISTS eea_document (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sha256 char(64) NOT NULL,
    mime text NOT NULL,
    size integer NOT NULL,
    filename text,
    object_key text NOT NULL,
    uploaded_by text NOT NULL DEFAULT 'local-admin',
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_document_sha256 UNIQUE (sha256)
);
"""

DOWNGRADE_SQL = """
ALTER TABLE eea_signal DROP COLUMN IF EXISTS snapshot_html_object_key;
DROP TABLE IF EXISTS eea_document;
"""


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(text(UPGRADE_SQL))


def downgrade() -> None:
    bind = op.get_bind()
    bind.execute(text(DOWNGRADE_SQL))
