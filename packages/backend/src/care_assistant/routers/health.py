import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..db_models import HealthCheckDB, PatientDB
from ..models.patient import HealthCheck

router = APIRouter(prefix="/health", tags=["health"])


def _to_health_check(db: HealthCheckDB) -> HealthCheck:
    return HealthCheck(
        id=db.id,
        patient_id=db.patient_id,
        blood_pressure_systolic=db.blood_pressure_systolic,
        blood_pressure_diastolic=db.blood_pressure_diastolic,
        heart_rate=db.heart_rate,
        temperature=db.temperature,
        notes=db.notes,
        checked_at=db.checked_at,
    )


@router.post("/checks", response_model=HealthCheck, status_code=201)
def create_health_check(health_check: HealthCheck, db: Session = Depends(get_db)):
    """Record a health check for a patient."""
    if not db.query(PatientDB).filter(PatientDB.id == health_check.patient_id).first():
        raise HTTPException(status_code=404, detail="Patient not found")

    db_check = HealthCheckDB(
        id=str(uuid.uuid4()),
        patient_id=health_check.patient_id,
        blood_pressure_systolic=health_check.blood_pressure_systolic,
        blood_pressure_diastolic=health_check.blood_pressure_diastolic,
        heart_rate=health_check.heart_rate,
        temperature=health_check.temperature,
        notes=health_check.notes,
        checked_at=health_check.checked_at,
    )
    db.add(db_check)
    db.commit()
    db.refresh(db_check)
    return _to_health_check(db_check)


@router.get("/checks/{patient_id}", response_model=list[HealthCheck])
def get_patient_health_checks(patient_id: str, db: Session = Depends(get_db)):
    """Get all health checks for a specific patient, newest first."""
    if not db.query(PatientDB).filter(PatientDB.id == patient_id).first():
        raise HTTPException(status_code=404, detail="Patient not found")

    rows = (
        db.query(HealthCheckDB)
        .filter(HealthCheckDB.patient_id == patient_id)
        .order_by(HealthCheckDB.checked_at.desc())
        .all()
    )
    return [_to_health_check(r) for r in rows]
