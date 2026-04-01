import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException, status

# Configuration
UPLOAD_DIR = Path("uploads")
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# Create upload directories
PRODUCT_IMAGES_DIR = UPLOAD_DIR / "products"
PROFILE_IMAGES_DIR = UPLOAD_DIR / "profiles"
ID_IMAGES_DIR = UPLOAD_DIR / "id_documents"

def ensure_upload_dirs():
    """Create upload directories if they don't exist"""
    PRODUCT_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    PROFILE_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    ID_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

def validate_image_file(file: UploadFile) -> None:
    """Validate uploaded image file"""
    # Check content type first (more reliable than filename)
    if file.content_type and file.content_type.startswith("image/"):
        return  # valid

    # Fall back to extension check
    if file.filename:
        file_ext = Path(file.filename).suffix.lower()
        if file_ext in ALLOWED_IMAGE_EXTENSIONS:
            return  # valid

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
    )

async def save_upload_file(file: UploadFile, directory: Path) -> str:
    """Save uploaded file and return the file path"""
    validate_image_file(file)
    
    # Generate unique filename — derive extension from content_type if filename has none
    file_ext = Path(file.filename).suffix.lower() if file.filename else ''
    if not file_ext and file.content_type:
        ct_map = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp'}
        file_ext = ct_map.get(file.content_type, '.jpg')
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = directory / unique_filename
    
    # Read and validate file size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024)}MB"
        )
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Return relative path for URL
    return f"/uploads/{directory.name}/{unique_filename}"

async def save_product_image(file: UploadFile) -> str:
    """Save product image and return URL"""
    ensure_upload_dirs()
    return await save_upload_file(file, PRODUCT_IMAGES_DIR)

async def save_profile_image(file: UploadFile) -> str:
    """Save profile image and return URL"""
    ensure_upload_dirs()
    return await save_upload_file(file, PROFILE_IMAGES_DIR)

async def save_id_image(file: UploadFile) -> str:
    """Save national ID document image and return URL"""
    ensure_upload_dirs()
    return await save_upload_file(file, ID_IMAGES_DIR)

def delete_file(file_url: str) -> None:
    """Delete a file given its URL"""
    if not file_url or not file_url.startswith("/uploads/"):
        return
    
    # Convert URL to file path
    file_path = Path(file_url.lstrip("/"))
    
    try:
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        # Log error but don't raise exception
        print(f"Error deleting file {file_path}: {e}")
