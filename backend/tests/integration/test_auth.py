"""
Integration tests for authentication endpoints.
Tests registration, login, token validation, and role-based access.
"""
import pytest
from httpx import AsyncClient

from tests.helpers.assertions import (
    assert_ok, assert_created, assert_unauthorized, assert_bad_request, assert_has_fields
)
from tests.helpers.auth import expired_token, invalid_token
from tests.fixtures.data import FARMER_DATA, RETAILER_DATA

pytestmark = pytest.mark.integration


class TestRegistration:
    async def test_register_farmer_success(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/register", json=FARMER_DATA)
        data = assert_created(resp)
        assert_has_fields(data, "id", "email", "username", "role")
        assert data["role"] == "farmer"
        assert data["email"] == FARMER_DATA["email"]

    async def test_register_retailer_success(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/register", json=RETAILER_DATA)
        data = assert_created(resp)
        assert data["role"] == "retailer"

    async def test_register_duplicate_email_fails(self, client: AsyncClient):
        await client.post("/api/v1/auth/register", json=FARMER_DATA)
        resp = await client.post("/api/v1/auth/register", json=FARMER_DATA)
        assert_bad_request(resp)
        assert "already registered" in resp.json()["detail"]

    async def test_register_duplicate_username_fails(self, client: AsyncClient):
        await client.post("/api/v1/auth/register", json=FARMER_DATA)
        dup = {**FARMER_DATA, "email": "other@test.com"}
        resp = await client.post("/api/v1/auth/register", json=dup)
        assert_bad_request(resp)

    async def test_register_missing_email_fails(self, client: AsyncClient):
        data = {k: v for k, v in FARMER_DATA.items() if k != "email"}
        resp = await client.post("/api/v1/auth/register", json=data)
        assert resp.status_code == 422  # Unprocessable Entity

    async def test_register_invalid_role_fails(self, client: AsyncClient):
        data = {**FARMER_DATA, "role": "superuser"}
        resp = await client.post("/api/v1/auth/register", json=data)
        assert resp.status_code == 422

    async def test_password_not_returned(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/register", json=FARMER_DATA)
        data = assert_created(resp)
        assert "password" not in data
        assert "hashed_password" not in data


class TestLogin:
    async def test_login_success(self, client: AsyncClient, farmer):
        resp = await client.post(
            "/api/v1/auth/login",
            data={"username": farmer.username, "password": "Test@1234"},
        )
        data = assert_ok(resp)
        assert_has_fields(data, "access_token", "token_type")
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 20

    async def test_login_wrong_password(self, client: AsyncClient, farmer):
        resp = await client.post(
            "/api/v1/auth/login",
            data={"username": farmer.username, "password": "wrong_password"},
        )
        assert_unauthorized(resp)

    async def test_login_nonexistent_user(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/auth/login",
            data={"username": "nobody", "password": "password"},
        )
        assert_unauthorized(resp)

    async def test_login_inactive_user(self, client: AsyncClient, db):
        from tests.factories.user_factory import create_farmer
        inactive = await create_farmer(db, is_active=False)
        resp = await client.post(
            "/api/v1/auth/login",
            data={"username": inactive.username, "password": "Test@1234"},
        )
        assert resp.status_code == 400

    async def test_login_returns_refresh_token(self, client: AsyncClient, farmer):
        resp = await client.post(
            "/api/v1/auth/login",
            data={"username": farmer.username, "password": "Test@1234"},
        )
        data = assert_ok(resp)
        assert "refresh_token" in data


class TestGetMe:
    async def test_get_me_authenticated(self, farmer_client: AsyncClient, farmer):
        resp = await farmer_client.get("/api/v1/auth/me")
        data = assert_ok(resp)
        assert data["username"] == farmer.username
        assert data["role"] == "farmer"

    async def test_get_me_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/api/v1/auth/me")
        assert_unauthorized(resp)

    async def test_get_me_expired_token(self, client: AsyncClient, farmer):
        token = expired_token(farmer)
        resp = await client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
        )
        assert_unauthorized(resp)

    async def test_get_me_invalid_token(self, client: AsyncClient):
        resp = await client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {invalid_token()}"}
        )
        assert_unauthorized(resp)

    async def test_get_me_malformed_header(self, client: AsyncClient):
        resp = await client.get(
            "/api/v1/auth/me", headers={"Authorization": "NotBearer token"}
        )
        assert_unauthorized(resp)


class TestTokenRefresh:
    async def test_refresh_token_returns_new_access_token(
        self, client: AsyncClient, farmer
    ):
        login = await client.post(
            "/api/v1/auth/login",
            data={"username": farmer.username, "password": "Test@1234"},
        )
        refresh_token = login.json()["refresh_token"]
        resp = await client.post(
            "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
        )
        data = assert_ok(resp)
        assert_has_fields(data, "access_token", "token_type")

    async def test_refresh_with_invalid_token_fails(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/auth/refresh", json={"refresh_token": invalid_token()}
        )
        assert_unauthorized(resp)
