"""
Credit workflow API — deferred payment for approved retailers.
Endpoints:
  Admin: grant/revoke/suspend credit, list all credit accounts
  Retailer: view own credit, pay invoice
  Shared: list invoices
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from decimal import Decimal
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.credit import RetailerCredit, Invoice, StockReservation
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.services.notification_service import notify_order_status_change

router = APIRouter()

# ── Pydantic schemas ──────────────────────────────────────────────────────────

class CreditGrantRequest(BaseModel):
    retailer_id: int
    credit_limit: Decimal = Field(..., gt=0)
    payment_due_days: int = Field(30, ge=1, le=365)
    notes: Optional[str] = None

class CreditUpdateRequest(BaseModel):
    credit_limit: Optional[Decimal] = Field(None, gt=0)
    payment_due_days: Optional[int] = Field(None, ge=1, le=365)
    notes: Optional[str] = None

class CreditSuspendRequest(BaseModel):
    reason: str = Field(..., min_length=5)

class CreditResponse(BaseModel):
    id: int
    retailer_id: int
    retailer_name: Optional[str] = None
    credit_limit: Decimal
    used_credit: Decimal
    available_credit: float
    utilization_pct: float
    payment_due_days: int
    is_active: bool
    approved_at: Optional[datetime] = None
    suspended_at: Optional[datetime] = None
    suspension_reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    order_id: int
    retailer_id: int
    farmer_id: int
    subtotal: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    paid_amount: Decimal
    balance_due: float
    payment_type: str
    status: str
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    penalty_amount: Decimal
    is_overdue: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CreditOrderRequest(BaseModel):
    product_id: int
    quantity: int
    delivery_date: Optional[datetime] = None

class InvoicePayRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    payment_method: str = "chapa"

# ── Helpers ───────────────────────────────────────────────────────────────────

def _invoice_number() -> str:
    import secrets
    return f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{secrets.token_hex(3).upper()}"

def _credit_resp(credit: RetailerCredit, retailer: Optional[User] = None) -> dict:
    d = {c.name: getattr(credit, c.name) for c in credit.__table__.columns}
    d["available_credit"] = credit.available_credit
    d["utilization_pct"] = credit.utilization_pct
    d["retailer_name"] = (retailer.full_name or retailer.username) if retailer else None
    return d

def _invoice_resp(inv: Invoice) -> dict:
    d = {c.name: getattr(inv, c.name) for c in inv.__table__.columns}
    d["balance_due"] = inv.balance_due
    d["is_overdue"] = inv.is_overdue
    return d

# ── Admin: grant credit ───────────────────────────────────────────────────────

@router.post("/admin/grant", response_model=CreditResponse, status_code=201)
async def grant_credit(
    req: CreditGrantRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")

    # Verify retailer exists and is verified
    r = await db.execute(select(User).where(User.id == req.retailer_id))
    retailer = r.scalar_one_or_none()
    if not retailer or retailer.role != "retailer":
        raise HTTPException(404, "Retailer not found")
    if retailer.verification_status != "verified":
        raise HTTPException(400, "Retailer must be verified before granting credit")

    # Check if already has credit account
    r2 = await db.execute(select(RetailerCredit).where(RetailerCredit.retailer_id == req.retailer_id))
    existing = r2.scalar_one_or_none()
    if existing:
        raise HTTPException(400, "Retailer already has a credit account. Use PATCH to update.")

    credit = RetailerCredit(
        retailer_id=req.retailer_id,
        credit_limit=req.credit_limit,
        payment_due_days=req.payment_due_days,
        is_active=True,
        approved_by=current_user.id,
        approved_at=datetime.utcnow(),
        notes=req.notes,
    )
    db.add(credit)
    await db.commit()
    await db.refresh(credit)
    return _credit_resp(credit, retailer)


@router.patch("/admin/{credit_id}", response_model=CreditResponse)
async def update_credit(
    credit_id: int,
    req: CreditUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")
    r = await db.execute(select(RetailerCredit).where(RetailerCredit.id == credit_id))
    credit = r.scalar_one_or_none()
    if not credit:
        raise HTTPException(404, "Credit account not found")
    if req.credit_limit is not None:
        credit.credit_limit = req.credit_limit
    if req.payment_due_days is not None:
        credit.payment_due_days = req.payment_due_days
    if req.notes is not None:
        credit.notes = req.notes
    await db.commit()
    await db.refresh(credit)
    r2 = await db.execute(select(User).where(User.id == credit.retailer_id))
    return _credit_resp(credit, r2.scalar_one_or_none())


@router.post("/admin/{credit_id}/suspend", response_model=CreditResponse)
async def suspend_credit(
    credit_id: int,
    req: CreditSuspendRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")
    r = await db.execute(select(RetailerCredit).where(RetailerCredit.id == credit_id))
    credit = r.scalar_one_or_none()
    if not credit:
        raise HTTPException(404, "Credit account not found")
    credit.is_active = False
    credit.suspended_at = datetime.utcnow()
    credit.suspension_reason = req.reason
    await db.commit()
    await db.refresh(credit)
    r2 = await db.execute(select(User).where(User.id == credit.retailer_id))
    return _credit_resp(credit, r2.scalar_one_or_none())


@router.post("/admin/{credit_id}/reinstate", response_model=CreditResponse)
async def reinstate_credit(
    credit_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")
    r = await db.execute(select(RetailerCredit).where(RetailerCredit.id == credit_id))
    credit = r.scalar_one_or_none()
    if not credit:
        raise HTTPException(404, "Credit account not found")
    credit.is_active = True
    credit.suspended_at = None
    credit.suspension_reason = None
    await db.commit()
    await db.refresh(credit)
    r2 = await db.execute(select(User).where(User.id == credit.retailer_id))
    return _credit_resp(credit, r2.scalar_one_or_none())


@router.get("/admin/accounts", response_model=List[CreditResponse])
async def list_all_credits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")
    r = await db.execute(select(RetailerCredit))
    credits = r.scalars().all()
    result = []
    for c in credits:
        r2 = await db.execute(select(User).where(User.id == c.retailer_id))
        result.append(_credit_resp(c, r2.scalar_one_or_none()))
    return result


@router.get("/admin/invoices", response_model=List[InvoiceResponse])
async def list_all_invoices(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin only")
    q = select(Invoice)
    if status_filter:
        q = q.where(Invoice.status == status_filter)
    q = q.order_by(Invoice.created_at.desc())
    r = await db.execute(q)
    return [_invoice_resp(i) for i in r.scalars().all()]

# ── Retailer: view own credit ─────────────────────────────────────────────────

@router.get("/my-credit", response_model=CreditResponse)
async def get_my_credit(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "retailer":
        raise HTTPException(403, "Retailers only")
    r = await db.execute(select(RetailerCredit).where(RetailerCredit.retailer_id == current_user.id))
    credit = r.scalar_one_or_none()
    if not credit:
        raise HTTPException(404, "No credit account. Contact admin to apply.")
    return _credit_resp(credit, current_user)


@router.get("/my-invoices", response_model=List[InvoiceResponse])
async def get_my_invoices(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Invoice).where(Invoice.retailer_id == current_user.id)
    if status_filter:
        q = q.where(Invoice.status == status_filter)
    q = q.order_by(Invoice.created_at.desc())
    r = await db.execute(q)
    return [_invoice_resp(i) for i in r.scalars().all()]

# ── Credit order placement ────────────────────────────────────────────────────

@router.post("/order", status_code=201)
async def place_credit_order(
    req: CreditOrderRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Place an order using credit (deferred payment)."""
    if current_user.role != "retailer":
        raise HTTPException(403, "Retailers only")
    if current_user.verification_status != "verified":
        raise HTTPException(403, "Account must be verified to use credit ordering")

    # Check credit account
    r = await db.execute(select(RetailerCredit).where(RetailerCredit.retailer_id == current_user.id))
    credit = r.scalar_one_or_none()
    if not credit or not credit.is_active:
        raise HTTPException(403, "No active credit account. Contact admin.")

    # Get product
    r2 = await db.execute(select(Product).where(Product.id == req.product_id))
    product = r2.scalar_one_or_none()
    if not product:
        raise HTTPException(404, "Product not found")

    if product.available_quantity < req.quantity:
        raise HTTPException(400, f"Insufficient stock. Available: {product.available_quantity}")

    total = Decimal(str(product.price)) * req.quantity

    # Check credit limit
    if total > Decimal(str(credit.available_credit)):
        raise HTTPException(400, f"Order total ({total} ETB) exceeds available credit ({credit.available_credit:.2f} ETB)")

    # Create order
    order = Order(
        product_id=req.product_id,
        farmer_id=product.farmer_id,
        retailer_id=current_user.id,
        quantity=req.quantity,
        total_price=float(total),
        delivery_date=req.delivery_date,
        status=OrderStatus.PENDING,
        payment_type="credit",
        payment_status="credit_pending",
    )
    db.add(order)
    await db.flush()  # get order.id

    # Reserve stock
    reservation = StockReservation(
        order_id=order.id,
        product_id=req.product_id,
        quantity=req.quantity,
        status="active",
        expires_at=datetime.utcnow() + timedelta(hours=48),
    )
    db.add(reservation)

    # Deduct from available (reserved)
    product.available_quantity -= req.quantity

    # Generate invoice
    invoice = Invoice(
        invoice_number=_invoice_number(),
        order_id=order.id,
        retailer_id=current_user.id,
        farmer_id=product.farmer_id,
        credit_account_id=credit.id,
        subtotal=total,
        total_amount=total,
        payment_type="credit",
        status="issued",
        due_date=datetime.utcnow() + timedelta(days=credit.payment_due_days),
    )
    db.add(invoice)

    # Deduct used credit
    credit.used_credit = Decimal(str(credit.used_credit)) + total

    await db.commit()
    await db.refresh(order)

    await notify_order_status_change(db, product.farmer_id, order.id, "pending")

    return {
        "order_id": order.id,
        "invoice_number": invoice.invoice_number,
        "total": float(total),
        "due_date": invoice.due_date.isoformat(),
        "credit_remaining": credit.available_credit,
        "message": "Credit order placed. Invoice generated.",
    }

