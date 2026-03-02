from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProductImageBase(BaseModel):
    image_url: str
    is_primary: bool = False
    display_order: int = 0

class ProductImageResponse(ProductImageBase):
    id: int
    product_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    price: float
    unit: str
    available_quantity: int
    location: Optional[str] = None
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    unit: Optional[str] = None
    available_quantity: Optional[int] = None
    location: Optional[str] = None
    image_url: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    farmer_id: int
    images: List[ProductImageResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
