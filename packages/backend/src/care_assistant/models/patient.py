from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class EmergencyContactRelation(str, Enum):
    SPOUSE = "spouse"
    CHILD = "child"
    SIBLING = "sibling"
    FRIEND = "friend"
    CAREGIVER = "caregiver"
    OTHER = "other"


class EmergencyContact(BaseModel):
    name: str
    phone: str
    relation: EmergencyContactRelation
    is_primary: bool = False


class Patient(BaseModel):
    id: Optional[str] = None
    first_name: str
    last_name: str
    date_of_birth: datetime
    email: Optional[str] = None
    phone: str
    address: Optional[str] = None
    emergency_contacts: list[EmergencyContact] = Field(default_factory=list)
    medical_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class HealthCheck(BaseModel):
    id: Optional[str] = None
    patient_id: str
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None
    notes: Optional[str] = None
    checked_at: datetime = Field(default_factory=datetime.now)


class Medication(BaseModel):
    id: Optional[str] = None
    patient_id: str
    name: str
    dosage: str
    frequency: str
    start_date: datetime
    end_date: Optional[datetime] = None
    instructions: Optional[str] = None
    active: bool = True


class Appointment(BaseModel):
    id: Optional[str] = None
    patient_id: str
    title: str
    description: Optional[str] = None
    appointment_type: str
    scheduled_at: datetime
    duration_minutes: int = 30
    location: Optional[str] = None
    completed: bool = False
    notes: Optional[str] = None
