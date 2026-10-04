"""API service configuration (R8: 12-factor)."""

from __future__ import annotations

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    R8: No secrets in code, images or logs.
    """

    model_config = {"env_prefix": "GEOMINE_"}

    # ── Database ──────────────────────────────────────────────────────
    database_url: str = "postgresql+asyncpg://geomine:geomine@localhost:5432/geomine"
    database_pool_size: int = Field(default=20, ge=1)
    database_max_overflow: int = Field(default=10, ge=0)

    # ── Redis ─────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── MinIO / S3 ────────────────────────────────────────────────────
    minio_endpoint: str = "localhost:9000"
    minio_access_key: SecretStr = SecretStr("minioadmin")
    minio_secret_key: SecretStr = SecretStr("minioadmin")
    minio_bucket: str = "geomine-documents"
    minio_use_ssl: bool = False

    # ── Auth ──────────────────────────────────────────────────────────
    keycloak_url: str = "http://localhost:8080"
    keycloak_realm: str = "geomine"
    keycloak_client_id: str = "geomine-api"

    # ── Observability ─────────────────────────────────────────────────
    otel_endpoint: str = "http://localhost:4317"
    log_level: str = "INFO"

    # ── API ───────────────────────────────────────────────────────────
    api_title: str = "GeoMine API"
    api_version: str = "0.1.0"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    debug: bool = False
