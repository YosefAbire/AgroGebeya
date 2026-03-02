from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class NotificationResponse(BaseModel):
    """Schema for notification response"""
    id: int
    user_id: int
    type: str
    title: str
    content: str
    metadata: Optional[Dict[str, Any]] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class NotificationPreferenceResponse(BaseModel):
    """Schema for notification preference response"""
    id: int
    user_id: int
    email_enabled: bool
    sms_enabled: bool
    push_enabled: bool
    order_notifications: bool
    payment_notifications: bool
    transport_notifications: bool
    message_notifications: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class NotificationPreferenceUpdate(BaseModel):
    """Schema for updating notification preferences"""
    email_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    order_notifications: Optional[bool] = None
    payment_notifications: Optional[bool] = None
    transport_notifications: Optional[bool] = None
    message_notifications: Optional[bool] = None

class UnreadNotificationCountResponse(BaseModel):
    """Schema for unread notification count"""
    unread_count: int
