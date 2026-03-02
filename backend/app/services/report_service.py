from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from app.models.order import Order
from app.models.user import User
from app.models.transaction import Transaction
from app.models.transport import TransportRequest
from app.models.product import Product

class ReportService:
    """Service for generating reports and analytics"""
    
    @staticmethod
    async def generate_orders_report(
        db: AsyncSession,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        status: Optional[str] = None,
        farmer_id: Optional[int] = None,
        retailer_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Generate orders report"""
        
        query = select(Order)
        
        if start_date:
            query = query.where(Order.created_at >= start_date)
        if end_date:
            query = query.where(Order.created_at <= end_date)
        if status:
            query = query.where(Order.status == status)
        if farmer_id:
            query = query.where(Order.farmer_id == farmer_id)
        if retailer_id:
            query = query.where(Order.retailer_id == retailer_id)
        
        result = await db.execute(query)
        orders = result.scalars().all()
        
        total_orders = len(orders)
        total_value = sum(order.total_price for order in orders)
        average_order_value = total_value / total_orders if total_orders > 0 else 0
        
        # Orders by status
        orders_by_status = {}
        for order in orders:
            status_key = order.status.value if hasattr(order.status, 'value') else str(order.status)
            orders_by_status[status_key] = orders_by_status.get(status_key, 0) + 1
        
        # Get product categories
        product_ids = [order.product_id for order in orders]
        products_result = await db.execute(
            select(Product).where(Product.id.in_(product_ids))
        )
        products = {p.id: p for p in products_result.scalars().all()}
        
        # Orders by category
        orders_by_category = {}
        for order in orders:
            product = products.get(order.product_id)
            if product:
                category = product.category
                orders_by_category[category] = orders_by_category.get(category, 0) + 1
        
        # Top products
        product_counts = {}
        for order in orders:
            product_counts[order.product_id] = product_counts.get(order.product_id, 0) + 1
        
        top_products = []
        for product_id, count in sorted(product_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
            product = products.get(product_id)
            if product:
                top_products.append({
                    "product_id": product_id,
                    "product_name": product.name,
                    "order_count": count
                })
        
        return {
            "total_orders": total_orders,
            "total_value": float(total_value),
            "average_order_value": float(average_order_value),
            "orders_by_status": orders_by_status,
            "orders_by_category": orders_by_category,
            "top_products": top_products
        }
    
    @staticmethod
    async def generate_revenue_report(
        db: AsyncSession,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        group_by: str = "day"
    ) -> Dict[str, Any]:
        """Generate revenue report"""
        
        query = select(Transaction).where(Transaction.status == "completed")
        
        if start_date:
            query = query.where(Transaction.created_at >= start_date)
        if end_date:
            query = query.where(Transaction.created_at <= end_date)
        
        result = await db.execute(query)
        transactions = result.scalars().all()
        
        total_revenue = sum(t.amount for t in transactions)
        total_transactions = len(transactions)
        average_transaction_value = total_revenue / total_transactions if total_transactions > 0 else 0
        
        # Revenue by period
        revenue_by_period = []
        if transactions:
            # Group transactions by period
            period_data = {}
            for transaction in transactions:
                if group_by == "day":
                    period_key = transaction.created_at.date().isoformat()
                elif group_by == "week":
                    period_key = transaction.created_at.isocalendar()[:2]  # (year, week)
                    period_key = f"{period_key[0]}-W{period_key[1]:02d}"
                else:  # month
                    period_key = transaction.created_at.strftime("%Y-%m")
                
                if period_key not in period_data:
                    period_data[period_key] = {"period": period_key, "revenue": Decimal(0), "count": 0}
                
                period_data[period_key]["revenue"] += transaction.amount
                period_data[period_key]["count"] += 1
            
            revenue_by_period = [
                {
                    "period": data["period"],
                    "revenue": float(data["revenue"]),
                    "transaction_count": data["count"]
                }
                for data in sorted(period_data.values(), key=lambda x: x["period"])
            ]
        
        # Revenue by payment method
        revenue_by_payment_method = {}
        for transaction in transactions:
            method = transaction.payment_method or "unknown"
            revenue_by_payment_method[method] = revenue_by_payment_method.get(method, Decimal(0)) + transaction.amount
        
        revenue_by_payment_method = {k: float(v) for k, v in revenue_by_payment_method.items()}
        
        return {
            "total_revenue": float(total_revenue),
            "total_transactions": total_transactions,
            "average_transaction_value": float(average_transaction_value),
            "revenue_by_period": revenue_by_period,
            "revenue_by_payment_method": revenue_by_payment_method
        }
    
    @staticmethod
    async def generate_user_registration_report(
        db: AsyncSession,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Generate user registration report"""
        
        query = select(User)
        
        if start_date:
            query = query.where(User.created_at >= start_date)
        if end_date:
            query = query.where(User.created_at <= end_date)
        
        result = await db.execute(query)
        users = result.scalars().all()
        
        total_registrations = len(users)
        
        # Registrations by role
        registrations_by_role = {}
        for user in users:
            role = user.role.value if hasattr(user.role, 'value') else str(user.role)
            registrations_by_role[role] = registrations_by_role.get(role, 0) + 1
        
        # Registrations by period (day)
        registrations_by_period = {}
        for user in users:
            period_key = user.created_at.date().isoformat()
            registrations_by_period[period_key] = registrations_by_period.get(period_key, 0) + 1
        
        registrations_by_period_list = [
            {"period": period, "count": count}
            for period, count in sorted(registrations_by_period.items())
        ]
        
        # Verification rate
        verified_count = sum(1 for user in users if user.verification_status == "verified")
        verification_rate = (verified_count / total_registrations * 100) if total_registrations > 0 else 0
        
        return {
            "total_registrations": total_registrations,
            "registrations_by_role": registrations_by_role,
            "registrations_by_period": registrations_by_period_list,
            "verification_rate": round(verification_rate, 2)
        }
    
    @staticmethod
    async def generate_payment_success_rate_report(
        db: AsyncSession,
        days: int = 30
    ) -> Dict[str, Any]:
        """Generate payment success rate report"""
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        result = await db.execute(
            select(Transaction).where(Transaction.created_at >= cutoff_date)
        )
        transactions = result.scalars().all()
        
        total_payments = len(transactions)
        successful_payments = sum(1 for t in transactions if t.status == "completed")
        failed_payments = sum(1 for t in transactions if t.status == "failed")
        success_rate = (successful_payments / total_payments * 100) if total_payments > 0 else 0
        
        # Average payment value
        completed_transactions = [t for t in transactions if t.status == "completed"]
        average_payment_value = (
            sum(t.amount for t in completed_transactions) / len(completed_transactions)
            if completed_transactions else 0
        )
        
        # Payments by method
        payments_by_method = {}
        for transaction in transactions:
            method = transaction.payment_method or "unknown"
            payments_by_method[method] = payments_by_method.get(method, 0) + 1
        
        return {
            "total_payments": total_payments,
            "successful_payments": successful_payments,
            "failed_payments": failed_payments,
            "success_rate": round(success_rate, 2),
            "average_payment_value": float(average_payment_value),
            "payments_by_method": payments_by_method
        }
    
    @staticmethod
    async def generate_transport_completion_report(
        db: AsyncSession,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Generate transport completion report"""
        
        query = select(TransportRequest)
        
        if start_date:
            query = query.where(TransportRequest.created_at >= start_date)
        if end_date:
            query = query.where(TransportRequest.created_at <= end_date)
        
        result = await db.execute(query)
        requests = result.scalars().all()
        
        total_requests = len(requests)
        completed_requests = sum(1 for r in requests if r.status == "delivered")
        pending_requests = sum(1 for r in requests if r.status in ["pending_approval", "approved", "in_transit"])
        rejected_requests = sum(1 for r in requests if r.status == "rejected")
        
        completion_rate = (completed_requests / total_requests * 100) if total_requests > 0 else 0
        
        # Average delivery time
        completed_with_dates = [
            r for r in requests 
            if r.status == "delivered" and r.delivered_at and r.created_at
        ]
        
        if completed_with_dates:
            total_days = sum(
                (r.delivered_at - r.created_at).days 
                for r in completed_with_dates
            )
            average_delivery_time_days = total_days / len(completed_with_dates)
        else:
            average_delivery_time_days = None
        
        return {
            "total_requests": total_requests,
            "completed_requests": completed_requests,
            "pending_requests": pending_requests,
            "rejected_requests": rejected_requests,
            "completion_rate": round(completion_rate, 2),
            "average_delivery_time_days": round(average_delivery_time_days, 1) if average_delivery_time_days else None
        }
    
    @staticmethod
    async def generate_dashboard_metrics(db: AsyncSession) -> Dict[str, Any]:
        """Generate dashboard metrics"""
        
        # User counts
        users_result = await db.execute(select(User))
        users = users_result.scalars().all()
        
        total_users = len(users)
        total_farmers = sum(1 for u in users if u.role.value == "farmer")
        total_retailers = sum(1 for u in users if u.role.value == "retailer")
        total_admins = sum(1 for u in users if u.role.value == "admin")
        
        # Order counts
        orders_result = await db.execute(select(Order))
        orders = orders_result.scalars().all()
        
        total_orders = len(orders)
        pending_orders = sum(1 for o in orders if o.status.value == "pending")
        approved_orders = sum(1 for o in orders if o.status.value == "approved")
        delivered_orders = sum(1 for o in orders if o.status.value == "delivered")
        
        # Revenue
        transactions_result = await db.execute(
            select(Transaction).where(Transaction.status == "completed")
        )
        transactions = transactions_result.scalars().all()
        
        total_revenue = sum(t.amount for t in transactions)
        
        # Monthly revenue
        current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_transactions_result = await db.execute(
            select(Transaction).where(
                and_(
                    Transaction.status == "completed",
                    Transaction.created_at >= current_month_start
                )
            )
        )
        monthly_transactions = monthly_transactions_result.scalars().all()
        monthly_revenue = sum(t.amount for t in monthly_transactions)
        
        # Pending items
        pending_verifications_result = await db.execute(
            select(func.count()).select_from(
                select(User).where(User.verification_status == "pending").subquery()
            )
        )
        pending_verifications = pending_verifications_result.scalar()
        
        pending_transport_result = await db.execute(
            select(func.count()).select_from(
                select(TransportRequest).where(TransportRequest.status == "pending_approval").subquery()
            )
        )
        pending_transport_approvals = pending_transport_result.scalar()
        
        # Payment success rate (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_transactions_result = await db.execute(
            select(Transaction).where(Transaction.created_at >= thirty_days_ago)
        )
        recent_transactions = recent_transactions_result.scalars().all()
        
        if recent_transactions:
            successful = sum(1 for t in recent_transactions if t.status == "completed")
            payment_success_rate = (successful / len(recent_transactions) * 100)
        else:
            payment_success_rate = 0
        
        return {
            "total_users": total_users,
            "total_farmers": total_farmers,
            "total_retailers": total_retailers,
            "total_admins": total_admins,
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "approved_orders": approved_orders,
            "delivered_orders": delivered_orders,
            "total_revenue": float(total_revenue),
            "monthly_revenue": float(monthly_revenue),
            "pending_verifications": pending_verifications,
            "pending_transport_approvals": pending_transport_approvals,
            "payment_success_rate": round(payment_success_rate, 2)
        }


# Singleton instance
report_service = ReportService()
