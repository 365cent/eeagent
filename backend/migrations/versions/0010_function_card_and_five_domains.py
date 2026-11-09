"""Add the user-approved five domains and function card fields.

Revision ID: 0010_fn_card_domains
Revises: 0009_audit_before_after
"""
from alembic import op


revision = "0010_fn_card_domains"
down_revision = "0009_audit_before_after"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("ck_vocab_kind", "eea_vocab", type_="check")
    op.create_check_constraint(
        "ck_vocab_kind",
        "eea_vocab",
        "kind IN ('tech_tag', 'domain', 'recommendation_level', 'target_domain')",
    )

    # See 0009: fresh databases receive current ORM columns in 0001, while
    # existing installations receive them here through additive ALTERs.
    op.execute("ALTER TABLE eea_vehicle_function ADD COLUMN IF NOT EXISTS recommendation_level TEXT")
    op.execute("ALTER TABLE eea_vehicle_function ADD COLUMN IF NOT EXISTS automation_levels JSONB")
    op.execute("ALTER TABLE eea_vehicle_function ADD COLUMN IF NOT EXISTS target_domain TEXT")
    op.execute("ALTER TABLE eea_vehicle_function ADD COLUMN IF NOT EXISTS recommendation_reason TEXT")
    op.execute("ALTER TABLE eea_vehicle_function ADD COLUMN IF NOT EXISTS l2_l4_difference TEXT")

    op.execute(
        """
        INSERT INTO eea_vocab (id, kind, name) VALUES
          (gen_random_uuid(), 'domain', '软件'),
          (gen_random_uuid(), 'domain', '硬件'),
          (gen_random_uuid(), 'domain', '通信'),
          (gen_random_uuid(), 'domain', '电源与能源管理'),
          (gen_random_uuid(), 'domain', '工具')
        ON CONFLICT (kind, name) DO NOTHING
        """
    )


def downgrade() -> None:
    op.execute(
        """
        DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM eea_vocab
            WHERE kind IN ('recommendation_level', 'target_domain')
          ) THEN
            RAISE EXCEPTION 'remove configured function-card vocabularies before downgrade';
          END IF;
        END $$
        """
    )
    op.execute("ALTER TABLE eea_vehicle_function DROP COLUMN IF EXISTS l2_l4_difference")
    op.execute("ALTER TABLE eea_vehicle_function DROP COLUMN IF EXISTS recommendation_reason")
    op.execute("ALTER TABLE eea_vehicle_function DROP COLUMN IF EXISTS target_domain")
    op.execute("ALTER TABLE eea_vehicle_function DROP COLUMN IF EXISTS automation_levels")
    op.execute("ALTER TABLE eea_vehicle_function DROP COLUMN IF EXISTS recommendation_level")
    op.drop_constraint("ck_vocab_kind", "eea_vocab", type_="check")
    op.create_check_constraint("ck_vocab_kind", "eea_vocab", "kind IN ('tech_tag', 'domain')")
