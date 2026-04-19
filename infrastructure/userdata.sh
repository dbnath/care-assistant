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
