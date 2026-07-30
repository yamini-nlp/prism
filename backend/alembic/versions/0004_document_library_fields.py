"""documents: add status, size_bytes, updated_at

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("documents", sa.Column("status", sa.String(length=32), nullable=False, server_default="ready"))
    op.add_column("documents", sa.Column("size_bytes", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("documents", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True))
    op.execute("UPDATE documents SET updated_at = ingested_at WHERE updated_at IS NULL")
    op.alter_column("documents", "updated_at", nullable=False)
    op.create_index("ix_documents_ingested_at", "documents", ["ingested_at"])
    op.create_index("ix_documents_status", "documents", ["status"])
    op.create_index("ix_documents_source_type", "documents", ["source_type"])


def downgrade() -> None:
    op.drop_index("ix_documents_source_type", table_name="documents")
    op.drop_index("ix_documents_status", table_name="documents")
    op.drop_index("ix_documents_ingested_at", table_name="documents")
    op.drop_column("documents", "updated_at")
    op.drop_column("documents", "size_bytes")
    op.drop_column("documents", "status")