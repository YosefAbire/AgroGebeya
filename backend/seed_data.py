"""
Seed database with sample data for testing
Run this after running migrations: python seed_data.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.product import Product


async def seed_database():
    engine = create_async_engine(
        settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
        echo=False
    )
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        print("🌱 Seeding database...")

        result = await session.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            print("⚠️  Database already has data. Skipping seed.")
            return

        # ── Users ──────────────────────────────────────────────────────────────
        print("\n📝 Creating users...")
        users_data = [
            # Farmers (from mock-data.ts ethiopianFarmers)
            dict(email="abebe.gebreselassie@agrogebeya.com", username="abebe_g",
                 full_name="Abebe Gebreselassie", phone="+251911234567",
                 role=UserRole.FARMER, location="Addis Ababa"),
            dict(email="teffo.zeri@agrogebeya.com", username="teffo_z",
                 full_name="Teffo Zeri", phone="+251912345678",
                 role=UserRole.FARMER, location="Hawassa"),
            dict(email="demse.alem@agrogebeya.com", username="demse_a",
                 full_name="Demse Alem", phone="+251913456789",
                 role=UserRole.FARMER, location="Jimma"),
            dict(email="yuhwas.tadesse@agrogebeya.com", username="yuhwas_t",
                 full_name="Yuhwas Tadesse", phone="+251914567890",
                 role=UserRole.FARMER, location="Bahir Dar"),
            # Extra farmers for products
            dict(email="hailu.girma@agrogebeya.com", username="hailu_g",
                 full_name="Hailu Girma", phone="+251915678901",
                 role=UserRole.FARMER, location="Mekelle"),
            dict(email="worku.sharm@agrogebeya.com", username="worku_s",
                 full_name="Worku Sharm", phone="+251916789012",
                 role=UserRole.FARMER, location="Dire Dawa"),
            dict(email="beindeta.samra@agrogebeya.com", username="beindeta_s",
                 full_name="Beindeta Samra", phone="+251917890123",
                 role=UserRole.FARMER, location="Adama"),
            dict(email="muste.tibeb@agrogebeya.com", username="muste_t",
                 full_name="Muste Tibeb", phone="+251918901234",
                 role=UserRole.FARMER, location="Arsi Zone"),
            dict(email="asrat.gibre@agrogebeya.com", username="asrat_g",
                 full_name="Asrat Gibre", phone="+251919012345",
                 role=UserRole.FARMER, location="South Wollo"),
            dict(email="nori.diri@agrogebeya.com", username="nori_d",
                 full_name="Nori Diri Tebab", phone="+251910123456",
                 role=UserRole.FARMER, location="Addis Ababa"),
            # Retailers (from mock-data.ts ethiopianRetailers)
            dict(email="tadesse.abate@freshmarket.com", username="tadesse_a",
                 full_name="Tadesse Abate", phone="+251921234567",
                 role=UserRole.RETAILER, location="Dire Dawa"),
            dict(email="huba.tadla@greenmarket.com", username="huba_t",
                 full_name="Huba Tadla", phone="+251922345678",
                 role=UserRole.RETAILER, location="Adama"),
            dict(email="berhane.samu@promarket.com", username="berhane_s",
                 full_name="Berhane Samu", phone="+251923456789",
                 role=UserRole.RETAILER, location="Mekelle"),
            # Admin
            dict(email="admin@agrogebeya.com", username="admin",
                 full_name="Admin User", phone="+251933456789",
                 role=UserRole.ADMIN, location="Addis Ababa"),
        ]

        users = []
        for u in users_data:
            pwd = "admin123" if u["role"] == UserRole.ADMIN else "password123"
            user = User(
                email=u["email"], username=u["username"],
                hashed_password=get_password_hash(pwd),
                full_name=u["full_name"], phone=u["phone"],
                role=u["role"], is_active=True, verification_status="verified"
            )
            users.append(user)

        session.add_all(users)
        await session.commit()
        for u in users:
            await session.refresh(u)
        print(f"✅ Created {len(users)} users")

        # Map by username for easy lookup
        by_username = {u.username: u for u in users}

        # ── Products ───────────────────────────────────────────────────────────
        print("\n📦 Creating products...")
        products = [
            # Abebe Gebreselassie – Addis Ababa
            Product(name="Organic Tomatoes", description="ቲማቲም ኦርጋኒክ – freshly harvested organic red tomatoes",
                    category="Vegetables", price=25.0, unit="KG", available_quantity=500,
                    location="Addis Ababa", farmer_id=by_username["abebe_g"].id),
            # Teffo Zeri – Hawassa
            Product(name="Fresh Onions", description="ሽንኩርት አዲስ – fresh onions from Hawassa farms",
                    category="Vegetables", price=30.0, unit="KG", available_quantity=300,
                    location="Hawassa", farmer_id=by_username["teffo_z"].id),
            # Demse Alem – Jimma
            Product(name="Red Potatoes", description="ድንች ቀይ – red potatoes from Jimma highlands",
                    category="Vegetables", price=20.0, unit="KG", available_quantity=600,
                    location="Jimma", farmer_id=by_username["demse_a"].id),
            Product(name="Coffee Beans", description="Ethiopian Arabica coffee beans from Jimma region",
                    category="Beverages", price=120.0, unit="KG", available_quantity=200,
                    location="Jimma", farmer_id=by_username["demse_a"].id),
            # Yuhwas Tadesse – Bahir Dar
            Product(name="Garden Carrots", description="ካሮት ወርደ – fresh garden carrots from Bahir Dar",
                    category="Vegetables", price=22.0, unit="KG", available_quantity=400,
                    location="Bahir Dar", farmer_id=by_username["yuhwas_t"].id),
            Product(name="Honey", description="Pure Ethiopian honey from forest bees near Bahir Dar",
                    category="Beverages", price=150.0, unit="KG", available_quantity=100,
                    location="Bahir Dar", farmer_id=by_username["yuhwas_t"].id),
            # Hailu Girma – Mekelle
            Product(name="Fresh Cabbage", description="ጎመን አዲስ – green cabbage from Mekelle organic farm",
                    category="Vegetables", price=15.0, unit="KG", available_quantity=350,
                    location="Mekelle", farmer_id=by_username["hailu_g"].id),
            # Worku Sharm – Dire Dawa
            Product(name="Ripe Bananas", description="ሙዝ ሙቅ – ripe bananas from Dire Dawa",
                    category="Fruits", price=35.0, unit="Dozen", available_quantity=250,
                    location="Dire Dawa", farmer_id=by_username["worku_s"].id),
            # Beindeta Samra – Adama
            Product(name="Sweet Oranges", description="ብርቱካን ጣፈጥ – sweet oranges from Adama",
                    category="Fruits", price=40.0, unit="KG", available_quantity=300,
                    location="Adama", farmer_id=by_username["beindeta_s"].id),
            # Muste Tibeb – Arsi Zone
            Product(name="White Wheat", description="ጤፍ ነጩ – premium white wheat from Arsi Zone",
                    category="Grains", price=18.0, unit="KG", available_quantity=800,
                    location="Arsi Zone", farmer_id=by_username["muste_t"].id),
            Product(name="Barley", description="Premium barley grain from Arsi highlands",
                    category="Grains", price=38.0, unit="KG", available_quantity=500,
                    location="Arsi Zone", farmer_id=by_username["muste_t"].id),
            # Asrat Gibre – South Wollo
            Product(name="Red Teff", description="ጤፍ ቀይ – premium red teff from South Wollo, perfect for injera",
                    category="Grains", price=45.0, unit="KG", available_quantity=1000,
                    location="South Wollo", farmer_id=by_username["asrat_g"].id),
            # Nori Diri – Addis Ababa
            Product(name="Fresh Milk", description="ወተት አዲስ – fresh dairy milk from Addis Ababa",
                    category="Dairy", price=50.0, unit="Litre", available_quantity=150,
                    location="Addis Ababa", farmer_id=by_username["nori_d"].id),
        ]

        session.add_all(products)
        await session.commit()
        print(f"✅ Created {len(products)} products")

    await engine.dispose()

    print("\n" + "=" * 60)
    print("✅ Database seeded successfully!")
    print("=" * 60)
    print("\n📋 Test Accounts (all use password123 except admin):")
    print("\n  Farmers: abebe_g, teffo_z, demse_a, yuhwas_t, hailu_g,")
    print("           worku_s, beindeta_s, muste_t, asrat_g, nori_d")
    print("\n  Retailers: tadesse_a, huba_t, berhane_s")
    print("\n  Admin: admin / admin123")
    print("\n🌐 Locations API: GET /api/v1/locations/cities  &  /api/v1/locations/regions")


if __name__ == "__main__":
    asyncio.run(seed_database())
