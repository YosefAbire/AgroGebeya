"""
End-to-end integration tests covering complete multi-step workflows.

1. Farmer product-to-order lifecycle
2. Verified retailer checkout flow (immediate payment)
3. Credit-based retailer checkout flow
4. Delivery completion updating order state
5. Multi-role interaction across modules
"""
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient

from tests.helpers.assertions import assert_ok, assert_created, assert_has_fields

pytestmark = pytest.mark.integration

MOCK_CHAPA = {"data": {"checkout_url": "https://checkout.chapa.co/test/abc"}}


class TestFarmerProductToOrderLifecycle:
    """
    Full flow:
    Farmer creates product → Retailer places order →
    Farmer approves → Order moves to pending_payment →
    Retailer pays → Order becomes PAID → Farmer marks completed
    """

    async def test_full_immediate_payment_lifecycle(
        self,
        farmer_client: AsyncClient,
        verified_retailer_client: AsyncClient,
        farmer,
        verified_retailer,
        db,
    ):
        # 1. Farmer creates a product
        product_resp = await farmer_client.post(
            "/api/v1/products",
            json={
                "name": "E2E Tomatoes",
                "description": "End-to-end test product",
                "category": "Vegetables",
                "price": 30.0,
                "unit": "KG",
                "available_quantity": 100,
                "location": "Addis Ababa",
            },
        )
        product = assert_created(product_resp)
        product_id = product["id"]
        assert product["farmer_id"] == farmer.id

        # 2. Retailer places order
        order_resp = await verified_retailer_client.post(
            "/api/v1/orders",
            json={
                "product_id": product_id,
                "quantity": 10,
                "delivery_date": "2027-06-01T12:00:00",
            },
        )
        order = assert_created(order_resp)
        order_id = order["id"]
        assert order["status"] == "pending"
        assert order["total_price"] == pytest.approx(300.0)

        # 3. Farmer approves → auto-advances to pending_payment
        approve_resp = await farmer_client.put(
            f"/api/v1/orders/{order_id}/status",
            json={"status": "approved"},
        )
        approved = assert_ok(approve_resp)
        assert approved["status"] == "pending_payment"
        assert approved["payment_deadline"] is not None

        # 4. Retailer initializes payment
        with patch(
            "app.services.chapa_service.chapa_service.initialize_payment",
            new_callable=AsyncMock,
            return_value=MOCK_CHAPA,
        ):
            pay_resp = await verified_retailer_client.post(
                "/api/v1/payments/initialize",
                json={
                    "order_id": order_id,
                    "return_url": "http://localhost:3000/payment/success",
                },
            )
        pay_data = assert_created(pay_resp)
        tx_ref = pay_data["transaction_ref"]
        assert pay_data["checkout_url"] is not None

        # 5. Chapa webhook fires — payment successful
        webhook_resp = await verified_retailer_client.post(
            "/api/v1/payments/webhook",
            json={"tx_ref": tx_ref, "status": "success"},
        )
        assert webhook_resp.json()["status"] == "ok"

        # 6. Verify order is now PAID
        order_check = await farmer_client.get(f"/api/v1/orders/{order_id}")
        order_data = assert_ok(order_check)
        assert order_data["status"] == "paid"
        assert order_data["payment_status"] == "paid"

        # 7. Farmer marks order completed
        complete_resp = await farmer_client.put(
            f"/api/v1/orders/{order_id}/status",
            json={"status": "completed"},
        )
        completed = assert_ok(complete_resp)
        assert completed["status"] == "completed"
        assert completed["completed_at"] is not None

        # 8. Verify inventory was permanently deducted
        product_check = await farmer_client.get(f"/api/v1/products/{product_id}")
        updated_product = assert_ok(product_check)
        assert updated_product["available_quantity"] == 90  # 100 - 10


