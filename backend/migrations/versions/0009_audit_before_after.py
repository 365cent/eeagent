"""Store explicit before/after values on correction audit records.

Revision ID: 0009_audit_before_after
Revises: 0008
"""
from alembic import op


revision = "0009_audit_before_after"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The legacy 0001 migration creates tables from the current ORM metadata,
    # so a fresh database can already have additive columns represented here.
    op.execute("ALTER TABLE eea_correction_audit ADD COLUMN IF NOT EXISTS old_value JSONB")
    op.execute("ALTER TABLE eea_correction_audit ADD COLUMN IF NOT EXISTS new_value JSONB")
    op.execute(
        "UPDATE eea_correction_audit SET old_value = machine_value, new_value = human_value"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE eea_correction_audit DROP COLUMN IF EXISTS new_value")
    op.execute("ALTER TABLE eea_correction_audit DROP COLUMN IF EXISTS old_value")
