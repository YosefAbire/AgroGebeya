"""add_id_images_to_verification

Revision ID: c1f2a3b4d5e6
Revises: 59417cdc0a17
Branch Labels: None
Depends On: None

"""
from alembic import op
import sqlalchemy as sa

revision = 'c1f2a3b4d5e6'
down_revision = '59417cdc0a17'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('verification_requests', sa.Column('id_front_image_url', sa.String(500), nullable=True))
    op.add_column('verification_requests', sa.Column('id_back_image_url', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('verification_requests', 'id_back_image_url')
    op.drop_column('verification_requests', 'id_front_image_url')
