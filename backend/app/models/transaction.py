from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Text, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="ETB")
    payment_method = Column(String(50))
    status = Column(String(20), nullable=False, default="pending")
    chapa_transaction_ref = Column(String(255), unique=True)
    chapa_checkout_url = Column(Text)
    gross_amount = Column(Numeric(10, 2))
    net_amount = Column(Numeric(10, 2))
    fee_amount = Column(Numeric(10, 2))
    refund_transaction_id = Column(Integer, ForeignKey("transactions.id"))
    transaction_metadata = Column(JSONB)
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    order = relationship("Order", back_populates="transactions")
    user = relationship("User", back_populates="transactions")
    refund_transaction = relationship("Transaction", remote_side=[id])
