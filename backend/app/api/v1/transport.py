from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
import secrets
from app.core.database import get_db
from app.models.transport import TransportRequest
from app.models.order import Order
from app.models.user import User, UserRole
from app.schemas.transport import (
    TransportRequestCreate,
    TransportRequestResponse,
    TransportApprove,
    TransportReject,
    TransportStatusUpdate,
    TransportTrackingResponse,
    BulkApproveRequest,
)
from app.api.v1.auth import get_current_user
from app.services.notification_service import notify_transport_status

router = APIRouter()


def generate_tracking_number() -> str:
    """Generate unique tracking number"""
    return f"TRK-{secrets.token_hex(6).upper()}"


@router.post("/request", response_model=TransportRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_transport_request(
    transport_data: TransportRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create transport request for an order"""
    
    # Get order
    result = await db.execute(
        select(Order).where(Order.id == transport_data.order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check authorization
    if order.retailer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to request transport for this order"
        )
    
    # Check if order is paid
    if order.payment_status != "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must be paid before requesting transport"
        )
    
    # Validate preferred date is not in the past
    if transport_data.preferred_date < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Preferred date cannot be in the past"
        )
    
    # Create transport request
    transport_request = TransportRequest(
        order_id=transport_data.order_id,
        user_id=current_user.id,
        pickup_location=transport_data.pickup_location,
        pickup_latitude=transport_data.pickup_latitude,
        pickup_longitude=transport_data.pickup_longitude,
        delivery_location=transport_data.delivery_location,
        delivery_latitude=transport_data.delivery_latitude,
        delivery_longitude=transport_data.delivery_longitude,
        preferred_date=transport_data.preferred_date,
        weight=transport_data.weight,
        vehicle_type=transport_data.vehicle_type,
        special_instructions=transport_data.special_instructions,
        status="pending_approval"
    )
    
    db.add(transport_request)
    await db.commit()
    await db.refresh(transport_request)
    
    return transport_request


@router.get("/{transport_id}", response_model=TransportRequestResponse)
async def get_transport_request(
    transport_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get transport request details"""
    
    result = await db.execute(
        select(TransportRequest).where(TransportRequest.id == transport_id)
    )
    transport_request = result.scalar_one_or_none()
    
    if not transport_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transport request not found"
        )
    
    # Check authorization
    if current_user.role != UserRole.ADMIN and transport_request.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this transport request"
        )
    
    return transport_request


@router.get("/track/{tracking_number}", response_model=TransportTrackingResponse)
async def track_transport(
    tracking_number: str,
    db: AsyncSession = Depends(get_db)
):
    """Track transport by tracking number (public endpoint)"""
    
    result = await db.execute(
        select(TransportRequest).where(TransportRequest.tracking_number == tracking_number)
    )
    transport_request = result.scalar_one_or_none()
    
    if not transport_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transport not found"
        )
    
    return TransportTrackingResponse(
        tracking_number=transport_request.tracking_number,
        status=transport_request.status,
        pickup_location=transport_request.pickup_location,
        delivery_location=transport_request.delivery_location,
        preferred_date=transport_request.preferred_date,
        driver_name=transport_request.driver_name,
        driver_phone=transport_request.driver_phone,
        estimated_distance=transport_request.estimated_distance,
        created_at=transport_request.created_at,
        delivered_at=transport_request.delivered_at
    )


@router.get("/admin/pending", response_model=List[TransportRequestResponse])
async def get_pending_transport_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all pending transport requests (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(TransportRequest).where(TransportRequest.status == "pending_approval")
    )
    requests = result.scalars().all()
    
    return requests


