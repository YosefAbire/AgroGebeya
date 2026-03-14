from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from decimal import Decimal
from datetime import datetime
from app.core.database import get_db
from app.models.transaction import Transaction
from app.models.order import Order
from app.models.user import User
from app.schemas.transaction import (
    PaymentInitializeRequest,
    PaymentInitializeResponse,
    PaymentWebhook,
    PaymentVerifyResponse,
    TransactionResponse,
    RefundRequest,
    RefundResponse,
)
from app.api.v1.auth import get_current_user
from app.services.chapa_service import chapa_service
from app.services.notification_service import notify_payment_completed, notify_order_status_change
from app.core.config import settings

router = APIRouter()


@router.post("/initialize", response_model=PaymentInitializeResponse)
async def initialize_payment(
    payment_data: PaymentInitializeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Initialize payment for an order"""
    
    # Get order
    result = await db.execute(
        select(Order).where(Order.id == payment_data.order_id)
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
            detail="Not authorized to pay for this order"
        )
    
    # Check if order is approved
    if order.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must be approved before payment"
        )
    
    # Check if already paid
    if order.payment_status == "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already paid"
        )
    
    # Create transaction record
    transaction = Transaction(
        order_id=order.id,
        user_id=current_user.id,
        amount=Decimal(str(order.total_price)),
        currency="ETB",
        status="pending"
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    
    # Initialize payment with Chapa
    try:
        tx_ref = f"AGR-{transaction.id}-{int(datetime.utcnow().timestamp())}"
        callback_url = f"{settings.API_URL}/api/v1/payments/webhook"
        
        chapa_response = await chapa_service.initialize_payment(
            amount=transaction.amount,
            email=current_user.email,
            first_name=current_user.full_name or current_user.username,
            last_name="",
            tx_ref=tx_ref,
            callback_url=callback_url,
            return_url=payment_data.return_url,
            customization={
                "title": "AgroGebeya Order Payment",
                "description": f"Payment for Order #{order.id}"
            }
        )
        
        # Update transaction with Chapa details
        transaction.chapa_transaction_ref = tx_ref
        transaction.chapa_checkout_url = chapa_response.get("data", {}).get("checkout_url")
        transaction.status = "processing"
        
        # Update order payment status
        order.payment_status = "pending"
        
        await db.commit()
        await db.refresh(transaction)
        
        return PaymentInitializeResponse(
            transaction_id=transaction.id,
            checkout_url=transaction.chapa_checkout_url,
            transaction_ref=tx_ref
        )
        
    except Exception as e:
        transaction.status = "failed"
        transaction.error_message = str(e)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment initialization failed: {str(e)}"
        )


@router.post("/webhook")
async def payment_webhook(
    request: Request,
    x_chapa_signature: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """Handle Chapa payment webhook"""
    
    # Get raw body for signature verification
    body = await request.body()
    
    # Verify webhook signature
    if x_chapa_signature:
        if not chapa_service.verify_webhook_signature(body, x_chapa_signature):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature"
            )
    
    # Parse webhook data
    webhook_data = await request.json()
    tx_ref = webhook_data.get("tx_ref")
    payment_status = webhook_data.get("status")
    
    if not tx_ref:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing transaction reference"
        )
    
    # Find transaction
    result = await db.execute(
        select(Transaction).where(Transaction.chapa_transaction_ref == tx_ref)
    )
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        # Idempotency: return success if transaction not found (might be duplicate webhook)
        return {"status": "ok"}
    
    # Update transaction status
    if payment_status == "success":
        transaction.status = "completed"
        transaction.completed_at = datetime.utcnow()
        
        # Update order payment status
        order_result = await db.execute(
            select(Order).where(Order.id == transaction.order_id)
        )
        order = order_result.scalar_one_or_none()
        if order:
            order.payment_status = "paid"
            order.paid_at = datetime.utcnow()
        
        # Send notification to retailer
        await notify_payment_completed(
            db,
            transaction.user_id,
            transaction.order_id,
            float(transaction.amount)
        )
        # Also notify farmer that payment was received
        if order:
            await notify_order_status_change(db, order.farmer_id, order.id, "paid")
        
    elif payment_status == "failed":
        transaction.status = "failed"
    
    await db.commit()
    
    return {"status": "ok"}


@router.get("/{transaction_id}/status", response_model=TransactionResponse)
async def get_payment_status(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get payment status"""
    
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Check authorization
    if transaction.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this transaction"
        )
    
    return transaction


