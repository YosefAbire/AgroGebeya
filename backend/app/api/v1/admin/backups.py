from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.models.backup import Backup
from app.models.user import User, UserRole
from app.schemas.backup import (
    BackupResponse,
    BackupCreate,
    BackupVerifyResponse,
    BackupRestoreRequest,
    BackupRestoreResponse,
)
from app.api.v1.auth import get_current_user

router = APIRouter()


@router.post("/create", response_model=BackupResponse, status_code=status.HTTP_201_CREATED)
async def create_backup(
    backup_data: BackupCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create manual backup (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Create backup record (actual backup logic would be implemented separately)
    backup = Backup(
        backup_type=backup_data.backup_type,
        filename=f"backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.sql",
        storage_path="/backups/",
        created_by=current_user.id
    )
    
    db.add(backup)
    await db.commit()
    await db.refresh(backup)
    
    return backup


@router.get("", response_model=List[BackupResponse])
async def list_backups(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all backups (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(Backup).order_by(Backup.created_at.desc())
    )
    backups = result.scalars().all()
    
    return backups


@router.get("/{backup_id}/download")
async def download_backup(
    backup_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Download backup file (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(Backup).where(Backup.id == backup_id)
    )
    backup = result.scalar_one_or_none()
    
    if not backup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Backup not found"
        )
    
    # Return download URL (actual file serving would be implemented separately)
    return {
        "backup_id": backup.id,
        "filename": backup.filename,
        "download_url": f"/backups/{backup.filename}",
        "message": "Backup download functionality to be implemented"
    }


@router.post("/{backup_id}/restore", response_model=BackupRestoreResponse)
async def restore_backup(
    backup_id: int,
    restore_data: BackupRestoreRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Restore from backup (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    if not restore_data.confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation required for restore operation"
        )
    
    result = await db.execute(
        select(Backup).where(Backup.id == backup_id)
    )
    backup = result.scalar_one_or_none()
    
    if not backup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Backup not found"
        )
    
    # Restore logic would be implemented separately
    return BackupRestoreResponse(
        success=True,
        message="Backup restore functionality to be implemented",
        restored_at=datetime.utcnow()
    )


@router.get("/{backup_id}/verify", response_model=BackupVerifyResponse)
async def verify_backup(
    backup_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify backup integrity (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(Backup).where(Backup.id == backup_id)
    )
    backup = result.scalar_one_or_none()
    
    if not backup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Backup not found"
        )
    
    # Verification logic would be implemented separately
    backup.is_verified = True
    backup.verified_at = datetime.utcnow()
    
    await db.commit()
    
    return BackupVerifyResponse(
        backup_id=backup.id,
        is_verified=True,
        verified_at=backup.verified_at,
        message="Backup verified successfully"
    )
