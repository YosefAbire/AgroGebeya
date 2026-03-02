from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class MessageCreate(BaseModel):
    """Schema for creating a message"""
    recipient_id: int
    content: str = Field(..., min_length=1, max_length=2000, description="Message content")

class MessageResponse(BaseModel):
    """Schema for message response"""
    id: int
    sender_id: int
    recipient_id: int
    content: str
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    """Schema for conversation response"""
    user_id: int
    user_name: str
    last_message: str
    last_message_at: datetime
    unread_count: int

class UnreadCountResponse(BaseModel):
    """Schema for unread message count"""
    unread_count: int
