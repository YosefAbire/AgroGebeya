from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.feedback import Feedback
from app.models.user import User, UserRole
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackResponse,
    FeedbackReview,
    FeedbackResolve,
    FeedbackQuery,
)
from app.api.v1.auth import get_current_user
from app.core.validators import validate_feedback_description

router = APIRouter()


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    feedback_data: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit feedback"""
    
    # Validate description
    is_valid, error_message = validate_feedback_description(feedback_data.description)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Check spam prevention (max 5 submissions per day)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    result = await db.execute(
        select(func.count(Feedback.id)).where(
            Feedback.user_id == current_user.id,
            Feedback.created_at >= today_start
        )
    )
    today_count = result.scalar()
    
    if today_count >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Maximum 5 feedback submissions per day"
        )
    
    # Validate feedback type
    valid_types = ["bug_report", "feature_request", "general_feedback"]
    if feedback_data.type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid feedback type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Create feedback
    feedback = Feedback(
        user_id=current_user.id,
        type=feedback_data.type,
        description=feedback_data.description,
        contact_preference=feedback_data.contact_preference,
        status="submitted"
    )
    
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    
    return feedback


@router.get("/my-feedback", response_model=List[FeedbackResponse])
async def get_my_feedback(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's feedback"""
    
    result = await db.execute(
        select(Feedback).where(Feedback.user_id == current_user.id).order_by(Feedback.created_at.desc())
    )
    feedback_list = result.scalars().all()
    
    return feedback_list


@router.get("/admin", response_model=List[FeedbackResponse])
async def get_all_feedback(
    type_filter: Optional[str] = Query(None, description="Filter by type"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all feedback (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    query = select(Feedback)
    
    if type_filter:
        query = query.where(Feedback.type == type_filter)
    
    if status_filter:
        query = query.where(Feedback.status == status_filter)
    
    query = query.order_by(Feedback.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    feedback_list = result.scalars().all()
    
    return feedback_list


@router.put("/admin/{feedback_id}/review", response_model=FeedbackResponse)
async def mark_feedback_reviewed(
    feedback_id: int,
    review_data: FeedbackReview,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark feedback as reviewed (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(Feedback).where(Feedback.id == feedback_id)
    )
    feedback = result.scalar_one_or_none()
    
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    
    feedback.status = "reviewed"
    feedback.reviewed_by = current_user.id
    feedback.reviewed_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(feedback)
    
    return feedback


@router.put("/admin/{feedback_id}/resolve", response_model=FeedbackResponse)
async def mark_feedback_resolved(
    feedback_id: int,
    resolve_data: FeedbackResolve,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark feedback as resolved (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(Feedback).where(Feedback.id == feedback_id)
    )
    feedback = result.scalar_one_or_none()
    
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found"
        )
    
    feedback.status = "resolved"
    feedback.reviewed_by = current_user.id
    feedback.reviewed_at = datetime.utcnow()
    feedback.resolution = resolve_data.resolution
    
    await db.commit()
    await db.refresh(feedback)
    
    return feedback
