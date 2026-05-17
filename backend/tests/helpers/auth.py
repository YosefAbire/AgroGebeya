"""
Auth helpers — generate JWT tokens and auth headers for tests.
"""
from datetime import timedelta
from app.core.security import create_access_token
from app.models.user import User


def make_token(user: User, expires_minutes: int = 60) -> str:
    """Return a valid JWT access token for the given user."""
    return create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=expires_minutes),
    )


def auth_headers(user: User, expires_minutes: int = 60) -> dict:
    """Return Authorization header dict for use with httpx."""
    return {"Authorization": f"Bearer {make_token(user, expires_minutes)}"}


def expired_token(user: User) -> str:
    """Return an already-expired JWT token."""
    return create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(seconds=-1),
    )


def invalid_token() -> str:
    """Return a syntactically valid but cryptographically invalid JWT."""
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJoYWNrZXIifQ.INVALID_SIG"
