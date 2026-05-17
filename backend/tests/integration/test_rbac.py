"""
Role-Based Access Control (RBAC) boundary tests.
Verifies that each role can only access what it's permitted to.
"""
import pytest
from httpx import AsyncClient

pytestmark = [pytest.mark.integration, pytest.mark.auth]


ADMIN_ONLY_ENDPOINTS = [
    ("GET",  "/api/v1/verification/admin/pending"),
    ("GET",  "/api/v1/credit/admin/accounts"),
    ("GET",  "/api/v1/credit/admin/invoices"),
    ("GET",  "/api/v1/admin/users"),
]

FARMER_FORBIDDEN_ENDPOINTS = [
    ("POST", "/api/v1/orders", {"product_id": 1, "quantity": 1}),
    ("GET",  "/api/v1/credit/my-credit", None),
]

RETAILER_FORBIDDEN_ENDPOINTS = [
    ("POST", "/api/v1/products", {"name": "x", "price": 1, "unit": "KG",
                                   "available_quantity": 1, "category": "Veg",
                                   "location": "AA"}),
]


class TestAdminOnlyEndpoints:
    @pytest.mark.parametrize("method,url", ADMIN_ONLY_ENDPOINTS)
    async def test_farmer_blocked_from_admin_endpoint(
        self, farmer_client: AsyncClient, method: str, url: str
    ):
        resp = await getattr(farmer_client, method.lower())(url)
        assert resp.status_code == 403, f"{method} {url} should be 403 for farmer"

    @pytest.mark.parametrize("method,url", ADMIN_ONLY_ENDPOINTS)
    async def test_retailer_blocked_from_admin_endpoint(
        self, retailer_client: AsyncClient, method: str, url: str
    ):
        resp = await getattr(retailer_client, method.lower())(url)
        assert resp.status_code == 403, f"{method} {url} should be 403 for retailer"

    @pytest.mark.parametrize("method,url", ADMIN_ONLY_ENDPOINTS)
    async def test_unauthenticated_blocked_from_admin_endpoint(
        self, client: AsyncClient, method: str, url: str
    ):
        resp = await getattr(client, method.lower())(url)
        assert resp.status_code in (401, 403)


class TestFarmerRestrictions:
    async def test_farmer_cannot_place_order(
        self, farmer_client: AsyncClient, product
    ):
        resp = await farmer_client.post(
            "/api/v1/orders",
            json={"product_id": product.id, "quantity": 1},
        )
        assert resp.status_code == 403

    async def test_farmer_cannot_access_credit(self, farmer_client: AsyncClient):
        resp = await farmer_client.get("/api/v1/credit/my-credit")
        assert resp.status_code == 403

    async def test_farmer_cannot_place_credit_order(
        self, farmer_client: AsyncClient, product
    ):
        resp = await farmer_client.post(
            "/api/v1/credit/order",
            json={"product_id": product.id, "quantity": 1},
        )
        assert resp.status_code == 403


class TestRetailerRestrictions:
    async def test_retailer_cannot_create_product(
        self, retailer_client: AsyncClient
    ):
        resp = await retailer_client.post(
            "/api/v1/products",
            json={
                "name": "Hack Product",
                "price": 1.0,
                "unit": "KG",
                "available_quantity": 100,
                "category": "Vegetables",
                "location": "AA",
            },
        )
        assert resp.status_code == 403

    async def test_retailer_cannot_approve_orders(
        self, verified_retailer_client: AsyncClient, pending_order
    ):
        resp = await verified_retailer_client.put(
            f"/api/v1/orders/{pending_order.id}/status",
            json={"status": "approved"},
        )
        assert resp.status_code == 403

    async def test_retailer_cannot_access_admin_reports(
        self, retailer_client: AsyncClient
    ):
        resp = await retailer_client.get("/api/v1/admin/reports/orders")
        assert resp.status_code in (401, 403)


class TestCrossUserDataIsolation:
    async def test_retailer_cannot_see_other_retailers_orders(
        self, db, product, verified_retailer
    ):
        """A second retailer should not see the first retailer's orders."""
        from tests.factories.user_factory import create_retailer
        from tests.factories.order_factory import create_order
        from tests.helpers.auth import auth_headers
        from httpx import AsyncClient, ASGITransport
        from app.main import app

        other_retailer = await create_retailer(db, verified=True)
        await create_order(db, product, verified_retailer)

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            headers=auth_headers(other_retailer),
        ) as ac:
            resp = await ac.get("/api/v1/orders")

        # Other retailer's order list should be empty (no orders for them)
        data = resp.json()
        assert all(o["retailer_id"] == other_retailer.id for o in data)
