from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Enum, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PENDING_PAYMENT = "pending_payment"
    PAID = "paid"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DELIVERED = "delivered"  # kept for backward compat

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    retailer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    delivery_date = Column(DateTime(timezone=True))
    
    # New columns for functional requirements
    payment_status = Column(String(20), default="unpaid")
    payment_type = Column(String(20), default="immediate")  # 'immediate' | 'credit'
    paid_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    cancelled_at = Column(DateTime(timezone=True))
    cancellation_reason = Column(String(500))
    payment_deadline = Column(DateTime(timezone=True))  # auto-cancel after this
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    product = relationship("Product", back_populates="orders")
    farmer = relationship("User", foreign_keys=[farmer_id], back_populates="farmer_orders")
    retailer = relationship("User", foreign_keys=[retailer_id], back_populates="retailer_orders")
    
    # New relationships for functional requirements
    transactions = relationship("Transaction", back_populates="order")
    transport_requests = relationship("TransportRequest", back_populates="order")
    invoice = relationship("Invoice", back_populates="order", uselist=False)
