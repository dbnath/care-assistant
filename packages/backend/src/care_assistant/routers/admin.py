from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..db_models import UserDB
from ..models.user import UserResponse, UserRole
from .auth import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_founder(current_user: UserDB = Depends(get_current_user)) -> UserDB:
    """Dependency that restricts access to founder-role users only."""
    if UserRole(current_user.role) != UserRole.FOUNDER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to founders.",
        )
    return current_user


def _to_user_response(user: UserDB) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        role=UserRole(user.role),
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        is_active=user.is_active,
        created_at=user.created_at,
        patient_id=user.patient_id,
        password_hash=user.password_hash
    )


@router.get("/users", response_model=list[UserResponse])
def list_all_users(
    db: Session = Depends(get_db),
) -> list[UserResponse]:
    """Return all registered users. Restricted to founders."""
    users = db.query(UserDB).order_by(UserDB.created_at).all()
    return [_to_user_response(u) for u in users]
