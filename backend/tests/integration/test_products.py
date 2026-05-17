"""
Integration tests for product management endpoints.
Covers CRUD, role-based access, and stock validation.
"""
import pytest
from httpx import AsyncClient

from tests.helpers.assertions import (
    assert_ok, assert_created, assert_forbidden, assert_not_found,
    assert_bad_request, assert_has_fields,
)
from tests.fixtures.data import PRODUCT_DATA

pytestmark = pytest.mark.integration


class TestListProducts:
    async def test_list_products_public(self, client: AsyncClient):
        """Product listing is public — no auth required."""
        resp = await client.get("/api/v1/products")
        assert_ok(resp)
        assert isinstance(resp.json(), list)

    async def test_list_products_authenticated(self, farmer_client: AsyncClient):
        resp = await farmer_client.get("/api/v1/products")
        assert_ok(resp)

    async def test_list_products_returns_created_product(
        self, client: AsyncClient, product
    ):
        resp = await client.get("/api/v1/products")
        ids = [p["id"] for p in resp.json()]
        assert product.id in ids


class TestGetProduct:
    async def test_get_existing_product(self, client: AsyncClient, product):
        resp = await client.get(f"/api/v1/products/{product.id}")
        data = assert_ok(resp)
        assert data["id"] == product.id
        assert data["name"] == product.name

    async def test_get_nonexistent_product(self, client: AsyncClient):
        resp = await client.get("/api/v1/products/999999")
        assert_not_found(resp)


class TestCreateProduct:
    async def test_farmer_can_create_product(
        self, farmer_client: AsyncClient, farmer
    ):
        resp = await farmer_client.post("/api/v1/products", json=PRODUCT_DATA)
        data = assert_created(resp)
        assert_has_fields(data, "id", "name", "price", "available_quantity")
        assert data["farmer_id"] == farmer.id
        assert data["name"] == PRODUCT_DATA["name"]

    async def test_retailer_cannot_create_product(
        self, retailer_client: AsyncClient
    ):
        resp = await retailer_client.post("/api/v1/products", json=PRODUCT_DATA)
        assert_forbidden(resp)

    async def test_unauthenticated_cannot_create_product(
        self, client: AsyncClient
    ):
        resp = await client.post("/api/v1/products", json=PRODUCT_DATA)
        assert resp.status_code == 401

    async def test_create_product_missing_required_field(
        self, farmer_client: AsyncClient
    ):
        data = {k: v for k, v in PRODUCT_DATA.items() if k != "price"}
        resp = await farmer_client.post("/api/v1/products", json=data)
        assert resp.status_code == 422

    async def test_create_product_negative_price_fails(
        self, farmer_client: AsyncClient
    ):
        data = {**PRODUCT_DATA, "price": -10}
        resp = await farmer_client.post("/api/v1/products", json=data)
        # Either 422 (validation) or 400 (business logic)
        assert resp.status_code in (400, 422)


class TestUpdateProduct:
    async def test_farmer_can_update_own_product(
        self, farmer_client: AsyncClient, product
    ):
        resp = await farmer_client.put(
            f"/api/v1/products/{product.id}",
            json={"price": 30.0, "available_quantity": 400},
        )
        data = assert_ok(resp)
        assert data["price"] == 30.0
        assert data["available_quantity"] == 400

    async def test_farmer_cannot_update_others_product(
        self, db, product
    ):
        from tests.factories.user_factory import create_farmer
        from tests.helpers.auth import auth_headers
        from httpx import AsyncClient
        from httpx import ASGITransport
        from app.main import app

        other_farmer = await create_farmer(db)
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
            headers=auth_headers(other_farmer),
        ) as ac:
            resp = await ac.put(
                f"/api/v1/products/{product.id}", json={"price": 99.0}
            )
        assert_forbidden(resp)

    async def test_retailer_cannot_update_product(
        self, retailer_client: AsyncClient, product
    ):
        resp = await retailer_client.put(
            f"/api/v1/products/{product.id}", json={"price": 99.0}
        )
        assert_forbidden(resp)


class TestDeleteProduct:
    async def test_farmer_can_delete_own_product(
        self, farmer_client: AsyncClient, db, farmer
    ):
        from tests.factories.product_factory import create_product
        p = await create_product(db, farmer, name="ToDelete")
        resp = await farmer_client.delete(f"/api/v1/products/{p.id}")
        assert resp.status_code == 204

    async def test_delete_nonexistent_product(self, farmer_client: AsyncClient):
        resp = await farmer_client.delete("/api/v1/products/999999")
        assert_not_found(resp)
