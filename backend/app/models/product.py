from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    category = Column(String, nullable=False, index=True)
    price = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    available_quantity = Column(Integer, nullable=False, default=0)
    location = Column(String)
    image_url = Column(String)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    farmer = relationship("User", back_populates="products")
    orders = relationship("Order", back_populates="product")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
