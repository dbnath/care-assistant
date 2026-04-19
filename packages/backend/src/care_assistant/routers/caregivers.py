from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..db_models import CaregiverPatientDB, PatientDB, UserDB
from ..models.caregiver import (
    AssignPatientRequest,
    AssignmentResponse,
    CaregiverProfile,
    CaregiverSummary,
    PatientSummary,
)
from ..models.founder import FounderSummary

router = APIRouter(prefix="/caregivers", tags=["caregivers"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_caregiver_or_404(caregiver_id: str, db: Session) -> UserDB:
    user = (
        db.query(UserDB)
        .filter(UserDB.id == caregiver_id, UserDB.role == "caregiver")
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Caregiver not found")
    return user


def _to_profile(caregiver: UserDB) -> CaregiverProfile:
    return CaregiverProfile(
        id=caregiver.id,
        first_name=caregiver.first_name,
        last_name=caregiver.last_name,
        email=caregiver.email,
        phone=caregiver.phone,
        is_active=caregiver.is_active,
        created_at=caregiver.created_at,
        assigned_patients=[
            PatientSummary(
                id=a.patient.id,
                first_name=a.patient.first_name,
                last_name=a.patient.last_name,
                email=a.patient.email,
                phone=a.patient.phone,
                assigned_at=a.assigned_at,
                assignment_notes=a.notes,
            )
            for a in caregiver.assignments
        ],
    )


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[CaregiverProfile])
def list_caregivers(db: Session = Depends(get_db)):
    """List all registered caregivers with their assigned patients."""
    caregivers = (
        db.query(UserDB)
        .filter(UserDB.role == "caregiver")
        .order_by(UserDB.last_name, UserDB.first_name)
        .all()
    )
    return [_to_profile(c) for c in caregivers]


@router.get("/{caregiver_id}", response_model=CaregiverProfile)
def get_caregiver(caregiver_id: str, db: Session = Depends(get_db)):
    """Get a caregiver's profile and their assigned patients."""
    return _to_profile(_get_caregiver_or_404(caregiver_id, db))


@router.get("/{caregiver_id}/patients", response_model=list[PatientSummary])
def list_assigned_patients(caregiver_id: str, db: Session = Depends(get_db)):
    """List patients currently assigned to a caregiver."""
    caregiver = _get_caregiver_or_404(caregiver_id, db)
    return [
        PatientSummary(
            id=a.patient.id,
            first_name=a.patient.first_name,
            last_name=a.patient.last_name,
            email=a.patient.email,
            phone=a.patient.phone,
            assigned_at=a.assigned_at,
            assignment_notes=a.notes,
        )
        for a in caregiver.assignments
    ]


@router.post(
    "/{caregiver_id}/patients",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_patient(
    caregiver_id: str,
    body: AssignPatientRequest,
    db: Session = Depends(get_db),
):
    """Assign a patient to a caregiver."""
    caregiver = _get_caregiver_or_404(caregiver_id, db)

    patient = db.query(PatientDB).filter(PatientDB.id == body.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Prevent duplicate assignment
    existing = (
        db.query(CaregiverPatientDB)
        .filter(
            CaregiverPatientDB.caregiver_id == caregiver_id,
            CaregiverPatientDB.patient_id == body.patient_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Patient is already assigned to this caregiver",
        )

    assignment = CaregiverPatientDB(
        caregiver_id=caregiver_id,
        patient_id=body.patient_id,
        notes=body.notes,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return AssignmentResponse(
        id=assignment.id,
        caregiver_id=assignment.caregiver_id,
        patient_id=assignment.patient_id,
        assigned_at=assignment.assigned_at,
        notes=assignment.notes,
    )


@router.delete("/{caregiver_id}/patients/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def unassign_patient(
    caregiver_id: str,
    patient_id: str,
    db: Session = Depends(get_db),
):
    """Remove a patient assignment from a caregiver."""
    _get_caregiver_or_404(caregiver_id, db)

    assignment = (
        db.query(CaregiverPatientDB)
        .filter(
            CaregiverPatientDB.caregiver_id == caregiver_id,
            CaregiverPatientDB.patient_id == patient_id,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(assignment)
    db.commit()


@router.get("/{caregiver_id}/employer", response_model=FounderSummary)
def get_employer(caregiver_id: str, db: Session = Depends(get_db)):
    """Get the founder who employs this caregiver, if any."""
    caregiver = _get_caregiver_or_404(caregiver_id, db)
    if not caregiver.employment:
        raise HTTPException(status_code=404, detail="Caregiver has no employer")
    e = caregiver.employment
    return FounderSummary(
        id=e.founder.id,
        first_name=e.founder.first_name,
        last_name=e.founder.last_name,
        email=e.founder.email,
        phone=e.founder.phone,
        employed_at=e.employed_at,
        job_title=e.job_title,
        employment_notes=e.notes,
    )
