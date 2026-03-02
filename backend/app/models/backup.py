from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class BackupType(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    MANUAL = "manual"

class Backup(Base):
    __tablename__ = "backups"
    
    id = Column(Integer, primary_key=True, index=True)
    backup_type = Column(String(20), nullable=False)
    filename = Column(String(255), nullable=False)
    file_size = Column(BigInteger)
    storage_path = Column(Text, nullable=False)
    is_encrypted = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime(timezone=True))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    
    # Relationships
    creator = relationship("User", back_populates="backups")
