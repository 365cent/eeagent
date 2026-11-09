"""Add the persisted four-step strategic funnel workspace.

Revision ID: 0012_strategy_funnel
Revises: 0011_demand_trace
"""
from alembic import op


revision = "0012_strategy_funnel"
down_revision = "0011_demand_trace"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 0001 creates current ORM metadata on a fresh database, while existing
    # databases need these additive changes here.
    op.execute(
        "ALTER TABLE eea_strategic_assessment "
        "ADD COLUMN IF NOT EXISTS score_rationales JSONB"
    )
    op.execute(
        "ALTER TABLE eea_strategic_assessment "
        "ADD COLUMN IF NOT EXISTS funnel_snapshot JSONB"
    )
    op.execute(
        """
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'ck_assess_classification'
          ) THEN
            ALTER TABLE eea_strategic_assessment
              ADD CONSTRAINT ck_assess_classification
              CHECK (classification IN ('前瞻布局', '短期可落地', '产业投资/生态合作')) NOT VALID;
          END IF;
        END $$
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS eea_strategic_funnel (
          tech_landing_point_id UUID PRIMARY KEY
            REFERENCES eea_tech_landing_point(id) ON DELETE CASCADE,
          scan_scope TEXT,
          scan_sources JSONB,
          tier1_current_business_relation TEXT,
          tier1_future_business_relation TEXT,
          valuable_role TEXT,
          adaptation_decision TEXT
            CHECK (adaptation_decision IS NULL OR adaptation_decision IN ('pass', 'reject')),
          adaptation_reason TEXT,
          score_business SMALLINT
            CHECK (score_business IS NULL OR score_business BETWEEN 1 AND 5),
          rationale_business TEXT,
          score_maturity SMALLINT
            CHECK (score_maturity IS NULL OR score_maturity BETWEEN 1 AND 5),
          rationale_maturity TEXT,
          score_moat SMALLINT
            CHECK (score_moat IS NULL OR score_moat BETWEEN 1 AND 5),
          rationale_moat TEXT,
          score_supply_chain SMALLINT
            CHECK (score_supply_chain IS NULL OR score_supply_chain BETWEEN 1 AND 5),
          rationale_supply_chain TEXT,
          score_feasibility SMALLINT
            CHECK (score_feasibility IS NULL OR score_feasibility BETWEEN 1 AND 5),
          rationale_feasibility TEXT,
          classification TEXT
            CHECK (classification IS NULL OR classification IN ('前瞻布局', '短期可落地', '产业投资/生态合作')),
          strategy_note TEXT,
          finalized_assessment_id UUID,
          finalized_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_by TEXT NOT NULL
        )
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM eea_strategic_funnel) THEN
            RAISE EXCEPTION 'remove strategic funnel work records before downgrade';
          END IF;
          IF EXISTS (
            SELECT 1 FROM eea_strategic_assessment
            WHERE score_rationales IS NOT NULL OR funnel_snapshot IS NOT NULL
          ) THEN
            RAISE EXCEPTION 'remove strategic assessment snapshots before downgrade';
          END IF;
        END $$
        """
    )
    op.execute("DROP TABLE IF EXISTS eea_strategic_funnel")
    op.execute("ALTER TABLE eea_strategic_assessment DROP COLUMN IF EXISTS funnel_snapshot")
    op.execute("ALTER TABLE eea_strategic_assessment DROP COLUMN IF EXISTS score_rationales")
    op.execute("ALTER TABLE eea_strategic_assessment DROP CONSTRAINT IF EXISTS ck_assess_classification")
