from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.core.config import settings
from app.api.v1 import api_router
from app.core.file_storage import ensure_upload_dirs

app = FastAPI(
    title="AgroGebeya API",
    description="Backend API for AgroGebeya Agricultural Marketplace",
    version="1.0.0"
)

# Ensure upload directories exist
ensure_upload_dirs()

# Mount static files for uploads
uploads_dir = Path("uploads")
if uploads_dir.exists():
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to AgroGebeya API"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "AgroGebeya API is running"}
