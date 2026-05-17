"""
Unit tests for model properties and computed fields.
No DB required — tests pure Python logic on model instances.
"""

import pytest

from decimal import Decimal
from datetime import datetime, timedelta

pytestmark = pytest.mark.unit


class TestRetailerCreditProperties:

    def _make_credit(self, limit, used):
        from app.models.credit import RetailerCredit

        return RetailerCredit(
            credit_limit=Decimal(str(limit)),
            used_credit=Decimal(str(used)),
        )

    def test_available_credit_calculation(self):
        c = self._make_credit(50000, 20000)
        assert c.available_credit == pytest.approx(30000.0)

    def test_utilization_pct_calculation(self):
        c = self._make_credit(50000, 25000)
        assert c.utilization_pct == pytest.approx(50.0)

    def test_zero_limit_utilization(self):
        c = self._make_credit(0, 0)
        assert c.utilization_pct == 0

    def test_full_utilization(self):
        c = self._make_credit(10000, 10000)
        assert c.utilization_pct == pytest.approx(100.0)


class TestInvoiceProperties:

    def _make_invoice(
        self,
        total,
        paid,
        penalty=0,
        due_days_offset=1,
    ):
        from app.models.credit import Invoice

        return Invoice(
            total_amount=Decimal(str(total)),
            paid_amount=Decimal(str(paid)),
            penalty_amount=Decimal(str(penalty)),
            status="issued",
            due_date=datetime.utcnow() + timedelta(days=due_days_offset),
        )

    def test_balance_due_unpaid(self):
        inv = self._make_invoice(1000, 0)
        assert inv.balance_due == pytest.approx(1000.0)

    def test_balance_due_partially_paid(self):
        inv = self._make_invoice(1000, 400)
        assert inv.balance_due == pytest.approx(600.0)

    def test_balance_due_fully_paid(self):
        inv = self._make_invoice(1000, 1000)
        assert inv.balance_due == pytest.approx(0.0)

    def test_balance_due_with_penalty(self):
        inv = self._make_invoice(1000, 0, penalty=50)
        assert inv.balance_due == pytest.approx(1050.0)

    def test_not_overdue_future_due_date(self):
        inv = self._make_invoice(1000, 0, due_days_offset=5)
        assert inv.is_overdue is False

    def test_overdue_past_due_date(self):
        inv = self._make_invoice(1000, 0, due_days_offset=-1)
        assert inv.is_overdue is True

    def test_paid_invoice_not_overdue(self):
        inv = self._make_invoice(1000, 1000, due_days_offset=-1)
        inv.status = "paid"

        assert inv.is_overdue is False


class TestOrderStatusEnum:

    def test_all_statuses_defined(self):
        from app.models.order import OrderStatus

        expected = {
            "pending",
            "approved",
            "rejected",
            "pending_payment",
            "paid",
            "completed",
            "cancelled",
            "delivered",
        }

        actual = {s.value for s in OrderStatus}

        assert expected.issubset(actual)

    def test_status_is_string(self):
        from app.models.order import OrderStatus

        assert isinstance(OrderStatus.PENDING.value, str)