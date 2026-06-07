"""store loan scoring demo payloads

Revision ID: e7f8a9b0c1d2
Revises: b1f2c3d4e5f6
Create Date: 2026-06-07 16:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e7f8a9b0c1d2"
down_revision: str | None = "b1f2c3d4e5f6"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("loans", sa.Column("credit_score", sa.JSON(), nullable=True))
    op.add_column("loans", sa.Column("loan_scoring_input", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("loans", "loan_scoring_input")
    op.drop_column("loans", "credit_score")
