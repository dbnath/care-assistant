# AWS Terraform Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the FastAPI backend to AWS Free Tier using EC2 t2.micro + S3 for uploads, managed by flat Terraform, with GitHub Actions for automated deploys.

**Architecture:** EC2 t2.micro runs uvicorn behind nginx with SQLite on EBS. Uploaded files move from local filesystem to S3 (served via pre-signed URLs). Terraform manages all AWS resources. GitHub Actions SSHes in on push to main and restarts the service.

**Tech Stack:** Terraform >= 1.0, AWS Provider ~> 5.0, boto3 >= 1.34, Ubuntu 22.04 LTS (EC2), Python 3.12, nginx, certbot, GitHub Actions (appleboy/ssh-action)

---

## File Map

**New files:**
- `infrastructure/main.tf` — all AWS resources (EC2, EIP, SG, S3, IAM)
- `infrastructure/variables.tf` — input variables
- `infrastructure/outputs.tf` — public IP, S3 bucket name, SSH command
- `infrastructure/userdata.sh` — EC2 bootstrap (installs Python, nginx, clones repo, creates systemd service)
- `infrastructure/terraform.tfvars.example` — template for secrets
- `packages/backend/src/care_assistant/services/s3.py` — S3 operations (upload, download, delete, presign)
- `packages/backend/tests/test_s3_service.py` — unit tests for S3 service
- `packages/backend/tests/test_uploads.py` — router tests with mocked S3
- `.github/workflows/deploy.yml` — CI/CD deploy on push to main

**Modified files:**
- `packages/backend/pyproject.toml` — add boto3 dependency
- `packages/backend/requirements.txt` — add boto3
- `packages/backend/src/care_assistant/config.py` — add `aws_s3_bucket`, `aws_region`
- `packages/backend/src/care_assistant/routers/uploads.py` — replace local filesystem with S3
- `packages/backend/src/care_assistant/main.py` — remove static file mount
- `.gitignore` — add Terraform artifacts

---

## Task 1: Update .gitignore for Terraform

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add Terraform entries to .gitignore**

Append to `.gitignore`:
```
# Terraform
infrastructure/.terraform/
infrastructure/.terraform.lock.hcl
infrastructure/terraform.tfstate
infrastructure/terraform.tfstate.backup
infrastructure/terraform.tfvars
infrastructure/*.tfplan
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add Terraform artifacts to .gitignore"
```

---

## Task 2: Add boto3 to Dependencies

**Files:**
- Modify: `packages/backend/pyproject.toml`
- Modify: `packages/backend/requirements.txt`

- [ ] **Step 1: Add boto3 to pyproject.toml**

In `packages/backend/pyproject.toml`, in the `dependencies` list after `"anthropic>=0.40.0,"`, add:
```toml
    "boto3>=1.34.0",
```

- [ ] **Step 2: Add boto3 to requirements.txt**

In `packages/backend/requirements.txt`, append:
```
boto3>=1.34.0
```

- [ ] **Step 3: Install the dependency**

```bash
cd packages/backend
source .venv/bin/activate
pip install boto3>=1.34.0
```

Expected: boto3 installs successfully.

- [ ] **Step 4: Run existing tests to confirm nothing broke**

```bash
cd packages/backend
source .venv/bin/activate
pytest tests/test_patients.py tests/test_main.py -v
```

Expected: All existing tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/backend/pyproject.toml packages/backend/requirements.txt
git commit -m "feat: add boto3 dependency for S3 uploads"
```

---

## Task 3: Add S3 Config Settings

**Files:**
- Modify: `packages/backend/src/care_assistant/config.py`

- [ ] **Step 1: Write the failing test**

Create `packages/backend/tests/test_config.py`:
```python
def test_config_has_s3_bucket_setting():
    from care_assistant.config import settings
    assert hasattr(settings, "aws_s3_bucket")
    assert settings.aws_s3_bucket == ""  # empty string default


