from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class UserRole(str, enum.Enum):
    FARMER = "farmer"
    RETAILER = "retailer"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    phone = Column(String)
    profile_image_url = Column(String)
    role = Column(Enum(UserRole), default=UserRole.FARMER)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # New columns for functional requirements
    verification_status = Column(String(20), default="unverified")
    language_preference = Column(String(5), default="en")
    last_login_at = Column(DateTime(timezone=True))
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    products = relationship("Product", back_populates="farmer")
    farmer_orders = relationship("Order", foreign_keys="Order.farmer_id", back_populates="farmer")
    retailer_orders = relationship("Order", foreign_keys="Order.retailer_id", back_populates="retailer")
    
    # New relationships for functional requirements
    verification_request = relationship("VerificationRequest", foreign_keys="VerificationRequest.user_id", back_populates="user", uselist=False)
    transactions = relationship("Transaction", back_populates="user")
    transport_requests = relationship("TransportRequest", foreign_keys="TransportRequest.user_id", back_populates="user")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.recipient_id", back_populates="recipient")
    notifications = relationship("Notification", back_populates="user")
    notification_preference = relationship("NotificationPreference", back_populates="user", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="user")
    feedback = relationship("Feedback", foreign_keys="Feedback.user_id", back_populates="user")
    config_updates = relationship("SystemConfig", back_populates="updater")
    backups = relationship("Backup", back_populates="creator")
