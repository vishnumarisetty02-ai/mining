"""LLMGateway — the ONLY entry point for LLM calls (R7).

Usage:
    gateway = LLMGateway(settings)
    response = await gateway.complete(request)
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any

import jsonschema  # type: ignore[import-untyped]

from llm_gateway.config import GatewaySettings, LLMProvider
from llm_gateway.providers import BaseLLMProvider
from llm_gateway.providers.cloud import CloudProvider
from llm_gateway.providers.ollama import OllamaProvider
from llm_gateway.schemas import (
    LLMGatewayError,
    LLMProviderError,
    LLMRequest,
    LLMResponse,
    LLMValidationError,
)

logger = logging.getLogger(__name__)


class LLMGateway:
    """Unified LLM Gateway — single point of control for all model calls.

    - Selects provider based on configuration (R7)
    - Enforces JSON-schema constraints on outputs (R5)
    - Rejects invalid outputs (never silently repairs)
    - Logs all calls with token counts and latency
    - Implements retry with exponential backoff
    """

    def __init__(self, settings: GatewaySettings | None = None) -> None:
        self._settings = settings or GatewaySettings()
        self._provider: BaseLLMProvider = self._create_provider()

    def _create_provider(self) -> BaseLLMProvider:
        """Instantiate the configured provider."""
        if self._settings.provider == LLMProvider.CLOUD:
            return CloudProvider(self._settings)
        if self._settings.provider == LLMProvider.OLLAMA:
            return OllamaProvider(self._settings)
        msg = f"Unknown LLM provider: {self._settings.provider}"
        raise LLMGatewayError(msg)

    async def complete(self, request: LLMRequest) -> LLMResponse:
        """Send a completion request with retry and validation.

        Args:
            request: Validated LLM request with optional JSON schema.

        Returns:
            Validated LLM response.

        Raises:
            LLMValidationError: If response fails JSON-schema validation (R5).
            LLMProviderError: After exhausting retries.
        """
        last_error: Exception | None = None

        for attempt in range(self._settings.max_retries + 1):
            try:
                response = await self._provider.complete(request)

                # Validate JSON schema if required (R5)
                if request.response_json_schema is not None:
                    self._validate_response_schema(response, request.response_json_schema)

                # Log successful call
                logger.info(
                    "llm_call_success",
                    extra={
                        "provider": response.provider,
                        "model": response.model,
                        "prompt_tokens": response.prompt_tokens,
                        "completion_tokens": response.completion_tokens,
                        "latency_ms": response.latency_ms,
                        "attempt": attempt + 1,
                    },
                )

                return response

            except LLMValidationError:
                # Schema validation failures are not retried — the output is
                # fundamentally wrong, not a transient error
                raise

            except (LLMProviderError, LLMGatewayError) as exc:
                last_error = exc
                if attempt < self._settings.max_retries:
                    delay = self._settings.retry_base_delay * (2 ** attempt)
                    logger.warning(
                        "llm_call_retry",
                        extra={
                            "attempt": attempt + 1,
                            "max_retries": self._settings.max_retries,
                            "delay_seconds": delay,
                            "error": str(exc),
                        },
                    )
                    import asyncio
                    await asyncio.sleep(delay)

        raise LLMProviderError(
            f"LLM call failed after {self._settings.max_retries + 1} attempts: {last_error}"
        ) from last_error

    def _validate_response_schema(
        self,
        response: LLMResponse,
        schema: dict[str, Any],
    ) -> None:
        """Validate LLM output against the provided JSON schema (R5).

        Invalid output is rejected, not repaired silently.
        """
        try:
            parsed = json.loads(response.content)
        except json.JSONDecodeError as exc:
            raise LLMValidationError(
                f"LLM output is not valid JSON: {exc}"
            ) from exc

        try:
            jsonschema.validate(instance=parsed, schema=schema)
        except jsonschema.ValidationError as exc:
            raise LLMValidationError(
                f"LLM output failed JSON-schema validation: {exc.message}"
            ) from exc

    async def close(self) -> None:
        """Shut down the underlying provider client."""
        if hasattr(self._provider, "close"):
            await self._provider.close()