def test_config_has_aws_region_setting():
    from care_assistant.config import settings
    assert hasattr(settings, "aws_region")
    assert settings.aws_region == "us-east-1"
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd packages/backend
source .venv/bin/activate
pytest tests/test_config.py -v
```

Expected: FAIL — `AttributeError: 'Settings' object has no attribute 'aws_s3_bucket'`

- [ ] **Step 3: Add the settings fields**

In `packages/backend/src/care_assistant/config.py`, add after the `allowed_upload_extensions` field inside the `Settings` class:
```python
    # AWS settings
    aws_s3_bucket: str = ""
    aws_region: str = "us-east-1"
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/test_config.py -v
```

Expected: Both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/backend/src/care_assistant/config.py packages/backend/tests/test_config.py
git commit -m "feat: add AWS S3 config settings"
```

---

## Task 4: Create S3 Service Module

**Files:**
- Create: `packages/backend/src/care_assistant/services/s3.py`
- Create: `packages/backend/tests/test_s3_service.py`

- [ ] **Step 1: Write the failing tests**

Create `packages/backend/tests/test_s3_service.py`:
```python
from unittest.mock import MagicMock, patch


def test_upload_to_s3_calls_put_object():
    from care_assistant.services.s3 import upload_to_s3

    mock_client = MagicMock()
    with patch("care_assistant.services.s3.boto3") as mock_boto3:
        mock_boto3.client.return_value = mock_client
        upload_to_s3(b"file-content", "my-bucket", "prescriptions/p1/f1.pdf")
        mock_client.put_object.assert_called_once_with(
            Body=b"file-content", Bucket="my-bucket", Key="prescriptions/p1/f1.pdf"
        )


def test_download_from_s3_returns_bytes():
    from care_assistant.services.s3 import download_from_s3

    mock_client = MagicMock()
    mock_client.get_object.return_value = {"Body": MagicMock(read=lambda: b"file-bytes")}
    with patch("care_assistant.services.s3.boto3") as mock_boto3:
        mock_boto3.client.return_value = mock_client
        result = download_from_s3("my-bucket", "prescriptions/p1/f1.pdf")
        assert result == b"file-bytes"
        mock_client.get_object.assert_called_once_with(
            Bucket="my-bucket", Key="prescriptions/p1/f1.pdf"
        )


def test_delete_from_s3_calls_delete_object():
    from care_assistant.services.s3 import delete_from_s3

    mock_client = MagicMock()
    with patch("care_assistant.services.s3.boto3") as mock_boto3:
        mock_boto3.client.return_value = mock_client
        delete_from_s3("my-bucket", "prescriptions/p1/f1.pdf")
        mock_client.delete_object.assert_called_once_with(
            Bucket="my-bucket", Key="prescriptions/p1/f1.pdf"
        )


def test_generate_presigned_url_returns_url():
    from care_assistant.services.s3 import generate_presigned_url

    mock_client = MagicMock()
    mock_client.generate_presigned_url.return_value = "https://s3.example.com/key?sig=abc"
    with patch("care_assistant.services.s3.boto3") as mock_boto3:
        mock_boto3.client.return_value = mock_client
        url = generate_presigned_url("my-bucket", "prescriptions/p1/f1.pdf")
        assert url == "https://s3.example.com/key?sig=abc"
        mock_client.generate_presigned_url.assert_called_once_with(
            "get_object",
            Params={"Bucket": "my-bucket", "Key": "prescriptions/p1/f1.pdf"},
            ExpiresIn=3600,
        )


def test_generate_presigned_url_custom_expiry():
    from care_assistant.services.s3 import generate_presigned_url

    mock_client = MagicMock()
    mock_client.generate_presigned_url.return_value = "https://s3.example.com/key?sig=xyz"
    with patch("care_assistant.services.s3.boto3") as mock_boto3:
        mock_boto3.client.return_value = mock_client
        generate_presigned_url("my-bucket", "prescriptions/p1/f1.pdf", expiry_seconds=7200)
        mock_client.generate_presigned_url.assert_called_once_with(
            "get_object",
            Params={"Bucket": "my-bucket", "Key": "prescriptions/p1/f1.pdf"},
            ExpiresIn=7200,
        )
```

- [ ] **Step 2: Run to verify all fail**

```bash
cd packages/backend
source .venv/bin/activate
pytest tests/test_s3_service.py -v
```

Expected: All 5 tests FAIL — `ModuleNotFoundError: No module named 'care_assistant.services.s3'`

