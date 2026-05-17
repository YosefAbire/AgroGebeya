from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse
from app.api.v1.auth import get_current_user
from app.services.notification_service import notify_order_status_change

router = APIRouter()

PAYMENT_DEADLINE_HOURS = 24  # retailer has 24h to pay after approval


def _enrich(order: Order) -> dict:
    d = {c.name: getattr(order, c.name) for c in order.__table__.columns}
    d["product_name"] = order.product.name if order.product else f"Product #{order.product_id}"
    d["product_unit"] = order.product.unit if order.product else "unit"
    d["retailer_name"] = (order.retailer.full_name or order.retailer.username) if order.retailer else f"Retailer #{order.retailer_id}"
    d["farmer_name"] = (order.farmer.full_name or order.farmer.username) if order.farmer else f"Farmer #{order.farmer_id}"
    return d


def _order_query(base):
    return base.options(
        joinedload(Order.product),
        joinedload(Order.farmer),
        joinedload(Order.retailer),
    )


@router.get("", response_model=List[OrderResponse])
async def get_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role == "farmer":
        base = select(Order).where(Order.farmer_id == current_user.id)
    elif current_user.role == "retailer":
        base = select(Order).where(Order.retailer_id == current_user.id)
    else:
        base = select(Order)

    if status_filter:
        base = base.where(Order.status == status_filter)

    query = _order_query(base).order_by(Order.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    orders = result.scalars().unique().all()
    return [_enrich(o) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(_order_query(select(Order).where(Order.id == order_id)))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user.role != "admin":
        if order.farmer_id != current_user.id and order.retailer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    return _enrich(order)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "retailer":
        raise HTTPException(status_code=403, detail="Only retailers can create orders")

    # Require retailer to be verified
    if current_user.verification_status != "verified":
        raise HTTPException(
            status_code=403,
            detail="Your account must be verified before placing orders. Please complete identity verification."
        )

    result = await db.execute(select(Product).where(Product.id == order_data.product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if product.available_quantity < order_data.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available: {product.available_quantity}, Requested: {order_data.quantity}"
        )

    total_price = product.price * order_data.quantity
    new_order = Order(
        product_id=order_data.product_id,
        farmer_id=product.farmer_id,
        retailer_id=current_user.id,
        quantity=order_data.quantity,
        total_price=total_price,
        delivery_date=order_data.delivery_date,
        status=OrderStatus.PENDING
    )
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)

    await notify_order_status_change(db, product.farmer_id, new_order.id, "pending")

    result2 = await db.execute(_order_query(select(Order).where(Order.id == new_order.id)))
    return _enrich(result2.scalar_one())


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    order_update: OrderUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    new_status = order_update.status

    # Permission checks
    is_farmer = order.farmer_id == current_user.id
    is_retailer = order.retailer_id == current_user.id
    is_admin = current_user.role == "admin"

    if not (is_farmer or is_retailer or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized")

    # Enforce valid transitions
    valid_transitions = {
        OrderStatus.PENDING: [OrderStatus.APPROVED, OrderStatus.REJECTED, OrderStatus.CANCELLED],
        OrderStatus.APPROVED: [OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED, OrderStatus.REJECTED],
        OrderStatus.PENDING_PAYMENT: [OrderStatus.PAID, OrderStatus.CANCELLED],
        OrderStatus.PAID: [OrderStatus.COMPLETED, OrderStatus.DELIVERED],
        OrderStatus.DELIVERED: [OrderStatus.COMPLETED],
        OrderStatus.COMPLETED: [],
        OrderStatus.CANCELLED: [],
        OrderStatus.REJECTED: [],
    }
    allowed = valid_transitions.get(order.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from '{order.status}' to '{new_status}'"
        )

    # Role-based permission per transition
    farmer_allowed = [OrderStatus.APPROVED, OrderStatus.REJECTED, OrderStatus.DELIVERED, OrderStatus.COMPLETED]
    retailer_allowed = [OrderStatus.CANCELLED]
    if is_farmer and not is_admin and new_status not in farmer_allowed:
        raise HTTPException(status_code=403, detail="Farmers cannot set this status")
    if is_retailer and not is_admin and new_status not in retailer_allowed:
        raise HTTPException(status_code=403, detail="Retailers cannot set this status")

    # Side effects per transition
    if new_status == OrderStatus.APPROVED:
        # Decrement inventory
        prod_result = await db.execute(select(Product).where(Product.id == order.product_id))
        product = prod_result.scalar_one_or_none()
        if product:
            if product.available_quantity < order.quantity:
                raise HTTPException(status_code=400, detail="Insufficient stock to approve")
            product.available_quantity -= order.quantity
        # Set payment deadline
        order.payment_deadline = datetime.utcnow() + timedelta(hours=PAYMENT_DEADLINE_HOURS)
        order.status = OrderStatus.PENDING_PAYMENT  # auto-advance to pending_payment

    elif new_status in (OrderStatus.REJECTED, OrderStatus.CANCELLED):
        # Restore inventory if it was decremented (approved state)
        if order.status in (OrderStatus.APPROVED, OrderStatus.PENDING_PAYMENT):
            prod_result = await db.execute(select(Product).where(Product.id == order.product_id))
            product = prod_result.scalar_one_or_none()
            if product:
                product.available_quantity += order.quantity
        order.cancelled_at = datetime.utcnow()
        order.cancellation_reason = order_update.cancellation_reason
        order.status = new_status

    elif new_status in (OrderStatus.COMPLETED, OrderStatus.DELIVERED):
        order.completed_at = datetime.utcnow()
        order.status = new_status

    else:
        order.status = new_status

    await db.commit()
    await db.refresh(order)

    # Notify the other party
    notify_user_id = order.retailer_id if is_farmer else order.farmer_id
    await notify_order_status_change(db, notify_user_id, order.id, order.status.value)

    result2 = await db.execute(_order_query(select(Order).where(Order.id == order.id)))
    return _enrich(result2.scalar_one())


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.retailer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    if order.status not in (OrderStatus.PENDING, OrderStatus.PENDING_PAYMENT):
        raise HTTPException(status_code=400, detail="Only pending or pending_payment orders can be cancelled")

    # Restore inventory if approved
    if order.status == OrderStatus.PENDING_PAYMENT:
        prod_result = await db.execute(select(Product).where(Product.id == order.product_id))
        product = prod_result.scalar_one_or_none()
        if product:
            product.available_quantity += order.quantity

    order.status = OrderStatus.CANCELLED
    order.cancelled_at = datetime.utcnow()
    await db.commit()

    await notify_order_status_change(db, order.farmer_id, order.id, "cancelled")
    return None


@router.post("/auto-cancel-expired", include_in_schema=False)
async def auto_cancel_expired_orders(
    db: AsyncSession = Depends(get_db)
):
    """Called by a scheduler to cancel orders where payment deadline has passed."""
    now = datetime.utcnow()
    result = await db.execute(
        select(Order).where(
            Order.status == OrderStatus.PENDING_PAYMENT,
            Order.payment_deadline < now
        )
    )
    expired = result.scalars().all()
    cancelled_ids = []
    for order in expired:
        # Restore inventory
        prod_result = await db.execute(select(Product).where(Product.id == order.product_id))
        product = prod_result.scalar_one_or_none()
        if product:
            product.available_quantity += order.quantity
        order.status = OrderStatus.CANCELLED
        order.cancelled_at = now
        order.cancellation_reason = "Payment not completed within 24 hours"
        cancelled_ids.append(order.id)
        await notify_order_status_change(db, order.retailer_id, order.id, "cancelled")
        await notify_order_status_change(db, order.farmer_id, order.id, "cancelled")

    await db.commit()
    return {"cancelled": cancelled_ids}
