"""Persist classification rule provenance and conflicts (BE-13)."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "0020_signal_classification_basis"
down_revision = "0019_document_structure"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("eea_signal", sa.Column("classification_basis", JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("eea_signal", "classification_basis")