- [ ] **Step 3: Implement the S3 service**

Create `packages/backend/src/care_assistant/services/s3.py`:
```python
import boto3


def upload_to_s3(file_bytes: bytes, bucket: str, key: str) -> None:
    """Upload bytes to S3 at the given key."""
    boto3.client("s3").put_object(Body=file_bytes, Bucket=bucket, Key=key)


def download_from_s3(bucket: str, key: str) -> bytes:
    """Download an object from S3 and return its bytes."""
    response = boto3.client("s3").get_object(Bucket=bucket, Key=key)
    return response["Body"].read()


def delete_from_s3(bucket: str, key: str) -> None:
    """Delete an object from S3."""
    boto3.client("s3").delete_object(Bucket=bucket, Key=key)


def generate_presigned_url(bucket: str, key: str, expiry_seconds: int = 3600) -> str:
    """Generate a time-limited pre-signed GET URL for an S3 object."""
    return boto3.client("s3").generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=expiry_seconds,
    )
```

- [ ] **Step 4: Run tests to verify all pass**

```bash
pytest tests/test_s3_service.py -v
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/backend/src/care_assistant/services/s3.py packages/backend/tests/test_s3_service.py
git commit -m "feat: add S3 service module with upload/download/delete/presign"
```

---

## Task 5: Rewrite Uploads Router for S3

**Files:**
- Modify: `packages/backend/src/care_assistant/routers/uploads.py`
- Create: `packages/backend/tests/test_uploads.py`

- [ ] **Step 1: Write the failing tests**

Create `packages/backend/tests/test_uploads.py`:
```python
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch

from care_assistant.main import app


async def _create_patient(client: AsyncClient) -> str:
    resp = await client.post(
        "/api/v1/patients/",
        json={
            "first_name": "Jane",
            "last_name": "Doe",
            "date_of_birth": "1950-01-15T00:00:00",
            "phone": "+1234567890",
        },
    )
    assert resp.status_code == 200
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_upload_file_returns_presigned_url():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        patient_id = await _create_patient(client)

        with patch("care_assistant.routers.uploads.upload_to_s3"), \
             patch(
                 "care_assistant.routers.uploads.generate_presigned_url",
                 return_value="https://s3.example.com/presigned",
             ):
            resp = await client.post(
                "/api/v1/uploads/",
                data={"patient_id": patient_id, "file_type": "prescription"},
                files={"file": ("report.pdf", b"%PDF-1.4 content", "application/pdf")},
            )

        assert resp.status_code == 201
        data = resp.json()
        assert data["patient_id"] == patient_id
        assert data["file_type"] == "prescription"
        assert data["file_path"] == "https://s3.example.com/presigned"
        assert data["filename"] == "report.pdf"


@pytest.mark.asyncio
async def test_upload_stores_s3_key_not_local_path():
    """file_path stored in DB must be an S3 key (no leading slash, no 'uploads/' prefix)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        patient_id = await _create_patient(client)

        captured_key = {}

        def mock_upload(file_bytes, bucket, key):
            captured_key["key"] = key

        with patch("care_assistant.routers.uploads.upload_to_s3", side_effect=mock_upload), \
             patch("care_assistant.routers.uploads.generate_presigned_url", return_value="https://s3.example.com/x"):
            await client.post(
                "/api/v1/uploads/",
                data={"patient_id": patient_id, "file_type": "prescription"},
                files={"file": ("rx.pdf", b"%PDF content", "application/pdf")},
            )

        key = captured_key["key"]
        assert key.startswith("prescriptions/")
        assert patient_id in key
        assert key.endswith(".pdf")
        assert not key.startswith("/")
        assert "uploads/" not in key


@pytest.mark.asyncio
async def test_upload_rejects_invalid_file_type():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        patient_id = await _create_patient(client)
        resp = await client.post(
            "/api/v1/uploads/",
            data={"patient_id": patient_id, "file_type": "prescription"},
            files={"file": ("virus.exe", b"MZ content", "application/octet-stream")},
        )
        assert resp.status_code == 400
        assert "not allowed" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_upload_rejects_bad_file_type_field():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        patient_id = await _create_patient(client)
        resp = await client.post(
            "/api/v1/uploads/",
            data={"patient_id": patient_id, "file_type": "invoice"},
            files={"file": ("f.pdf", b"%PDF content", "application/pdf")},
        )
        assert resp.status_code == 400


@pytest.mark.asyncio
async def test_list_uploads_returns_presigned_urls():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        patient_id = await _create_patient(client)

        with patch("care_assistant.routers.uploads.upload_to_s3"), \
             patch("care_assistant.routers.uploads.generate_presigned_url", return_value="https://s3.example.com/file"):
            await client.post(
                "/api/v1/uploads/",
                data={"patient_id": patient_id, "file_type": "report"},
                files={"file": ("lab.pdf", b"%PDF content", "application/pdf")},
            )

        with patch("care_assistant.routers.uploads.generate_presigned_url", return_value="https://s3.example.com/listed"):
            resp = await client.get(f"/api/v1/uploads/{patient_id}")

        assert resp.status_code == 200
        uploads = resp.json()
        assert len(uploads) == 1
        assert uploads[0]["file_path"] == "https://s3.example.com/listed"


@pytest.mark.asyncio
async def test_delete_upload_calls_s3_delete():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        patient_id = await _create_patient(client)

        with patch("care_assistant.routers.uploads.upload_to_s3"), \
             patch("care_assistant.routers.uploads.generate_presigned_url", return_value="https://s3.example.com/f"):
            upload_resp = await client.post(
                "/api/v1/uploads/",
                data={"patient_id": patient_id, "file_type": "prescription"},
                files={"file": ("rx.pdf", b"%PDF content", "application/pdf")},
            )
        upload_id = upload_resp.json()["id"]

        with patch("care_assistant.routers.uploads.delete_from_s3") as mock_delete:
            del_resp = await client.delete(f"/api/v1/uploads/{upload_id}")
            assert del_resp.status_code == 204
            mock_delete.assert_called_once()


@pytest.mark.asyncio
async def test_upload_patient_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/uploads/",
            data={"patient_id": "nonexistent-id", "file_type": "prescription"},
            files={"file": ("f.pdf", b"%PDF content", "application/pdf")},
        )
        assert resp.status_code == 404
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd packages/backend
source .venv/bin/activate
pytest tests/test_uploads.py -v
```

