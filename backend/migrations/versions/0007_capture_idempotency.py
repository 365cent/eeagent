"""Persist unified capture submission keys and payload fingerprints.

Revision ID: 0007
Revises: 0006
"""
from alembic import op
from sqlalchemy import text

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None

UPGRADE_SQL = """
ALTER TABLE eea_signal ADD COLUMN IF NOT EXISTS capture_submission_id uuid;
ALTER TABLE eea_signal ADD COLUMN IF NOT EXISTS capture_submission_sha256 char(64);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'eea_signal'::regclass
          AND conname = 'uq_signal_capture_submission_id'
    ) THEN
        ALTER TABLE eea_signal
            ADD CONSTRAINT uq_signal_capture_submission_id UNIQUE (capture_submission_id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'eea_signal'::regclass
          AND conname = 'ck_signal_capture_submission_pair'
    ) THEN
        ALTER TABLE eea_signal
            ADD CONSTRAINT ck_signal_capture_submission_pair
            CHECK ((capture_submission_id IS NULL) = (capture_submission_sha256 IS NULL));
    END IF;
END $$;
"""

DOWNGRADE_SQL = """
ALTER TABLE eea_signal DROP CONSTRAINT IF EXISTS ck_signal_capture_submission_pair;
ALTER TABLE eea_signal DROP CONSTRAINT IF EXISTS uq_signal_capture_submission_id;
ALTER TABLE eea_signal DROP COLUMN IF EXISTS capture_submission_sha256;
ALTER TABLE eea_signal DROP COLUMN IF EXISTS capture_submission_id;
"""


def upgrade() -> None:
    op.get_bind().execute(text(UPGRADE_SQL))


def downgrade() -> None:
    op.get_bind().execute(text(DOWNGRADE_SQL))
