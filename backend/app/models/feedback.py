from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class FeedbackType(str, enum.Enum):
    BUG_REPORT = "bug_report"
    FEATURE_REQUEST = "feature_request"
    GENERAL_FEEDBACK = "general_feedback"

class FeedbackStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(20), nullable=False)
    description = Column(Text, nullable=False)
    contact_preference = Column(Boolean, default=False)
    status = Column(String(20), default="submitted")
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    reviewed_at = Column(DateTime(timezone=True))
    resolution = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="feedback")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