Expected: Tests FAIL — the current router uses local filesystem, not S3.

- [ ] **Step 3: Rewrite the uploads router**

Replace the entire content of `packages/backend/src/care_assistant/routers/uploads.py` with:
```python
import base64
import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..db_models import PatientDB, UploadDB
from ..services.s3 import delete_from_s3, download_from_s3, generate_presigned_url, upload_to_s3

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

_MEDIA_TYPES = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
}


class UploadResponse(BaseModel):
    id: str
    patient_id: str
    file_type: str
    filename: str
    file_path: str  # pre-signed S3 URL (1-hour expiry)
    uploaded_at: datetime


class SummarizeResponse(BaseModel):
    summary: str


def _to_upload_response(db: UploadDB) -> UploadResponse:
    """Build UploadResponse with a fresh pre-signed URL for the S3 key in db.file_path."""
    url = generate_presigned_url(settings.aws_s3_bucket, db.file_path)
    return UploadResponse(
        id=db.id,
        patient_id=db.patient_id,
        file_type=db.file_type,
        filename=db.filename,
        file_path=url,
        uploaded_at=db.uploaded_at,
    )


@router.post("/", response_model=UploadResponse, status_code=201)
async def upload_file(
    patient_id: str = Form(...),
    file_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload a prescription or medical report for a patient to S3."""
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

    file_id = str(uuid.uuid4())
    new_filename = f"{file_id}{file_extension}"
    s3_key = f"{file_type}s/{patient_id}/{new_filename}"

    upload_to_s3(contents, settings.aws_s3_bucket, s3_key)

    db_upload = UploadDB(
        id=file_id,
        patient_id=patient_id,
        file_type=file_type,
        filename=file.filename or new_filename,
        file_path=s3_key,  # store S3 key; pre-signed URL generated on read
        uploaded_at=datetime.utcnow(),
    )
    db.add(db_upload)
    db.commit()
    db.refresh(db_upload)
    return _to_upload_response(db_upload)


@router.get("/{patient_id}", response_model=list[UploadResponse])
def list_patient_uploads(patient_id: str, db: Session = Depends(get_db)):
    """List all uploads for a patient, each with a fresh pre-signed S3 URL."""
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
    """Delete an upload from S3 and remove its database record."""
    db_upload = db.query(UploadDB).filter(UploadDB.id == upload_id).first()
    if not db_upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    delete_from_s3(settings.aws_s3_bucket, db_upload.file_path)

    db.delete(db_upload)
    db.commit()


@router.post("/{upload_id}/summarize", response_model=SummarizeResponse)
def summarize_upload(upload_id: str, db: Session = Depends(get_db)):
    """Summarize the content of an uploaded document using Claude."""
    db_upload = db.query(UploadDB).filter(UploadDB.id == upload_id).first()
    if not db_upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    ext = os.path.splitext(db_upload.file_path)[1].lower()
    media_type = _MEDIA_TYPES.get(ext)
    if not media_type:
        raise HTTPException(status_code=400, detail="Unsupported file type for summarization")

    file_bytes = download_from_s3(settings.aws_s3_bucket, db_upload.file_path)
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
    #         messages=[{"role": "user", "content": [content_block, {"type": "text", "text": prompt}]}],
    #     )
    #     summary = message.content[0].text if message.content else "No summary available."
    # except Exception as exc:
    #     raise HTTPException(status_code=502, detail=f"Summarization failed: {exc}") from exc

    return SummarizeResponse(summary=summary)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_uploads.py -v
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Run full test suite**

```bash
pytest -v
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/backend/src/care_assistant/routers/uploads.py packages/backend/tests/test_uploads.py
git commit -m "feat: migrate file uploads from local filesystem to S3"
```

---

## Task 6: Remove Static File Mount

**Files:**
- Modify: `packages/backend/src/care_assistant/main.py`

- [ ] **Step 1: Remove the static files mount**

In `packages/backend/src/care_assistant/main.py`, remove the line:
```python
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

