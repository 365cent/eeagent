"""Provider usage snapshot on durable agent runs.

Revision ID: 0015_agent_run_usage
Revises: 0014_panorama_import
"""

from alembic import op
from sqlalchemy import text

revision = "0015_agent_run_usage"
down_revision = "0014_panorama_import"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.get_bind().execute(
        text("ALTER TABLE eea_agent_run ADD COLUMN IF NOT EXISTS usage_json JSONB")
    )


def downgrade() -> None:
    op.get_bind().execute(text("ALTER TABLE eea_agent_run DROP COLUMN IF EXISTS usage_json"))
