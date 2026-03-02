from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BackupResponse(BaseModel):
    """Schema for backup response"""
    id: int
    backup_type: str
    filename: str
    file_size: Optional[int] = None
    storage_path: str
    is_encrypted: bool
    is_verified: bool
    verified_at: Optional[datetime] = None
    created_by: Optional[int] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class BackupCreate(BaseModel):
    """Schema for creating backup"""
    backup_type: str = "manual"

class BackupVerifyResponse(BaseModel):
    """Schema for backup verification response"""
    backup_id: int
    is_verified: bool
    verified_at: datetime
    message: str

class BackupRestoreRequest(BaseModel):
    """Schema for backup restore request"""
    backup_id: int
    confirm: bool = False

class BackupRestoreResponse(BaseModel):
    """Schema for backup restore response"""
    success: bool
    message: str
    restored_at: datetime
