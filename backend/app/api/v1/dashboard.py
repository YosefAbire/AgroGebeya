from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Dict, List
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.models.transaction import Transaction
from app.api.v1.auth import get_current_user

router = APIRouter()

@router.get("/farmer/stats")
async def get_farmer_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard statistics for farmers"""
    if current_user.role != "farmer":
        return {"error": "Only farmers can access this endpoint"}
    
    # Total products listed
    total_products_result = await db.execute(
        select(func.count(Product.id)).where(Product.farmer_id == current_user.id)
    )
    total_products = total_products_result.scalar() or 0
    
    # Active listings (products with available quantity > 0)
    active_listings_result = await db.execute(
        select(func.count(Product.id)).where(
            and_(
                Product.farmer_id == current_user.id,
                Product.available_quantity > 0
            )
        )
    )
    active_listings = active_listings_result.scalar() or 0
    
    # Pending orders
    pending_orders_result = await db.execute(
        select(func.count(Order.id)).where(
            and_(
                Order.farmer_id == current_user.id,
                Order.status == "pending"
            )
        )
    )
    pending_orders = pending_orders_result.scalar() or 0
    
    # Total earnings (sum of delivered orders)
    total_earnings_result = await db.execute(
        select(func.sum(Order.total_price)).where(
            and_(
                Order.farmer_id == current_user.id,
                Order.status == "delivered"
            )
        )
    )
    total_earnings = total_earnings_result.scalar() or 0
    
    return {
        "total_products": total_products,
        "active_listings": active_listings,
        "pending_orders": pending_orders,
        "total_earnings": float(total_earnings)
    }

@router.get("/retailer/stats")
async def get_retailer_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard statistics for retailers"""
    if current_user.role != "retailer":
        return {"error": "Only retailers can access this endpoint"}
    
    # Total orders placed
    total_orders_result = await db.execute(
        select(func.count(Order.id)).where(Order.retailer_id == current_user.id)
    )
    total_orders = total_orders_result.scalar() or 0
    
    # Pending deliveries (approved orders not yet delivered)
    pending_deliveries_result = await db.execute(
        select(func.count(Order.id)).where(
            and_(
                Order.retailer_id == current_user.id,
                Order.status == "approved"
            )
        )
    )
    pending_deliveries = pending_deliveries_result.scalar() or 0
    
    # In transit (you might want to add this status to your Order model)
    # For now, we'll count approved orders as in transit
    in_transit = pending_deliveries
    
    # Total spent (sum of all orders)
    total_spent_result = await db.execute(
        select(func.sum(Order.total_price)).where(
            Order.retailer_id == current_user.id
        )
    )
    total_spent = total_spent_result.scalar() or 0
    
    return {
        "total_orders": total_orders,
        "pending_deliveries": pending_deliveries,
        "in_transit": in_transit,
        "total_spent": float(total_spent)
    }

@router.get("/farmer/recent-orders")
async def get_farmer_recent_orders(
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get recent orders for farmer"""
    if current_user.role != "farmer":
        return {"error": "Only farmers can access this endpoint"}
    
    result = await db.execute(
        select(Order)
        .where(Order.farmer_id == current_user.id)
        .order_by(Order.created_at.desc())
        .limit(limit)
    )
    orders = result.scalars().all()
    
    # Get product and retailer details
    order_list = []
    for order in orders:
        product_result = await db.execute(
            select(Product).where(Product.id == order.product_id)
        )
        product = product_result.scalar_one_or_none()
        
        retailer_result = await db.execute(
            select(User).where(User.id == order.retailer_id)
        )
        retailer = retailer_result.scalar_one_or_none()
        
        order_list.append({
            "id": order.id,
            "order_number": f"#ORD-{order.id:04d}",
            "product_name": product.name if product else "Unknown",
            "quantity": order.quantity,
            "unit": product.unit if product else "KG",
            "total_price": float(order.total_price),
            "status": order.status,
            "created_at": order.created_at.isoformat(),
            "retailer_name": retailer.full_name or retailer.username if retailer else "Unknown"
        })
    
    return order_list

@router.get("/retailer/recent-purchases")
async def get_retailer_recent_purchases(
    limit: int = Query(5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get recent purchases for retailer"""
    if current_user.role != "retailer":
        return {"error": "Only retailers can access this endpoint"}
    
    result = await db.execute(
        select(Order)
        .where(Order.retailer_id == current_user.id)
        .order_by(Order.created_at.desc())
        .limit(limit)
    )
    orders = result.scalars().all()
    
    # Get product and farmer details
    order_list = []
    for order in orders:
        product_result = await db.execute(
            select(Product).where(Product.id == order.product_id)
        )
        product = product_result.scalar_one_or_none()
        
        farmer_result = await db.execute(
            select(User).where(User.id == order.farmer_id)
        )
        farmer = farmer_result.scalar_one_or_none()
        
        order_list.append({
            "id": order.id,
            "order_number": f"#ORD-{order.id:04d}",
            "product_name": product.name if product else "Unknown",
            "quantity": order.quantity,
            "unit": product.unit if product else "KG",
            "total_price": float(order.total_price),
            "status": order.status,
            "created_at": order.created_at.isoformat(),
            "farmer_name": farmer.full_name or farmer.username if farmer else "Unknown"
        })
    
    return order_list
