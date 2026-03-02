from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any
from datetime import datetime
import json
from app.core.database import get_db
from app.models.config import SystemConfig, ConfigHistory
from app.models.user import User, UserRole
from app.schemas.config import (
    SystemConfigResponse,
    SystemConfigUpdate,
    SystemConfigCreate,
    ConfigHistoryResponse,
    ConfigExportResponse,
    ConfigImportRequest,
    ConfigRollbackRequest,
)
from app.api.v1.auth import get_current_user
from app.core.encryption import encryption_service

router = APIRouter()


@router.get("/config", response_model=List[SystemConfigResponse])
async def get_all_configs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all system configurations (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(select(SystemConfig))
    configs = result.scalars().all()
    
    return configs


@router.get("/config/{key}", response_model=SystemConfigResponse)
async def get_config(
    key: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get specific configuration (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(SystemConfig).where(SystemConfig.key == key)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )
    
    return config


@router.put("/config/{key}", response_model=SystemConfigResponse)
async def update_config(
    key: str,
    config_data: SystemConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update configuration (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(SystemConfig).where(SystemConfig.key == key)
    )
    config = result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )
    
    # Create history entry
    history = ConfigHistory(
        config_id=config.id,
        key=config.key,
        old_value=config.value,
        new_value=config_data.value,
        changed_by=current_user.id
    )
    db.add(history)
    
    # Update config
    config.value = config_data.value
    config.updated_by = current_user.id
    
    await db.commit()
    await db.refresh(config)
    
    return config


@router.post("/config/export", response_model=ConfigExportResponse)
async def export_config(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Export all configurations (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(select(SystemConfig))
    configs = result.scalars().all()
    
    config_dict = {
        config.key: {
            "value": config.value,
            "value_type": config.value_type,
            "description": config.description
        }
        for config in configs
    }
    
    return ConfigExportResponse(
        configs=config_dict,
        exported_at=datetime.utcnow()
    )


@router.post("/config/import")
async def import_config(
    import_data: ConfigImportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Import configurations (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    imported_count = 0
    
    for key, config_data in import_data.configs.items():
        result = await db.execute(
            select(SystemConfig).where(SystemConfig.key == key)
        )
        config = result.scalar_one_or_none()
        
        if config:
            # Update existing
            config.value = config_data.get("value", config.value)
            config.updated_by = current_user.id
        else:
            # Create new
            config = SystemConfig(
                key=key,
                value=config_data.get("value"),
                value_type=config_data.get("value_type", "string"),
                description=config_data.get("description"),
                updated_by=current_user.id
            )
            db.add(config)
        
        imported_count += 1
    
    await db.commit()
    
    return {"message": f"Imported {imported_count} configurations"}


@router.get("/config/history", response_model=List[ConfigHistoryResponse])
async def get_config_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get configuration history (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(ConfigHistory).order_by(ConfigHistory.created_at.desc()).limit(100)
    )
    history = result.scalars().all()
    
    return history


@router.post("/config/rollback/{version_id}")
async def rollback_config(
    version_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Rollback configuration to a previous version (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get history entry
    result = await db.execute(
        select(ConfigHistory).where(ConfigHistory.id == version_id)
    )
    history = result.scalar_one_or_none()
    
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="History version not found"
        )
    
    # Get config
    config_result = await db.execute(
        select(SystemConfig).where(SystemConfig.id == history.config_id)
    )
    config = config_result.scalar_one_or_none()
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )
    
    # Rollback to old value
    config.value = history.old_value
    config.updated_by = current_user.id
    
    await db.commit()
    
    return {"message": f"Configuration '{config.key}' rolled back successfully"}
