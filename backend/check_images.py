"""
Script to check product images in the database
"""
import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.product import Product
from app.models.product_image import ProductImage

async def check_images():
    async with AsyncSessionLocal() as db:
        # Get all products
        result = await db.execute(select(Product))
        products = result.scalars().all()
        
        print(f"\n=== Products ({len(products)} total) ===")
        for product in products:
            print(f"\nProduct ID: {product.id}")
            print(f"Name: {product.name}")
            print(f"Image URL: {product.image_url}")
            
            # Get images for this product
            img_result = await db.execute(
                select(ProductImage).where(ProductImage.product_id == product.id)
            )
            images = img_result.scalars().all()
            
            if images:
                print(f"Images ({len(images)}):")
                for img in images:
                    print(f"  - {img.image_url} (primary: {img.is_primary})")
            else:
                print("  No images in ProductImage table")

if __name__ == "__main__":
    asyncio.run(check_images())
