"""LLM Gateway configuration (R8: 12-factor, no secrets in code)."""

from __future__ import annotations

from enum import StrEnum

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings


class LLMProvider(StrEnum):
    """Supported LLM backend providers."""

    CLOUD = "cloud"
    OLLAMA = "ollama"


class GatewaySettings(BaseSettings):
    """Configuration for the LLM Gateway, loaded from environment variables.

    R8: Secrets come from the environment or the secret manager.
    """

    model_config = {"env_prefix": "LLM_"}

    provider: LLMProvider = LLMProvider.OLLAMA
    model: str = "llama3.1"
    api_base: str = "http://localhost:11434"
    api_key: SecretStr = SecretStr("")

    # Request defaults
    temperature: float = Field(default=0.1, ge=0.0, le=2.0)
    max_tokens: int = Field(default=4096, ge=1, le=128_000)
    timeout_seconds: float = Field(default=120.0, ge=1.0)

    # Retry
    max_retries: int = Field(default=3, ge=0, le=10)
    retry_base_delay: float = Field(default=1.0, ge=0.1)
