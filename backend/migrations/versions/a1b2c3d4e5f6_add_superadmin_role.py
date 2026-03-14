"""add_superadmin_role

Revision ID: a1b2c3d4e5f6
Revises: cfb1e47fdad6
Create Date: 2026-03-13 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'cfb1e47fdad6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'superadmin'")


def downgrade() -> None:
    # PostgreSQL no permite eliminar valores de un enum directamente.
    # Para hacer downgrade manual: recrear el tipo sin 'superadmin'.
    pass
