"""Add the evidence-backed demand derivation trace.

Revision ID: 0011_demand_trace
Revises: 0010_fn_card_domains
"""
from alembic import op


revision = "0011_demand_trace"
down_revision = "0010_fn_card_domains"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE eea_demand_point ADD COLUMN IF NOT EXISTS derivation_trace JSONB")


def downgrade() -> None:
    op.execute(
        """
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM eea_demand_point WHERE derivation_trace IS NOT NULL) THEN
            RAISE EXCEPTION 'clear demand derivation traces before downgrade';
          END IF;
        END $$
        """
    )
    op.execute("ALTER TABLE eea_demand_point DROP COLUMN IF EXISTS derivation_trace")
