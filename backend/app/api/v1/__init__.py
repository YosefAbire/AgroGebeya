from fastapi import APIRouter
from app.api.v1 import (
    auth,
    products,
    orders,
    verification,
    payments,
    transport,
    messages,
    notifications,
    feedback,
    i18n,
    ws,
    uploads,
    dashboard,
    locations,
)
from app.api.v1.admin import (
    audit,
    users,
    reports,
    config,
    backups,
)

api_router = APIRouter()

# Public endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(locations.router, prefix="/locations", tags=["locations"])

# User endpoints
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(verification.router, prefix="/verification", tags=["verification"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(transport.router, prefix="/transport", tags=["transport"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(i18n.router, prefix="/i18n", tags=["internationalization"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])

# WebSocket endpoints
api_router.include_router(ws.router, prefix="/ws", tags=["websocket"])

# Admin endpoints
api_router.include_router(audit.router, prefix="/admin", tags=["admin-audit"])
api_router.include_router(users.router, prefix="/admin", tags=["admin-users"])
api_router.include_router(reports.router, prefix="/admin/reports", tags=["admin-reports"])
api_router.include_router(config.router, prefix="/admin", tags=["admin-config"])
api_router.include_router(backups.router, prefix="/admin/backups", tags=["admin-backups"])
