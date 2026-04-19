from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    FOUNDER = "founder"
    CAREGIVER = "caregiver"
    PATIENT = "patient"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    role: UserRole
    first_name: str
    last_name: str
    phone: Optional[str] = None

    # Extra fields for patient self-registration
    date_of_birth: Optional[datetime] = None
    address: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    role: UserRole
    first_name: str
    last_name: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    # Populated only for patient-role users
    patient_id: Optional[str] = None
    password_hash: Optional[str] = None  # Include password_hash in the response for admin users    


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
