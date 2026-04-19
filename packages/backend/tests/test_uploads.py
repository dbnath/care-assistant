import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch

from care_assistant.main import app


async def _create_patient(client: AsyncClient) -> str:
    resp = await client.post(
        "/api/v1/patients/",
        json={
            "first_name": "Jane",
            "last_name": "Doe",
            "date_of_birth": "1950-01-15T00:00:00",
            "phone": "+1234567890",
        },
    )
    assert resp.status_code == 201
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_upload_file_returns_presigned_url():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        patient_id = await _create_patient(client)

        with patch("care_assistant.routers.uploads.upload_to_s3"), \
             patch(
                 "care_assistant.routers.uploads.generate_presigned_url",
                 return_value="https://s3.example.com/presigned",
             ):
            resp = await client.post(
                "/api/v1/uploads/",
                data={"patient_id": patient_id, "file_type": "prescription"},
                files={"file": ("report.pdf", b"%PDF-1.4 content", "application/pdf")},
            )

        assert resp.status_code == 201
        data = resp.json()
        assert data["patient_id"] == patient_id
        assert data["file_type"] == "prescription"
        assert data["file_path"] == "https://s3.example.com/presigned"
        assert data["filename"] == "report.pdf"


@pytest.mark.asyncio
async def test_upload_stores_s3_key_not_local_path():
    """file_path stored in DB must be an S3 key (no leading slash, no 'uploads/' prefix)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        patient_id = await _create_patient(client)

        captured_key = {}

        def mock_upload(file_bytes, bucket, key):
            captured_key["key"] = key

        with patch("care_assistant.routers.uploads.upload_to_s3", side_effect=mock_upload), \
             patch("care_assistant.routers.uploads.generate_presigned_url", return_value="https://s3.example.com/x"):
            await client.post(
                "/api/v1/uploads/",
                data={"patient_id": patient_id, "file_type": "prescription"},
                files={"file": ("rx.pdf", b"%PDF content", "application/pdf")},
            )

        key = captured_key["key"]
        assert key.startswith("prescriptions/")
        assert patient_id in key
        assert key.endswith(".pdf")
        assert not key.startswith("/")
        assert "uploads/" not in key


@pytest.mark.asyncio
async def test_upload_rejects_invalid_file_type():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        patient_id = await _create_patient(client)
        resp = await client.post(
            "/api/v1/uploads/",
            data={"patient_id": patient_id, "file_type": "prescription"},
            files={"file": ("virus.exe", b"MZ content", "application/octet-stream")},
        )
        assert resp.status_code == 400
        assert "not allowed" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_upload_rejects_bad_file_type_field():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        patient_id = await _create_patient(client)
        resp = await client.post(
            "/api/v1/uploads/",
            data={"patient_id": patient_id, "file_type": "invoice"},
            files={"file": ("f.pdf", b"%PDF content", "application/pdf")},
        )
        assert resp.status_code == 400


@pytest.mark.asyncio
async def test_list_uploads_returns_presigned_urls():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        patient_id = await _create_patient(client)

        with patch("care_assistant.routers.uploads.upload_to_s3"), \
             patch("care_assistant.routers.uploads.generate_presigned_url", return_value="https://s3.example.com/file"):
            await client.post(
                "/api/v1/uploads/",
                data={"patient_id": patient_id, "file_type": "report"},
                files={"file": ("lab.pdf", b"%PDF content", "application/pdf")},
            )

        with patch("care_assistant.routers.uploads.generate_presigned_url", return_value="https://s3.example.com/listed"):
            resp = await client.get(f"/api/v1/uploads/{patient_id}")

        assert resp.status_code == 200
        uploads = resp.json()
        assert len(uploads) == 1
        assert uploads[0]["file_path"] == "https://s3.example.com/listed"


@pytest.mark.asyncio
async def test_delete_upload_calls_s3_delete():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        patient_id = await _create_patient(client)

        with patch("care_assistant.routers.uploads.upload_to_s3"), \
             patch("care_assistant.routers.uploads.generate_presigned_url", return_value="https://s3.example.com/f"):
            upload_resp = await client.post(
                "/api/v1/uploads/",
                data={"patient_id": patient_id, "file_type": "prescription"},
                files={"file": ("rx.pdf", b"%PDF content", "application/pdf")},
            )
        upload_id = upload_resp.json()["id"]

        with patch("care_assistant.routers.uploads.delete_from_s3") as mock_delete:
            del_resp = await client.delete(f"/api/v1/uploads/{upload_id}")
            assert del_resp.status_code == 204
            mock_delete.assert_called_once()


@pytest.mark.asyncio
async def test_upload_patient_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/uploads/",
            data={"patient_id": "nonexistent-id", "file_type": "prescription"},
            files={"file": ("f.pdf", b"%PDF content", "application/pdf")},
        )
        assert resp.status_code == 404
