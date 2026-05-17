"""
User factory — creates User model instances directly in the test DB.
Uses the same password hashing as production code.
"""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.core.security import get_password_hash


async def create_user(
    db: AsyncSession,
    *,
    email: str | None = None,
    username: str | None = None,
    password: str = "Test@1234",
    full_name: str = "Test User",
    phone: str = "+251911000000",
    role: str = "farmer",
    is_active: bool = True,
    verification_status: str = "unverified",
) -> User:
    """
    Insert a User row directly into the test DB and return it.
    A unique suffix is appended to email/username to avoid collisions
    when multiple tests run in the same session.
    """
    suffix = uuid.uuid4().hex[:8]
    user = User(
        email=email or f"user_{suffix}@test.com",
        username=username or f"user_{suffix}",
        hashed_password=get_password_hash(password),
        full_name=full_name,
        phone=phone,
        role=role,
        is_active=is_active,
        verification_status=verification_status,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def create_farmer(db: AsyncSession, **kwargs) -> User:
    return await create_user(db, role="farmer", **kwargs)


async def create_retailer(db: AsyncSession, verified: bool = False, **kwargs) -> User:
    vs = "verified" if verified else "unverified"
    return await create_user(db, role="retailer", verification_status=vs, **kwargs)


async def create_admin(db: AsyncSession, **kwargs) -> User:
    return await create_user(db, role="admin", verification_status="verified", **kwargs)
