"""
Product factory — creates Product model instances in the test DB.
"""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product
from app.models.user import User


async def create_product(
    db: AsyncSession,
    farmer: User,
    *,
    name: str | None = None,
    category: str = "Vegetables",
    price: float = 25.0,
    unit: str = "KG",
    available_quantity: int = 500,
    location: str = "Addis Ababa",
    description: str = "Test product",
) -> Product:
    """Insert a Product row and return it."""
    suffix = uuid.uuid4().hex[:6]
    product = Product(
        name=name or f"Product_{suffix}",
        description=description,
        category=category,
        price=price,
        unit=unit,
        available_quantity=available_quantity,
        location=location,
        farmer_id=farmer.id,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product
