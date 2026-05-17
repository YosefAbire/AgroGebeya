"""
Integration tests for the order lifecycle.
Covers placement, status transitions, inventory updates, and access control.
"""
import pytest
from httpx import AsyncClient

from tests.helpers.assertions import (
    assert_ok, assert_created, assert_forbidden, assert_bad_request,
    assert_not_found, assert_has_fields,
)

pytestmark = pytest.mark.integration


class TestOrderPlacement:
    async def test_verified_retailer_can_place_order(
        self, verified_retailer_client: AsyncClient, product
    ):
        resp = await verified_retailer_client.post(
            "/api/v1/orders",
            json={
                "product_id": product.id,
                "quantity": 5,
                "delivery_date": "2027-06-01T12:00:00",
            },
        )
        data = assert_created(resp)
        assert_has_fields(data, "id", "status", "total_price", "product_name")
        assert data["status"] == "pending"
        assert data["total_price"] == product.price * 5

    async def test_unverified_retailer_cannot_place_order(
        self, retailer_client: AsyncClient, product
    ):
        resp = await retailer_client.post(
            "/api/v1/orders",
            json={"product_id": product.id, "quantity": 5},
        )
        assert_forbidden(resp)
        assert "verified" in resp.json()["detail"].lower()

    async def test_farmer_cannot_place_order(
        self, farmer_client: AsyncClient, product
    ):
        resp = await farmer_client.post(
            "/api/v1/orders",
            json={"product_id": product.id, "quantity": 5},
        )
        assert_forbidden(resp)

    async def test_unauthenticated_cannot_place_order(
        self, client: AsyncClient, product
    ):
        resp = await client.post(
            "/api/v1/orders",
            json={"product_id": product.id, "quantity": 5},
        )
        assert resp.status_code == 401

    async def test_order_exceeding_stock_fails(
        self, verified_retailer_client: AsyncClient, product
    ):
        resp = await verified_retailer_client.post(
            "/api/v1/orders",
            json={"product_id": product.id, "quantity": product.available_quantity + 1},
        )
        assert_bad_request(resp)
        assert "insufficient" in resp.json()["detail"].lower()

    async def test_order_nonexistent_product_fails(
        self, verified_retailer_client: AsyncClient
    ):
        resp = await verified_retailer_client.post(
            "/api/v1/orders",
            json={"product_id": 999999, "quantity": 1},
        )
        assert_not_found(resp)

    async def test_order_total_price_calculated_correctly(
        self, verified_retailer_client: AsyncClient, product
    ):
        qty = 7
        resp = await verified_retailer_client.post(
            "/api/v1/orders",
            json={"product_id": product.id, "quantity": qty},
        )
        data = assert_created(resp)
        assert data["total_price"] == pytest.approx(product.price * qty)


class TestOrderListing:
    async def test_farmer_sees_own_orders(
        self, farmer_client: AsyncClient, pending_order
    ):
        resp = await farmer_client.get("/api/v1/orders")
        data = assert_ok(resp)
        ids = [o["id"] for o in data]
        assert pending_order.id in ids

    async def test_retailer_sees_own_orders(
        self, verified_retailer_client: AsyncClient, pending_order
    ):
        resp = await verified_retailer_client.get("/api/v1/orders")
        data = assert_ok(resp)
        ids = [o["id"] for o in data]
        assert pending_order.id in ids

    async def test_admin_sees_all_orders(
        self, admin_client: AsyncClient, pending_order
    ):
        resp = await admin_client.get("/api/v1/orders")
        data = assert_ok(resp)
        assert len(data) >= 1

    async def test_unauthenticated_cannot_list_orders(self, client: AsyncClient):
        resp = await client.get("/api/v1/orders")
        assert resp.status_code == 401


class TestOrderStatusTransitions:
    async def test_farmer_approves_pending_order(
        self, farmer_client: AsyncClient, pending_order, db
    ):
        resp = await farmer_client.put(
            f"/api/v1/orders/{pending_order.id}/status",
            json={"status": "approved"},
        )
        data = assert_ok(resp)
        # Farmer approval auto-advances to pending_payment
        assert data["status"] == "pending_payment"

    async def test_farmer_rejects_pending_order(
        self, farmer_client: AsyncClient, pending_order
    ):
        resp = await farmer_client.put(
            f"/api/v1/orders/{pending_order.id}/status",
            json={"status": "rejected", "cancellation_reason": "Out of season"},
        )
        data = assert_ok(resp)
        assert data["status"] == "rejected"

    async def test_retailer_cancels_pending_order(
        self, verified_retailer_client: AsyncClient, pending_order
    ):
        resp = await verified_retailer_client.delete(
            f"/api/v1/orders/{pending_order.id}"
        )
        assert resp.status_code == 204

    async def test_invalid_transition_fails(
        self, farmer_client: AsyncClient, pending_order
    ):
        # Cannot jump from pending directly to completed
        resp = await farmer_client.put(
            f"/api/v1/orders/{pending_order.id}/status",
            json={"status": "completed"},
        )
        assert_bad_request(resp)

    async def test_retailer_cannot_approve_order(
        self, verified_retailer_client: AsyncClient, pending_order
    ):
        resp = await verified_retailer_client.put(
            f"/api/v1/orders/{pending_order.id}/status",
            json={"status": "approved"},
        )
        assert_forbidden(resp)

    async def test_unauthorized_user_cannot_update_order(
        self, client: AsyncClient, pending_order
    ):
        resp = await client.put(
            f"/api/v1/orders/{pending_order.id}/status",
            json={"status": "approved"},
        )
        assert resp.status_code == 401


class TestInventoryOnOrderApproval:
    async def test_inventory_decremented_on_approval(
        self, farmer_client: AsyncClient, pending_order, product, db
    ):
        initial_qty = product.available_quantity
        await farmer_client.put(
            f"/api/v1/orders/{pending_order.id}/status",
            json={"status": "approved"},
        )
        # Refresh product from DB
        from sqlalchemy import select
        from app.models.product import Product
        result = await db.execute(select(Product).where(Product.id == product.id))
        updated = result.scalar_one()
        assert updated.available_quantity == initial_qty - pending_order.quantity

    async def test_inventory_restored_on_rejection(
        self, db, farmer_client: AsyncClient, product, verified_retailer
    ):
        from tests.factories.order_factory import create_order
        from app.models.order import OrderStatus
        from sqlalchemy import select
        from app.models.product import Product

        # Create an order that is already in pending_payment state
        order = await create_order(
            db, product, verified_retailer, status=OrderStatus.PENDING_PAYMENT
        )
        # Manually decrement stock as the approval would have done
        product.available_quantity -= order.quantity
        await db.commit()
        qty_after_approval = product.available_quantity

        # Now reject — should restore stock
        resp = await farmer_client.put(
            f"/api/v1/orders/{order.id}/status",
            json={"status": "rejected", "cancellation_reason": "Test rejection"},
        )
        assert_ok(resp)

        result = await db.execute(select(Product).where(Product.id == product.id))
        updated = result.scalar_one()
        assert updated.available_quantity == qty_after_approval + order.quantity
