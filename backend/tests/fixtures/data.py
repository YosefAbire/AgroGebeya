"""
Shared fixture data constants.
These are static dictionaries used to seed test users, products, and orders.
"""

# ── Users ─────────────────────────────────────────────────────────────────────

FARMER_DATA = {
    "email": "farmer@test.com",
    "username": "test_farmer",
    "password": "Farmer@1234",
    "full_name": "Test Farmer",
    "phone": "+251911000001",
    "role": "farmer",
}

RETAILER_DATA = {
    "email": "retailer@test.com",
    "username": "test_retailer",
    "password": "Retailer@1234",
    "full_name": "Test Retailer",
    "phone": "+251911000002",
    "role": "retailer",
}

ADMIN_DATA = {
    "email": "admin@test.com",
    "username": "test_admin",
    "password": "Admin@1234",
    "full_name": "Test Admin",
    "phone": "+251911000003",
    "role": "admin",
}

# ── Products ──────────────────────────────────────────────────────────────────

PRODUCT_DATA = {
    "name": "Fresh Tomatoes",
    "description": "Organic red tomatoes from Addis Ababa",
    "category": "Vegetables",
    "price": 25.0,
    "unit": "KG",
    "available_quantity": 500,
    "location": "Addis Ababa",
}

PRODUCT_DATA_2 = {
    "name": "White Onions",
    "description": "Fresh white onions",
    "category": "Vegetables",
    "price": 18.0,
    "unit": "KG",
    "available_quantity": 200,
    "location": "Hawassa",
}

# ── Orders ────────────────────────────────────────────────────────────────────

ORDER_DATA = {
    "quantity": 10,
    "delivery_date": "2027-01-15T12:00:00",
}

# ── Verification ──────────────────────────────────────────────────────────────

VERIFICATION_DATA = {
    "national_id": "123456789012",  # 12-digit FIN
}

# ── Credit ────────────────────────────────────────────────────────────────────

CREDIT_GRANT_DATA = {
    "credit_limit": 50000.0,
    "payment_due_days": 30,
    "notes": "Trusted retailer",
}
