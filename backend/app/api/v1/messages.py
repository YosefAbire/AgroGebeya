from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.models.message import Message
from app.models.order import Order
from app.models.user import User
from app.schemas.message import (
    MessageCreate,
    MessageResponse,
    ConversationResponse,
    UnreadCountResponse,
)
from app.api.v1.auth import get_current_user
from app.core.validators import validate_message_content
from app.services.notification_service import notify_new_message

router = APIRouter()


async def can_message_user(sender_id: int, recipient_id: int, db: AsyncSession) -> bool:
    """Check if sender can message recipient (must have orders together)"""
    
    result = await db.execute(
        select(Order).where(
            or_(
                and_(Order.farmer_id == sender_id, Order.retailer_id == recipient_id),
                and_(Order.farmer_id == recipient_id, Order.retailer_id == sender_id)
            )
        )
    )
    order = result.scalar_one_or_none()
    
    return order is not None


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a message to another user"""
    
    # Validate message content
    is_valid, error_message = validate_message_content(message_data.content)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Check if trying to message self
    if message_data.recipient_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send message to yourself"
        )
    
    # Check if recipient exists
    recipient_result = await db.execute(
        select(User).where(User.id == message_data.recipient_id)
    )
    recipient = recipient_result.scalar_one_or_none()
    
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipient not found"
        )
    
    # Check if users can message each other (must have orders together)
    can_message = await can_message_user(current_user.id, message_data.recipient_id, db)
    if not can_message:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only message users you have orders with"
        )
    
    # Create message
    message = Message(
        sender_id=current_user.id,
        recipient_id=message_data.recipient_id,
        content=message_data.content
    )
    
    db.add(message)
    await db.commit()
    await db.refresh(message)
    
    # Send notification
    await notify_new_message(
        db,
        message_data.recipient_id,
        current_user.full_name or current_user.username,
        message.id
    )
    
    return message


@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get list of user's conversations"""
    
    # Get all users the current user has messaged with
    result = await db.execute(
        select(Message).where(
            or_(
                Message.sender_id == current_user.id,
                Message.recipient_id == current_user.id
            )
        ).order_by(Message.created_at.desc())
    )
    messages = result.scalars().all()
    
    # Group by conversation partner
    conversations = {}
    for message in messages:
        partner_id = message.recipient_id if message.sender_id == current_user.id else message.sender_id
        
        if partner_id not in conversations:
            # Get partner user info
            user_result = await db.execute(
                select(User).where(User.id == partner_id)
            )
            partner = user_result.scalar_one_or_none()
            
            if partner:
                # Count unread messages from this partner
                unread_result = await db.execute(
                    select(func.count(Message.id)).where(
                        and_(
                            Message.sender_id == partner_id,
                            Message.recipient_id == current_user.id,
                            Message.is_read == False
                        )
                    )
                )
                unread_count = unread_result.scalar()
                
                conversations[partner_id] = ConversationResponse(
                    user_id=partner.id,
                    user_name=partner.full_name or partner.username,
                    last_message=message.content[:100],  # Truncate for preview
                    last_message_at=message.created_at,
                    unread_count=unread_count
                )
    
    return list(conversations.values())


@router.get("/conversation/{user_id}", response_model=List[MessageResponse])
async def get_conversation(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get conversation with a specific user"""
    
    # Check if other user exists
    user_result = await db.execute(
        select(User).where(User.id == user_id)
    )
    other_user = user_result.scalar_one_or_none()
    
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get all messages between the two users
    result = await db.execute(
        select(Message).where(
            or_(
                and_(Message.sender_id == current_user.id, Message.recipient_id == user_id),
                and_(Message.sender_id == user_id, Message.recipient_id == current_user.id)
            )
        ).order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()
    
    # Mark messages from other user as read
    for message in messages:
        if message.recipient_id == current_user.id and not message.is_read:
            message.is_read = True
            message.read_at = datetime.utcnow()
    
    await db.commit()
    
    return messages


@router.put("/{message_id}/read", response_model=MessageResponse)
async def mark_message_as_read(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a message as read"""
    
    result = await db.execute(
        select(Message).where(Message.id == message_id)
    )
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    # Check authorization (only recipient can mark as read)
    if message.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to mark this message as read"
        )
    
    if not message.is_read:
        message.is_read = True
        message.read_at = datetime.utcnow()
        await db.commit()
        await db.refresh(message)
    
    return message


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get count of unread messages"""
    
    result = await db.execute(
        select(func.count(Message.id)).where(
            and_(
                Message.recipient_id == current_user.id,
                Message.is_read == False
            )
        )
    )
    unread_count = result.scalar()
    
    return UnreadCountResponse(unread_count=unread_count)
