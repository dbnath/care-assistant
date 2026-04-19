from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..db_models import FounderCaregiverDB, UserDB
from ..models.founder import (
    CaregiverEmploymentSummary,
    EmployCaregiverRequest,
    EmploymentResponse,
    FounderProfile,
    FounderSummary,
)

router = APIRouter(prefix="/founders", tags=["founders"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_founder_or_404(founder_id: str, db: Session) -> UserDB:
    user = (
        db.query(UserDB)
        .filter(UserDB.id == founder_id, UserDB.role == "founder")
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Founder not found")
    return user


def _to_profile(founder: UserDB) -> FounderProfile:
    return FounderProfile(
        id=founder.id,
        first_name=founder.first_name,
        last_name=founder.last_name,
        email=founder.email,
        phone=founder.phone,
        is_active=founder.is_active,
        created_at=founder.created_at,
        employed_caregivers=[
            CaregiverEmploymentSummary(
                id=e.caregiver.id,
                first_name=e.caregiver.first_name,
                last_name=e.caregiver.last_name,
                email=e.caregiver.email,
                phone=e.caregiver.phone,
                is_active=e.caregiver.is_active,
                employed_at=e.employed_at,
                job_title=e.job_title,
                employment_notes=e.notes,
            )
            for e in founder.employments
        ],
    )


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[FounderProfile])
def list_founders(db: Session = Depends(get_db)):
    """List all founders with their employed caregivers."""
    founders = (
        db.query(UserDB)
        .filter(UserDB.role == "founder")
        .order_by(UserDB.last_name, UserDB.first_name)
        .all()
    )
    return [_to_profile(f) for f in founders]


@router.get("/{founder_id}", response_model=FounderProfile)
def get_founder(founder_id: str, db: Session = Depends(get_db)):
    """Get a founder's profile and their employed caregivers."""
    return _to_profile(_get_founder_or_404(founder_id, db))


@router.get("/{founder_id}/caregivers", response_model=list[CaregiverEmploymentSummary])
def list_employed_caregivers(founder_id: str, db: Session = Depends(get_db)):
    """List all caregivers currently employed by a founder."""
    founder = _get_founder_or_404(founder_id, db)
    return [
        CaregiverEmploymentSummary(
            id=e.caregiver.id,
            first_name=e.caregiver.first_name,
            last_name=e.caregiver.last_name,
            email=e.caregiver.email,
            phone=e.caregiver.phone,
            is_active=e.caregiver.is_active,
            employed_at=e.employed_at,
            job_title=e.job_title,
            employment_notes=e.notes,
        )
        for e in founder.employments
    ]


@router.post(
    "/{founder_id}/caregivers",
    response_model=EmploymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def employ_caregiver(
    founder_id: str,
    body: EmployCaregiverRequest,
    db: Session = Depends(get_db),
):
    """Employ a caregiver under a founder."""
    _get_founder_or_404(founder_id, db)

    caregiver = (
        db.query(UserDB)
        .filter(UserDB.id == body.caregiver_id, UserDB.role == "caregiver")
        .first()
    )
    if not caregiver:
        raise HTTPException(status_code=404, detail="Caregiver not found")

    # Check if caregiver is already employed (by any founder)
    existing = (
        db.query(FounderCaregiverDB)
        .filter(FounderCaregiverDB.caregiver_id == body.caregiver_id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Caregiver is already employed by a founder",
        )

    employment = FounderCaregiverDB(
        founder_id=founder_id,
        caregiver_id=body.caregiver_id,
        job_title=body.job_title,
        notes=body.notes,
    )
    db.add(employment)
    db.commit()
    db.refresh(employment)

    return EmploymentResponse(
        id=employment.id,
        founder_id=employment.founder_id,
        caregiver_id=employment.caregiver_id,
        employed_at=employment.employed_at,
        job_title=employment.job_title,
        notes=employment.notes,
    )


@router.delete(
    "/{founder_id}/caregivers/{caregiver_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def terminate_employment(
    founder_id: str,
    caregiver_id: str,
    db: Session = Depends(get_db),
):
    """Terminate a caregiver's employment under a founder."""
    _get_founder_or_404(founder_id, db)

    employment = (
        db.query(FounderCaregiverDB)
        .filter(
            FounderCaregiverDB.founder_id == founder_id,
            FounderCaregiverDB.caregiver_id == caregiver_id,
        )
        .first()
    )
    if not employment:
        raise HTTPException(status_code=404, detail="Employment record not found")

    db.delete(employment)
    db.commit()
