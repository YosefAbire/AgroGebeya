from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any
from datetime import datetime
from decimal import Decimal

class TransactionCreate(BaseModel):
    """Schema for creating a transaction"""
    order_id: int
    amount: Decimal = Field(..., gt=0, description="Transaction amount")
    payment_method: Optional[str] = None
    
    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        # Ensure amount has at most 2 decimal places
        if v.as_tuple().exponent < -2:
            raise ValueError('Amount must have at most 2 decimal places')
        return v

class TransactionResponse(BaseModel):
    """Schema for transaction response"""
    id: int
    order_id: int
    user_id: int
    amount: Decimal
    currency: str
    payment_method: Optional[str] = None
    status: str
    chapa_transaction_ref: Optional[str] = None
    chapa_checkout_url: Optional[str] = None
    gross_amount: Optional[Decimal] = None
    net_amount: Optional[Decimal] = None
    fee_amount: Optional[Decimal] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PaymentInitializeRequest(BaseModel):
    """Schema for initializing payment"""
    order_id: int
    return_url: str = Field(..., description="URL to redirect after payment")

class PaymentInitializeResponse(BaseModel):
    """Schema for payment initialization response"""
    transaction_id: int
    checkout_url: str
    transaction_ref: str

class PaymentWebhook(BaseModel):
    """Schema for Chapa webhook payload"""
    tx_ref: str
    status: str
    amount: Decimal
    currency: str
    created_at: str
    charge: Optional[Decimal] = None
    
class PaymentVerifyResponse(BaseModel):
    """Schema for payment verification response"""
    transaction_id: int
    status: str
    amount: Decimal
    verified_at: Optional[datetime] = None

class RefundRequest(BaseModel):
    """Schema for refund request"""
    amount: Optional[Decimal] = Field(None, gt=0, description="Amount to refund (full refund if not specified)")
    reason: Optional[str] = Field(None, max_length=500)
    
    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v is not None:
            # Ensure amount has at most 2 decimal places
            if v.as_tuple().exponent < -2:
                raise ValueError('Amount must have at most 2 decimal places')
        return v

class RefundResponse(BaseModel):
    """Schema for refund response"""
    refund_transaction_id: int
    original_transaction_id: int
    amount: Decimal
    status: str
    created_at: datetime
