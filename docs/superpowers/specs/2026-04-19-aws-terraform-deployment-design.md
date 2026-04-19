# AWS Terraform Deployment Design

**Date:** 2026-04-19
**Status:** Approved
**Scope:** Deploy the FastAPI backend to AWS using flat Terraform, staying within Free Tier

---

## Overview

Deploy the care-assistant FastAPI backend to a single AWS environment using:
- EC2 t2.micro (Free Tier) running uvicorn behind nginx
- S3 for file uploads (replacing local filesystem)
- SQLite on EBS (no RDS needed)
- Let's Encrypt SSL via nip.io free subdomain
- GitHub Actions for automated deploys on push to `main`

All infrastructure is managed via flat Terraform in a new `infrastructure/` directory at the monorepo root.

---

## Infrastructure

### Terraform File Structure

```
infrastructure/
├── main.tf                  # All AWS resources
├── variables.tf             # region, instance_type, bucket name, key name
├── outputs.tf               # public_ip, s3_bucket_name
├── userdata.sh              # EC2 bootstrap script (runs once on first boot)
└── terraform.tfvars.example # Template — copy to terraform.tfvars, fill in values
```

`terraform.tfvars` is gitignored. `terraform.tfvars.example` is committed as a reference.

### AWS Resources

| Resource | Type | Purpose | Free Tier |
|---|---|---|---|
| EC2 instance | `aws_instance` t2.micro | Runs FastAPI via uvicorn | 750 hrs/month, 12 months |
| Elastic IP | `aws_eip` | Static public IP | Free when attached to running instance |
| Security Group | `aws_security_group` | Allow ports 22, 80, 443 inbound | Free |
| S3 Bucket | `aws_s3_bucket` | Store uploaded files | 5GB + 20K GET / 2K PUT free forever |
| IAM Role + Instance Profile | `aws_iam_role` | Grant EC2 permission to read/write S3 | Free |
| Key Pair | `aws_key_pair` | SSH access for GitHub Actions | Free |

**Default VPC is used** — no custom networking, no NAT gateway, no cost.

### Variables

| Variable | Default | Description |
|---|---|---|
| `aws_region` | `us-east-1` | AWS region |
| `instance_type` | `t2.micro` | EC2 instance type |
| `s3_bucket_name` | — | Globally unique S3 bucket name (required) |
| `key_name` | — | Name for the EC2 key pair (required) |
| `public_key_path` | `~/.ssh/id_rsa.pub` | Path to SSH public key |
| `github_repo` | — | GitHub repo URL for git clone in userdata |

### Outputs

| Output | Description |
|---|---|
| `public_ip` | Elastic IP — use as `EC2_HOST` GitHub Secret and in nip.io domain |
| `s3_bucket_name` | S3 bucket name — add to `.env` on instance |

---

## EC2 Bootstrap (userdata.sh)

Runs once automatically when the instance first boots. Sets up the full server:

1. System update and install: Python 3.12, pip, git, nginx, certbot, python3-certbot-nginx
2. Clone repo from GitHub to `/opt/care-assistant`
3. Create Python venv at `/opt/care-assistant/packages/backend/.venv`
4. Install backend dependencies: `pip install -r requirements.txt && pip install -e .`
5. Write `/opt/care-assistant/packages/backend/.env` from Terraform template variables
6. Create systemd service `care-assistant.service`:
   - `ExecStart`: uvicorn on `0.0.0.0:8000`
   - `WorkingDirectory`: `/opt/care-assistant/packages/backend`
   - `Restart=always`, `WantedBy=multi-user.target`
7. Enable and start the service
8. Configure nginx reverse proxy: HTTP port 80 → `localhost:8000`
9. Run certbot: obtain Let's Encrypt cert for `<elastic-ip>.nip.io`, auto-configure HTTPS port 443

**Note:** The EC2 IAM instance profile provides AWS credentials automatically — no access keys in `.env`.

---

## App Changes Required

### 1. Add boto3 dependency

`packages/backend/pyproject.toml`:
```toml
dependencies = [
    ...
    "boto3>=1.34.0",
]
```

### 2. New config settings

`packages/backend/src/care_assistant/config.py` — add to `Settings`:
```python
aws_s3_bucket: str = ""
aws_region: str = "us-east-1"
```

### 3. Rewrite uploads router to use S3

`packages/backend/src/care_assistant/routers/uploads.py`:
- **Upload**: Replace `open(path, "wb")` with `s3.upload_fileobj(file, bucket, key)`
- **List**: Replace directory scan with `s3.list_objects_v2(Bucket=bucket, Prefix=patient_id)`
- **Delete**: Replace `os.remove(path)` with `s3.delete_object(Bucket=bucket, Key=key)`
- **Serve files**: Return pre-signed S3 URLs (1-hour expiry) instead of static file paths

### 4. Remove static file mount

`packages/backend/src/care_assistant/main.py` — remove:
```python
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

**API surface is unchanged** — mobile app endpoints remain identical.

---

## CI/CD: GitHub Actions

File: `.github/workflows/deploy.yml`

**Trigger:** Push to `main` branch

**Workflow steps:**
1. Checkout repo
2. SSH into EC2 (`EC2_HOST` secret) using private key (`EC2_SSH_KEY` secret)
3. `cd /opt/care-assistant && git pull origin main`
4. `pip install -r packages/backend/requirements.txt -q`
5. `sudo systemctl restart care-assistant`

**Required GitHub Secrets:**

| Secret | How to get it |
|---|---|
| `EC2_HOST` | `terraform output public_ip` after apply |
| `EC2_SSH_KEY` | Private key matching the `public_key_path` variable |
| `EC2_USER` | `ec2-user` (Amazon Linux 2023) |

---

## Deployment Workflow

### First-time setup

```bash
cd infrastructure

# Configure credentials
cp terraform.tfvars.example terraform.tfvars
# Fill in: s3_bucket_name, key_name, github_repo

# Deploy
terraform init
terraform plan
terraform apply

# Copy outputs to GitHub Secrets
terraform output public_ip   # → EC2_HOST secret
```

### Subsequent deploys

Push to `main` → GitHub Actions SSHes in → git pull → restart service. No manual steps.

### SSL setup (one-time, after first apply)

Certbot runs automatically in `userdata.sh`. The domain `<public-ip>.nip.io` resolves to the Elastic IP with no DNS configuration needed.

---

## Security Notes

- SSH (port 22) is open to `0.0.0.0/0` for GitHub Actions. This can be restricted to GitHub Actions IP ranges if desired.
- S3 bucket has public access blocked; files are served via pre-signed URLs only.
- EC2 instance uses IAM role for S3 access — no long-lived credentials.
- `terraform.tfvars` is gitignored to prevent secrets from being committed.

---

## Free Tier Summary

| Service | Free Tier | Expires |
|---|---|---|
| EC2 t2.micro | 750 hrs/month | 12 months from account creation |
| Elastic IP | Free when attached to running instance | Never |
| S3 | 5GB storage, 20K GET, 2K PUT/month | Never |
| Data transfer | 100GB/month outbound | 12 months |
| IAM, Security Groups | Always free | Never |
