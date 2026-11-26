"""Record each apply run of the orphan maintenance command (BE-01)."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "0026_maintenance_run"
down_revision = "0025_capture_client_claim_worker"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "eea_maintenance_run",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("command", sa.Text(), nullable=False),
        sa.Column("scan_limit", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("scanned", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("pruned", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("operator_subject", sa.Text(), nullable=False),
        sa.Column("operator_role", sa.Text(), nullable=False, server_default="system"),
        sa.Column("details", JSONB(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("scan_limit >= 0", name="ck_maintenance_run_limit"),
        sa.CheckConstraint("scanned >= 0", name="ck_maintenance_run_scanned"),
        sa.CheckConstraint("pruned >= 0", name="ck_maintenance_run_pruned"),
        sa.PrimaryKeyConstraint("id"),
        if_not_exists=True,
    )
    op.create_index(
        "eea_maintenance_run_command_idx",
        "eea_maintenance_run",
        ["command", "finished_at"],
        if_not_exists=True,
    )


def downgrade() -> None:
    op.drop_index("eea_maintenance_run_command_idx", table_name="eea_maintenance_run")
    op.drop_table("eea_maintenance_run")