class TestCreditBasedCheckoutFlow:
    """
    Full credit flow:
    Admin grants credit → Retailer places credit order →
    Invoice generated → Retailer pays invoice → Credit balance restored
    """

    async def test_full_credit_lifecycle(
        self,
        admin_client: AsyncClient,
        verified_retailer_client: AsyncClient,
        verified_retailer,
        product,
    ):
        # 1. Admin grants credit
        grant_resp = await admin_client.post(
            "/api/v1/credit/admin/grant",
            json={
                "retailer_id": verified_retailer.id,
                "credit_limit": 50000,
                "payment_due_days": 30,
            },
        )
        credit = assert_created(grant_resp)
        assert float(credit["available_credit"]) == 50000.0

        # 2. Retailer places credit order
        order_resp = await verified_retailer_client.post(
            "/api/v1/credit/order",
            json={"product_id": product.id, "quantity": 20},
        )
        order_data = assert_created(order_resp)
        assert "invoice_number" in order_data
        expected_total = product.price * 20
        assert float(order_data["total"]) == pytest.approx(expected_total)

        # 3. Credit balance reduced
        credit_check = await verified_retailer_client.get("/api/v1/credit/my-credit")
        updated_credit = assert_ok(credit_check)
        assert float(updated_credit["used_credit"]) == pytest.approx(expected_total)
        assert float(updated_credit["available_credit"]) == pytest.approx(
            50000.0 - expected_total
        )

        # 4. Invoice exists
        invoices_resp = await verified_retailer_client.get("/api/v1/credit/my-invoices")
        invoices = assert_ok(invoices_resp)
        assert len(invoices) >= 1
        invoice = invoices[0]
        assert invoice["status"] == "issued"
        assert float(invoice["balance_due"]) == pytest.approx(expected_total)

        # 5. Retailer pays invoice in full
        pay_resp = await verified_retailer_client.post(
            f"/api/v1/credit/invoices/{invoice['id']}/pay",
            json={"amount": invoice["balance_due"]},
        )
        paid = assert_ok(pay_resp)
        assert paid["status"] == "paid"
        assert float(paid["balance_due"]) == pytest.approx(0.0, abs=0.01)

        # 6. Credit balance restored
        final_credit = await verified_retailer_client.get("/api/v1/credit/my-credit")
        final = assert_ok(final_credit)
        assert float(final["used_credit"]) == pytest.approx(0.0, abs=0.01)
        assert float(final["available_credit"]) == pytest.approx(50000.0, abs=0.01)


class TestOrderCancellationRestoresInventory:
    """
    Retailer cancels a pending_payment order →
    Inventory is restored to original quantity.
    """

    async def test_cancellation_restores_stock(
        self,
        farmer_client: AsyncClient,
        verified_retailer_client: AsyncClient,
        product,
        db,
    ):
        initial_qty = product.available_quantity

        # Place order
        order_resp = await verified_retailer_client.post(
            "/api/v1/orders",
            json={"product_id": product.id, "quantity": 15},
        )
        order_id = order_resp.json()["id"]

        # Farmer approves (deducts stock)
        await farmer_client.put(
            f"/api/v1/orders/{order_id}/status",
            json={"status": "approved"},
        )

        # Retailer cancels
        cancel_resp = await verified_retailer_client.delete(
            f"/api/v1/orders/{order_id}"
        )
        assert cancel_resp.status_code == 204

        # Stock restored
        from sqlalchemy import select
        from app.models.product import Product

        result = await db.execute(select(Product).where(Product.id == product.id))
        updated = result.scalar_one()
        assert updated.available_quantity == initial_qty


class TestMultiRoleInteraction:
    """
    Verifies that farmer and retailer see only their own data
    and that admin sees everything.
    """

    async def test_admin_sees_all_orders(
        self,
        admin_client: AsyncClient,
        farmer_client: AsyncClient,
        verified_retailer_client: AsyncClient,
        product,
        verified_retailer,
        db,
    ):
        # Place two orders from the same retailer
        for _ in range(2):
            await verified_retailer_client.post(
                "/api/v1/orders",
                json={"product_id": product.id, "quantity": 1},
            )

        admin_orders = await admin_client.get("/api/v1/orders")
        farmer_orders = await farmer_client.get("/api/v1/orders")
        retailer_orders = await verified_retailer_client.get("/api/v1/orders")

        # Admin sees at least as many as farmer + retailer combined
        assert len(admin_orders.json()) >= len(farmer_orders.json())
        assert len(admin_orders.json()) >= len(retailer_orders.json())

        # Farmer only sees orders for their products
        for o in farmer_orders.json():
            assert o["farmer_id"] == product.farmer_id

        # Retailer only sees their own orders
        for o in retailer_orders.json():
            assert o["retailer_id"] == verified_retailer.id
