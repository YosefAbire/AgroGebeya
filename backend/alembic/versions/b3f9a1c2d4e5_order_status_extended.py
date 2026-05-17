"""order status extended - add cancelled, pending_payment, paid, completed statuses and new columns

Revision ID: b3f9a1c2d4e5
Revises: 59417cdc0a17
Create Date: 2026-04-03
"""
from alembic import op
import sqlalchemy as sa

revision = 'b3f9a1c2d4e5'
down_revision = '59417cdc0a17'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to orders table
    op.add_column('orders', sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('orders', sa.Column('cancellation_reason', sa.String(500), nullable=True))
    op.add_column('orders', sa.Column('payment_deadline', sa.DateTime(timezone=True), nullable=True))

    # Extend the orderstatus enum with new values
    # PostgreSQL requires special handling for enum changes
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'pending_payment'")
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'paid'")
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'completed'")
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'cancelled'")


def downgrade():
    op.drop_column('orders', 'cancelled_at')
    op.drop_column('orders', 'cancellation_reason')
    op.drop_column('orders', 'payment_deadline')
