from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CaregiverSummary(BaseModel):
    """Minimal caregiver info embedded inside patient responses."""

    id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    assigned_at: datetime
    assignment_notes: Optional[str] = None


class PatientSummary(BaseModel):
    """Minimal patient info embedded inside caregiver responses."""

    id: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: str
    assigned_at: datetime
    assignment_notes: Optional[str] = None


class CaregiverProfile(BaseModel):
    """Full caregiver profile with list of assigned patients."""

    id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    assigned_patients: list[PatientSummary] = []


class AssignPatientRequest(BaseModel):
    patient_id: str
    notes: Optional[str] = None


class AssignmentResponse(BaseModel):
    id: str
    caregiver_id: str
    patient_id: str
    assigned_at: datetime
    notes: Optional[str] = None
