"""
Order factory — creates Order model instances in the test DB.
"""
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.user import User


async def create_order(
    db: AsyncSession,
    product: Product,
    retailer: User,
    *,
    quantity: int = 10,
    status: OrderStatus = OrderStatus.PENDING,
    payment_type: str = "immediate",
    payment_status: str = "unpaid",
    delivery_date: datetime | None = None,
) -> Order:
    """Insert an Order row and return it."""
    total_price = product.price * quantity
    order = Order(
        product_id=product.id,
        farmer_id=product.farmer_id,
        retailer_id=retailer.id,
        quantity=quantity,
        total_price=total_price,
        status=status,
        payment_type=payment_type,
        payment_status=payment_status,
        delivery_date=delivery_date or (datetime.utcnow() + timedelta(days=7)),
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order