# ── Pay invoice ───────────────────────────────────────────────────────────────

@router.post("/invoices/{invoice_id}/pay")
async def pay_invoice(
    invoice_id: int,
    req: InvoicePayRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Record payment against a credit invoice."""
    r = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = r.scalar_one_or_none()
    if not invoice:
        raise HTTPException(404, "Invoice not found")
    if invoice.retailer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not authorized")
    if invoice.status in ("paid", "cancelled"):
        raise HTTPException(400, f"Invoice is already {invoice.status}")

    # Apply payment
    invoice.paid_amount = Decimal(str(invoice.paid_amount)) + req.amount
    balance = invoice.balance_due

    if balance <= 0:
        invoice.status = "paid"
        invoice.paid_at = datetime.utcnow()
        # Release credit
        r2 = await db.execute(select(RetailerCredit).where(RetailerCredit.id == invoice.credit_account_id))
        credit = r2.scalar_one_or_none()
        if credit:
            credit.used_credit = max(Decimal("0"), Decimal(str(credit.used_credit)) - Decimal(str(invoice.total_amount)))
        # Mark order paid
        r3 = await db.execute(select(Order).where(Order.id == invoice.order_id))
        order = r3.scalar_one_or_none()
        if order:
            order.payment_status = "paid"
            order.paid_at = datetime.utcnow()
            order.status = OrderStatus.PAID
    else:
        invoice.status = "partially_paid"

    await db.commit()
    return {
        "invoice_id": invoice.id,
        "paid_amount": float(req.amount),
        "balance_due": invoice.balance_due,
        "status": invoice.status,
    }
