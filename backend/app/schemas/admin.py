from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

# User Management Schemas
class UserManagementResponse(BaseModel):
    """Schema for user management response"""
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: str
    is_active: bool
    verification_status: str
    last_login_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserActivateRequest(BaseModel):
    """Schema for activating user"""
    pass

class UserDeactivateRequest(BaseModel):
    """Schema for deactivating user"""
    reason: Optional[str] = Field(None, max_length=500)

class UserResetPasswordResponse(BaseModel):
    """Schema for password reset response"""
    user_id: int
    temporary_password: str
    message: str

class UserRoleUpdate(BaseModel):
    """Schema for updating user role"""
    role: str = Field(..., description="New role: farmer, retailer, admin")

class UserActivityResponse(BaseModel):
    """Schema for user activity"""
    user_id: int
    total_orders: int
    total_products: int
    total_transactions: Decimal
    last_login: Optional[datetime] = None
    account_age_days: int

# Dashboard Schemas
class DashboardMetricsResponse(BaseModel):
    """Schema for dashboard metrics"""
    total_users: int
    total_farmers: int
    total_retailers: int
    total_admins: int
    total_orders: int
    pending_orders: int
    approved_orders: int
    delivered_orders: int
    total_revenue: Decimal
    monthly_revenue: Decimal
    pending_verifications: int
    pending_transport_approvals: int
    payment_success_rate: float
    recent_activities: List[Dict[str, Any]]

# Report Schemas
class OrdersReportRequest(BaseModel):
    """Schema for orders report request"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None
    farmer_id: Optional[int] = None
    retailer_id: Optional[int] = None

class OrdersReportResponse(BaseModel):
    """Schema for orders report response"""
    total_orders: int
    total_value: Decimal
    average_order_value: Decimal
    orders_by_status: Dict[str, int]
    orders_by_category: Dict[str, int]
    top_products: List[Dict[str, Any]]

class RevenueReportRequest(BaseModel):
    """Schema for revenue report request"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    group_by: str = Field("day", description="Grouping: day, week, month")

class RevenueReportResponse(BaseModel):
    """Schema for revenue report response"""
    total_revenue: Decimal
    total_transactions: int
    average_transaction_value: Decimal
    revenue_by_period: List[Dict[str, Any]]
    revenue_by_payment_method: Dict[str, Decimal]

class UserRegistrationReportRequest(BaseModel):
    """Schema for user registration report request"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class UserRegistrationReportResponse(BaseModel):
    """Schema for user registration report response"""
    total_registrations: int
    registrations_by_role: Dict[str, int]
    registrations_by_period: List[Dict[str, Any]]
    verification_rate: float

class PaymentSuccessRateReportRequest(BaseModel):
    """Schema for payment success rate report"""
    days: int = Field(30, ge=1, le=365)

class PaymentSuccessRateReportResponse(BaseModel):
    """Schema for payment success rate response"""
    total_payments: int
    successful_payments: int
    failed_payments: int
    success_rate: float
    average_payment_value: Decimal
    payments_by_method: Dict[str, int]

class TransportCompletionReportRequest(BaseModel):
    """Schema for transport completion report"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class TransportCompletionReportResponse(BaseModel):
    """Schema for transport completion report response"""
    total_requests: int
    completed_requests: int
    pending_requests: int
    rejected_requests: int
    completion_rate: float
    average_delivery_time_days: Optional[float] = None

# Data Export Schemas
class DataExportRequest(BaseModel):
    """Schema for data export request"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    filters: Optional[Dict[str, Any]] = None

class DataExportResponse(BaseModel):
    """Schema for data export response"""
    filename: str
    record_count: int
    file_size: int
    download_url: str
    expires_at: datetime
