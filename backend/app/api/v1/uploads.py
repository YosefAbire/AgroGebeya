from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
from app.core.database import get_db
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.core.file_storage import (
    save_product_image,
    save_profile_image,
    delete_file
)
from pydantic import BaseModel

router = APIRouter()

class ImageUploadResponse(BaseModel):
    url: str
    message: str

class ProductImageResponse(BaseModel):
    id: int
    image_url: str
    is_primary: bool
    display_order: int
    
    class Config:
        from_attributes = True

@router.post("/products/{product_id}/images", response_model=ImageUploadResponse)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    is_primary: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload an image for a product"""
    # Verify product exists and user owns it
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if product.farmer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload images for this product"
        )
    
    # Save the image file
    image_url = await save_product_image(file)
    
    # If this is set as primary, unset other primary images
    if is_primary:
        await db.execute(
            select(ProductImage)
            .where(ProductImage.product_id == product_id)
            .where(ProductImage.is_primary == True)
        )
        existing_primary = (await db.execute(
            select(ProductImage)
            .where(ProductImage.product_id == product_id)
            .where(ProductImage.is_primary == True)
        )).scalars().all()
        
        for img in existing_primary:
            img.is_primary = False
    
    # Get the next display order
    max_order_result = await db.execute(
        select(ProductImage.display_order)
        .where(ProductImage.product_id == product_id)
        .order_by(ProductImage.display_order.desc())
        .limit(1)
    )
    max_order = max_order_result.scalar_one_or_none()
    next_order = (max_order or 0) + 1
    
    # Create product image record
    product_image = ProductImage(
        product_id=product_id,
        image_url=image_url,
        is_primary=is_primary,
        display_order=next_order
    )
    
    db.add(product_image)
    
    # Update product's main image_url if this is primary or first image
    if is_primary or not product.image_url:
        product.image_url = image_url
    
    await db.commit()
    
    return ImageUploadResponse(
        url=image_url,
        message="Image uploaded successfully"
    )

@router.get("/products/{product_id}/images", response_model=List[ProductImageResponse])
async def get_product_images(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get all images for a product"""
    result = await db.execute(
        select(ProductImage)
        .where(ProductImage.product_id == product_id)
        .order_by(ProductImage.is_primary.desc(), ProductImage.display_order)
    )
    images = result.scalars().all()
    
    return images

@router.delete("/products/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_image(
    image_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a product image"""
    # Get the image
    result = await db.execute(
        select(ProductImage).where(ProductImage.id == image_id)
    )
    image = result.scalar_one_or_none()
    
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    # Verify ownership
    product_result = await db.execute(
        select(Product).where(Product.id == image.product_id)
    )
    product = product_result.scalar_one_or_none()
    
    if product.farmer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this image"
        )
    
    # Delete the file
    delete_file(image.image_url)
    
    # Delete the database record
    await db.delete(image)
    
    # If this was the primary image, update product's image_url
    if product.image_url == image.image_url:
        # Get the next image
        next_image_result = await db.execute(
            select(ProductImage)
            .where(ProductImage.product_id == image.product_id)
            .where(ProductImage.id != image_id)
            .order_by(ProductImage.display_order)
            .limit(1)
        )
        next_image = next_image_result.scalar_one_or_none()
        product.image_url = next_image.image_url if next_image else None
    
    await db.commit()
    
    return None

@router.post("/profile/image", response_model=ImageUploadResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload profile image for current user"""
    # Delete old profile image if exists
    if current_user.profile_image_url:
        delete_file(current_user.profile_image_url)
    
    # Save new image
    image_url = await save_profile_image(file)
    
    # Update user record
    current_user.profile_image_url = image_url
    await db.commit()
    
    return ImageUploadResponse(
        url=image_url,
        message="Profile image uploaded successfully"
    )

@router.delete("/profile/image", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile_image(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete profile image for current user"""
    if not current_user.profile_image_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No profile image found"
        )
    
    # Delete the file
    delete_file(current_user.profile_image_url)
    
    # Update user record
    current_user.profile_image_url = None
    await db.commit()
    
    return None
