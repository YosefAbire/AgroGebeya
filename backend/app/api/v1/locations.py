from fastapi import APIRouter
from typing import List

router = APIRouter()

ETHIOPIAN_CITIES = [
    "Addis Ababa", "Dire Dawa", "Adama", "Hawassa", "Mekelle",
    "Bahir Dar", "Jimma", "Arsi Zone", "Wollega", "South Wollo",
    "Gimbi", "Durame", "Shashemene", "Debre Berhan", "Debre Zeit",
]

ETHIOPIAN_REGIONS = [
    "Addis Ababa", "Amhara", "Oromia", "SNNPR", "Tigray",
    "Benishangul-Gumuz", "Gambela", "Harari", "Afar", "Dire Dawa", "Somali",
]


@router.get("/cities", response_model=List[str])
async def get_cities():
    """Get list of Ethiopian cities"""
    return ETHIOPIAN_CITIES


@router.get("/regions", response_model=List[str])
async def get_regions():
    """Get list of Ethiopian regions"""
    return ETHIOPIAN_REGIONS
