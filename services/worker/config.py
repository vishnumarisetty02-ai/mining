"""Worker configuration (R8: 12-factor)."""

from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings


class WorkerSettings(BaseSettings):
    """arq worker settings loaded from environment variables."""

    model_config = {"env_prefix": "GEOMINE_WORKER_"}

    redis_url: str = "redis://localhost:6379/0"
    database_url: str = "postgresql+asyncpg://geomine:geomine@localhost:5432/geomine"

    # MinIO
    minio_endpoint: str = "localhost:9000"
    minio_bucket: str = "geomine-documents"

    # Pipeline
    max_concurrent_jobs: int = Field(default=10, ge=1)
    job_timeout_seconds: int = Field(default=600, ge=30)

    # Extractor versioning (R4: idempotency key component)
    extractor_version: str = "1.0.0"
