"""
Integration tests for KYC / identity verification workflow.
"""
import pytest
import io
from httpx import AsyncClient

from tests.helpers.assertions import (
    assert_ok, assert_created, assert_forbidden, assert_bad_request,
)

pytestmark = pytest.mark.integration


class TestSubmitVerification:
    async def test_user_can_submit_national_id(self, farmer_client: AsyncClient):
        resp = await farmer_client.post(
            "/api/v1/verification/submit",
            json={"national_id": "123456789012"},
        )
        data = assert_created(resp)
        assert data["status"] == "pending"

    async def test_invalid_national_id_rejected(self, farmer_client: AsyncClient):
        resp = await farmer_client.post(
            "/api/v1/verification/submit",
            json={"national_id": "123"},  # too short
        )
        assert resp.status_code in (400, 422)

    async def test_unauthenticated_cannot_submit(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/verification/submit",
            json={"national_id": "123456789012"},
        )
        assert resp.status_code == 401

    async def test_duplicate_submission_when_pending_fails(
        self, farmer_client: AsyncClient
    ):
        await farmer_client.post(
            "/api/v1/verification/submit",
            json={"national_id": "123456789012"},
        )
        resp = await farmer_client.post(
            "/api/v1/verification/submit",
            json={"national_id": "123456789012"},
        )
        assert_bad_request(resp)
        assert "pending" in resp.json()["detail"].lower()


class TestVerificationStatus:
    async def test_get_status_unverified(self, farmer_client: AsyncClient):
        resp = await farmer_client.get("/api/v1/verification/status")
        data = assert_ok(resp)
        assert data["status"] == "unverified"

    async def test_get_status_after_submission(self, farmer_client: AsyncClient):
        await farmer_client.post(
            "/api/v1/verification/submit",
            json={"national_id": "123456789012"},
        )
        resp = await farmer_client.get("/api/v1/verification/status")
        data = assert_ok(resp)
        assert data["status"] == "pending"


class TestAdminVerificationActions:
    async def test_admin_can_list_pending(
        self, admin_client: AsyncClient, farmer_client: AsyncClient
    ):
        await farmer_client.post(
            "/api/v1/verification/submit",
            json={"national_id": "123456789012"},
        )
        resp = await admin_client.get("/api/v1/verification/admin/pending")
        data = assert_ok(resp)
        assert isinstance(data, list)
        assert len(data) >= 1

    async def test_non_admin_cannot_list_pending(
        self, farmer_client: AsyncClient
    ):
        resp = await farmer_client.get("/api/v1/verification/admin/pending")
        assert_forbidden(resp)

    async def test_admin_can_approve_verification(
        self, admin_client: AsyncClient, farmer_client: AsyncClient, db
    ):
        # Submit
        await farmer_client.post(
            "/api/v1/verification/submit",
            json={"national_id": "123456789012"},
        )
        # Get pending list
        pending = await admin_client.get("/api/v1/verification/admin/pending")
        req_id = pending.json()[0]["id"]

        # Approve
        resp = await admin_client.post(
            f"/api/v1/verification/admin/{req_id}/approve", json={}
        )
        data = assert_ok(resp)
        assert data["status"] == "verified"

    async def test_admin_can_reject_verification(
        self, admin_client: AsyncClient, farmer_client: AsyncClient
    ):
        await farmer_client.post(
            "/api/v1/verification/submit",
            json={"national_id": "123456789012"},
        )
        pending = await admin_client.get("/api/v1/verification/admin/pending")
        req_id = pending.json()[0]["id"]

        resp = await admin_client.post(
            f"/api/v1/verification/admin/{req_id}/reject",
            json={"rejection_reason": "ID image is blurry and unreadable"},
        )
        data = assert_ok(resp)
        assert data["status"] == "rejected"
        assert data["rejection_reason"] is not None


class TestIDImageUpload:
    async def test_upload_id_images_creates_record(
        self, farmer_client: AsyncClient
    ):
        """Upload front + back images without prior ID submission (auto-creates record)."""
        fake_image = io.BytesIO(b"fake_image_data")
        resp = await farmer_client.post(
            "/api/v1/verification/upload-id-images",
            files={
                "front_image": ("front.jpg", fake_image, "image/jpeg"),
                "back_image": ("back.jpg", io.BytesIO(b"back_data"), "image/jpeg"),
            },
        )
        data = assert_created(resp)
        assert data["status"] == "pending"
        assert data["id_front_image_url"] is not None
        assert data["id_back_image_url"] is not None
