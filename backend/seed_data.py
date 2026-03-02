"""
Seed database with sample data for testing
Run this after running migrations: python seed_data.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.product import Product

async def seed_database():
    """Seed database with sample data"""
    
    # Create engine
    engine = create_async_engine(
        settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
        echo=False
    )
    
    # Create session
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        print("🌱 Seeding database with sample data...")
        
        # Check if users already exist
        from sqlalchemy import select
        result = await session.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            print("⚠️  Database already has data. Skipping seed.")
            return
        
        # Create test users
        print("\n📝 Creating users...")
        users = [
            User(
                email="farmer1@agrogebeya.com",
                username="farmer1",
                hashed_password=get_password_hash("password123"),
                full_name="Abebe Kebede",
                phone="+251911234567",
                role=UserRole.FARMER,
                is_active=True,
                verification_status="verified"
            ),
            User(
                email="farmer2@agrogebeya.com",
                username="farmer2",
                hashed_password=get_password_hash("password123"),
                full_name="Tigist Haile",
                phone="+251912345678",
                role=UserRole.FARMER,
                is_active=True,
                verification_status="verified"
            ),
            User(
                email="retailer1@agrogebeya.com",
                username="retailer1",
                hashed_password=get_password_hash("password123"),
                full_name="Tadesse Abate",
                phone="+251922345678",
                role=UserRole.RETAILER,
                is_active=True,
                verification_status="verified"
            ),
            User(
                email="retailer2@agrogebeya.com",
                username="retailer2",
                hashed_password=get_password_hash("password123"),
                full_name="Marta Tesfaye",
                phone="+251923456789",
                role=UserRole.RETAILER,
                is_active=True,
                verification_status="verified"
            ),
            User(
                email="admin@agrogebeya.com",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                full_name="Admin User",
                phone="+251933456789",
                role=UserRole.ADMIN,
                is_active=True,
                verification_status="verified"
            ),
        ]
        
        session.add_all(users)
        await session.commit()
        
        print(f"✅ Created {len(users)} users")
        
        # Refresh to get IDs
        for user in users:
            await session.refresh(user)
        
        farmer1 = users[0]
        farmer2 = users[1]
        
        # Create test products
        print("\n📦 Creating products...")
        products = [
            # Farmer 1 products
            Product(
                name="Fresh Tomatoes",
                description="Organic red tomatoes, freshly harvested from Addis Ababa farms",
                category="Vegetables",
                price=25.0,
                unit="KG",
                available_quantity=500,
                location="Addis Ababa",
                farmer_id=farmer1.id
            ),
            Product(
                name="Teff Grain",
                description="Premium quality teff grain, perfect for injera",
                category="Grains",
                price=45.0,
                unit="KG",
                available_quantity=1000,
                location="Addis Ababa",
                farmer_id=farmer1.id
            ),
            Product(
                name="Coffee Beans",
                description="Ethiopian Arabica coffee beans from Jimma region",
                category="Beverages",
                price=120.0,
                unit="KG",
                available_quantity=200,
                location="Jimma",
                farmer_id=farmer1.id
            ),
            Product(
                name="Fresh Onions",
                description="Red onions from local organic farm",
                category="Vegetables",
                price=18.0,
                unit="KG",
                available_quantity=300,
                location="Addis Ababa",
                farmer_id=farmer1.id
            ),
            Product(
                name="Wheat",
                description="High quality wheat grain for bread making",
                category="Grains",
                price=35.0,
                unit="KG",
                available_quantity=800,
                location="Debre Zeit",
                farmer_id=farmer1.id
            ),
            # Farmer 2 products
            Product(
                name="Fresh Potatoes",
                description="Farm-fresh potatoes from Shashemene",
                category="Vegetables",
                price=22.0,
                unit="KG",
                available_quantity=600,
                location="Shashemene",
                farmer_id=farmer2.id
            ),
            Product(
                name="Barley",
                description="Premium barley grain",
                category="Grains",
                price=38.0,
                unit="KG",
                available_quantity=500,
                location="Debre Berhan",
                farmer_id=farmer2.id
            ),
            Product(
                name="Fresh Carrots",
                description="Organic carrots from highland farms",
                category="Vegetables",
                price=28.0,
                unit="KG",
                available_quantity=400,
                location="Addis Ababa",
                farmer_id=farmer2.id
            ),
            Product(
                name="Honey",
                description="Pure Ethiopian honey from forest bees",
                category="Beverages",
                price=150.0,
                unit="KG",
                available_quantity=100,
                location="Bahir Dar",
                farmer_id=farmer2.id
            ),
            Product(
                name="Fresh Cabbage",
                description="Green cabbage from organic farm",
                category="Vegetables",
                price=15.0,
                unit="KG",
                available_quantity=350,
                location="Addis Ababa",
                farmer_id=farmer2.id
            ),
        ]
        
        session.add_all(products)
        await session.commit()
        
        print(f"✅ Created {len(products)} products")
    
    await engine.dispose()
    
    print("\n" + "="*60)
    print("✅ Database seeded successfully!")
    print("="*60)
    print("\n📋 Test Accounts:")
    print("\n  Farmers:")
    print("    • farmer1 / password123 (Abebe Kebede)")
    print("    • farmer2 / password123 (Tigist Haile)")
    print("\n  Retailers:")
    print("    • retailer1 / password123 (Tadesse Abate)")
    print("    • retailer2 / password123 (Marta Tesfaye)")
    print("\n  Admin:")
    print("    • admin / admin123 (Admin User)")
    print("\n🚀 You can now start the backend server:")
    print("    uvicorn app.main:app --reload")
    print("\n📱 Frontend will be available at:")
    print("    http://localhost:3000")
    print("\n")

if __name__ == "__main__":
    asyncio.run(seed_database())
