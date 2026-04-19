from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CaregiverEmploymentSummary(BaseModel):
    """Caregiver info as seen from a founder's employee list."""

    id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    is_active: bool
    employed_at: datetime
    job_title: Optional[str] = None
    employment_notes: Optional[str] = None


class FounderSummary(BaseModel):
    """Minimal founder info as seen from a caregiver's perspective."""

    id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    employed_at: datetime
    job_title: Optional[str] = None
    employment_notes: Optional[str] = None


class FounderProfile(BaseModel):
    """Full founder profile with their list of employed caregivers."""

    id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    employed_caregivers: list[CaregiverEmploymentSummary] = []


class EmployCaregiverRequest(BaseModel):
    caregiver_id: str
    job_title: Optional[str] = None
    notes: Optional[str] = None


class EmploymentResponse(BaseModel):
    id: str
    founder_id: str
    caregiver_id: str
    employed_at: datetime
    job_title: Optional[str] = None
    notes: Optional[str] = None
