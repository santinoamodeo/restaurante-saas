"""add billing and owner fields

Revision ID: a1b2c3d4e5f6
Revises: f6a7b8c9d0e1
Down_revision: f6a7b8c9d0e1
Branch Labels: None
Depends_on: None
"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = 'f6a7b8c9d0e1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('tenants', sa.Column('billing_day', sa.Integer(), nullable=True))
    op.add_column('tenants', sa.Column('internal_notes', sa.String(1000), nullable=True))
    op.add_column('tenants', sa.Column('plan_price', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('full_name', sa.String(200), nullable=True))
    op.add_column('users', sa.Column('phone', sa.String(30), nullable=True))


def downgrade() -> None:
    op.drop_column('tenants', 'billing_day')
    op.drop_column('tenants', 'internal_notes')
    op.drop_column('tenants', 'plan_price')
    op.drop_column('users', 'full_name')
    op.drop_column('users', 'phone')
