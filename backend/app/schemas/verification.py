from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class VerificationRequestCreate(BaseModel):
    """Schema for submitting National ID for verification"""
    national_id: str = Field(..., min_length=9, max_length=9, description="Ethiopian National ID (9 digits)")

class VerificationRequestResponse(BaseModel):
    """Schema for verification request response"""
    id: int
    user_id: int
    status: str
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[int] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class VerificationApprove(BaseModel):
    """Schema for approving verification"""
    pass

class VerificationReject(BaseModel):
    """Schema for rejecting verification"""
    rejection_reason: str = Field(..., min_length=10, description="Reason for rejection")

class VerificationStatusResponse(BaseModel):
    """Schema for verification status"""
    status: str
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
