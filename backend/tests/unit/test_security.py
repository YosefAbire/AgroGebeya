"""
Unit tests for security utilities (no DB, no network).
Tests password hashing and JWT token creation/validation.
"""
import pytest
from datetime import timedelta
from jose import jwt

from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
)
from app.core.config import settings


pytestmark = pytest.mark.unit


class TestPasswordHashing:
    def test_hash_is_not_plaintext(self):
        hashed = get_password_hash("secret123")
        assert hashed != "secret123"

    def test_verify_correct_password(self):
        hashed = get_password_hash("correct_password")
        assert verify_password("correct_password", hashed) is True

    def test_reject_wrong_password(self):
        hashed = get_password_hash("correct_password")
        assert verify_password("wrong_password", hashed) is False

    def test_different_hashes_for_same_password(self):
        """bcrypt uses random salt — same password produces different hashes."""
        h1 = get_password_hash("same_password")
        h2 = get_password_hash("same_password")
        assert h1 != h2

    def test_empty_password_hashes(self):
        hashed = get_password_hash("")
        assert verify_password("", hashed) is True


class TestJWTTokens:
    def test_create_token_contains_subject(self):
        token = create_access_token(data={"sub": "testuser"})
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        assert payload["sub"] == "testuser"

    def test_token_has_expiry(self):
        token = create_access_token(data={"sub": "testuser"})
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        assert "exp" in payload

    def test_custom_expiry(self):
        token = create_access_token(
            data={"sub": "testuser"}, expires_delta=timedelta(hours=2)
        )
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        assert payload["exp"] > 0

    def test_expired_token_raises(self):
        from jose import ExpiredSignatureError
        token = create_access_token(
            data={"sub": "testuser"}, expires_delta=timedelta(seconds=-1)
        )
        with pytest.raises(ExpiredSignatureError):
            jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])

    def test_invalid_signature_raises(self):
        from jose import JWTError
        token = create_access_token(data={"sub": "testuser"})
        tampered = token[:-5] + "XXXXX"
        with pytest.raises(JWTError):
            jwt.decode(tampered, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])

    def test_wrong_secret_raises(self):
        from jose import JWTError
        token = create_access_token(data={"sub": "testuser"})
        with pytest.raises(JWTError):
            jwt.decode(token, "wrong_secret", algorithms=[settings.JWT_ALGORITHM])
