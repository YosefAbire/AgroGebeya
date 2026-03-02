"""
Script to create a new user in the database
Usage: python create_user.py
"""
import asyncio
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole

async def create_user():
    async with AsyncSessionLocal() as session:
        # Get user details
        print("Create New User")
        print("-" * 50)
        
        username = input("Username: ").strip()
        email = input("Email: ").strip()
        password = input("Password: ").strip()
        full_name = input("Full Name: ").strip()
        phone = input("Phone (optional): ").strip() or None
        
        print("\nSelect Role:")
        print("1. Farmer")
        print("2. Retailer")
        print("3. Admin")
        role_choice = input("Enter choice (1-3): ").strip()
        
        role_map = {
            "1": UserRole.FARMER,
            "2": UserRole.RETAILER,
            "3": UserRole.ADMIN
        }
        
        role = role_map.get(role_choice, UserRole.FARMER)
        
        # Create user
        new_user = User(
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            phone=phone,
            role=role,
            is_active=True,
            is_verified=True
        )
        
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
        
        print("\n" + "=" * 50)
        print("✅ User created successfully!")
        print("=" * 50)
        print(f"ID: {new_user.id}")
        print(f"Username: {new_user.username}")
        print(f"Email: {new_user.email}")
        print(f"Role: {new_user.role.value}")
        print(f"Full Name: {new_user.full_name}")
        print("=" * 50)

if __name__ == "__main__":
    asyncio.run(create_user())
