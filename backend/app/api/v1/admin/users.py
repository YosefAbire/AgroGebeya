from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import List, Optional
from datetime import datetime
import secrets
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.order import Order
from app.models.product import Product
from app.models.transaction import Transaction
from app.schemas.admin import (
    UserManagementResponse,
    UserActivateRequest,
    UserDeactivateRequest,
    UserResetPasswordResponse,
    UserRoleUpdate,
    UserActivityResponse,
)
from app.api.v1.auth import get_current_user
from app.core.security import get_password_hash

router = APIRouter()


@router.get("/users", response_model=List[UserManagementResponse])
async def list_users(
    search: Optional[str] = Query(None, description="Search by username, email, or name"),
    role: Optional[UserRole] = Query(None),
    verification_status: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List/search users (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    query = select(User)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                User.username.ilike(search_pattern),
                User.email.ilike(search_pattern),
                User.full_name.ilike(search_pattern)
            )
        )
    
    if role:
        query = query.where(User.role == role)
    
    if verification_status:
        query = query.where(User.verification_status == verification_status)
    
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    
    query = query.order_by(User.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return users


@router.get("/users/{user_id}", response_model=UserManagementResponse)
async def get_user_details(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user details (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/users/{user_id}/activate", response_model=UserManagementResponse)
async def activate_user(
    user_id: int,
    activate_data: UserActivateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Activate user account (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    user.locked_until = None
    user.failed_login_attempts = 0
    
    await db.commit()
    await db.refresh(user)
    
    return user


@router.put("/users/{user_id}/deactivate", response_model=UserManagementResponse)
async def deactivate_user(
    user_id: int,
    deactivate_data: UserDeactivateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Deactivate user account (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Prevent admin from deactivating themselves
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check for active orders
    active_orders_result = await db.execute(
        select(func.count(Order.id)).where(
            or_(
                Order.farmer_id == user_id,
                Order.retailer_id == user_id
            ),
            Order.status.in_(["pending", "approved"])
        )
    )
    active_orders_count = active_orders_result.scalar()
    
    if active_orders_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User has {active_orders_count} active orders. Cannot deactivate."
        )
    
    user.is_active = False
    
    await db.commit()
    await db.refresh(user)
    
    return user


@router.post("/users/{user_id}/reset-password", response_model=UserResetPasswordResponse)
async def reset_user_password(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reset user password (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Generate temporary password
    temp_password = secrets.token_urlsafe(12)
    user.hashed_password = get_password_hash(temp_password)
    user.failed_login_attempts = 0
    user.locked_until = None
    
    await db.commit()
    
    return UserResetPasswordResponse(
        user_id=user.id,
        temporary_password=temp_password,
        message="Password has been reset. User should change it on next login."
    )


@router.put("/users/{user_id}/role", response_model=UserManagementResponse)
async def change_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change user role (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate role
    try:
        new_role = UserRole(role_data.role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be: farmer, retailer, or admin"
        )
    
    user.role = new_role
    
    await db.commit()
    await db.refresh(user)
    
    return user


@router.get("/users/{user_id}/activity", response_model=UserActivityResponse)
async def get_user_activity(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user activity statistics (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Count orders
    orders_result = await db.execute(
        select(func.count(Order.id)).where(
            or_(
                Order.farmer_id == user_id,
                Order.retailer_id == user_id
            )
        )
    )
    total_orders = orders_result.scalar()
    
    # Count products (if farmer)
    products_result = await db.execute(
        select(func.count(Product.id)).where(Product.farmer_id == user_id)
    )
    total_products = products_result.scalar()
    
    # Sum transactions
    transactions_result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.user_id == user_id,
            Transaction.status == "completed"
        )
    )
    total_transactions = transactions_result.scalar() or 0
    
    # Calculate account age
    account_age_days = (datetime.utcnow() - user.created_at).days
    
    return UserActivityResponse(
        user_id=user.id,
        total_orders=total_orders,
        total_products=total_products,
        total_transactions=total_transactions,
        last_login=user.last_login_at,
        account_age_days=account_age_days
    )
