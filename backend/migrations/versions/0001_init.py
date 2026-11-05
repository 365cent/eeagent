"""initial schema: 11 base tables + 2 views (docs/platform-implementation-plan.md §4.1)

Revision ID: 0001
Revises:
Create Date: 2026-10-27
"""
from alembic import op

import app.models  # noqa: F401
from app.db.base import Base

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

VIEWS = """
CREATE OR REPLACE VIEW eea_v_tech_theme_metrics AS
SELECT
  t.id AS tech_theme_id,
  count(s.id) FILTER (WHERE s.evidence_status_code IS DISTINCT FROM '已归档/停用') AS signal_frequency,
  count(DISTINCT s.url_normalized) FILTER (WHERE s.id IS NOT NULL) AS source_count
FROM eea_tech_theme t
LEFT JOIN eea_signal s ON s.tech_theme_id = t.id
GROUP BY t.id;

CREATE OR REPLACE VIEW eea_v_tech_theme_display_tags AS
SELECT t.id AS tech_theme_id, v.name AS tag_name, count(*) AS tag_hits
FROM eea_tech_theme t
JOIN eea_signal s ON s.tech_theme_id = t.id
JOIN eea_signal_tag st ON st.signal_id = s.id
JOIN eea_vocab v ON v.id = st.vocab_id AND v.kind = 'tech_tag'
GROUP BY t.id, v.name;
"""


def upgrade() -> None:
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)
    from sqlalchemy import text

    bind.execute(text(VIEWS))


def downgrade() -> None:
    bind = op.get_bind()
    from sqlalchemy import text

    bind.execute(
        text("DROP VIEW IF EXISTS eea_v_tech_theme_display_tags; DROP VIEW IF EXISTS eea_v_tech_theme_metrics;")
    )
    Base.metadata.drop_all(bind=bind)
