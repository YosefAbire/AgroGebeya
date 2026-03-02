"""add_product_images_and_profile_image

Revision ID: 59417cdc0a17
Revises: 52ae36cc2667
Create Date: 2026-03-02 08:53:09.057961

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '59417cdc0a17'
down_revision = '52ae36cc2667'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add profile_image_url column to users table
    op.add_column('users', sa.Column('profile_image_url', sa.String(), nullable=True))
    
    # Create product_images table
    op.create_table(
        'product_images',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('image_url', sa.String(), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('display_order', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_product_images_id'), 'product_images', ['id'], unique=False)
    op.create_index(op.f('ix_product_images_product_id'), 'product_images', ['product_id'], unique=False)


def downgrade() -> None:
    # Drop product_images table
    op.drop_index(op.f('ix_product_images_product_id'), table_name='product_images')
    op.drop_index(op.f('ix_product_images_id'), table_name='product_images')
    op.drop_table('product_images')
    
    # Remove profile_image_url column from users table
    op.drop_column('users', 'profile_image_url')