Also remove the unused import `from fastapi.staticfiles import StaticFiles` if it is no longer used elsewhere in the file.

- [ ] **Step 2: Run full test suite**

```bash
cd packages/backend
source .venv/bin/activate
pytest -v
```

Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/backend/src/care_assistant/main.py
git commit -m "feat: remove local static file serving (files now served from S3)"
```

---

## Task 7: Create Terraform Variables and Outputs

**Files:**
- Create: `infrastructure/variables.tf`
- Create: `infrastructure/outputs.tf`

- [ ] **Step 1: Create the infrastructure directory and variables.tf**

```bash
mkdir -p infrastructure
```

Create `infrastructure/variables.tf`:
```hcl
variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "s3_bucket_name" {
  description = "Globally unique name for the S3 uploads bucket"
  type        = string
}

variable "key_name" {
  description = "Name for the EC2 key pair resource in AWS"
  type        = string
}

variable "public_key_path" {
  description = "Local filesystem path to the SSH public key to register with AWS"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "github_repo" {
  description = "HTTPS GitHub URL to clone onto the EC2 instance (e.g. https://github.com/org/care-assistant.git)"
  type        = string
}
```

- [ ] **Step 2: Create outputs.tf**

Create `infrastructure/outputs.tf`:
```hcl
output "public_ip" {
  description = "Elastic IP of the EC2 instance — set this as the EC2_HOST GitHub Secret"
  value       = aws_eip.app.public_ip
}

output "s3_bucket_name" {
  description = "S3 bucket name — add as AWS_S3_BUCKET in the .env on the instance"
  value       = aws_s3_bucket.uploads.bucket
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh ubuntu@${aws_eip.app.public_ip}"
}

output "api_url" {
  description = "API base URL once nginx and SSL are configured"
  value       = "https://${aws_eip.app.public_ip}.nip.io/api/v1"
}
```

- [ ] **Step 3: Commit**

```bash
git add infrastructure/variables.tf infrastructure/outputs.tf
git commit -m "feat(infra): add Terraform variables and outputs"
```

---

## Task 8: Create Terraform Main Configuration

**Files:**
- Create: `infrastructure/main.tf`

- [ ] **Step 1: Create main.tf**

Create `infrastructure/main.tf`:
```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# --- AMI: Ubuntu 22.04 LTS ---
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# --- SSH Key Pair ---
resource "aws_key_pair" "deployer" {
  key_name   = var.key_name
  public_key = file(var.public_key_path)
}

# --- Security Group ---
resource "aws_security_group" "care_assistant" {
  name        = "care-assistant-sg"
  description = "Allow SSH, HTTP, HTTPS inbound; all outbound"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "care-assistant"
  }
}

