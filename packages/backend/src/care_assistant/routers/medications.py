import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..db_models import MedicationDB, PatientDB
from ..models.patient import Medication

router = APIRouter(prefix="/medications", tags=["medications"])


class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    end_date: Optional[str] = None
    instructions: Optional[str] = None
    active: Optional[bool] = None


def _to_medication(db: MedicationDB) -> Medication:
    return Medication(
        id=db.id,
        patient_id=db.patient_id,
        name=db.name,
        dosage=db.dosage,
        frequency=db.frequency,
        start_date=db.start_date,
        end_date=db.end_date,
        instructions=db.instructions,
        active=db.active,
    )


@router.post("/", response_model=Medication, status_code=201)
def create_medication(medication: Medication, db: Session = Depends(get_db)):
    """Add a new medication for a patient."""
    if not db.query(PatientDB).filter(PatientDB.id == medication.patient_id).first():
        raise HTTPException(status_code=404, detail="Patient not found")

    db_med = MedicationDB(
        id=str(uuid.uuid4()),
        patient_id=medication.patient_id,
        name=medication.name,
        dosage=medication.dosage,
        frequency=medication.frequency,
        start_date=medication.start_date,
        end_date=medication.end_date,
        instructions=medication.instructions,
        active=medication.active,
    )
    db.add(db_med)
    db.commit()
    db.refresh(db_med)
    return _to_medication(db_med)


@router.get("/{patient_id}", response_model=list[Medication])
def get_patient_medications(
    patient_id: str, active_only: bool = True, db: Session = Depends(get_db)
):
    """Get medications for a patient, optionally filtered to active only."""
    if not db.query(PatientDB).filter(PatientDB.id == patient_id).first():
        raise HTTPException(status_code=404, detail="Patient not found")

    query = db.query(MedicationDB).filter(MedicationDB.patient_id == patient_id)
    if active_only:
        query = query.filter(MedicationDB.active == True)  # noqa: E712
    rows = query.order_by(MedicationDB.name).all()
    return [_to_medication(r) for r in rows]


@router.patch("/{medication_id}", response_model=Medication)
def update_medication(
    medication_id: str, updates: MedicationUpdate, db: Session = Depends(get_db)
):
    """Update medication details."""
    db_med = db.query(MedicationDB).filter(MedicationDB.id == medication_id).first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medication not found")

    patch = updates.model_dump(exclude_unset=True)
    for field, value in patch.items():
        setattr(db_med, field, value)

    db.commit()
    db.refresh(db_med)
    return _to_medication(db_med)


@router.delete("/{medication_id}")
def deactivate_medication(medication_id: str, db: Session = Depends(get_db)):
    """Deactivate a medication (soft delete)."""
    db_med = db.query(MedicationDB).filter(MedicationDB.id == medication_id).first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medication not found")

    db_med.active = False
    db.commit()
    return {"status": "deactivated", "id": medication_id}
