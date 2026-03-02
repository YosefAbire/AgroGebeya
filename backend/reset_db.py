import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from app.core.database import Base

# Import all models BEFORE creating tables
from app.models.user import User, UserRole
from app.models.product import Product
from app.models.order import Order

async def reset_database():
    """Drop all tables and recreate them"""
    
    engine = create_async_engine(
        settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
        echo=True
    )
    
    async with engine.begin() as conn:
        # Drop all tables
        await conn.run_sync(Base.metadata.drop_all)
        print("✓ All tables dropped")
        
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        print("✓ All tables created")
    
    await engine.dispose()
    print("\n✓ Database reset complete!")

if __name__ == "__main__":
    asyncio.run(reset_database())
