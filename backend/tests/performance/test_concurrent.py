"""
Performance tests — concurrency, pagination, and bulk operations.
These tests are marked `slow` and skipped in normal CI runs unless
explicitly requested with: pytest -m performance
"""
import asyncio
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

pytestmark = [pytest.mark.performance, pytest.mark.slow]


class TestConcurrentRequests:
    async def test_concurrent_product_listing(self, client: AsyncClient):
        """50 simultaneous GET /products requests should all return 200."""
        tasks = [client.get("/api/v1/products") for _ in range(50)]
        responses = await asyncio.gather(*tasks)
        statuses = [r.status_code for r in responses]
        assert all(s == 200 for s in statuses), f"Some failed: {statuses}"

    async def test_concurrent_health_checks(self, client: AsyncClient):
        """100 simultaneous health checks."""
        tasks = [client.get("/api/health") for _ in range(100)]
        responses = await asyncio.gather(*tasks)
        assert all(r.status_code == 200 for r in responses)

    async def test_concurrent_order_placement(
        self, db, farmer, product
    ):
        """
        10 verified retailers try to order the same product simultaneously.
        Total requested quantity must not exceed available stock.
        """
        from tests.factories.user_factory import create_retailer
        from tests.helpers.auth import auth_headers

        # Create 10 verified retailers with unique emails
        retailers = [
            await create_retailer(db, verified=True)
            for _ in range(10)
        ]

        async def place_order(retailer):
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
                headers=auth_headers(retailer),
            ) as ac:
                return await ac.post(
                    "/api/v1/orders",
                    json={"product_id": product.id, "quantity": 60},
                )

        responses = await asyncio.gather(
            *[place_order(r) for r in retailers], return_exceptions=True
        )

        # Count successes and failures
        successes = [r for r in responses if not isinstance(r, Exception) and r.status_code == 201]
        failures = [r for r in responses if not isinstance(r, Exception) and r.status_code in (400, 403)]

        # With 500 units available and each order requesting 60,
        # at most 8 can succeed (8 * 60 = 480 ≤ 500, 9 * 60 = 540 > 500)
        total_ordered = sum(60 for _ in successes)
        assert total_ordered <= product.available_quantity, (
            f"Oversold! {total_ordered} ordered but only {product.available_quantity} available"
        )


class TestPaginationPerformance:
    async def test_product_list_pagination(
        self, farmer_client: AsyncClient, db, farmer
    ):
        """Create 25 products and verify pagination works correctly."""
        from tests.factories.product_factory import create_product

        for i in range(25):
            await create_product(db, farmer, name=f"Perf Product {i}")

        # First page
        resp1 = await farmer_client.get("/api/v1/products?skip=0&limit=10")
        assert resp1.status_code == 200
        assert len(resp1.json()) <= 10

        # Second page
        resp2 = await farmer_client.get("/api/v1/products?skip=10&limit=10")
        assert resp2.status_code == 200

        # Pages should not overlap
        ids1 = {p["id"] for p in resp1.json()}
        ids2 = {p["id"] for p in resp2.json()}
        assert ids1.isdisjoint(ids2), "Pagination pages overlap"

    async def test_order_list_pagination(
        self, verified_retailer_client: AsyncClient, db, product, verified_retailer
    ):
        """Create 15 orders and verify pagination."""
        from tests.factories.order_factory import create_order

        for _ in range(15):
            await create_order(db, product, verified_retailer)

        resp = await verified_retailer_client.get("/api/v1/orders?skip=0&limit=5")
        assert resp.status_code == 200
        assert len(resp.json()) <= 5


class TestBulkOperations:
    async def test_bulk_product_creation_performance(
        self, farmer_client: AsyncClient
    ):
        """Create 20 products sequentially and verify all succeed within time limit."""
        import time

        start = time.monotonic()
        for i in range(20):
            resp = await farmer_client.post(
                "/api/v1/products",
                json={
                    "name": f"Bulk Product {i}",
                    "description": "Bulk test",
                    "category": "Vegetables",
                    "price": 10.0 + i,
                    "unit": "KG",
                    "available_quantity": 100,
                    "location": "Addis Ababa",
                },
            )
            assert resp.status_code == 201

        elapsed = time.monotonic() - start
        # 20 products should be created in under 10 seconds
        assert elapsed < 10.0, f"Bulk creation too slow: {elapsed:.2f}s"