# --- IAM Role for S3 Access ---
resource "aws_iam_role" "ec2_s3_role" {
  name = "care-assistant-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })

  tags = {
    Name = "care-assistant"
  }
}

resource "aws_iam_role_policy" "s3_access" {
  name = "care-assistant-s3-policy"
  role = aws_iam_role.ec2_s3_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
      ]
      Resource = [
        aws_s3_bucket.uploads.arn,
        "${aws_s3_bucket.uploads.arn}/*",
      ]
    }]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "care-assistant-instance-profile"
  role = aws_iam_role.ec2_s3_role.name
}

# --- S3 Bucket ---
resource "aws_s3_bucket" "uploads" {
  bucket = var.s3_bucket_name

  tags = {
    Name = "care-assistant-uploads"
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- EC2 Instance ---
resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.deployer.key_name
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  vpc_security_group_ids = [aws_security_group.care_assistant.id]

  user_data = templatefile("${path.module}/userdata.sh", {
    github_repo    = var.github_repo
    s3_bucket_name = var.s3_bucket_name
    aws_region     = var.aws_region
  })

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  tags = {
    Name = "care-assistant"
  }
}

# --- Elastic IP ---
resource "aws_eip" "app" {
  domain = "vpc"

  tags = {
    Name = "care-assistant"
  }
}

resource "aws_eip_association" "app" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.app.id
}
```

- [ ] **Step 2: Commit**

```bash
git add infrastructure/main.tf
git commit -m "feat(infra): add Terraform main configuration (EC2, S3, IAM, EIP)"
```

---

## Task 9: Create EC2 Bootstrap Script

**Files:**
- Create: `infrastructure/userdata.sh`

- [ ] **Step 1: Create userdata.sh**

Create `infrastructure/userdata.sh`:
```bash
#!/bin/bash
set -euo pipefail

# Update system
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# Install system packages
apt-get install -y \
  software-properties-common \
  git \
  nginx \
  certbot \
  python3-certbot-nginx

# Install Python 3.12 from deadsnakes PPA
add-apt-repository -y ppa:deadsnakes/ppa
apt-get update -y
apt-get install -y python3.12 python3.12-venv python3.12-distutils

# Clone repository
git clone ${github_repo} /opt/care-assistant
chown -R ubuntu:ubuntu /opt/care-assistant

# Setup Python environment
cd /opt/care-assistant
python3.12 -m venv packages/backend/.venv
source packages/backend/.venv/bin/activate
pip install --quiet -r packages/backend/requirements.txt
pip install --quiet -e packages/backend/

# Write environment config (IAM role provides AWS credentials — no keys needed)
cat > /opt/care-assistant/packages/backend/.env <<ENVEOF
DEBUG=False
AWS_S3_BUCKET=${s3_bucket_name}
AWS_REGION=${aws_region}
ENVEOF

chown ubuntu:ubuntu /opt/care-assistant/packages/backend/.env

# Create systemd service
cat > /etc/systemd/system/care-assistant.service <<'SVCEOF'
[Unit]
Description=Care Assistant FastAPI Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/care-assistant/packages/backend
ExecStart=/opt/care-assistant/packages/backend/.venv/bin/uvicorn src.care_assistant.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable care-assistant
systemctl start care-assistant

