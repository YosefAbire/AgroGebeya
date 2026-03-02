from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class AuditLogResponse(BaseModel):
    """Schema for audit log response"""
    id: int
    user_id: Optional[int] = None
    action_type: str
    resource_type: Optional[str] = None
    resource_id: Optional[int] = None
    before_value: Optional[Dict[str, Any]] = None
    after_value: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool
    error_message: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class AuditLogQuery(BaseModel):
    """Schema for querying audit logs"""
    user_id: Optional[int] = None
    action_type: Optional[str] = None
    resource_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = 100
    offset: int = 0

class SecurityAlertResponse(BaseModel):
    """Schema for security alert"""
    user_id: int
    alert_type: str
    description: str
    count: int
    last_occurrence: datetime
