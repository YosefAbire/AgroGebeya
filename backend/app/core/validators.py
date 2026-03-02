import re
from typing import Optional

def validate_ethiopian_national_id(national_id: str) -> bool:
    """
    Validate Ethiopian National ID format (9 digits)
    
    Args:
        national_id: National ID string to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not national_id:
        return False
    
    # Remove any whitespace
    national_id = national_id.strip()
    
    # Check if it's exactly 9 digits
    pattern = r'^\d{9}$'
    return bool(re.match(pattern, national_id))


def sanitize_national_id(national_id: str) -> str:
    """
    Sanitize National ID by removing non-digit characters
    
    Args:
        national_id: National ID string to sanitize
        
    Returns:
        Sanitized National ID containing only digits
    """
    if not national_id:
        return ""
    
    return re.sub(r'\D', '', national_id)


def mask_national_id(national_id: str) -> str:
    """
    Mask National ID showing only last 4 digits
    
    Args:
        national_id: National ID to mask
        
    Returns:
        Masked National ID (e.g., "*****1234")
    """
    if not national_id or len(national_id) < 4:
        return "****"
    
    return "*" * (len(national_id) - 4) + national_id[-4:]


def validate_phone_number(phone: str) -> bool:
    """
    Validate Ethiopian phone number format
    
    Args:
        phone: Phone number to validate
        
    Returns:
        True if valid, False otherwise
    """
    if not phone:
        return False
    
    # Ethiopian phone numbers: +251XXXXXXXXX or 0XXXXXXXXX
    pattern = r'^(\+251|0)[79]\d{8}$'
    return bool(re.match(pattern, phone.strip()))


def validate_message_content(content: str) -> tuple[bool, Optional[str]]:
    """
    Validate message content
    
    Args:
        content: Message content to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not content:
        return False, "Message content cannot be empty"
    
    if len(content) < 1:
        return False, "Message must be at least 1 character"
    
    if len(content) > 2000:
        return False, "Message cannot exceed 2000 characters"
    
    return True, None


def validate_feedback_description(description: str) -> tuple[bool, Optional[str]]:
    """
    Validate feedback description
    
    Args:
        description: Feedback description to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not description:
        return False, "Description cannot be empty"
    
    if len(description) < 10:
        return False, "Description must be at least 10 characters"
    
    return True, None
