import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..db_models import AppointmentDB, PatientDB
from ..models.patient import Appointment

router = APIRouter(prefix="/appointments", tags=["appointments"])


def _to_appointment(db: AppointmentDB) -> Appointment:
    return Appointment(
        id=db.id,
        patient_id=db.patient_id,
        title=db.title,
        description=db.description,
        appointment_type=db.appointment_type,
        scheduled_at=db.scheduled_at,
        duration_minutes=db.duration_minutes,
        location=db.location,
        completed=db.completed,
        notes=db.notes,
    )


@router.post("/", response_model=Appointment, status_code=201)
def create_appointment(appointment: Appointment, db: Session = Depends(get_db)):
    """Schedule a new appointment."""
    if not db.query(PatientDB).filter(PatientDB.id == appointment.patient_id).first():
        raise HTTPException(status_code=404, detail="Patient not found")

    db_appt = AppointmentDB(
        id=str(uuid.uuid4()),
        patient_id=appointment.patient_id,
        title=appointment.title,
        description=appointment.description,
        appointment_type=appointment.appointment_type,
        scheduled_at=appointment.scheduled_at,
        duration_minutes=appointment.duration_minutes,
        location=appointment.location,
        completed=appointment.completed,
        notes=appointment.notes,
    )
    db.add(db_appt)
    db.commit()
    db.refresh(db_appt)
    return _to_appointment(db_appt)


@router.get("/{patient_id}", response_model=list[Appointment])
def get_patient_appointments(
    patient_id: str,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    """Get appointments for a patient within an optional date range."""
    if not db.query(PatientDB).filter(PatientDB.id == patient_id).first():
        raise HTTPException(status_code=404, detail="Patient not found")

    query = db.query(AppointmentDB).filter(AppointmentDB.patient_id == patient_id)
    if from_date:
        query = query.filter(AppointmentDB.scheduled_at >= from_date)
    if to_date:
        query = query.filter(AppointmentDB.scheduled_at <= to_date)
    rows = query.order_by(AppointmentDB.scheduled_at).all()
    return [_to_appointment(r) for r in rows]


@router.patch("/{appointment_id}/complete", response_model=Appointment)
def complete_appointment(
    appointment_id: str, notes: Optional[str] = None, db: Session = Depends(get_db)
):
    """Mark an appointment as completed."""
    db_appt = db.query(AppointmentDB).filter(AppointmentDB.id == appointment_id).first()
    if not db_appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    db_appt.completed = True
    if notes is not None:
        db_appt.notes = notes
    db.commit()
    db.refresh(db_appt)
    return _to_appointment(db_appt)


@router.delete("/{appointment_id}", status_code=204)
def cancel_appointment(appointment_id: str, db: Session = Depends(get_db)):
    """Cancel (delete) an appointment."""
    db_appt = db.query(AppointmentDB).filter(AppointmentDB.id == appointment_id).first()
    if not db_appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    db.delete(db_appt)
    db.commit()
