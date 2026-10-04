"""Cloud LLM provider (OpenAI-compatible API)."""

from __future__ import annotations

import time

import httpx

from llm_gateway.config import GatewaySettings
from llm_gateway.providers import BaseLLMProvider
from llm_gateway.schemas import (
    LLMProviderError,
    LLMRequest,
    LLMResponse,
    LLMTimeoutError,
)


class CloudProvider(BaseLLMProvider):
    """Provider for cloud-hosted LLMs via OpenAI-compatible REST API."""

    def __init__(self, settings: GatewaySettings) -> None:
        self._settings = settings
        self._client = httpx.AsyncClient(
            base_url=settings.api_base,
            timeout=settings.timeout_seconds,
            headers={
                "Authorization": f"Bearer {settings.api_key.get_secret_value()}",
                "Content-Type": "application/json",
            },
        )

    @property
    def provider_name(self) -> str:
        return "cloud"

    async def complete(self, request: LLMRequest) -> LLMResponse:
        """Send completion request to cloud API."""
        payload: dict[str, object] = {
            "model": self._settings.model,
            "messages": [{"role": m.role, "content": m.content} for m in request.messages],
            "temperature": request.temperature or self._settings.temperature,
            "max_tokens": request.max_tokens or self._settings.max_tokens,
        }

        if request.response_json_schema is not None:
            payload["response_format"] = {
                "type": "json_schema",
                "json_schema": {
                    "name": "response",
                    "schema": request.response_json_schema,
                },
            }

        start = time.perf_counter_ns()
        try:
            resp = await self._client.post("/v1/chat/completions", json=payload)
            resp.raise_for_status()
        except httpx.TimeoutException as exc:
            raise LLMTimeoutError(f"Cloud LLM timed out: {exc}") from exc
        except httpx.HTTPStatusError as exc:
            raise LLMProviderError(
                f"Cloud LLM error {exc.response.status_code}: {exc.response.text}"
            ) from exc
        except httpx.HTTPError as exc:
            raise LLMProviderError(f"Cloud LLM request failed: {exc}") from exc

        latency_ms = (time.perf_counter_ns() - start) / 1_000_000
        data = resp.json()

        choice = data["choices"][0]
        usage = data.get("usage", {})

        return LLMResponse(
            content=choice["message"]["content"],
            model=data.get("model", self._settings.model),
            provider=self.provider_name,
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
            latency_ms=latency_ms,
        )

    async def close(self) -> None:
        """Close the HTTP client."""
        await self._client.aclose()