# Configure nginx reverse proxy
cat > /etc/nginx/sites-available/care-assistant <<'NGINXEOF'
server {
    listen 80;
    server_name _;
    client_max_body_size 15M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/care-assistant /etc/nginx/sites-enabled/care-assistant
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
```

- [ ] **Step 2: Verify the template variables match main.tf**

Confirm `${github_repo}`, `${s3_bucket_name}`, and `${aws_region}` in `userdata.sh` match the keys in the `templatefile()` call in `main.tf`:
```hcl
user_data = templatefile("${path.module}/userdata.sh", {
  github_repo    = var.github_repo
  s3_bucket_name = var.s3_bucket_name
  aws_region     = var.aws_region
})
```
All three match. Proceed.

- [ ] **Step 3: Commit**

```bash
git add infrastructure/userdata.sh
git commit -m "feat(infra): add EC2 bootstrap script (userdata.sh)"
```

---

## Task 10: Create terraform.tfvars Example and Run Validate

**Files:**
- Create: `infrastructure/terraform.tfvars.example`

- [ ] **Step 1: Create the example vars file**

Create `infrastructure/terraform.tfvars.example`:
```hcl
# Copy this file to terraform.tfvars and fill in your values.
# terraform.tfvars is gitignored — never commit it.

aws_region     = "us-east-1"
instance_type  = "t2.micro"

# Must be globally unique across all AWS accounts
s3_bucket_name = "care-assistant-uploads-YOURNAME"

# Name for the key pair in the AWS console
key_name = "care-assistant-key"

# Path to your local SSH public key (the private key is stored as EC2_SSH_KEY GitHub Secret)
public_key_path = "~/.ssh/id_rsa.pub"

# HTTPS URL of your GitHub repo
github_repo = "https://github.com/YOUR_ORG/care-assistant.git"
```

- [ ] **Step 2: Install Terraform (if not installed)**

```bash
terraform version
```

If not found, install via: https://developer.hashicorp.com/terraform/install
Expected after install: `Terraform v1.x.x`

- [ ] **Step 3: Run terraform init and validate**

```bash
cd infrastructure
terraform init
terraform validate
```

Expected:
```
Initializing the backend...
Initializing provider plugins...
- Finding hashicorp/aws versions matching "~> 5.0"...
- Installing hashicorp/aws v5.x.x...

Terraform has been successfully initialized!

Success! The configuration is valid.
```

- [ ] **Step 4: Run terraform fmt to check formatting**

```bash
terraform fmt -check
```

If it reports files to reformat, run `terraform fmt` to fix them.

- [ ] **Step 5: Commit**

```bash
cd ..
git add infrastructure/terraform.tfvars.example
git commit -m "feat(infra): add terraform.tfvars.example and validate config"
```

---

## Task 11: Create GitHub Actions Deploy Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create the workflows directory and deploy.yml**

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to EC2

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /opt/care-assistant
            git pull origin main
            source packages/backend/.venv/bin/activate
            pip install --quiet -r packages/backend/requirements.txt
            pip install --quiet -e packages/backend/
            sudo systemctl restart care-assistant
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add GitHub Actions deploy workflow for EC2"
```

---

## Post-Deployment Steps (Manual, One-Time)

These steps run after `terraform apply` succeeds. They are not automated.

**Step 1: Apply infrastructure**
```bash
cd infrastructure
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your real values
terraform apply
```

**Step 2: Note the outputs**
```bash
terraform output
# public_ip = "x.x.x.x"
# ssh_command = "ssh ubuntu@x.x.x.x"
# api_url = "https://x.x.x.x.nip.io/api/v1"
```

**Step 3: Set GitHub Secrets**

In your GitHub repo → Settings → Secrets → Actions, add:
| Secret | Value |
|---|---|
| `EC2_HOST` | Value of `terraform output public_ip` |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Contents of your SSH private key (e.g. `cat ~/.ssh/id_rsa`) |

**Step 4: Wait for instance bootstrap (~3 minutes)**
```bash
# Check bootstrap log
ssh ubuntu@<public_ip> 'sudo journalctl -u care-assistant --no-pager -n 30'
```
Expected: `Application startup complete.`

**Step 5: Get SSL certificate (one-time)**
```bash
ssh ubuntu@<public_ip> \
  'sudo certbot --nginx -d <public_ip>.nip.io --non-interactive --agree-tos -m your@email.com'
```
Replace `<public_ip>` with the actual IP from `terraform output public_ip`.

**Step 6: Verify the API is live**
```bash
curl https://<public_ip>.nip.io/health
# {"status":"healthy"}
```
