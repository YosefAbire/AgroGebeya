# AgroGebeya Backend

FastAPI backend for the AgroGebeya agricultural marketplace platform.

## Tech Stack

- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Relational database
- **SQLAlchemy** - ORM with async support
- **Alembic** - Database migrations
- **Pydantic** - Data validation
- **JWT** - Authentication
- **Uvicorn** - ASGI server

## Setup

### Prerequisites

- Python 3.9+
- PostgreSQL 12+
- pip or poetry

### Installation

1. Create virtual environment:
```bash
python -m venv venv
```

2. Activate virtual environment:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

5. Update environment variables in `.env`

### Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE agrogebeya;
```

2. Run migrations:
```bash
alembic upgrade head
```

### Run Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

API will be available at:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI application entry point
│   ├── core/             # Core functionality
│   │   ├── config.py     # Configuration settings
│   │   ├── security.py   # Authentication & security
│   │   └── database.py   # Database connection
│   ├── api/              # API routes
│   │   └── v1/           # API version 1
│   ├── models/           # SQLAlchemy models
│   │   └── user.py       # User model
│   ├── schemas/          # Pydantic schemas
│   │   └── user.py       # User schemas
│   └── utils/            # Utility functions
├── alembic/              # Database migrations
│   ├── versions/         # Migration files
│   └── env.py            # Alembic environment
├── requirements.txt      # Python dependencies
├── alembic.ini           # Alembic configuration
└── .env                  # Environment variables
```

## API Endpoints

### Health Check
- `GET /` - Welcome message
- `GET /api/health` - Health check

### Coming Soon
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order

## Development

### Create a new migration
```bash
alembic revision --autogenerate -m "description"
```

### Apply migrations
```bash
alembic upgrade head
```

### Rollback migration
```bash
alembic downgrade -1
```

### Run with auto-reload
```bash
uvicorn app.main:app --reload
```

### Run tests
```bash
pytest
```

### Format code
```bash
black app/
```

### Lint code
```bash
flake8 app/
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `PORT` - Server port (default: 8000)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `ENVIRONMENT` - development/production
