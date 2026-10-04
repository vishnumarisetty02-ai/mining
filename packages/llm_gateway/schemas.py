"""Request/Response schemas for the LLM Gateway (R5, R9).

LLM outputs are JSON-schema constrained and validated;
invalid output is rejected, not repaired silently.
"""

from __future__ import annotations

import json
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class LLMMessage(BaseModel):
    """A single message in the conversation."""

    model_config = ConfigDict(frozen=True)

    role: str = Field(pattern=r"^(system|user|assistant)$")
    content: str = Field(min_length=1)


class LLMRequest(BaseModel):
    """Request to the LLM Gateway."""

    model_config = ConfigDict(frozen=True)

    messages: list[LLMMessage] = Field(min_length=1)
    temperature: float | None = None
    max_tokens: int | None = None
    response_json_schema: dict[str, Any] | None = Field(
        default=None,
        description=(
            "If provided, the response content MUST parse as JSON matching "
            "this schema. Invalid responses are rejected (R5)."
        ),
    )


class LLMResponse(BaseModel):
    """Response from the LLM Gateway."""

    model_config = ConfigDict(frozen=True)

    content: str
    model: str
    provider: str
    prompt_tokens: int = Field(ge=0)
    completion_tokens: int = Field(ge=0)
    total_tokens: int = Field(ge=0)
    latency_ms: float = Field(ge=0)

    def parse_json(self) -> dict[str, Any]:
        """Parse the response content as JSON.

        Raises:
            ValueError: If content is not valid JSON.
        """
        try:
            result: dict[str, Any] = json.loads(self.content)
        except json.JSONDecodeError as exc:
            msg = f"LLM response is not valid JSON: {exc}"
            raise ValueError(msg) from exc
        return result


class LLMGatewayError(Exception):
    """Base exception for LLM Gateway errors."""


class LLMValidationError(LLMGatewayError):
    """Raised when LLM output fails JSON-schema validation (R5)."""


class LLMProviderError(LLMGatewayError):
    """Raised when the underlying provider returns an error."""


class LLMTimeoutError(LLMGatewayError):
    """Raised when the LLM call exceeds the configured timeout."""
