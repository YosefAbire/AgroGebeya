from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class VerificationRequestCreate(BaseModel):
    """Schema for submitting National ID for verification.
    
    Accepts:
      - FIN (Fayda ID Number): 12 digits
      - SN  (Serial Number):   8 digits
    """
    national_id: str = Field(
        ...,
        min_length=8,
        max_length=12,
        description="Ethiopian National ID — FIN (12 digits) or SN (8 digits)",
    )

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
