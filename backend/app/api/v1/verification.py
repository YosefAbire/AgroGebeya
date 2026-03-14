from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.models.verification import VerificationRequest
from app.models.user import User, UserRole
from app.schemas.verification import (
    VerificationRequestCreate,
    VerificationRequestResponse,
    VerificationApprove,
    VerificationReject,
    VerificationStatusResponse,
)
from app.api.v1.auth import get_current_user
from app.core.encryption import encryption_service
from app.core.validators import validate_ethiopian_national_id, sanitize_national_id
from app.services.notification_service import notify_verification_status

router = APIRouter()


@router.post("/submit", response_model=VerificationRequestResponse, status_code=status.HTTP_201_CREATED)
async def submit_verification(
    verification_data: VerificationRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit National ID for verification"""
    
    # Sanitize and validate National ID
    national_id = sanitize_national_id(verification_data.national_id)
    if not validate_ethiopian_national_id(national_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Ethiopian National ID format. Must be 12 digits (FIN) or 8 digits (SN)."
        )
    
    # Check if user already has a verification request
    result = await db.execute(
        select(VerificationRequest).where(VerificationRequest.user_id == current_user.id)
    )
    existing_request = result.scalar_one_or_none()
    
    if existing_request:
        if existing_request.status == "verified":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already verified"
            )
        elif existing_request.status == "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification request is already pending"
            )
    
    # Encrypt National ID
    encrypted_id = encryption_service.encrypt(national_id)
    
    # Create or update verification request
    if existing_request:
        existing_request.encrypted_national_id = encrypted_id
        existing_request.status = "pending"
        existing_request.submitted_at = datetime.utcnow()
        existing_request.rejection_reason = None
        verification_request = existing_request
    else:
        verification_request = VerificationRequest(
            user_id=current_user.id,
            encrypted_national_id=encrypted_id,
            status="pending"
        )
        db.add(verification_request)
    
    # Update user verification status
    current_user.verification_status = "pending"
    
    await db.commit()
    await db.refresh(verification_request)
    
    return verification_request


@router.get("/status", response_model=VerificationStatusResponse)
async def get_verification_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's verification status"""
    
    result = await db.execute(
        select(VerificationRequest).where(VerificationRequest.user_id == current_user.id)
    )
    verification_request = result.scalar_one_or_none()
    
    if not verification_request:
        return VerificationStatusResponse(
            status="unverified",
            submitted_at=None,
            reviewed_at=None,
            rejection_reason=None
        )
    
    return VerificationStatusResponse(
        status=verification_request.status,
        submitted_at=verification_request.submitted_at,
        reviewed_at=verification_request.reviewed_at,
        rejection_reason=verification_request.rejection_reason
    )


@router.get("/admin/pending", response_model=List[VerificationRequestResponse])
async def get_pending_verifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all pending verification requests (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(VerificationRequest).where(VerificationRequest.status == "pending")
    )
    requests = result.scalars().all()
    
    return requests


@router.post("/admin/{verification_id}/approve", response_model=VerificationRequestResponse)
async def approve_verification(
    verification_id: int,
    approve_data: VerificationApprove,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Approve a verification request (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(VerificationRequest).where(VerificationRequest.id == verification_id)
    )
    verification_request = result.scalar_one_or_none()
    
    if not verification_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification request not found"
        )
    
    if verification_request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending requests can be approved"
        )
    
    # Update verification request
    verification_request.status = "verified"
    verification_request.reviewed_at = datetime.utcnow()
    verification_request.reviewed_by = current_user.id
    
    # Update user verification status
    user_result = await db.execute(
        select(User).where(User.id == verification_request.user_id)
    )
    user = user_result.scalar_one_or_none()
    if user:
        user.verification_status = "verified"
    
    await db.commit()
    await db.refresh(verification_request)
    
    # Send notification
    await notify_verification_status(db, verification_request.user_id, "verified")
    
    return verification_request


@router.post("/admin/{verification_id}/reject", response_model=VerificationRequestResponse)
async def reject_verification(
    verification_id: int,
    reject_data: VerificationReject,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reject a verification request (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(VerificationRequest).where(VerificationRequest.id == verification_id)
    )
    verification_request = result.scalar_one_or_none()
    
    if not verification_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification request not found"
        )
    
    if verification_request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending requests can be rejected"
        )
    
    # Update verification request
    verification_request.status = "rejected"
    verification_request.reviewed_at = datetime.utcnow()
    verification_request.reviewed_by = current_user.id
    verification_request.rejection_reason = reject_data.rejection_reason
    
    # Update user verification status
    user_result = await db.execute(
        select(User).where(User.id == verification_request.user_id)
    )
    user = user_result.scalar_one_or_none()
    if user:
        user.verification_status = "rejected"
    
    await db.commit()
    await db.refresh(verification_request)
    
    # Send notification
    await notify_verification_status(
        db, 
        verification_request.user_id, 
        "rejected", 
        reject_data.rejection_reason
    )
    
    return verification_request


def require_verification(user: User):
    """Dependency to check if user is verified"""
    if user.verification_status != "verified":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="National ID verification required"
        )
    return user
