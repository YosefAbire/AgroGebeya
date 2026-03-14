from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.order import OrderStatus

class OrderBase(BaseModel):
    product_id: int
    quantity: int
    delivery_date: Optional[datetime] = None

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    status: OrderStatus

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
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
