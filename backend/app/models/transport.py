from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class TransportStatus(str, enum.Enum):
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class TransportRequest(Base):
    __tablename__ = "transport_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    pickup_location = Column(String(255), nullable=False)
    pickup_latitude = Column(Numeric(10, 8))
    pickup_longitude = Column(Numeric(11, 8))
    delivery_location = Column(String(255), nullable=False)
    delivery_latitude = Column(Numeric(10, 8))
    delivery_longitude = Column(Numeric(11, 8))
    preferred_date = Column(DateTime(timezone=True), nullable=False)
    weight = Column(Numeric(8, 2))
    vehicle_type = Column(String(50))
    special_instructions = Column(Text)
    estimated_distance = Column(Numeric(8, 2))
    status = Column(String(20), nullable=False, default="pending_approval")
    tracking_number = Column(String(50), unique=True)
    driver_name = Column(String(255))
    driver_phone = Column(String(20))
    driver_vehicle = Column(String(100))
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime(timezone=True))
    rejection_reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    delivered_at = Column(DateTime(timezone=True))
    
    # Relationships
    order = relationship("Order", back_populates="transport_requests")
    user = relationship("User", foreign_keys=[user_id], back_populates="transport_requests")
    approver = relationship("User", foreign_keys=[approved_by])
