"""Canonical code literals in views + normalize label-form values to codes.

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-27

- eea_v_tech_theme_metrics: exclude evidence_status_code = 'archived' (code),
  matching the plan DDL (docs/platform-implementation-plan.md:569). 0001 used the
  label '已归档/停用', so rows storing the canonical code were NOT excluded.
- Normalize label-form values already stored in *_code columns to canonical
  codes (CONV-CLOSED-VOCAB): early API writes accepted raw labels. Codes are
  the canonical stored form; the comparison literals in views/queries use codes.
"""
from alembic import op
from sqlalchemy import text

from app.services.refcodes import REF_CODES

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

# (table, column, domain) — every code column backed by an eea_ref_code domain
CODE_COLUMNS = [
    ("eea_signal", "value_chain_stage_code", "value_chain_stage"),
    ("eea_signal", "signal_type_code", "signal_type"),
    ("eea_signal", "evolution_node_code", "evolution_node"),
    ("eea_signal", "evidence_status_code", "evidence_status"),
    ("eea_signal", "channel_code", "channel"),
    ("eea_tech_theme", "value_chain_stage_code", "value_chain_stage"),
    ("eea_demand_point", "value_chain_stage_code", "value_chain_stage"),
    ("eea_vehicle_function", "value_chain_stage_code", "value_chain_stage"),
]

METRICS_VIEW = """
CREATE OR REPLACE VIEW eea_v_tech_theme_metrics AS
SELECT
  t.id AS tech_theme_id,
  count(s.id) FILTER (WHERE s.evidence_status_code IS DISTINCT FROM 'archived') AS signal_frequency,
  count(DISTINCT s.url_normalized) FILTER (WHERE s.id IS NOT NULL) AS source_count
FROM eea_tech_theme t
LEFT JOIN eea_signal s ON s.tech_theme_id = t.id
GROUP BY t.id;
"""

# 0001 form (label literal) — restored on downgrade for schema symmetry
METRICS_VIEW_0001 = """
CREATE OR REPLACE VIEW eea_v_tech_theme_metrics AS
SELECT
  t.id AS tech_theme_id,
  count(s.id) FILTER (WHERE s.evidence_status_code IS DISTINCT FROM '已归档/停用') AS signal_frequency,
  count(DISTINCT s.url_normalized) FILTER (WHERE s.id IS NOT NULL) AS source_count
FROM eea_tech_theme t
LEFT JOIN eea_signal s ON s.tech_theme_id = t.id
GROUP BY t.id;
"""


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(text(METRICS_VIEW))
    # label-form → code normalization (only touches rows holding a registry label)
    for table, column, domain in CODE_COLUMNS:
        for item in REF_CODES[domain]:
            code, label = item[0], item[1]
            bind.execute(
                text(f"UPDATE {table} SET {column} = :code WHERE {column} = :label"),
                {"code": code, "label": label},
            )


def downgrade() -> None:
    # Schema returns to the 0001 view; the data normalization is forward-only —
    # codes are the canonical form, and rewriting valid code rows back to labels
    # would corrupt rows that were never label-form.
    bind = op.get_bind()
    bind.execute(text(METRICS_VIEW_0001))
