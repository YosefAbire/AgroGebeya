"""add_functional_requirements_tables

Revision ID: 52ae36cc2667
Revises: a797d7abda0c
Create Date: 2026-03-01 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '52ae36cc2667'
down_revision = 'a797d7abda0c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to users table
    op.add_column('users', sa.Column('verification_status', sa.String(20), server_default='unverified'))
    op.add_column('users', sa.Column('language_preference', sa.String(5), server_default='en'))
    op.add_column('users', sa.Column('last_login_at', sa.DateTime(timezone=True)))
    op.add_column('users', sa.Column('failed_login_attempts', sa.Integer(), server_default='0'))
    op.add_column('users', sa.Column('locked_until', sa.DateTime(timezone=True)))
    
    # Add new columns to orders table
    op.add_column('orders', sa.Column('payment_status', sa.String(20), server_default='unpaid'))
    op.add_column('orders', sa.Column('paid_at', sa.DateTime(timezone=True)))
    op.add_column('orders', sa.Column('completed_at', sa.DateTime(timezone=True)))
    
    # Create verification_requests table
    op.create_table(
        'verification_requests',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('encrypted_national_id', sa.String(255), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('reviewed_at', sa.DateTime(timezone=True)),
        sa.Column('reviewed_by', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('rejection_reason', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('NOW()'))
    )
    op.create_index('idx_verification_status', 'verification_requests', ['status'])
    op.create_index('idx_verification_user', 'verification_requests', ['user_id'])
    
    # Create transactions table
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('order_id', sa.Integer(), sa.ForeignKey('orders.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('currency', sa.String(3), server_default='ETB'),
        sa.Column('payment_method', sa.String(50)),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('chapa_transaction_ref', sa.String(255), unique=True),
        sa.Column('chapa_checkout_url', sa.Text()),
        sa.Column('gross_amount', sa.Numeric(10, 2)),
        sa.Column('net_amount', sa.Numeric(10, 2)),
        sa.Column('fee_amount', sa.Numeric(10, 2)),
        sa.Column('refund_transaction_id', sa.Integer(), sa.ForeignKey('transactions.id')),
        sa.Column('transaction_metadata', postgresql.JSONB()),
        sa.Column('error_message', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('NOW()')),
        sa.Column('completed_at', sa.DateTime(timezone=True))
    )
    op.create_index('idx_transaction_order', 'transactions', ['order_id'])
    op.create_index('idx_transaction_user', 'transactions', ['user_id'])
    op.create_index('idx_transaction_status', 'transactions', ['status'])
    op.create_index('idx_transaction_ref', 'transactions', ['chapa_transaction_ref'])
    op.create_index('idx_transaction_created', 'transactions', ['created_at'])
    
    # Create transport_requests table
    op.create_table(
        'transport_requests',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('order_id', sa.Integer(), sa.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('pickup_location', sa.String(255), nullable=False),
        sa.Column('pickup_latitude', sa.Numeric(10, 8)),
        sa.Column('pickup_longitude', sa.Numeric(11, 8)),
        sa.Column('delivery_location', sa.String(255), nullable=False),
        sa.Column('delivery_latitude', sa.Numeric(10, 8)),
        sa.Column('delivery_longitude', sa.Numeric(11, 8)),
        sa.Column('preferred_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('weight', sa.Numeric(8, 2)),
        sa.Column('vehicle_type', sa.String(50)),
        sa.Column('special_instructions', sa.Text()),
        sa.Column('estimated_distance', sa.Numeric(8, 2)),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending_approval'),
        sa.Column('tracking_number', sa.String(50), unique=True),
        sa.Column('driver_name', sa.String(255)),
        sa.Column('driver_phone', sa.String(20)),
        sa.Column('driver_vehicle', sa.String(100)),
        sa.Column('approved_by', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('approved_at', sa.DateTime(timezone=True)),
        sa.Column('rejection_reason', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('NOW()')),
        sa.Column('delivered_at', sa.DateTime(timezone=True))
    )
    op.create_index('idx_transport_order', 'transport_requests', ['order_id'])
    op.create_index('idx_transport_user', 'transport_requests', ['user_id'])
    op.create_index('idx_transport_status', 'transport_requests', ['status'])
    op.create_index('idx_transport_tracking', 'transport_requests', ['tracking_number'])
    
    # Create messages table
    op.create_table(
        'messages',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('sender_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('recipient_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), server_default='false'),
        sa.Column('read_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'))
    )
    op.create_index('idx_message_sender', 'messages', ['sender_id'])
    op.create_index('idx_message_recipient', 'messages', ['recipient_id'])
    op.create_index('idx_message_conversation', 'messages', ['sender_id', 'recipient_id'])
    op.create_index('idx_message_unread', 'messages', ['recipient_id', 'is_read'], postgresql_where=sa.text('is_read = false'))
    op.create_index('idx_message_created', 'messages', ['created_at'])
    
    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('notification_metadata', postgresql.JSONB()),
        sa.Column('is_read', sa.Boolean(), server_default='false'),
        sa.Column('read_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'))
    )
    op.create_index('idx_notification_user', 'notifications', ['user_id'])
    op.create_index('idx_notification_unread', 'notifications', ['user_id', 'is_read'], postgresql_where=sa.text('is_read = false'))
    op.create_index('idx_notification_type', 'notifications', ['type'])
    op.create_index('idx_notification_created', 'notifications', ['created_at'])
    
    # Create notification_preferences table
    op.create_table(
        'notification_preferences',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('email_enabled', sa.Boolean(), server_default='true'),
        sa.Column('sms_enabled', sa.Boolean(), server_default='false'),
        sa.Column('push_enabled', sa.Boolean(), server_default='true'),
        sa.Column('order_notifications', sa.Boolean(), server_default='true'),
        sa.Column('payment_notifications', sa.Boolean(), server_default='true'),
        sa.Column('transport_notifications', sa.Boolean(), server_default='true'),
        sa.Column('message_notifications', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('NOW()'))
    )
    
    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL')),
        sa.Column('action_type', sa.String(50), nullable=False),
        sa.Column('resource_type', sa.String(50)),
        sa.Column('resource_id', sa.Integer()),
        sa.Column('before_value', postgresql.JSONB()),
        sa.Column('after_value', postgresql.JSONB()),
        sa.Column('ip_address', postgresql.INET()),
        sa.Column('user_agent', sa.Text()),
        sa.Column('success', sa.Boolean(), server_default='true'),
        sa.Column('error_message', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'))
    )
    op.create_index('idx_audit_user', 'audit_logs', ['user_id'])
    op.create_index('idx_audit_action', 'audit_logs', ['action_type'])
    op.create_index('idx_audit_resource', 'audit_logs', ['resource_type', 'resource_id'])
    op.create_index('idx_audit_created', 'audit_logs', ['created_at'])
    op.create_index('idx_audit_failed_auth', 'audit_logs', ['action_type', 'success'], 
                    postgresql_where=sa.text("action_type = 'authentication' AND success = false"))
    
    # Create feedback table
    op.create_table(
        'feedback',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('contact_preference', sa.Boolean(), server_default='false'),
        sa.Column('status', sa.String(20), server_default='submitted'),
        sa.Column('reviewed_by', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('reviewed_at', sa.DateTime(timezone=True)),
        sa.Column('resolution', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'))
    )
    op.create_index('idx_feedback_user', 'feedback', ['user_id'])
    op.create_index('idx_feedback_type', 'feedback', ['type'])
    op.create_index('idx_feedback_status', 'feedback', ['status'])
    op.create_index('idx_feedback_created', 'feedback', ['created_at'])
    
    # Create system_config table
    op.create_table(
        'system_config',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('key', sa.String(100), nullable=False, unique=True),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('value_type', sa.String(20), nullable=False),
        sa.Column('is_encrypted', sa.Boolean(), server_default='false'),
        sa.Column('description', sa.Text()),
        sa.Column('updated_by', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('NOW()'))
    )
    op.create_index('idx_config_key', 'system_config', ['key'])
    
    # Create config_history table
    op.create_table(
        'config_history',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('config_id', sa.Integer(), sa.ForeignKey('system_config.id', ondelete='CASCADE'), nullable=False),
        sa.Column('key', sa.String(100), nullable=False),
        sa.Column('old_value', sa.Text()),
        sa.Column('new_value', sa.Text(), nullable=False),
        sa.Column('changed_by', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'))
    )
    op.create_index('idx_config_history_config', 'config_history', ['config_id'])
    op.create_index('idx_config_history_created', 'config_history', ['created_at'])
    
    # Create backups table
    op.create_table(
        'backups',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('backup_type', sa.String(20), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('file_size', sa.BigInteger()),
        sa.Column('storage_path', sa.Text(), nullable=False),
        sa.Column('is_encrypted', sa.Boolean(), server_default='true'),
        sa.Column('is_verified', sa.Boolean(), server_default='false'),
        sa.Column('verified_at', sa.DateTime(timezone=True)),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()')),
        sa.Column('expires_at', sa.DateTime(timezone=True))
    )
    op.create_index('idx_backup_type', 'backups', ['backup_type'])
    op.create_index('idx_backup_created', 'backups', ['created_at'])
    op.create_index('idx_backup_expires', 'backups', ['expires_at'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('backups')
    op.drop_table('config_history')
    op.drop_table('system_config')
    op.drop_table('feedback')
    op.drop_table('audit_logs')
    op.drop_table('notification_preferences')
    op.drop_table('notifications')
    op.drop_table('messages')
    op.drop_table('transport_requests')
    op.drop_table('transactions')
    op.drop_table('verification_requests')
    
    # Remove columns from orders table
    op.drop_column('orders', 'completed_at')
    op.drop_column('orders', 'paid_at')
    op.drop_column('orders', 'payment_status')
    
    # Remove columns from users table
    op.drop_column('users', 'locked_until')
    op.drop_column('users', 'failed_login_attempts')
    op.drop_column('users', 'last_login_at')
    op.drop_column('users', 'language_preference')
    op.drop_column('users', 'verification_status')
