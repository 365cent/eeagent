"""Document-sourced signals (S1-3, 2026-10-29 会议): eea_signal.document_id.

Revision ID: 0006
Revises: 0005
Create Date: 2026-10-29

- eea_signal.document_id: nullable FK to eea_document(id). A signal created
  from an uploaded document references it, so the evidence drawer can link
  straight to GET /documents/{id}/canonical.md.
- Document-sourced signals skip automatic theme aggregation (no demo-theme
  misattribution, backend/TODO.md S1-3) — that is route logic, not DDL.

Every DDL carries IF NOT EXISTS: 0001 runs Base.metadata.create_all driven by
the CURRENT models, so a fresh database already contains the new column by the
time 0006 upgrades — 0006 must stay idempotent while still adding the column
(and its named FK, matching the model's ForeignKey(name=...)) to pre-0006
databases.
"""
from alembic import op
from sqlalchemy import text

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None

UPGRADE_SQL = """
ALTER TABLE eea_signal ADD COLUMN IF NOT EXISTS document_id uuid;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_eea_signal_document') THEN
        ALTER TABLE eea_signal
            ADD CONSTRAINT fk_eea_signal_document
            FOREIGN KEY (document_id) REFERENCES eea_document (id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_eea_signal_document_id ON eea_signal (document_id);
"""

DOWNGRADE_SQL = """
ALTER TABLE eea_signal DROP COLUMN IF EXISTS document_id;
"""


def upgrade() -> None:
    op.get_bind().execute(text(UPGRADE_SQL))


def downgrade() -> None:
    op.get_bind().execute(text(DOWNGRADE_SQL))
