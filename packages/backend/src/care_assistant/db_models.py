import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class UserDB(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20))  # founder | caregiver | patient
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # For patient users: link to their PatientDB record (nullable for other roles)
    patient_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("patients.id"), nullable=True
    )

    # Caregiver → assigned patients (only populated when role == "caregiver")
    assignments: Mapped[list["CaregiverPatientDB"]] = relationship(
        back_populates="caregiver",
        cascade="all, delete-orphan",
        foreign_keys="CaregiverPatientDB.caregiver_id",
    )

    # Founder → employed caregivers (only populated when role == "founder")
    employments: Mapped[list["FounderCaregiverDB"]] = relationship(
        back_populates="founder",
        cascade="all, delete-orphan",
        foreign_keys="FounderCaregiverDB.founder_id",
    )

    # Caregiver → their employer (only populated when role == "caregiver")
    employment: Mapped[Optional["FounderCaregiverDB"]] = relationship(
        back_populates="caregiver",
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="FounderCaregiverDB.caregiver_id",
    )


class PatientDB(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    date_of_birth: Mapped[datetime] = mapped_column(DateTime)
    email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    phone: Mapped[str] = mapped_column(String(50))
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    medical_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    emergency_contacts: Mapped[list["EmergencyContactDB"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    health_checks: Mapped[list["HealthCheckDB"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    medications: Mapped[list["MedicationDB"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    appointments: Mapped[list["AppointmentDB"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    uploads: Mapped[list["UploadDB"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )

    # Caregivers assigned to this patient
    caregiver_assignments: Mapped[list["CaregiverPatientDB"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )


class CaregiverPatientDB(Base):
    """Association table: caregiver (UserDB) ↔ patient (PatientDB)."""

    __tablename__ = "caregiver_patients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    caregiver_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"))
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    caregiver: Mapped["UserDB"] = relationship(
        back_populates="assignments", foreign_keys=[caregiver_id]
    )
    patient: Mapped["PatientDB"] = relationship(back_populates="caregiver_assignments")


class FounderCaregiverDB(Base):
    """Association table: founder (UserDB) employs caregiver (UserDB)."""

    __tablename__ = "founder_caregivers"
    __table_args__ = (
        # A caregiver can only be employed by one founder at a time
        UniqueConstraint("caregiver_id", name="uq_caregiver_employer"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    founder_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    caregiver_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    employed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    job_title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    founder: Mapped["UserDB"] = relationship(
        back_populates="employments", foreign_keys=[founder_id]
    )
    caregiver: Mapped["UserDB"] = relationship(
        back_populates="employment", foreign_keys=[caregiver_id]
    )


class EmergencyContactDB(Base):
    __tablename__ = "emergency_contacts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"))
    name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(50))
    relation: Mapped[str] = mapped_column(String(50))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    patient: Mapped["PatientDB"] = relationship(back_populates="emergency_contacts")


class HealthCheckDB(Base):
    __tablename__ = "health_checks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"))
    blood_pressure_systolic: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    blood_pressure_diastolic: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    heart_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    temperature: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    checked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    patient: Mapped["PatientDB"] = relationship(back_populates="health_checks")


class MedicationDB(Base):
    __tablename__ = "medications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"))
    name: Mapped[str] = mapped_column(String(200))
    dosage: Mapped[str] = mapped_column(String(100))
    frequency: Mapped[str] = mapped_column(String(100))
    start_date: Mapped[datetime] = mapped_column(DateTime)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    patient: Mapped["PatientDB"] = relationship(back_populates="medications")


class AppointmentDB(Base):
    __tablename__ = "appointments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    appointment_type: Mapped[str] = mapped_column(String(100))
    scheduled_at: Mapped[datetime] = mapped_column(DateTime)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    patient: Mapped["PatientDB"] = relationship(back_populates="appointments")


class UploadDB(Base):
    __tablename__ = "uploads"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id"))
    file_type: Mapped[str] = mapped_column(String(50))
    filename: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(Text)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    patient: Mapped["PatientDB"] = relationship(back_populates="uploads")
