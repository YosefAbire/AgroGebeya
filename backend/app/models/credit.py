"""
RetailerCredit — credit account assigned to a trusted retailer by admin.
Invoice       — generated per order, tracks payment obligation.
StockReservation — temporary hold on inventory during checkout.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class RetailerCredit(Base):
    """Credit account for a retailer approved for deferred payment."""
    __tablename__ = "retailer_credits"

    id = Column(Integer, primary_key=True, index=True)
    retailer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    credit_limit = Column(Numeric(12, 2), nullable=False, default=0)
    used_credit = Column(Numeric(12, 2), nullable=False, default=0)   # outstanding balance
    payment_due_days = Column(Integer, default=30)                     # days to pay after order
    is_active = Column(Boolean, default=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    suspended_at = Column(DateTime(timezone=True), nullable=True)
    suspension_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    retailer = relationship("User", foreign_keys=[retailer_id])
    approver = relationship("User", foreign_keys=[approved_by])
    invoices = relationship("Invoice", back_populates="credit_account")

    @property
    def available_credit(self):
        return float(self.credit_limit) - float(self.used_credit)

    @property
    def utilization_pct(self):
        if float(self.credit_limit) == 0:
            return 0
        return round(float(self.used_credit) / float(self.credit_limit) * 100, 1)


class Invoice(Base):
    """Invoice generated for each order — tracks payment obligation."""
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False)
    retailer_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    credit_account_id = Column(Integer, ForeignKey("retailer_credits.id"), nullable=True)

    # Amounts
    subtotal = Column(Numeric(12, 2), nullable=False)
    tax_amount = Column(Numeric(12, 2), default=0)
    total_amount = Column(Numeric(12, 2), nullable=False)
    paid_amount = Column(Numeric(12, 2), default=0)

    # Payment type: 'immediate' | 'credit'
    payment_type = Column(String(20), nullable=False, default="immediate")

    # Status: draft | issued | paid | partially_paid | overdue | cancelled | refunded
    status = Column(String(30), nullable=False, default="issued")

    due_date = Column(DateTime(timezone=True), nullable=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    overdue_notified_at = Column(DateTime(timezone=True), nullable=True)

    # Late payment penalty (% per day)
    late_penalty_rate = Column(Numeric(5, 4), default=0.001)
    penalty_amount = Column(Numeric(12, 2), default=0)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    order = relationship("Order", back_populates="invoice")
    retailer = relationship("User", foreign_keys=[retailer_id])
    farmer = relationship("User", foreign_keys=[farmer_id])
    credit_account = relationship("RetailerCredit", back_populates="invoices")

    @property
    def balance_due(self):
        return float(self.total_amount) + float(self.penalty_amount) - float(self.paid_amount)

    @property
    def is_overdue(self):
        if not self.due_date:
            return False
        from datetime import datetime
        return datetime.utcnow() > self.due_date.replace(tzinfo=None) and self.status not in ("paid", "cancelled")


class StockReservation(Base):
    """Temporary hold on product stock during checkout / pending payment."""
    __tablename__ = "stock_reservations"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False)
    # Status: active | released | converted (converted = permanently deducted)
    status = Column(String(20), nullable=False, default="active")
    expires_at = Column(DateTime(timezone=True), nullable=False)
    released_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    order = relationship("Order")
    product = relationship("Product")
