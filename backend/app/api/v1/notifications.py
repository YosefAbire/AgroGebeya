from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_db
from app.models.user import User
from app.schemas.notification import (
    NotificationResponse,
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
    UnreadNotificationCountResponse,
)
from app.api.v1.auth import get_current_user
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = Query(False, description="Return only unread notifications"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's notifications"""
    
    notifications = await NotificationService.get_user_notifications(
        db=db,
        user_id=current_user.id,
        unread_only=unread_only,
        limit=limit,
        offset=offset
    )
    
    return notifications


@router.get("/unread-count", response_model=UnreadNotificationCountResponse)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get count of unread notifications"""
    
    count = await NotificationService.get_unread_count(db=db, user_id=current_user.id)
    
    return UnreadNotificationCountResponse(unread_count=count)


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a notification as read"""
    
    notification = await NotificationService.mark_as_read(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id
    )
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return notification


@router.put("/read-all", status_code=status.HTTP_200_OK)
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all notifications as read"""
    
    count = await NotificationService.mark_all_as_read(db=db, user_id=current_user.id)
    
    return {"message": f"Marked {count} notifications as read"}


@router.get("/preferences", response_model=NotificationPreferenceResponse)
async def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's notification preferences"""
    
    preferences = await NotificationService.get_user_preferences(db=db, user_id=current_user.id)
    
    if not preferences:
        # Create default preferences if not exists
        preferences = await NotificationService.create_default_preferences(
            db=db,
            user_id=current_user.id
        )
    
    return preferences


@router.put("/preferences", response_model=NotificationPreferenceResponse)
async def update_notification_preferences(
    preferences_data: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user's notification preferences"""
    
    # Get update data
    update_data = preferences_data.model_dump(exclude_unset=True)
    
    preferences = await NotificationService.update_preferences(
        db=db,
        user_id=current_user.id,
        **update_data
    )
    
    return preferences
