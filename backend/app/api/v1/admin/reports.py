from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime
import csv
import io
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.admin import (
    OrdersReportRequest,
    OrdersReportResponse,
    RevenueReportRequest,
    RevenueReportResponse,
    UserRegistrationReportRequest,
    UserRegistrationReportResponse,
    PaymentSuccessRateReportRequest,
    PaymentSuccessRateReportResponse,
    TransportCompletionReportRequest,
    TransportCompletionReportResponse,
    DashboardMetricsResponse,
    DataExportRequest,
)
from app.api.v1.auth import get_current_user
from app.services.report_service import report_service

router = APIRouter()


@router.get("/orders", response_model=OrdersReportResponse)
async def get_orders_report(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    status: Optional[str] = Query(None),
    farmer_id: Optional[int] = Query(None),
    retailer_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate orders report (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    report = await report_service.generate_orders_report(
        db=db,
        start_date=start_date,
        end_date=end_date,
        status=status,
        farmer_id=farmer_id,
        retailer_id=retailer_id
    )
    
    return OrdersReportResponse(**report)


@router.get("/revenue", response_model=RevenueReportResponse)
async def get_revenue_report(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    group_by: str = Query("day", regex="^(day|week|month)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate revenue report (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    report = await report_service.generate_revenue_report(
        db=db,
        start_date=start_date,
        end_date=end_date,
        group_by=group_by
    )
    
    return RevenueReportResponse(**report)


@router.get("/users", response_model=UserRegistrationReportResponse)
async def get_user_registration_report(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate user registration report (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    report = await report_service.generate_user_registration_report(
        db=db,
        start_date=start_date,
        end_date=end_date
    )
    
    return UserRegistrationReportResponse(**report)


@router.get("/payments", response_model=PaymentSuccessRateReportResponse)
async def get_payment_success_rate_report(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate payment success rate report (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    report = await report_service.generate_payment_success_rate_report(
        db=db,
        days=days
    )
    
    return PaymentSuccessRateReportResponse(**report)


@router.get("/transport", response_model=TransportCompletionReportResponse)
async def get_transport_completion_report(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate transport completion report (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    report = await report_service.generate_transport_completion_report(
        db=db,
        start_date=start_date,
        end_date=end_date
    )
    
    return TransportCompletionReportResponse(**report)


@router.get("/dashboard-metrics", response_model=DashboardMetricsResponse)
async def get_dashboard_metrics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard metrics (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    metrics = await report_service.generate_dashboard_metrics(db=db)
    
    # Add empty recent_activities for now
    metrics["recent_activities"] = []
    
    return DashboardMetricsResponse(**metrics)


@router.post("/export/{export_type}")
async def export_data(
    export_type: str,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Export data to CSV (Admin only)"""
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Generate CSV based on export type
    if export_type == "orders":
        report = await report_service.generate_orders_report(
            db=db,
            start_date=start_date,
            end_date=end_date
        )
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Total Orders", report["total_orders"]])
        writer.writerow(["Total Value", report["total_value"]])
        writer.writerow(["Average Order Value", report["average_order_value"]])
        
        csv_content = output.getvalue()
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=orders_report.csv"}
        )
    
    elif export_type == "revenue":
        report = await report_service.generate_revenue_report(
            db=db,
            start_date=start_date,
            end_date=end_date
        )
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Total Revenue", report["total_revenue"]])
        writer.writerow(["Total Transactions", report["total_transactions"]])
        writer.writerow(["Average Transaction Value", report["average_transaction_value"]])
        
        csv_content = output.getvalue()
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=revenue_report.csv"}
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid export type: {export_type}"
        )
