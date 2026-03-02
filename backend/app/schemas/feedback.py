from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FeedbackCreate(BaseModel):
    """Schema for creating feedback"""
    type: str = Field(..., description="Feedback type: bug_report, feature_request, general_feedback")
    description: str = Field(..., min_length=10, max_length=5000, description="Feedback description")
    contact_preference: bool = Field(False, description="Whether user wants to be contacted for follow-up")

class FeedbackResponse(BaseModel):
    """Schema for feedback response"""
    id: int
    user_id: int
    type: str
    description: str
    contact_preference: bool
    status: str
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    resolution: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class FeedbackReview(BaseModel):
    """Schema for reviewing feedback"""
    pass

class FeedbackResolve(BaseModel):
    """Schema for resolving feedback"""
    resolution: str = Field(..., min_length=10, max_length=2000, description="Resolution description")

class FeedbackQuery(BaseModel):
    """Schema for querying feedback"""
    type: Optional[str] = None
    status: Optional[str] = None
    limit: int = 50
    offset: int = 0
