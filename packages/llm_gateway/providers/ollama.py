"""Ollama local LLM provider."""

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


class OllamaProvider(BaseLLMProvider):
    """Provider for local LLMs via Ollama REST API."""

    def __init__(self, settings: GatewaySettings) -> None:
        self._settings = settings
        self._client = httpx.AsyncClient(
            base_url=settings.api_base,
            timeout=settings.timeout_seconds,
        )

    @property
    def provider_name(self) -> str:
        return "ollama"

    async def complete(self, request: LLMRequest) -> LLMResponse:
        """Send completion request to Ollama API."""
        payload: dict[str, object] = {
            "model": self._settings.model,
            "messages": [{"role": m.role, "content": m.content} for m in request.messages],
            "stream": False,
            "options": {
                "temperature": request.temperature or self._settings.temperature,
                "num_predict": request.max_tokens or self._settings.max_tokens,
            },
        }

        if request.response_json_schema is not None:
            payload["format"] = "json"

        start = time.perf_counter_ns()
        try:
            resp = await self._client.post("/api/chat", json=payload)
            resp.raise_for_status()
        except httpx.TimeoutException as exc:
            raise LLMTimeoutError(f"Ollama timed out: {exc}") from exc
        except httpx.HTTPStatusError as exc:
            raise LLMProviderError(
                f"Ollama error {exc.response.status_code}: {exc.response.text}"
            ) from exc
        except httpx.HTTPError as exc:
            raise LLMProviderError(f"Ollama request failed: {exc}") from exc

        latency_ms = (time.perf_counter_ns() - start) / 1_000_000
        data = resp.json()

        return LLMResponse(
            content=data["message"]["content"],
            model=data.get("model", self._settings.model),
            provider=self.provider_name,
            prompt_tokens=data.get("prompt_eval_count", 0),
            completion_tokens=data.get("eval_count", 0),
            total_tokens=data.get("prompt_eval_count", 0) + data.get("eval_count", 0),
            latency_ms=latency_ms,
        )

    async def close(self) -> None:
        """Close the HTTP client."""
        await self._client.aclose()
