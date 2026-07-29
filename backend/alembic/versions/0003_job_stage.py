"""jobs: add stage column

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("jobs", sa.Column("stage", sa.String(length=32), nullable=False, server_default="uploading"))
    op.execute("UPDATE jobs SET stage = 'ready' WHERE status = 'complete'")
    op.execute("UPDATE jobs SET stage = 'error' WHERE status = 'failed'")


def downgrade() -> None:
    op.drop_column("jobs", "stage")