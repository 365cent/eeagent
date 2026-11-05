"""Document ingest artifacts for eea_document (W4).

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-28

W2 stored raw bytes only (0003). W4 turns a blob into canonical Markdown with
MarkItDown, plus per-figure vision captions. All DDL is IF NOT EXISTS because
0001 runs Base.metadata.create_all against the current models, so fresh
databases already contain these columns before 0004 upgrades.
"""
from alembic import op
from sqlalchemy import text

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None

UPGRADE_SQL = """
ALTER TABLE eea_document ADD COLUMN IF NOT EXISTS canonical_md_object_key text;
ALTER TABLE eea_document ADD COLUMN IF NOT EXISTS canonical_md_sha256 char(64);
ALTER TABLE eea_document ADD COLUMN IF NOT EXISTS markitdown_version text;
ALTER TABLE eea_document ADD COLUMN IF NOT EXISTS figure_count integer NOT NULL DEFAULT 0;
ALTER TABLE eea_document ADD COLUMN IF NOT EXISTS vision_model text;
ALTER TABLE eea_document ADD COLUMN IF NOT EXISTS ingest_status text NOT NULL DEFAULT 'stored';
ALTER TABLE eea_document ADD COLUMN IF NOT EXISTS ingest_error text;
ALTER TABLE eea_document ADD COLUMN IF NOT EXISTS ingested_at timestamptz;
"""

DOWNGRADE_SQL = """
ALTER TABLE eea_document DROP COLUMN IF EXISTS canonical_md_object_key;
ALTER TABLE eea_document DROP COLUMN IF EXISTS canonical_md_sha256;
ALTER TABLE eea_document DROP COLUMN IF EXISTS markitdown_version;
ALTER TABLE eea_document DROP COLUMN IF EXISTS figure_count;
ALTER TABLE eea_document DROP COLUMN IF EXISTS vision_model;
ALTER TABLE eea_document DROP COLUMN IF EXISTS ingest_status;
ALTER TABLE eea_document DROP COLUMN IF EXISTS ingest_error;
ALTER TABLE eea_document DROP COLUMN IF EXISTS ingested_at;
"""


def upgrade() -> None:
    op.get_bind().execute(text(UPGRADE_SQL))


def downgrade() -> None:
    op.get_bind().execute(text(DOWNGRADE_SQL))
