"""
Unit tests for input validators (no DB, no network).
"""
import pytest
from app.core.validators import (
    validate_ethiopian_national_id,
    sanitize_national_id,
    validate_phone_number,
)

pytestmark = pytest.mark.unit


class TestNationalIDValidator:
    def test_valid_fin_12_digits(self):
        assert validate_ethiopian_national_id("123456789012") is True

    def test_valid_sn_8_digits(self):
        assert validate_ethiopian_national_id("12345678") is True

    def test_reject_9_digits(self):
        assert validate_ethiopian_national_id("123456789") is False

    def test_reject_letters(self):
        assert validate_ethiopian_national_id("ABCDEFGH") is False

    def test_reject_empty(self):
        assert validate_ethiopian_national_id("") is False

    def test_reject_too_short(self):
        assert validate_ethiopian_national_id("1234567") is False

    def test_reject_too_long(self):
        assert validate_ethiopian_national_id("1234567890123") is False


class TestSanitizeNationalID:
    def test_strips_spaces(self):
        assert sanitize_national_id("  123456789012  ") == "123456789012"

    def test_strips_dashes(self):
        assert sanitize_national_id("1234-5678-9012") == "123456789012"

    def test_empty_returns_empty(self):
        assert sanitize_national_id("") == ""


class TestPhoneValidator:
    def test_valid_ethiopian_plus251(self):
        assert validate_phone_number("+251911234567") is True

    def test_valid_ethiopian_0_prefix(self):
        assert validate_phone_number("0911234567") is True

    def test_reject_short_number(self):
        assert validate_phone_number("+25191123") is False

    def test_reject_empty(self):
        assert validate_phone_number("") is False
