# AgroGebeya Backend Test Suite

Production-grade test suite for the FastAPI + PostgreSQL + Alembic D2C Agricultural Retail Management System.

## Structure

```
tests/
├── conftest.py              # Root fixtures: DB session, HTTP clients, user fixtures
├── pytest.ini               # Pytest configuration, coverage settings
├── README.md                # This file
├── requirements-test.txt    # Test-only dependencies
│
├── fixtures/
│   └── data.py              # Static test data constants (users, products, orders)
│
├── factories/
│   ├── user_factory.py      # Create User rows directly in test DB
│   ├── product_factory.py   # Create Product rows
│   └── order_factory.py     # Create Order rows
│
├── helpers/
│   ├── auth.py              # JWT token generation, auth headers, expired/invalid tokens
│   └── assertions.py        # Custom assertion helpers (assert_ok, assert_forbidden, etc.)
│
├── unit/
│   ├── test_security.py     # Password hashing, JWT creation/validation
│   ├── test_validators.py   # Ethiopian National ID, phone number validators
│   └── test_models.py       # Model property/computed field tests (no DB)
│
├── integration/
│   ├── test_auth.py         # Registration, login, token refresh, /me endpoint
│   ├── test_products.py     # CRUD, role-based access, stock validation
│   ├── test_orders.py       # Order lifecycle, status transitions, inventory updates
│   ├── test_verification.py # KYC submission, admin approve/reject, image upload
│   ├── test_payments.py     # Chapa integration (mocked), webhook handling, refunds
│   ├── test_credit.py       # Credit grant/suspend, credit orders, invoice payment
│   ├── test_rbac.py         # Role-based access control boundary tests
│   ├── test_security_validation.py  # SQL injection, invalid payloads, state transitions
│   └── test_e2e_flows.py    # Complete multi-step workflow tests
│
└── performance/
    └── test_concurrent.py   # Concurrent requests, pagination, bulk operations
```

## Quick Start

### 1. Create the test database

```bash
psql -U postgres -c "CREATE DATABASE agrogebeya_test;"
```

Or set a custom URL:

```bash
export TEST_DATABASE_URL="postgresql://postgres:password@localhost:5432/agrogebeya_test"
```

### 2. Install test dependencies

```bash
pip install -r tests/requirements-test.txt
```

### 3. Run all tests

```bash
# From the backend/ directory
pytest tests/

# With verbose output
pytest tests/ -v

# With coverage report
pytest tests/ --cov=app --cov-report=html
```

### 4. Run specific test categories

```bash
# Unit tests only (fast, no DB)
pytest tests/ -m unit

# Integration tests only
pytest tests/ -m integration

# Auth tests only
pytest tests/ -m auth

# Skip slow performance tests
pytest tests/ -m "not slow"

# Performance tests only
pytest tests/ -m performance
```

### 5. Run a single test file

```bash
pytest tests/integration/test_auth.py -v
pytest tests/integration/test_orders.py::TestOrderPlacement -v
pytest tests/integration/test_orders.py::TestOrderPlacement::test_verified_retailer_can_place_order -v
```

## Test Strategy

### Isolation
Each test function gets a **rolled-back transaction** — no test data persists between tests. Tables are created once per session and dropped at the end.

### Mocking
External services (Chapa payment gateway) are mocked using `unittest.mock.patch` to avoid real API calls and network dependencies.

### Fixtures
All fixtures are defined in `conftest.py` and are available to every test automatically:

| Fixture | Description |
|---------|-------------|
| `db` | Async SQLAlchemy session (rolled back after each test) |
| `client` | Unauthenticated httpx AsyncClient |
| `farmer` | Farmer user in DB |
| `retailer` | Unverified retailer user in DB |
| `verified_retailer` | Verified retailer user in DB |
| `admin` | Admin user in DB |
| `farmer_client` | Authenticated client as farmer |
| `retailer_client` | Authenticated client as retailer |
| `verified_retailer_client` | Authenticated client as verified retailer |
| `admin_client` | Authenticated client as admin |
| `product` | Product owned by `farmer` |
| `pending_order` | Pending order from `verified_retailer` for `product` |

## Coverage

The suite is configured to enforce **85% minimum coverage**. HTML reports are generated in `htmlcov/`.

```bash
# View HTML coverage report
open htmlcov/index.html   # macOS
start htmlcov/index.html  # Windows
```

## CI/CD

See `.github/workflows/test.yml` for the GitHub Actions configuration. Tests run automatically on every push and pull request.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TEST_DATABASE_URL` | `...agrogebeya_test` | PostgreSQL URL for test DB |
| `JWT_SECRET` | Required | JWT signing secret |
| `DATABASE_URL` | Required | Production DB (not used in tests) |
