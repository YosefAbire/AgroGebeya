from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.order import OrderStatus

class OrderBase(BaseModel):
    product_id: int
    quantity: int
    delivery_date: Optional[datetime] = None

class OrderCreate(OrderBase):
    payment_type: str = "immediate"  # 'immediate' | 'credit'

class OrderUpdate(BaseModel):
    status: OrderStatus
    cancellation_reason: Optional[str] = None

class OrderResponse(BaseModel):
    id: int
    product_id: int
    farmer_id: int
    retailer_id: int
    quantity: int
    total_price: float
    status: OrderStatus
    delivery_date: Optional[datetime] = None
    payment_status: Optional[str] = None
    payment_type: Optional[str] = None
    paid_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    payment_deadline: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Enriched display fields
    product_name: Optional[str] = None
    product_unit: Optional[str] = None
    retailer_name: Optional[str] = None
    farmer_name: Optional[str] = None
    
    class Config:
        from_attributes = True
