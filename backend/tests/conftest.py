"""
Root conftest.py — shared fixtures for the entire test suite.

Testing Strategy:
- Uses a dedicated PostgreSQL test database.
- Creates all tables once per test session.
- Each API request gets its own isolated AsyncSession.
- Each test function uses rollback cleanup for isolation.
- FastAPI dependencies are overridden safely.
- Compatible with pytest-asyncio + asyncpg + SQLAlchemy async.
"""

import os
import pytest
import pytest_asyncio

from typing import AsyncGenerator

from httpx import AsyncClient, ASGITransport

from sqlalchemy.pool import NullPool

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)

# ─────────────────────────────────────────────────────────────────────────────
# App imports
# ─────────────────────────────────────────────────────────────────────────────

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings

# ─────────────────────────────────────────────────────────────────────────────
# Test Database URL
# ─────────────────────────────────────────────────────────────────────────────

TEST_DB_URL = os.getenv(
    "TEST_DATABASE_URL",
    settings.DATABASE_URL.replace(
        "agrogebeya",
        "agrogebeya_test"
    ),
).replace(
    "postgresql://",
    "postgresql+asyncpg://"
)

# ─────────────────────────────────────────────────────────────────────────────
# Async Engine
# ─────────────────────────────────────────────────────────────────────────────

test_engine = create_async_engine(
    TEST_DB_URL,
    echo=False,
    future=True,
    poolclass=NullPool,  # IMPORTANT for async test isolation
)

# ─────────────────────────────────────────────────────────────────────────────
# Async Session Factory
# ─────────────────────────────────────────────────────────────────────────────

TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# ─────────────────────────────────────────────────────────────────────────────
# AnyIO Backend
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

# ─────────────────────────────────────────────────────────────────────────────
# Create / Drop Tables Once Per Session
# ─────────────────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_test_tables():
    """
    Create all tables before tests start.
    Drop all tables after tests finish.
    """

    # Import all models
    import app.models  # noqa

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await test_engine.dispose()

# ─────────────────────────────────────────────────────────────────────────────
# Isolated DB Session Fixture
# ─────────────────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture()
async def db() -> AsyncGenerator[AsyncSession, None]:
    """
    Provide isolated DB session for each test.
    Rolls back changes after test completion.
    """

    async with TestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.rollback()
            await session.close()

# ─────────────────────────────────────────────────────────────────────────────
# FastAPI Dependency Override
# ─────────────────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture(autouse=True)
async def override_get_db():
    """
    Override FastAPI DB dependency.

    IMPORTANT:
    Creates a NEW AsyncSession per request.
    Prevents asyncpg concurrent operation errors.
    """

    async def _get_test_db():
        async with TestSessionLocal() as session:
            try:
                yield session
            finally:
                await session.close()

    app.dependency_overrides[get_db] = _get_test_db

    yield

    app.dependency_overrides.pop(get_db, None)

# ─────────────────────────────────────────────────────────────────────────────
# Base Async Client
# ─────────────────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture()
async def client() -> AsyncGenerator[AsyncClient, None]:
    """
    Unauthenticated async test client.
    """

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

# ─────────────────────────────────────────────────────────────────────────────
# User Fixtures (fixed to avoid duplicate key errors)
# ─────────────────────────────────────────────────────────────────────────────

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from tests.factories.user_factory import create_farmer, create_retailer, create_admin

@pytest_asyncio.fixture()
async def farmer(db: AsyncSession):
    # Unique farmer user each test run
    return await create_farmer(db)

@pytest_asyncio.fixture()
async def retailer(db: AsyncSession):
    # Unique retailer user each test run
    return await create_retailer(db)

@pytest_asyncio.fixture()
async def verified_retailer(db: AsyncSession):
    # Unique verified retailer user each test run
    return await create_retailer(db, verified=True)

@pytest_asyncio.fixture()
async def admin(db: AsyncSession):
    # Unique admin user each test run
    return await create_admin(db)


# ─────────────────────────────────────────────────────────────────────────────
# Authenticated Clients
# ─────────────────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture()
async def farmer_client(farmer) -> AsyncGenerator[AsyncClient, None]:
    from tests.helpers.auth import auth_headers

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers=auth_headers(farmer),
    ) as ac:
        yield ac

@pytest_asyncio.fixture()
async def retailer_client(retailer) -> AsyncGenerator[AsyncClient, None]:
    from tests.helpers.auth import auth_headers

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers=auth_headers(retailer),
    ) as ac:
        yield ac

@pytest_asyncio.fixture()
async def verified_retailer_client(
    verified_retailer,
) -> AsyncGenerator[AsyncClient, None]:

    from tests.helpers.auth import auth_headers

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers=auth_headers(verified_retailer),
    ) as ac:
        yield ac

@pytest_asyncio.fixture()
async def admin_client(admin) -> AsyncGenerator[AsyncClient, None]:
    from tests.helpers.auth import auth_headers

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers=auth_headers(admin),
    ) as ac:
        yield ac

# ─────────────────────────────────────────────────────────────────────────────
# Product Fixture
# ─────────────────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture()
async def product(db: AsyncSession, farmer):
    from tests.factories.product_factory import create_product

    return await create_product(db, farmer)

# ─────────────────────────────────────────────────────────────────────────────
# Order Fixture
# ─────────────────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture()
async def pending_order(
    db: AsyncSession,
    product,
    verified_retailer,
):
    from tests.factories.order_factory import create_order

    return await create_order(
        db,
        product,
        verified_retailer,
    )