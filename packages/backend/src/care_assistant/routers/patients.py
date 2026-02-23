import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..db_models import EmergencyContactDB, PatientDB
from ..models.patient import EmergencyContact, EmergencyContactRelation, Patient

router = APIRouter(prefix="/patients", tags=["patients"])


# ── Serialization ─────────────────────────────────────────────────────────────

def _to_patient(db: PatientDB) -> Patient:
    return Patient(
        id=db.id,
        first_name=db.first_name,
        last_name=db.last_name,
        date_of_birth=db.date_of_birth,
        email=db.email,
        phone=db.phone,
        address=db.address,
        medical_notes=db.medical_notes,
        emergency_contacts=[
            EmergencyContact(
                name=c.name,
                phone=c.phone,
                relation=EmergencyContactRelation(c.relation),
                is_primary=c.is_primary,
            )
            for c in db.emergency_contacts
        ],
        created_at=db.created_at,
        updated_at=db.updated_at,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/", response_model=Patient, status_code=201)
def create_patient(patient: Patient, db: Session = Depends(get_db)):
    """Create a new patient record."""
    patient_id = str(uuid.uuid4())
    db_patient = PatientDB(
        id=patient_id,
        first_name=patient.first_name,
        last_name=patient.last_name,
        date_of_birth=patient.date_of_birth,
        email=patient.email,
        phone=patient.phone,
        address=patient.address,
        medical_notes=patient.medical_notes,
    )
    for contact in patient.emergency_contacts:
        db_patient.emergency_contacts.append(
            EmergencyContactDB(
                id=str(uuid.uuid4()),
                patient_id=patient_id,
                name=contact.name,
                phone=contact.phone,
                relation=contact.relation.value,
                is_primary=contact.is_primary,
            )
        )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return _to_patient(db_patient)


@router.get("/", response_model=list[Patient])
def list_patients(db: Session = Depends(get_db)):
    """List all patients."""
    rows = db.query(PatientDB).order_by(PatientDB.last_name, PatientDB.first_name).all()
    return [_to_patient(p) for p in rows]


@router.get("/{patient_id}", response_model=Patient)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    """Get patient information by ID."""
    db_patient = db.query(PatientDB).filter(PatientDB.id == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return _to_patient(db_patient)


@router.patch("/{patient_id}", response_model=Patient)
def update_patient(patient_id: str, patient: Patient, db: Session = Depends(get_db)):
    """Update an existing patient record."""
    db_patient = db.query(PatientDB).filter(PatientDB.id == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db_patient.first_name = patient.first_name
    db_patient.last_name = patient.last_name
    db_patient.date_of_birth = patient.date_of_birth
    db_patient.email = patient.email
    db_patient.phone = patient.phone
    db_patient.address = patient.address
    db_patient.medical_notes = patient.medical_notes
    db_patient.updated_at = datetime.utcnow()

    # Replace emergency contacts
    for c in list(db_patient.emergency_contacts):
        db.delete(c)
    db.flush()

    for contact in patient.emergency_contacts:
        db_patient.emergency_contacts.append(
            EmergencyContactDB(
                id=str(uuid.uuid4()),
                patient_id=patient_id,
                name=contact.name,
                phone=contact.phone,
                relation=contact.relation.value,
                is_primary=contact.is_primary,
            )
        )

    db.commit()
    db.refresh(db_patient)
    return _to_patient(db_patient)


@router.delete("/{patient_id}", status_code=204)
def delete_patient(patient_id: str, db: Session = Depends(get_db)):
    """Delete a patient and all related records."""
    db_patient = db.query(PatientDB).filter(PatientDB.id == patient_id).first()
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(db_patient)
    db.commit()
