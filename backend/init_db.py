import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.core.security import get_password_hash
from app.core.database import Base

# Import all models to ensure relationships are properly configured
from app.models.user import User, UserRole
from app.models.product import Product
from app.models.order import Order

async def init_database():
    """Initialize database with tables and test data"""
    
    # Create engine
    engine = create_async_engine(
        settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
        echo=True
    )
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("+ Database tables created")
    
    # Create session
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        # Create test users
        users = [
            User(
                email="farmer@test.com",
                username="farmer_demo",
                hashed_password=get_password_hash("demo123"),
                full_name="Abebe Gebreselassie",
                phone="+251911234567",
                role=UserRole.FARMER,
                is_active=True,
                is_verified=True
            ),
            User(
                email="retailer@test.com",
                username="retailer_demo",
                hashed_password=get_password_hash("demo123"),
                full_name="Tadesse Abate",
                phone="+251922345678",
                role=UserRole.RETAILER,
                is_active=True,
                is_verified=True
            ),
            User(
                email="admin@test.com",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin User",
                phone="+251933456789",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            ),
        ]
        
        session.add_all(users)
        await session.commit()
        
        print("+ Test users created")
        print("  - farmer_demo / demo123 (Farmer)")
        print("  - retailer_demo / demo123 (Retailer)")
        print("  - admin / admin123 (Admin)")
        
        # Get farmer user for products
        farmer = users[0]
        
        # Create test products
        products = [
            Product(
                name="Fresh Tomatoes",
                description="Organic red tomatoes from Addis Ababa",
                category="Vegetables",
                price=25.0,
                unit="KG",
                available_quantity=500,
                location="Addis Ababa",
                farmer_id=farmer.id
            ),
            Product(
                name="Teff Grain",
                description="Premium quality teff grain",
                category="Grains",
                price=45.0,
                unit="KG",
                available_quantity=1000,
                location="Addis Ababa",
                farmer_id=farmer.id
            ),
            Product(
                name="Coffee Beans",
                description="Ethiopian Arabica coffee beans",
                category="Beverages",
                price=120.0,
                unit="KG",
                available_quantity=200,
                location="Jimma",
                farmer_id=farmer.id
            ),
            Product(
                name="Fresh Onions",
                description="Red onions from local farm",
                category="Vegetables",
                price=18.0,
                unit="KG",
                available_quantity=300,
                location="Addis Ababa",
                farmer_id=farmer.id
            ),
            Product(
                name="Wheat",
                description="High quality wheat grain",
                category="Grains",
                price=35.0,
                unit="KG",
                available_quantity=800,
                location="Debre Zeit",
                farmer_id=farmer.id
            ),
        ]
        
        session.add_all(products)
        await session.commit()
        
        print(f"+ {len(products)} test products created")
    
    await engine.dispose()
    print("\n+ Database initialization complete!")
    print("\nYou can now start the backend server:")
    print("  uvicorn app.main:app --reload")

if __name__ == "__main__":
    asyncio.run(init_database())
