"""Access history for IP-based auto identity (profile login history).

Revision ID: 0005
Revises: 0004
Create Date: 2026-10-28
"""
from alembic import op
from sqlalchemy import text

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None

UPGRADE_SQL = """
CREATE TABLE IF NOT EXISTS eea_access_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip text NOT NULL,
    ua_browser text NOT NULL,
    ua_os text NOT NULL,
    ua_raw text,
    page text,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_eea_access_log_ip_created
    ON eea_access_log (ip, created_at);
"""

DOWNGRADE_SQL = """
DROP TABLE IF EXISTS eea_access_log;
"""


def upgrade() -> None:
    op.get_bind().execute(text(UPGRADE_SQL))


def downgrade() -> None:
    op.get_bind().execute(text(DOWNGRADE_SQL))
