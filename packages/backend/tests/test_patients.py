import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime

from care_assistant.main import app


@pytest.mark.asyncio
async def test_list_patients():
    """Test listing all patients."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/patients/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_create_patient():
    """Test creating a new patient."""
    patient_data = {
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "1950-01-15T00:00:00",
        "phone": "+1234567890",
        "email": "john.doe@example.com",
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/patients/", json=patient_data)
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == patient_data["first_name"]
        assert data["last_name"] == patient_data["last_name"]