@router.get("/verify/{tx_ref}", response_model=PaymentVerifyResponse)
async def verify_payment(
    tx_ref: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify payment with Chapa"""
    
    # Find transaction
    result = await db.execute(
        select(Transaction).where(Transaction.chapa_transaction_ref == tx_ref)
    )
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Check authorization
    if transaction.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to verify this transaction"
        )
    
    # Verify with Chapa
    try:
        chapa_response = await chapa_service.verify_payment(tx_ref)
        chapa_status = chapa_response.get("data", {}).get("status")
        
        # Update transaction if status changed
        if chapa_status == "success" and transaction.status != "completed":
            transaction.status = "completed"
            transaction.completed_at = datetime.utcnow()
            
            # Update order
            order_result = await db.execute(
                select(Order).where(Order.id == transaction.order_id)
            )
            order = order_result.scalar_one_or_none()
            if order:
                order.payment_status = "paid"
                order.paid_at = datetime.utcnow()
            
            await db.commit()
        
        return PaymentVerifyResponse(
            transaction_id=transaction.id,
            status=transaction.status,
            amount=transaction.amount,
            verified_at=datetime.utcnow()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment verification failed: {str(e)}"
        )


@router.get("/transactions", response_model=list[TransactionResponse])
async def list_user_transactions(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List user's transactions with optional filtering"""
    
    # Build query
    query = select(Transaction).where(Transaction.user_id == current_user.id)
    
    # Apply status filter if provided
    if status:
        query = query.where(Transaction.status == status)
    
    # Order by most recent first
    query = query.order_by(Transaction.created_at.desc())
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    transactions = result.scalars().all()
    
    return transactions


@router.post("/admin/{transaction_id}/refund", response_model=RefundResponse)
async def process_refund(
    transaction_id: int,
    refund_data: RefundRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Process refund for a transaction (Admin only)"""
    
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Get original transaction
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    if transaction.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only completed transactions can be refunded"
        )
    
    # Determine refund amount
    refund_amount = refund_data.amount if refund_data.amount else transaction.amount
    
    if refund_amount > transaction.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refund amount cannot exceed original transaction amount"
        )
    
    # Process refund with Chapa
    try:
        chapa_response = await chapa_service.process_refund(
            transaction_id=transaction.chapa_transaction_ref,
            amount=refund_amount,
            reason=refund_data.reason
        )
        
        # Create refund transaction
        refund_transaction = Transaction(
            order_id=transaction.order_id,
            user_id=transaction.user_id,
            amount=-refund_amount,  # Negative amount for refund
            currency=transaction.currency,
            status="completed",
            refund_transaction_id=transaction.id,
            completed_at=datetime.utcnow()
        )
        db.add(refund_transaction)
        
        # Update original transaction
        transaction.status = "refunded"
        
        # Update order
        order_result = await db.execute(
            select(Order).where(Order.id == transaction.order_id)
        )
        order = order_result.scalar_one_or_none()
        if order:
            order.payment_status = "refunded"
        
        await db.commit()
        await db.refresh(refund_transaction)
        
        return RefundResponse(
            refund_transaction_id=refund_transaction.id,
            original_transaction_id=transaction.id,
            amount=refund_amount,
            status="completed",
            created_at=refund_transaction.created_at
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Refund processing failed: {str(e)}"
        )



