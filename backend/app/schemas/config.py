from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class SystemConfigResponse(BaseModel):
    """Schema for system config response"""
    id: int
    key: str
    value: str
    value_type: str
    is_encrypted: bool
    description: Optional[str] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class SystemConfigUpdate(BaseModel):
    """Schema for updating system config"""
    value: str = Field(..., description="New configuration value")

class SystemConfigCreate(BaseModel):
    """Schema for creating system config"""
    key: str = Field(..., min_length=1, max_length=100)
    value: str
    value_type: str = Field(..., description="Value type: string, number, boolean, json")
    is_encrypted: bool = False
    description: Optional[str] = None

class ConfigHistoryResponse(BaseModel):
    """Schema for config history response"""
    id: int
    config_id: int
    key: str
    old_value: Optional[str] = None
    new_value: str
    changed_by: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConfigExportResponse(BaseModel):
    """Schema for config export"""
    configs: Dict[str, Any]
    exported_at: datetime

class ConfigImportRequest(BaseModel):
    """Schema for config import"""
    configs: Dict[str, Any]

class ConfigRollbackRequest(BaseModel):
    """Schema for config rollback"""
    version_id: int
