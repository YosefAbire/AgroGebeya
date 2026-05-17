"""
Integration tests for the payment workflow.
Uses a mocked Chapa service to avoid real API calls.
"""
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient

from tests.helpers.assertions import (
    assert_ok, assert_created, assert_bad_request, assert_forbidden,
)
from app.models.order import OrderStatus

pytestmark = pytest.mark.integration

# Mock Chapa response
MOCK_CHAPA_RESPONSE = {
    "data": {"checkout_url": "https://checkout.chapa.co/test/pay/abc123"}
}


class TestPaymentInitialization:
    async def test_retailer_can_initialize_payment_for_pending_payment_order(
        self, verified_retailer_client: AsyncClient, db, product, verified_retailer
    ):
        from tests.factories.order_factory import create_order
        order = await create_order(
            db, product, verified_retailer, status=OrderStatus.PENDING_PAYMENT
        )

        with patch(
            "app.services.chapa_service.chapa_service.initialize_payment",
            new_callable=AsyncMock,
            return_value=MOCK_CHAPA_RESPONSE,
        ):
            resp = await verified_retailer_client.post(
                "/api/v1/payments/initialize",
                json={
                    "order_id": order.id,
                    "return_url": "http://localhost:3000/payment/success",
                },
            )
        data = assert_created(resp)
        assert "checkout_url" in data
        assert "transaction_id" in data
        assert "transaction_ref" in data

    async def test_cannot_pay_for_pending_order(
        self, verified_retailer_client: AsyncClient, pending_order
    ):
        """Order must be approved/pending_payment before payment."""
        with patch(
            "app.services.chapa_service.chapa_service.initialize_payment",
            new_callable=AsyncMock,
            return_value=MOCK_CHAPA_RESPONSE,
        ):
            resp = await verified_retailer_client.post(
                "/api/v1/payments/initialize",
                json={
                    "order_id": pending_order.id,
                    "return_url": "http://localhost:3000/payment/success",
                },
            )
        assert_bad_request(resp)

    async def test_farmer_cannot_initialize_payment(
        self, farmer_client: AsyncClient, db, product, verified_retailer
    ):
        from tests.factories.order_factory import create_order
        order = await create_order(
            db, product, verified_retailer, status=OrderStatus.PENDING_PAYMENT
        )
        with patch(
            "app.services.chapa_service.chapa_service.initialize_payment",
            new_callable=AsyncMock,
            return_value=MOCK_CHAPA_RESPONSE,
        ):
            resp = await farmer_client.post(
                "/api/v1/payments/initialize",
                json={
                    "order_id": order.id,
                    "return_url": "http://localhost:3000/payment/success",
                },
            )
        assert_forbidden(resp)

    async def test_duplicate_payment_blocked(
        self, verified_retailer_client: AsyncClient, db, product, verified_retailer
    ):
        from tests.factories.order_factory import create_order
        order = await create_order(
            db, product, verified_retailer,
            status=OrderStatus.PENDING_PAYMENT,
            payment_status="paid",
        )
        with patch(
            "app.services.chapa_service.chapa_service.initialize_payment",
            new_callable=AsyncMock,
            return_value=MOCK_CHAPA_RESPONSE,
        ):
            resp = await verified_retailer_client.post(
                "/api/v1/payments/initialize",
                json={
                    "order_id": order.id,
                    "return_url": "http://localhost:3000/payment/success",
                },
            )
        assert_bad_request(resp)
        assert "already paid" in resp.json()["detail"].lower()


class TestPaymentWebhook:
    async def test_successful_webhook_marks_order_paid(
        self, client: AsyncClient, db, product, verified_retailer
    ):
        from tests.factories.order_factory import create_order
        from app.models.transaction import Transaction
        from decimal import Decimal
        from sqlalchemy import select

        order = await create_order(
            db, product, verified_retailer, status=OrderStatus.PENDING_PAYMENT
        )
        # Create a transaction record as the initialize endpoint would
        tx = Transaction(
            order_id=order.id,
            user_id=verified_retailer.id,
            amount=Decimal(str(order.total_price)),
            currency="ETB",
            status="processing",
            chapa_transaction_ref="AGR-TEST-12345",
        )
        db.add(tx)
        await db.commit()

        resp = await client.post(
            "/api/v1/payments/webhook",
            json={"tx_ref": "AGR-TEST-12345", "status": "success"},
        )
        assert resp.json()["status"] == "ok"

        # Verify order is now PAID
        from app.models.order import Order
        result = await db.execute(select(Order).where(Order.id == order.id))
        updated_order = result.scalar_one()
        assert updated_order.payment_status == "paid"

    async def test_failed_webhook_marks_transaction_failed(
        self, client: AsyncClient, db, product, verified_retailer
    ):
        from app.models.transaction import Transaction
        from decimal import Decimal
        from sqlalchemy import select

        order = await create_order_helper(db, product, verified_retailer)
        tx = Transaction(
            order_id=order.id,
            user_id=verified_retailer.id,
            amount=Decimal("100.00"),
            currency="ETB",
            status="processing",
            chapa_transaction_ref="AGR-FAIL-99999",
        )
        db.add(tx)
        await db.commit()

        resp = await client.post(
            "/api/v1/payments/webhook",
            json={"tx_ref": "AGR-FAIL-99999", "status": "failed"},
        )
        assert resp.json()["status"] == "ok"

        result = await db.execute(
            __import__("sqlalchemy", fromlist=["select"]).select(Transaction).where(
                Transaction.chapa_transaction_ref == "AGR-FAIL-99999"
            )
        )
        updated_tx = result.scalar_one()
        assert updated_tx.status == "failed"

    async def test_unknown_tx_ref_returns_ok(self, client: AsyncClient):
        """Idempotency: unknown tx_ref should not crash."""
        resp = await client.post(
            "/api/v1/payments/webhook",
            json={"tx_ref": "NONEXISTENT-REF", "status": "success"},
        )
        assert resp.json()["status"] == "ok"


class TestTransactionHistory:
    async def test_retailer_can_list_own_transactions(
        self, verified_retailer_client: AsyncClient
    ):
        resp = await verified_retailer_client.get("/api/v1/payments/transactions")
        assert_ok(resp)
        assert isinstance(resp.json(), list)

    async def test_unauthenticated_cannot_list_transactions(
        self, client: AsyncClient
    ):
        resp = await client.get("/api/v1/payments/transactions")
        assert resp.status_code == 401


# ── Helper ────────────────────────────────────────────────────────────────────
async def create_order_helper(db, product, retailer):
    from tests.factories.order_factory import create_order
    return await create_order(db, product, retailer, status=OrderStatus.PENDING_PAYMENT)
