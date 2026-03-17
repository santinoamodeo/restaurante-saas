"""add address to tenants

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Down_revision: e5f6a7b8c9d0
Branch Labels: None
Depends_on: None
"""
from alembic import op
import sqlalchemy as sa

revision = 'f6a7b8c9d0e1'
down_revision = 'e5f6a7b8c9d0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('tenants', sa.Column('address', sa.String(400), nullable=True))


def downgrade() -> None:
    op.drop_column('tenants', 'address')
