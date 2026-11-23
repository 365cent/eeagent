"""Document figure metadata and heading-aware chunks (BE-12)."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "0019_document_structure"
down_revision = "0018_capture_tokens"
branch_labels = None
depends_on = None


def _add_column(table: str, column: sa.Column) -> None:
    """0001 creates current ORM columns on a fresh DB; skip ones already there."""
    existing = {c["name"] for c in sa.inspect(op.get_bind()).get_columns(table)}
    if column.name not in existing:
        op.add_column(table, column)


def upgrade() -> None:
    _add_column("eea_document_figure", sa.Column("object_key", sa.Text(), nullable=True))
    _add_column("eea_document_figure", sa.Column("mime", sa.Text(), nullable=True))
    _add_column("eea_document_figure", sa.Column("source", sa.Text(), nullable=True))
    _add_column("eea_document_figure", sa.Column("page", sa.Integer(), nullable=True))
    _add_column("eea_document_figure", sa.Column("position", sa.Integer(), nullable=True))
    _add_column("eea_document_figure", sa.Column("section_path", JSONB(), nullable=True))
    _add_column(
        "eea_document_figure",
        sa.Column("occurrence_count", sa.Integer(), server_default="1", nullable=False),
    )
    _add_column("eea_document_figure", sa.Column("confidence", sa.Float(), nullable=True))
    _add_column("eea_document_figure", sa.Column("review_reason", sa.Text(), nullable=True))

    _add_column("eea_document_chunk", sa.Column("section_path", JSONB(), nullable=True))
    _add_column("eea_document_chunk", sa.Column("heading_level", sa.Integer(), nullable=True))
    _add_column("eea_document_chunk", sa.Column("ordinal", sa.Integer(), nullable=True))
    _add_column("eea_document_chunk", sa.Column("char_start", sa.Integer(), nullable=True))
    _add_column("eea_document_chunk", sa.Column("char_end", sa.Integer(), nullable=True))
    _add_column("eea_document_chunk", sa.Column("figure_indices", JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("eea_document_chunk", "figure_indices")
    op.drop_column("eea_document_chunk", "char_end")
    op.drop_column("eea_document_chunk", "char_start")
    op.drop_column("eea_document_chunk", "ordinal")
    op.drop_column("eea_document_chunk", "heading_level")
    op.drop_column("eea_document_chunk", "section_path")

    op.drop_column("eea_document_figure", "review_reason")
    op.drop_column("eea_document_figure", "confidence")
    op.drop_column("eea_document_figure", "occurrence_count")
    op.drop_column("eea_document_figure", "section_path")
    op.drop_column("eea_document_figure", "position")
    op.drop_column("eea_document_figure", "page")
    op.drop_column("eea_document_figure", "source")
    op.drop_column("eea_document_figure", "mime")
    op.drop_column("eea_document_figure", "object_key")
