"""
Integration tests for the credit / deferred payment workflow.
"""
import pytest
from httpx import AsyncClient

from tests.helpers.assertions import (
    assert_ok, assert_created, assert_forbidden, assert_bad_request,
    assert_not_found, assert_has_fields,
)

pytestmark = pytest.mark.integration


class TestGrantCredit:
    async def test_admin_can_grant_credit_to_verified_retailer(
        self, admin_client: AsyncClient, verified_retailer
    ):
        resp = await admin_client.post(
            "/api/v1/credit/admin/grant",
            json={
                "retailer_id": verified_retailer.id,
                "credit_limit": 50000,
                "payment_due_days": 30,
                "notes": "Trusted retailer",
            },
        )
        data = assert_created(resp)
        assert_has_fields(data, "id", "credit_limit", "available_credit", "utilization_pct")
        assert float(data["credit_limit"]) == 50000.0
        assert float(data["available_credit"]) == 50000.0
        assert data["utilization_pct"] == 0.0

    async def test_cannot_grant_credit_to_unverified_retailer(
        self, admin_client: AsyncClient, retailer
    ):
        resp = await admin_client.post(
            "/api/v1/credit/admin/grant",
            json={"retailer_id": retailer.id, "credit_limit": 10000, "payment_due_days": 30},
        )
        assert_bad_request(resp)
        assert "verified" in resp.json()["detail"].lower()

    async def test_non_admin_cannot_grant_credit(
        self, farmer_client: AsyncClient, verified_retailer
    ):
        resp = await farmer_client.post(
            "/api/v1/credit/admin/grant",
            json={"retailer_id": verified_retailer.id, "credit_limit": 10000, "payment_due_days": 30},
        )
        assert_forbidden(resp)

    async def test_duplicate_credit_account_fails(
        self, admin_client: AsyncClient, verified_retailer
    ):
        payload = {
            "retailer_id": verified_retailer.id,
            "credit_limit": 10000,
            "payment_due_days": 30,
        }
        await admin_client.post("/api/v1/credit/admin/grant", json=payload)
        resp = await admin_client.post("/api/v1/credit/admin/grant", json=payload)
        assert_bad_request(resp)


class TestCreditAccountManagement:
    async def _grant(self, admin_client, retailer_id, limit=20000):
        resp = await admin_client.post(
            "/api/v1/credit/admin/grant",
            json={"retailer_id": retailer_id, "credit_limit": limit, "payment_due_days": 30},
        )
        return resp.json()

    async def test_admin_can_suspend_credit(
        self, admin_client: AsyncClient, verified_retailer
    ):
        acc = await self._grant(admin_client, verified_retailer.id)
        resp = await admin_client.post(
            f"/api/v1/credit/admin/{acc['id']}/suspend",
            json={"reason": "Overdue payments detected"},
        )
        data = assert_ok(resp)
        assert data["is_active"] is False
        assert data["suspension_reason"] == "Overdue payments detected"

    async def test_admin_can_reinstate_credit(
        self, admin_client: AsyncClient, verified_retailer
    ):
        acc = await self._grant(admin_client, verified_retailer.id)
        await admin_client.post(
            f"/api/v1/credit/admin/{acc['id']}/suspend",
            json={"reason": "Test suspension"},
        )
        resp = await admin_client.post(f"/api/v1/credit/admin/{acc['id']}/reinstate")
        data = assert_ok(resp)
        assert data["is_active"] is True

    async def test_admin_can_list_all_credit_accounts(
        self, admin_client: AsyncClient, verified_retailer
    ):
        await self._grant(admin_client, verified_retailer.id)
        resp = await admin_client.get("/api/v1/credit/admin/accounts")
        data = assert_ok(resp)
        assert isinstance(data, list)
        assert len(data) >= 1


class TestRetailerCreditView:
    async def test_retailer_can_view_own_credit(
        self, admin_client: AsyncClient, verified_retailer_client: AsyncClient, verified_retailer
    ):
        await admin_client.post(
            "/api/v1/credit/admin/grant",
            json={"retailer_id": verified_retailer.id, "credit_limit": 30000, "payment_due_days": 30},
        )
        resp = await verified_retailer_client.get("/api/v1/credit/my-credit")
        data = assert_ok(resp)
        assert float(data["credit_limit"]) == 30000.0

    async def test_retailer_without_credit_gets_404(
        self, verified_retailer_client: AsyncClient
    ):
        resp = await verified_retailer_client.get("/api/v1/credit/my-credit")
        assert_not_found(resp)

    async def test_farmer_cannot_view_credit(self, farmer_client: AsyncClient):
        resp = await farmer_client.get("/api/v1/credit/my-credit")
        assert_forbidden(resp)


