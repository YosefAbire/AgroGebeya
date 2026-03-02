"""
Quick script to add 'yosef' user as a farmer
Usage: python add_yosef_user.py
"""
import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole

async def add_yosef():
    async with AsyncSessionLocal() as session:
        # Check if user already exists
        result = await session.execute(
            select(User).where(User.username == "yosef")
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print("❌ User 'yosef' already exists!")
            print(f"   Email: {existing_user.email}")
            print(f"   Role: {existing_user.role.value}")
            return
        
        # Create yosef user
        new_user = User(
            username="yosef",
            email="yosef@agrogebeya.com",
            hashed_password=get_password_hash("password123"),  # Default password
            full_name="Yosef",
            phone="+251911234567",
            role=UserRole.FARMER,
            is_active=True,
            is_verified=True
        )
        
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
        
        print("\n" + "=" * 50)
        print("✅ User 'yosef' created successfully!")
        print("=" * 50)
        print(f"Username: yosef")
        print(f"Password: password123")
        print(f"Email: yosef@agrogebeya.com")
        print(f"Role: farmer")
        print("=" * 50)
        print("\nYou can now login with:")
        print("  Username: yosef")
        print("  Password: password123")
        print("=" * 50)

if __name__ == "__main__":
    asyncio.run(add_yosef())
