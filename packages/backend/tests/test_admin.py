"""Tests for admin endpoints (founder-only access)."""

import pytest
from httpx import AsyncClient, ASGITransport

from care_assistant.main import app

# ── Helpers ────────────────────────────────────────────────────────────────────

async def _register(client: AsyncClient, email: str, role: str, **extra) -> dict:
    """Register a user and return the full TokenResponse dict."""
    payload = {
        "email": email,
        "password": "password123",
        "role": role,
        "first_name": "Test",
        "last_name": "User",
        **extra,
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── Tests ──────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_users_unauthenticated_returns_401():
    """GET /admin/users without a token must return 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/admin/users")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_users_as_caregiver_returns_403():
    """A caregiver must not access the admin users list."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        token_resp = await _register(client, "cg_admin_test@example.com", "caregiver")
        response = await client.get(
            "/api/v1/admin/users",
            headers=_auth_headers(token_resp["access_token"]),
        )
        assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_users_as_patient_returns_403():
    """A patient must not access the admin users list."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        token_resp = await _register(
            client,
            "pt_admin_test@example.com",
            "patient",
            date_of_birth="1980-05-10T00:00:00",
        )
        response = await client.get(
            "/api/v1/admin/users",
            headers=_auth_headers(token_resp["access_token"]),
        )
        assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_users_as_founder_returns_200():
    """A founder receives HTTP 200 and a list from GET /admin/users."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        token_resp = await _register(client, "founder_admin_test@example.com", "founder")
        response = await client.get(
            "/api/v1/admin/users",
            headers=_auth_headers(token_resp["access_token"]),
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_list_users_response_contains_registered_users():
    """Registered users appear in the admin list with correct metadata."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register a founder (will be the caller) and a caregiver
        founder_resp = await _register(client, "founder_list_test@example.com", "founder")
        cg_resp = await _register(client, "cg_list_test@example.com", "caregiver")

        response = await client.get(
            "/api/v1/admin/users",
            headers=_auth_headers(founder_resp["access_token"]),
        )
        assert response.status_code == 200
        users = response.json()

        emails = {u["email"] for u in users}
        assert "founder_list_test@example.com" in emails
        assert "cg_list_test@example.com" in emails

        # Check that the caregiver entry has all expected metadata fields
        cg_user = next(u for u in users if u["email"] == "cg_list_test@example.com")
        assert cg_user["id"] == cg_resp["user"]["id"]
        assert cg_user["role"] == "caregiver"
        assert cg_user["first_name"] == "Test"
        assert cg_user["last_name"] == "User"
        assert cg_user["is_active"] is True
        assert "created_at" in cg_user
        assert "patient_id" in cg_user  # null for non-patients


@pytest.mark.asyncio
async def test_list_users_response_excludes_password_hash():
    """Password hashes must never appear in the admin users response."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        token_resp = await _register(client, "founder_pw_test@example.com", "founder")
        response = await client.get(
            "/api/v1/admin/users",
            headers=_auth_headers(token_resp["access_token"]),
        )
        assert response.status_code == 200
        for user in response.json():
            assert "password" not in user
            assert "password_hash" not in user
