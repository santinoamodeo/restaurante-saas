"""add transfer to paymentmethod enum

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Down_revision: d4e5f6a7b8c9
Branch Labels: None
Depends_on: None
"""
from alembic import op

revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE paymentmethod ADD VALUE IF NOT EXISTS 'transfer'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values without recreating the type
    pass
