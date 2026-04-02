from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pathlib import Path
from app.core.config import settings
from app.api.v1 import api_router
from app.core.file_storage import ensure_upload_dirs

import os

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    # Allow access from local network (e.g. phone, other devices on same WiFi)
    "http://192.168.56.1:3000",
    "http://192.168.1.1:3000",
]

# Allow additional origins from environment variable (comma-separated)
_extra = os.getenv("CORS_ORIGINS", "")
if _extra:
    CORS_ORIGINS += [o.strip() for o in _extra.split(",") if o.strip()]

app = FastAPI(
    title="AgroGebeya API",
    description="Backend API for AgroGebeya Agricultural Marketplace",
    version="1.0.0"
)

# CORS middleware must be added first so headers are present even on error responses
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directories exist
ensure_upload_dirs()

# Mount static files for uploads
uploads_dir = Path("uploads")
if uploads_dir.exists():
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to AgroGebeya API"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "AgroGebeya API is running"}
