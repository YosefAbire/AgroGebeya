"""
Security and input validation tests.
Covers SQL injection attempts, invalid payloads, permission boundaries,
duplicate protection, and invalid state transitions.
"""
import pytest
from httpx import AsyncClient

pytestmark = [pytest.mark.integration, pytest.mark.auth]


class TestSQLInjectionProtection:
    """SQLAlchemy parameterized queries prevent injection — verify no 500 errors."""

    async def test_sql_injection_in_username(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/auth/login",
            data={"username": "' OR '1'='1", "password": "anything"},
        )
        # Should be 401 (wrong creds), never 500
        assert resp.status_code == 401

    async def test_sql_injection_in_product_search(self, client: AsyncClient):
        resp = await client.get(
            "/api/v1/products?search='; DROP TABLE products; --"
        )
        # Should return 200 with empty/normal results, never 500
        assert resp.status_code == 200

    async def test_sql_injection_in_order_id(
        self, farmer_client: AsyncClient
    ):
        resp = await farmer_client.get("/api/v1/orders/1; DROP TABLE orders")
        # FastAPI path validation rejects non-integer path params
        assert resp.status_code in (404, 422)


class TestInvalidPayloads:
    async def test_register_with_empty_body(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/register", json={})
        assert resp.status_code == 422

    async def test_register_with_invalid_email(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "not-an-email",
                "username": "user1",
                "password": "pass",
                "role": "farmer",
            },
        )
        assert resp.status_code == 422

    async def test_create_product_with_string_price(
        self, farmer_client: AsyncClient
    ):
        resp = await farmer_client.post(
            "/api/v1/products",
            json={
                "name": "Bad Product",
                "price": "not_a_number",
                "unit": "KG",
                "available_quantity": 10,
                "category": "Vegetables",
                "location": "AA",
            },
        )
        assert resp.status_code == 422

    async def test_order_with_zero_quantity(
        self, verified_retailer_client: AsyncClient, product
    ):
        resp = await verified_retailer_client.post(
            "/api/v1/orders",
            json={"product_id": product.id, "quantity": 0},
        )
        assert resp.status_code in (400, 422)

    async def test_order_with_negative_quantity(
        self, verified_retailer_client: AsyncClient, product
    ):
        resp = await verified_retailer_client.post(
            "/api/v1/orders",
            json={"product_id": product.id, "quantity": -5},
        )
        assert resp.status_code in (400, 422)

    async def test_payment_with_missing_return_url(
        self, verified_retailer_client: AsyncClient, pending_order
    ):
        resp = await verified_retailer_client.post(
            "/api/v1/payments/initialize",
            json={"order_id": pending_order.id},
        )
        assert resp.status_code == 422


class TestDuplicateProtection:
    async def test_duplicate_user_registration(self, client: AsyncClient):
        payload = {
            "email": "dup@test.com",
            "username": "dup_user",
            "password": "Pass@1234",
            "role": "farmer",
        }
        await client.post("/api/v1/auth/register", json=payload)
        resp = await client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 400

    async def test_duplicate_verification_submission(
        self, farmer_client: AsyncClient
    ):
        await farmer_client.post(
            "/api/v1/verification/submit",
            json={"national_id": "123456789012"},
        )
        resp = await farmer_client.post(
            "/api/v1/verification/submit",
            json={"national_id": "123456789012"},
        )
        assert resp.status_code == 400

    async def test_duplicate_credit_grant(
        self, admin_client: AsyncClient, verified_retailer
    ):
        payload = {
            "retailer_id": verified_retailer.id,
            "credit_limit": 10000,
            "payment_due_days": 30,
        }
        await admin_client.post("/api/v1/credit/admin/grant", json=payload)
        resp = await admin_client.post("/api/v1/credit/admin/grant", json=payload)
        assert resp.status_code == 400


class TestInvalidStateTransitions:
    async def test_cannot_approve_already_approved_order(
        self, farmer_client: AsyncClient, db, product, verified_retailer
    ):
        from tests.factories.order_factory import create_order
        from app.models.order import OrderStatus

        order = await create_order(
            db, product, verified_retailer, status=OrderStatus.PENDING_PAYMENT
        )
        resp = await farmer_client.put(
            f"/api/v1/orders/{order.id}/status",
            json={"status": "approved"},
        )
        assert resp.status_code == 400

    async def test_cannot_cancel_completed_order(
        self, verified_retailer_client: AsyncClient, db, product, verified_retailer
    ):
        from tests.factories.order_factory import create_order
        from app.models.order import OrderStatus

        order = await create_order(
            db, product, verified_retailer, status=OrderStatus.COMPLETED
        )
        resp = await verified_retailer_client.delete(f"/api/v1/orders/{order.id}")
        assert resp.status_code == 400

    async def test_cannot_pay_cancelled_order(
        self, verified_retailer_client: AsyncClient, db, product, verified_retailer
    ):
        from tests.factories.order_factory import create_order
        from app.models.order import OrderStatus
        from unittest.mock import AsyncMock, patch

        order = await create_order(
            db, product, verified_retailer, status=OrderStatus.CANCELLED
        )
        with patch(
            "app.services.chapa_service.chapa_service.initialize_payment",
            new_callable=AsyncMock,
        ):
            resp = await verified_retailer_client.post(
                "/api/v1/payments/initialize",
                json={
                    "order_id": order.id,
                    "return_url": "http://localhost:3000/payment/success",
                },
            )
        assert resp.status_code == 400


class TestPermissionBoundaries:
    async def test_cannot_access_other_users_order(
        self, db, product, verified_retailer
    ):
        from tests.factories.user_factory import create_retailer
        from tests.factories.order_factory import create_order
        from tests.helpers.auth import auth_headers
        from httpx import AsyncClient, ASGITransport
        from app.main import app

        order = await create_order(db, product, verified_retailer)
        other = await create_retailer(db, verified=True)

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            headers=auth_headers(other),
        ) as ac:
            resp = await ac.get(f"/api/v1/orders/{order.id}")

        assert resp.status_code == 403

    async def test_cannot_delete_other_farmers_product(
        self, db, product, farmer
    ):
        from tests.factories.user_factory import create_farmer
        from tests.helpers.auth import auth_headers
        from httpx import AsyncClient, ASGITransport
        from app.main import app

        other_farmer = await create_farmer(db)
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            headers=auth_headers(other_farmer),
        ) as ac:
            resp = await ac.delete(f"/api/v1/products/{product.id}")

        assert resp.status_code == 403