class TestCreditOrderPlacement:
    async def test_retailer_with_credit_can_place_credit_order(
        self, admin_client: AsyncClient, verified_retailer_client: AsyncClient,
        verified_retailer, product
    ):
        await admin_client.post(
            "/api/v1/credit/admin/grant",
            json={"retailer_id": verified_retailer.id, "credit_limit": 50000, "payment_due_days": 30},
        )
        resp = await verified_retailer_client.post(
            "/api/v1/credit/order",
            json={"product_id": product.id, "quantity": 5},
        )
        data = assert_created(resp)
        assert "order_id" in data
        assert "invoice_number" in data
        assert "due_date" in data
        assert float(data["total"]) == product.price * 5

    async def test_credit_order_deducts_available_credit(
        self, admin_client: AsyncClient, verified_retailer_client: AsyncClient,
        verified_retailer, product
    ):
        await admin_client.post(
            "/api/v1/credit/admin/grant",
            json={"retailer_id": verified_retailer.id, "credit_limit": 50000, "payment_due_days": 30},
        )
        qty = 10
        await verified_retailer_client.post(
            "/api/v1/credit/order",
            json={"product_id": product.id, "quantity": qty},
        )
        credit_resp = await verified_retailer_client.get("/api/v1/credit/my-credit")
        credit = credit_resp.json()
        expected_used = product.price * qty
        assert float(credit["used_credit"]) == pytest.approx(expected_used)

    async def test_credit_order_exceeding_limit_fails(
        self, admin_client: AsyncClient, verified_retailer_client: AsyncClient,
        verified_retailer, product
    ):
        # Grant tiny credit
        await admin_client.post(
            "/api/v1/credit/admin/grant",
            json={"retailer_id": verified_retailer.id, "credit_limit": 1, "payment_due_days": 30},
        )
        resp = await verified_retailer_client.post(
            "/api/v1/credit/order",
            json={"product_id": product.id, "quantity": 100},
        )
        assert_bad_request(resp)
        assert "credit" in resp.json()["detail"].lower()

    async def test_suspended_credit_blocks_order(
        self, admin_client: AsyncClient, verified_retailer_client: AsyncClient,
        verified_retailer, product
    ):
        grant = await admin_client.post(
            "/api/v1/credit/admin/grant",
            json={"retailer_id": verified_retailer.id, "credit_limit": 50000, "payment_due_days": 30},
        )
        acc_id = grant.json()["id"]
        await admin_client.post(
            f"/api/v1/credit/admin/{acc_id}/suspend",
            json={"reason": "Test"},
        )
        resp = await verified_retailer_client.post(
            "/api/v1/credit/order",
            json={"product_id": product.id, "quantity": 5},
        )
        assert_forbidden(resp)


class TestInvoicePayment:
    async def test_retailer_can_pay_invoice(
        self, admin_client: AsyncClient, verified_retailer_client: AsyncClient,
        verified_retailer, product
    ):
        await admin_client.post(
            "/api/v1/credit/admin/grant",
            json={"retailer_id": verified_retailer.id, "credit_limit": 50000, "payment_due_days": 30},
        )
        order_resp = await verified_retailer_client.post(
            "/api/v1/credit/order",
            json={"product_id": product.id, "quantity": 5},
        )
        order_data = order_resp.json()

        # Get invoice
        invoices_resp = await verified_retailer_client.get("/api/v1/credit/my-invoices")
        invoices = invoices_resp.json()
        assert len(invoices) >= 1
        invoice_id = invoices[0]["id"]
        balance = invoices[0]["balance_due"]

        # Pay full balance
        pay_resp = await verified_retailer_client.post(
            f"/api/v1/credit/invoices/{invoice_id}/pay",
            json={"amount": balance},
        )
        data = assert_ok(pay_resp)
        assert data["status"] == "paid"
        assert float(data["balance_due"]) == pytest.approx(0.0, abs=0.01)
