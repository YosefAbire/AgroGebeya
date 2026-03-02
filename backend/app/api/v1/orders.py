from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional
from app.core.database import get_db
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse
from app.api.v1.auth import get_current_user

router = APIRouter()

@router.get("", response_model=List[OrderResponse])
async def get_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: Optional[OrderStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Users can only see their own orders
    if current_user.role == "farmer":
        query = select(Order).where(Order.farmer_id == current_user.id)
    elif current_user.role == "retailer":
        query = select(Order).where(Order.retailer_id == current_user.id)
    else:  # admin
        query = select(Order)
    
    if status_filter:
        query = query.where(Order.status == status_filter)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    orders = result.scalars().all()
    
    return orders

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check authorization
    if current_user.role != "admin":
        if order.farmer_id != current_user.id and order.retailer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this order"
            )
    
    return order

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "retailer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only retailers can create orders"
        )
    
    # Get product
    result = await db.execute(select(Product).where(Product.id == order_data.product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check availability
    if product.available_quantity < order_data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient product quantity"
        )
    
    # Calculate total price
    total_price = product.price * order_data.quantity
    
    # Create order
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
    
    return new_order

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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Only farmer can update order status
    if order.farmer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this order"
        )
    
    order.status = order_update.status
    
    # Update product quantity if approved
    if order_update.status == OrderStatus.APPROVED:
        result = await db.execute(select(Product).where(Product.id == order.product_id))
        product = result.scalar_one_or_none()
        if product:
            product.available_quantity -= order.quantity
    
    await db.commit()
    await db.refresh(order)
    
    return order
