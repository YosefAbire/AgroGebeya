from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.audit import (
    AuditLogResponse,
    AuditLogQuery,
    SecurityAlertResponse,
)
from app.api.v1.auth import get_current_user
from app.services.audit_service import audit_service

router = APIRouter()


@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    user_id: Optional[int] = Query(None),
    action_type: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Query audit logs (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    logs = await audit_service.get_audit_logs(
        db=db,
        user_id=user_id,
        action_type=action_type,
        resource_type=resource_type,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )
    
    return logs


@router.get("/audit-logs/user/{user_id}", response_model=List[AuditLogResponse])
async def get_user_audit_logs(
    user_id: int,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get audit logs for a specific user (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    logs = await audit_service.get_audit_logs(
        db=db,
        user_id=user_id,
        limit=limit,
        offset=offset
    )
    
    return logs


@router.get("/audit-logs/alerts", response_model=List[SecurityAlertResponse])
async def get_security_alerts(
    hours: int = Query(24, ge=1, le=168),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get security alerts (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    alerts = await audit_service.get_security_alerts(db=db, hours=hours)
    
    return [
        SecurityAlertResponse(
            user_id=alert["user_id"],
            alert_type=alert["alert_type"],
            description=alert["description"],
            count=alert["count"],
            last_occurrence=alert["last_occurrence"]
        )
        for alert in alerts
    ]
