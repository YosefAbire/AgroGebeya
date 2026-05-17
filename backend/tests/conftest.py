"""
Root conftest.py — shared fixtures for the entire test suite.

Strategy:
- A separate in-memory/test PostgreSQL database is used (TEST_DATABASE_URL env var).
- Each test function gets a fresh transaction that is rolled back after the test,
  so tests are fully isolated without needing to recreate tables.
- The FastAPI app's `get_db` dependency is overridden to use the test session.
"""
import asyncio
import os
import pytest
import pytest_asyncio
from typing import AsyncGenerator

from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)

# ── App imports ───────────────────────────────────────────────────────────────
from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings

# ── Test database URL ─────────────────────────────────────────────────────────
# Override via TEST_DATABASE_URL env var; falls back to a separate test DB.
TEST_DB_URL = os.getenv(
    "TEST_DATABASE_URL",
    settings.DATABASE_URL.replace("agrogebeya", "agrogebeya_test"),
).replace("postgresql://", "postgresql+asyncpg://")

# ── Engine & session factory ──────────────────────────────────────────────────
test_engine = create_async_engine(TEST_DB_URL, echo=False, future=True)
TestSessionLocal = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


# ── Session-scoped: create / drop all tables once per test run ────────────────
@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_test_tables():
    """Create all tables before the test session; drop them after."""
    # Import all models so SQLAlchemy knows about them
    import app.models  # noqa: F401 — registers all models with Base.metadata

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await test_engine.dispose()


# ── Function-scoped: isolated DB session with rollback ────────────────────────
@pytest_asyncio.fixture()
async def db() -> AsyncGenerator[AsyncSession, None]:
    """
    Provide a test DB session that is rolled back after each test.
    Uses a nested transaction (SAVEPOINT) so each test is fully isolated.
    """
    async with TestSessionLocal() as session:
        async with session.begin():
            # Create a savepoint so we can roll back to it after the test
            nested = await session.begin_nested()
            try:
                yield session
            finally:
                await nested.rollback()


# ── Override app dependency ───────────────────────────────────────────────────
@pytest_asyncio.fixture(autouse=True)
async def override_get_db(db: AsyncSession):
    """Replace the production DB session with the test session for every test."""
    async def _get_test_db():
        yield db

    app.dependency_overrides[get_db] = _get_test_db
    yield
    app.dependency_overrides.pop(get_db, None)


# ── Async HTTP client ─────────────────────────────────────────────────────────
@pytest_asyncio.fixture()
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Unauthenticated async HTTP client pointed at the test app."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


# ── User fixtures ─────────────────────────────────────────────────────────────
@pytest_asyncio.fixture()
async def farmer(db: AsyncSession):
    from tests.factories.user_factory import create_farmer
    return await create_farmer(db, email="farmer@test.com", username="test_farmer")


@pytest_asyncio.fixture()
async def retailer(db: AsyncSession):
    from tests.factories.user_factory import create_retailer
    return await create_retailer(db, email="retailer@test.com", username="test_retailer")


@pytest_asyncio.fixture()
async def verified_retailer(db: AsyncSession):
    from tests.factories.user_factory import create_retailer
    return await create_retailer(
        db, verified=True, email="vretailer@test.com", username="verified_retailer"
    )


@pytest_asyncio.fixture()
async def admin(db: AsyncSession):
    from tests.factories.user_factory import create_admin
    return await create_admin(db, email="admin@test.com", username="test_admin")


# ── Authenticated client fixtures ─────────────────────────────────────────────
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
async def verified_retailer_client(verified_retailer) -> AsyncGenerator[AsyncClient, None]:
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


# ── Product fixture ───────────────────────────────────────────────────────────
@pytest_asyncio.fixture()
async def product(db: AsyncSession, farmer):
    from tests.factories.product_factory import create_product
    return await create_product(db, farmer)


# ── Order fixture ─────────────────────────────────────────────────────────────
@pytest_asyncio.fixture()
async def pending_order(db: AsyncSession, product, verified_retailer):
    from tests.factories.order_factory import create_order
    return await create_order(db, product, verified_retailer)
