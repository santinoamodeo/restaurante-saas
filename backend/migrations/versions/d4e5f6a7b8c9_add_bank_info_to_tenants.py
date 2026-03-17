"""add bank_info to tenants

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Down_revision: c3d4e5f6a7b8
Branch Labels: None
Depends_on: None
"""
from alembic import op
import sqlalchemy as sa

revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('tenants', sa.Column('bank_info', sa.String(300), nullable=True))


def downgrade() -> None:
    op.drop_column('tenants', 'bank_info')
