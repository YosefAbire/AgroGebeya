from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal

class TransportRequestCreate(BaseModel):
    """Schema for creating transport request"""
    order_id: int
    pickup_location: str = Field(..., min_length=5, max_length=255)
    pickup_latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    pickup_longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    delivery_location: str = Field(..., min_length=5, max_length=255)
    delivery_latitude: Optional[Decimal] = Field(None, ge=-90, le=90)
    delivery_longitude: Optional[Decimal] = Field(None, ge=-180, le=180)
    preferred_date: datetime = Field(..., description="Preferred delivery date")
    weight: Optional[Decimal] = Field(None, gt=0, description="Weight in kg")
    vehicle_type: Optional[str] = Field(None, max_length=50)
    special_instructions: Optional[str] = Field(None, max_length=1000)

class TransportRequestResponse(BaseModel):
    """Schema for transport request response"""
    id: int
    order_id: int
    user_id: int
    pickup_location: str
    pickup_latitude: Optional[Decimal] = None
    pickup_longitude: Optional[Decimal] = None
    delivery_location: str
    delivery_latitude: Optional[Decimal] = None
    delivery_longitude: Optional[Decimal] = None
    preferred_date: datetime
    weight: Optional[Decimal] = None
    vehicle_type: Optional[str] = None
    special_instructions: Optional[str] = None
    estimated_distance: Optional[Decimal] = None
    status: str
    tracking_number: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    driver_vehicle: Optional[str] = None
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class TransportApprove(BaseModel):
    """Schema for approving transport request"""
    driver_name: Optional[str] = Field(None, max_length=255)
    driver_phone: Optional[str] = Field(None, max_length=20)
    driver_vehicle: Optional[str] = Field(None, max_length=100)

class TransportReject(BaseModel):
    """Schema for rejecting transport request"""
    rejection_reason: str = Field(..., min_length=10, max_length=500)

class TransportStatusUpdate(BaseModel):
    """Schema for updating transport status"""
    status: str = Field(..., description="New status: in_transit, delivered, cancelled")
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    driver_vehicle: Optional[str] = None

class TransportTrackingResponse(BaseModel):
    """Schema for transport tracking response"""
    tracking_number: str
    status: str
    pickup_location: str
    delivery_location: str
    preferred_date: datetime
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    estimated_distance: Optional[Decimal] = None
    created_at: datetime
    delivered_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class BulkApproveRequest(BaseModel):
    """Schema for bulk approving transport requests"""
    transport_ids: list[int] = Field(..., min_items=1, max_items=100)
