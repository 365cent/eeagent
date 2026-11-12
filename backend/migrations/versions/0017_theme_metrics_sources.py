"""Theme metrics: distinct URLs across signal_source rows (BE-05)."""

from alembic import op
from sqlalchemy import text

revision = "0017_theme_metrics_sources"
down_revision = "0016_release_foundation"
branch_labels = None
depends_on = None

METRICS_VIEW = """
CREATE OR REPLACE VIEW eea_v_tech_theme_metrics AS
SELECT
  t.id AS tech_theme_id,
  count(DISTINCT s.id) FILTER (
    WHERE s.evidence_status_code IS DISTINCT FROM 'archived'
  ) AS signal_frequency,
  count(DISTINCT ss.url_normalized) FILTER (
    WHERE ss.url_normalized IS NOT NULL AND ss.url_normalized <> ''
  ) AS source_count
FROM eea_tech_theme t
LEFT JOIN eea_signal s ON s.tech_theme_id = t.id
LEFT JOIN eea_signal_source ss ON ss.signal_id = s.id
GROUP BY t.id;
"""


def upgrade() -> None:
    op.get_bind().execute(text(METRICS_VIEW))


def downgrade() -> None:
    op.get_bind().execute(
        text(
            """
CREATE OR REPLACE VIEW eea_v_tech_theme_metrics AS
SELECT
  t.id AS tech_theme_id,
  count(s.id) FILTER (WHERE s.evidence_status_code IS DISTINCT FROM 'archived') AS signal_frequency,
  count(DISTINCT s.url_normalized) FILTER (WHERE s.id IS NOT NULL) AS source_count
FROM eea_tech_theme t
LEFT JOIN eea_signal s ON s.tech_theme_id = t.id
GROUP BY t.id;
"""
        )
    )
