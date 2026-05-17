"""
Custom assertion helpers for cleaner test code.
"""
from httpx import Response


def assert_ok(response: Response) -> dict:
    """Assert 200 and return parsed JSON."""
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    return response.json()


def assert_created(response: Response) -> dict:
    """Assert 201 and return parsed JSON."""
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
    return response.json()


def assert_unauthorized(response: Response) -> None:
    """Assert 401 Unauthorized."""
    assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"


def assert_forbidden(response: Response) -> None:
    """Assert 403 Forbidden."""
    assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"


def assert_not_found(response: Response) -> None:
    """Assert 404 Not Found."""
    assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"


def assert_bad_request(response: Response) -> None:
    """Assert 400 Bad Request."""
    assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"


def assert_has_fields(data: dict, *fields: str) -> None:
    """Assert that a dict contains all specified keys."""
    for field in fields:
        assert field in data, f"Missing field '{field}' in response: {data}"
