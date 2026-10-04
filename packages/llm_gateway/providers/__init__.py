"""Abstract base for LLM providers."""

from __future__ import annotations

from abc import ABC, abstractmethod

from llm_gateway.schemas import LLMRequest, LLMResponse


class BaseLLMProvider(ABC):
    """Abstract provider interface. Implementations handle cloud and local backends."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable provider name for logging."""

    @abstractmethod
    async def complete(self, request: LLMRequest) -> LLMResponse:
        """Send a completion request to the LLM provider.

        Args:
            request: The validated LLM request.

        Returns:
            LLMResponse with content and usage metrics.

        Raises:
            LLMProviderError: On provider-level errors.
            LLMTimeoutError: If the request exceeds timeout.
        """
