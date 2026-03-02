from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import JSONB, INET
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class AuditActionType(str, enum.Enum):
    AUTHENTICATION = "authentication"
    ORDER_CREATE = "order_create"
    ORDER_UPDATE = "order_update"
    PAYMENT_INIT = "payment_init"
    PAYMENT_COMPLETE = "payment_complete"
    ADMIN_ACTION = "admin_action"
    USER_UPDATE = "user_update"
    CONFIG_CHANGE = "config_change"

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    action_type = Column(String(50), nullable=False)
    resource_type = Column(String(50))
    resource_id = Column(Integer)
    before_value = Column(JSONB)
    after_value = Column(JSONB)
    ip_address = Column(INET)
    user_agent = Column(Text)
    success = Column(Boolean, default=True)
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
