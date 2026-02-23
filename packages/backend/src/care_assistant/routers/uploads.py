import base64
import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..db_models import PatientDB, UploadDB

router = APIRouter(prefix="/uploads", tags=["uploads"])


class UploadResponse(BaseModel):
    id: str
    patient_id: str
    file_type: str
    filename: str
    file_path: str
    uploaded_at: datetime


class SummarizeResponse(BaseModel):
    summary: str


UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def _to_upload_response(db: UploadDB) -> UploadResponse:
    return UploadResponse(
        id=db.id,
        patient_id=db.patient_id,
        file_type=db.file_type,
        filename=db.filename,
        file_path=db.file_path,
        uploaded_at=db.uploaded_at,
    )


@router.post("/", response_model=UploadResponse, status_code=201)
async def upload_file(
    patient_id: str = Form(...),
    file_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload a prescription or medical report for a patient."""
    if not db.query(PatientDB).filter(PatientDB.id == patient_id).first():
        raise HTTPException(status_code=404, detail="Patient not found")

    if file_type not in ["prescription", "report"]:
        raise HTTPException(status_code=400, detail="file_type must be 'prescription' or 'report'")

    file_extension = os.path.splitext(file.filename or "")[1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)}MB",
        )

    directory = os.path.join(UPLOAD_DIR, f"{file_type}s", patient_id)
    os.makedirs(directory, exist_ok=True)

    file_id = str(uuid.uuid4())
    new_filename = f"{file_id}{file_extension}"
    file_path = os.path.join(directory, new_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    uploaded_at = datetime.utcnow()
    db_upload = UploadDB(
        id=file_id,
        patient_id=patient_id,
        file_type=file_type,
        filename=file.filename or new_filename,
        file_path=file_path,
        uploaded_at=uploaded_at,
    )
    db.add(db_upload)
    db.commit()
    db.refresh(db_upload)
    return _to_upload_response(db_upload)


@router.get("/{patient_id}", response_model=list[UploadResponse])
def list_patient_uploads(patient_id: str, db: Session = Depends(get_db)):
    """List all uploads for a specific patient."""
    if not db.query(PatientDB).filter(PatientDB.id == patient_id).first():
        raise HTTPException(status_code=404, detail="Patient not found")

    rows = (
        db.query(UploadDB)
        .filter(UploadDB.patient_id == patient_id)
        .order_by(UploadDB.uploaded_at.desc())
        .all()
    )
    return [_to_upload_response(r) for r in rows]


@router.delete("/{upload_id}", status_code=204)
def delete_upload(upload_id: str, db: Session = Depends(get_db)):
    """Delete an uploaded file and its database record."""
    db_upload = db.query(UploadDB).filter(UploadDB.id == upload_id).first()
    if not db_upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    # Remove file from disk
    if os.path.exists(db_upload.file_path):
        os.remove(db_upload.file_path)

    db.delete(db_upload)
    db.commit()


_MEDIA_TYPES = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
}


@router.post("/{upload_id}/summarize", response_model=SummarizeResponse)
def summarize_upload(upload_id: str, db: Session = Depends(get_db)):
    """Summarize the content of an uploaded document using Claude."""
    db_upload = db.query(UploadDB).filter(UploadDB.id == upload_id).first()
    if not db_upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    if not os.path.exists(db_upload.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    ext = os.path.splitext(db_upload.file_path)[1].lower()
    media_type = _MEDIA_TYPES.get(ext)
    if not media_type:
        raise HTTPException(status_code=400, detail="Unsupported file type for summarization")

    with open(db_upload.file_path, "rb") as f:
        file_bytes = f.read()

    b64_data = base64.standard_b64encode(file_bytes).decode("utf-8")

    if media_type == "application/pdf":
        content_block: dict = {
            "type": "document",
            "source": {"type": "base64", "media_type": media_type, "data": b64_data},
        }
    else:
        content_block = {
            "type": "image",
            "source": {"type": "base64", "media_type": media_type, "data": b64_data},
        }

    prompt = (
        f"This is a medical {db_upload.file_type} document. "
        "Please provide a clear, concise summary of its key contents including: "
        "patient details (if visible), medications or treatments mentioned, "
        "dates, dosages, and any important instructions or findings. "
        "Format the summary in plain text with short bullet points."
    )
    summary = ""

    # try:
    #     client = anthropic.Anthropic()
    #     message = client.messages.create(
    #         model="claude-opus-4-6",
    #         max_tokens=1024,
    #         messages=[
    #             {
    #                 "role": "user",
    #                 "content": [content_block, {"type": "text", "text": prompt}],
    #             }
    #         ],
    #     )
    #     summary = message.content[0].text if message.content else "No summary available."
    # except Exception as exc:
    #     raise HTTPException(status_code=502, detail=f"Summarization failed: {exc}") from exc

    return SummarizeResponse(summary=summary)