@router.post("/admin/{transport_id}/approve", response_model=TransportRequestResponse)
async def approve_transport_request(
    transport_id: int,
    approve_data: TransportApprove,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Approve transport request (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(TransportRequest).where(TransportRequest.id == transport_id)
    )
    transport_request = result.scalar_one_or_none()
    
    if not transport_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transport request not found"
        )
    
    if transport_request.status != "pending_approval":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending requests can be approved"
        )
    
    # Update transport request
    transport_request.status = "approved"
    transport_request.approved_at = datetime.utcnow()
    transport_request.approved_by = current_user.id
    transport_request.tracking_number = generate_tracking_number()
    
    if approve_data.driver_name:
        transport_request.driver_name = approve_data.driver_name
    if approve_data.driver_phone:
        transport_request.driver_phone = approve_data.driver_phone
    if approve_data.driver_vehicle:
        transport_request.driver_vehicle = approve_data.driver_vehicle
    
    await db.commit()
    await db.refresh(transport_request)
    
    # Send notification
    await notify_transport_status(
        db,
        transport_request.user_id,
        transport_request.id,
        "approved",
        transport_request.tracking_number
    )
    
    return transport_request


@router.post("/admin/{transport_id}/reject", response_model=TransportRequestResponse)
async def reject_transport_request(
    transport_id: int,
    reject_data: TransportReject,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reject transport request (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(TransportRequest).where(TransportRequest.id == transport_id)
    )
    transport_request = result.scalar_one_or_none()
    
    if not transport_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transport request not found"
        )
    
    if transport_request.status != "pending_approval":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending requests can be rejected"
        )
    
    # Update transport request
    transport_request.status = "rejected"
    transport_request.rejection_reason = reject_data.rejection_reason
    
    await db.commit()
    await db.refresh(transport_request)
    
    # Send notification
    await notify_transport_status(
        db,
        transport_request.user_id,
        transport_request.id,
        "rejected"
    )
    
    return transport_request


@router.put("/admin/{transport_id}/status", response_model=TransportRequestResponse)
async def update_transport_status(
    transport_id: int,
    status_data: TransportStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update transport status (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    result = await db.execute(
        select(TransportRequest).where(TransportRequest.id == transport_id)
    )
    transport_request = result.scalar_one_or_none()
    
    if not transport_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transport request not found"
        )
    
    # Update status
    transport_request.status = status_data.status
    
    if status_data.driver_name:
        transport_request.driver_name = status_data.driver_name
    if status_data.driver_phone:
        transport_request.driver_phone = status_data.driver_phone
    if status_data.driver_vehicle:
        transport_request.driver_vehicle = status_data.driver_vehicle
    
    # If delivered, update order status and set delivered_at
    if status_data.status == "delivered":
        transport_request.delivered_at = datetime.utcnow()
        
        # Update order status to completed
        order_result = await db.execute(
            select(Order).where(Order.id == transport_request.order_id)
        )
        order = order_result.scalar_one_or_none()
        if order:
            order.status = "delivered"
            order.completed_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(transport_request)
    
    # Send notification
    await notify_transport_status(
        db,
        transport_request.user_id,
        transport_request.id,
        status_data.status,
        transport_request.tracking_number
    )
    
    return transport_request


@router.post("/admin/bulk-approve", response_model=List[TransportRequestResponse])
async def bulk_approve_transport_requests(
    bulk_data: BulkApproveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Bulk approve transport requests (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    approved_requests = []
    
    for transport_id in bulk_data.transport_ids:
        result = await db.execute(
            select(TransportRequest).where(TransportRequest.id == transport_id)
        )
        transport_request = result.scalar_one_or_none()
        
        if transport_request and transport_request.status == "pending_approval":
            transport_request.status = "approved"
            transport_request.approved_at = datetime.utcnow()
            transport_request.approved_by = current_user.id
            transport_request.tracking_number = generate_tracking_number()
            
            approved_requests.append(transport_request)
            
            # Send notification
            await notify_transport_status(
                db,
                transport_request.user_id,
                transport_request.id,
                "approved",
                transport_request.tracking_number
            )
    
    await db.commit()
    
    return approved_requests
