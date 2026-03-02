from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.audit import AuditLog
from app.models.user import User

class AuditService:
    """Service for audit logging and analysis"""
    
    @staticmethod
    async def log_action(
        db: AsyncSession,
        user_id: Optional[int],
        action_type: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[int] = None,
        before_value: Optional[Dict[str, Any]] = None,
        after_value: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        success: bool = True,
        error_message: Optional[str] = None
    ) -> AuditLog:
        """Create an audit log entry"""
        
        audit_log = AuditLog(
            user_id=user_id,
            action_type=action_type,
            resource_type=resource_type,
            resource_id=resource_id,
            before_value=before_value,
            after_value=after_value,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success,
            error_message=error_message
        )
        
        db.add(audit_log)
        await db.commit()
        await db.refresh(audit_log)
        
        return audit_log
    
    @staticmethod
    async def get_audit_logs(
        db: AsyncSession,
        user_id: Optional[int] = None,
        action_type: Optional[str] = None,
        resource_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[AuditLog]:
        """Query audit logs with filters"""
        
        query = select(AuditLog)
        
        if user_id:
            query = query.where(AuditLog.user_id == user_id)
        
        if action_type:
            query = query.where(AuditLog.action_type == action_type)
        
        if resource_type:
            query = query.where(AuditLog.resource_type == resource_type)
        
        if start_date:
            query = query.where(AuditLog.created_at >= start_date)
        
        if end_date:
            query = query.where(AuditLog.created_at <= end_date)
        
        query = query.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset)
        
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def detect_suspicious_activity(
        db: AsyncSession,
        user_id: int,
        time_window_minutes: int = 60
    ) -> Dict[str, Any]:
        """Detect suspicious patterns for a user"""
        
        cutoff_time = datetime.utcnow() - timedelta(minutes=time_window_minutes)
        
        # Count failed login attempts
        failed_login_result = await db.execute(
            select(func.count(AuditLog.id)).where(
                and_(
                    AuditLog.user_id == user_id,
                    AuditLog.action_type == "authentication",
                    AuditLog.success == False,
                    AuditLog.created_at >= cutoff_time
                )
            )
        )
        failed_logins = failed_login_result.scalar()
        
        # Count total actions
        total_actions_result = await db.execute(
            select(func.count(AuditLog.id)).where(
                and_(
                    AuditLog.user_id == user_id,
                    AuditLog.created_at >= cutoff_time
                )
            )
        )
        total_actions = total_actions_result.scalar()
        
        alerts = []
        
        if failed_logins >= 5:
            alerts.append({
                "type": "multiple_failed_logins",
                "severity": "high",
                "count": failed_logins,
                "message": f"{failed_logins} failed login attempts in the last {time_window_minutes} minutes"
            })
        
        if total_actions >= 100:
            alerts.append({
                "type": "high_activity",
                "severity": "medium",
                "count": total_actions,
                "message": f"{total_actions} actions in the last {time_window_minutes} minutes"
            })
        
        return {
            "user_id": user_id,
            "time_window_minutes": time_window_minutes,
            "failed_logins": failed_logins,
            "total_actions": total_actions,
            "alerts": alerts
        }
    
    @staticmethod
    async def get_security_alerts(
        db: AsyncSession,
        hours: int = 24
    ) -> List[Dict[str, Any]]:
        """Get security alerts for all users"""
        
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        # Get users with multiple failed logins
        result = await db.execute(
            select(
                AuditLog.user_id,
                func.count(AuditLog.id).label('count')
            ).where(
                and_(
                    AuditLog.action_type == "authentication",
                    AuditLog.success == False,
                    AuditLog.created_at >= cutoff_time
                )
            ).group_by(AuditLog.user_id).having(func.count(AuditLog.id) >= 3)
        )
        
        alerts = []
        for row in result:
            user_id, count = row
            
            # Get user info
            user_result = await db.execute(
                select(User).where(User.id == user_id)
            )
            user = user_result.scalar_one_or_none()
            
            if user:
                # Get last occurrence
                last_log_result = await db.execute(
                    select(AuditLog).where(
                        and_(
                            AuditLog.user_id == user_id,
                            AuditLog.action_type == "authentication",
                            AuditLog.success == False
                        )
                    ).order_by(AuditLog.created_at.desc()).limit(1)
                )
                last_log = last_log_result.scalar_one_or_none()
                
                alerts.append({
                    "user_id": user_id,
                    "username": user.username,
                    "alert_type": "multiple_failed_logins",
                    "description": f"{count} failed login attempts",
                    "count": count,
                    "last_occurrence": last_log.created_at if last_log else None
                })
        
        return alerts


# Singleton instance
audit_service = AuditService()
