from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
from app.core.database import get_db
from app.models.user import User
from app.api.v1.auth import get_current_user

router = APIRouter()

# Sample translations (in production, these would be loaded from files or database)
TRANSLATIONS = {
    "en": {
        "welcome": "Welcome to AgroGebeya",
        "login": "Login",
        "register": "Register",
        "products": "Products",
        "orders": "Orders",
        "messages": "Messages",
        "notifications": "Notifications",
        "profile": "Profile",
        "logout": "Logout"
    },
    "am": {
        "welcome": "ወደ አግሮገበያ እንኳን ደህና መጡ",
        "login": "ግባ",
        "register": "ይመዝገቡ",
        "products": "ምርቶች",
        "orders": "ትዕዛዞች",
        "messages": "መልዕክቶች",
        "notifications": "ማሳወቂያዎች",
        "profile": "መገለጫ",
        "logout": "ውጣ"
    }
}


@router.get("/translations/{locale}")
async def get_translations(locale: str) -> Dict[str, Any]:
    """Get translations for a specific locale"""
    
    if locale not in TRANSLATIONS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Translations not found for locale: {locale}"
        )
    
    return {
        "locale": locale,
        "translations": TRANSLATIONS[locale]
    }


@router.put("/users/me/language")
async def update_user_language(
    language: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user's language preference"""
    
    if language not in ["en", "am"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid language. Must be 'en' or 'am'"
        )
    
    current_user.language_preference = language
    
    await db.commit()
    await db.refresh(current_user)
    
    return {
        "message": "Language preference updated successfully",
        "language": language
    }
