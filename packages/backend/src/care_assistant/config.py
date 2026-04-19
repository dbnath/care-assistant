from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings and configuration."""

    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "Elderly Care Assistant"
    app_version: str = "0.1.0"
    debug: bool = False

    # API settings
    api_prefix: str = "/api/v1"

    # CORS settings (includes React Native Metro bundler)
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:8081",  # React Native Metro bundler
    ]

    # Upload settings
    upload_dir: str = "uploads"
    max_upload_size_mb: int = 10
    allowed_upload_extensions: list[str] = [".pdf", ".jpg", ".jpeg", ".png"]

    # AWS settings
    aws_s3_bucket: str = ""
    aws_region: str = "us-east-1"


settings = Settings()
