from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.notification import Notification, NotificationPreference, NotificationType
from app.models.user import User

class NotificationService:
    """Service for managing notifications"""
    
    @staticmethod
    async def create_notification(
        db: AsyncSession,
        user_id: int,
        notification_type: str,
        title: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Notification:
        """
        Create a new notification
        
        Args:
            db: Database session
            user_id: User ID to notify
            notification_type: Type of notification
            title: Notification title
            content: Notification content
            metadata: Optional metadata dict
            
        Returns:
            Created Notification object
        """
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            content=content,
            metadata=metadata
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        return notification
    
    @staticmethod
    async def get_user_notifications(
        db: AsyncSession,
        user_id: int,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0
    ) -> List[Notification]:
        """
        Get notifications for a user
        
        Args:
            db: Database session
            user_id: User ID
            unread_only: If True, return only unread notifications
            limit: Maximum number of notifications to return
            offset: Offset for pagination
            
        Returns:
            List of Notification objects
        """
        query = select(Notification).where(Notification.user_id == user_id)
        
        if unread_only:
            query = query.where(Notification.is_read == False)
        
        query = query.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def get_unread_count(db: AsyncSession, user_id: int) -> int:
        """
        Get count of unread notifications for a user
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Count of unread notifications
        """
        query = select(Notification).where(
            and_(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
        )
        result = await db.execute(query)
        return len(result.scalars().all())
    
    @staticmethod
    async def mark_as_read(
        db: AsyncSession,
        notification_id: int,
        user_id: int
    ) -> Optional[Notification]:
        """
        Mark a notification as read
        
        Args:
            db: Database session
            notification_id: Notification ID
            user_id: User ID (for authorization)
            
        Returns:
            Updated Notification object or None if not found
        """
        query = select(Notification).where(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
        )
        result = await db.execute(query)
        notification = result.scalar_one_or_none()
        
        if notification and not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            await db.commit()
            await db.refresh(notification)
        
        return notification
    
    @staticmethod
    async def mark_all_as_read(db: AsyncSession, user_id: int) -> int:
        """
        Mark all notifications as read for a user
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Number of notifications marked as read
        """
        query = select(Notification).where(
            and_(
                Notification.user_id == user_id,
                Notification.is_read == False
            )
        )
        result = await db.execute(query)
        notifications = result.scalars().all()
        
        count = 0
        for notification in notifications:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            count += 1
        
        await db.commit()
        return count
    
    @staticmethod
    async def delete_old_notifications(db: AsyncSession, days: int = 90) -> int:
        """
        Delete notifications older than specified days
        
        Args:
            db: Database session
            days: Number of days to keep notifications
            
        Returns:
            Number of notifications deleted
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query = select(Notification).where(Notification.created_at < cutoff_date)
        result = await db.execute(query)
        notifications = result.scalars().all()
        
        count = len(notifications)
        for notification in notifications:
            await db.delete(notification)
        
        await db.commit()
        return count
    
    @staticmethod
    async def get_user_preferences(
        db: AsyncSession,
        user_id: int
    ) -> Optional[NotificationPreference]:
        """
        Get notification preferences for a user
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            NotificationPreference object or None
        """
        query = select(NotificationPreference).where(
            NotificationPreference.user_id == user_id
        )
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def create_default_preferences(
        db: AsyncSession,
        user_id: int
    ) -> NotificationPreference:
        """
        Create default notification preferences for a user
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Created NotificationPreference object
        """
        preferences = NotificationPreference(user_id=user_id)
        db.add(preferences)
        await db.commit()
        await db.refresh(preferences)
        return preferences
    
    @staticmethod
    async def update_preferences(
        db: AsyncSession,
        user_id: int,
        **kwargs
    ) -> Optional[NotificationPreference]:
        """
        Update notification preferences for a user
        
        Args:
            db: Database session
            user_id: User ID
            **kwargs: Preference fields to update
            
        Returns:
            Updated NotificationPreference object or None
        """
        preferences = await NotificationService.get_user_preferences(db, user_id)
        
        if not preferences:
            preferences = await NotificationService.create_default_preferences(db, user_id)
        
        for key, value in kwargs.items():
            if hasattr(preferences, key):
                setattr(preferences, key, value)
        
        await db.commit()
        await db.refresh(preferences)
        return preferences


# Helper functions for creating specific notification types
async def notify_order_status_change(
    db: AsyncSession,
    user_id: int,
    order_id: int,
    new_status: str
):
    """Create notification for order status change"""
    await NotificationService.create_notification(
        db=db,
        user_id=user_id,
        notification_type="order_status",
        title="Order Status Updated",
        content=f"Your order #{order_id} status has been updated to {new_status}",
        metadata={"order_id": order_id, "status": new_status}
    )


async def notify_payment_completed(
    db: AsyncSession,
    user_id: int,
    order_id: int,
    amount: float
):
    """Create notification for payment completion"""
    await NotificationService.create_notification(
        db=db,
        user_id=user_id,
        notification_type="payment",
        title="Payment Completed",
        content=f"Payment of {amount} ETB for order #{order_id} has been completed successfully",
        metadata={"order_id": order_id, "amount": amount}
    )


async def notify_verification_status(
    db: AsyncSession,
    user_id: int,
    status: str,
    reason: Optional[str] = None
):
    """Create notification for verification status change"""
    content = f"Your National ID verification has been {status}"
    if reason:
        content += f". Reason: {reason}"
    
    await NotificationService.create_notification(
        db=db,
        user_id=user_id,
        notification_type="verification",
        title="Verification Status Updated",
        content=content,
        metadata={"status": status, "reason": reason}
    )


async def notify_new_message(
    db: AsyncSession,
    user_id: int,
    sender_name: str,
    message_id: int
):
    """Create notification for new message"""
    await NotificationService.create_notification(
        db=db,
        user_id=user_id,
        notification_type="message",
        title="New Message",
        content=f"You have a new message from {sender_name}",
        metadata={"message_id": message_id, "sender_name": sender_name}
    )


async def notify_transport_status(
    db: AsyncSession,
    user_id: int,
    transport_id: int,
    status: str,
    tracking_number: Optional[str] = None
):
    """Create notification for transport status change"""
    content = f"Your transport request status has been updated to {status}"
    if tracking_number:
        content += f". Tracking number: {tracking_number}"
    
    await NotificationService.create_notification(
        db=db,
        user_id=user_id,
        notification_type="transport",
        title="Transport Status Updated",
        content=content,
        metadata={"transport_id": transport_id, "status": status, "tracking_number": tracking_number}
    )
