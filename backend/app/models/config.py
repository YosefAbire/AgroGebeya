from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class ConfigValueType(str, enum.Enum):
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    JSON = "json"

class SystemConfig(Base):
    __tablename__ = "system_config"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), nullable=False, unique=True)
    value = Column(Text, nullable=False)
    value_type = Column(String(20), nullable=False)
    is_encrypted = Column(Boolean, default=False)
    description = Column(Text)
    updated_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    updater = relationship("User", back_populates="config_updates")
    history = relationship("ConfigHistory", back_populates="config")


class ConfigHistory(Base):
    __tablename__ = "config_history"
    
    id = Column(Integer, primary_key=True, index=True)
    config_id = Column(Integer, ForeignKey("system_config.id", ondelete="CASCADE"), nullable=False)
    key = Column(String(100), nullable=False)
    old_value = Column(Text)
    new_value = Column(Text, nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    config = relationship("SystemConfig", back_populates="history")
    changer = relationship("User")
