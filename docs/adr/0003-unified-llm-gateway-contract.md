# ADR-0003: Unified LLM Gateway Contract

**Status:** Accepted  
**Date:** 2026-10-03  
**Decision Makers:** GeoMine Architecture Team

## Context

GeoMine uses LLMs for text understanding, fact extraction, and report generation.
The platform must support both cloud APIs and local models (Ollama) and ensure that
no part of the codebase directly calls any model SDK.

Options considered:
1. **Direct SDK calls in each module** — fast to start but impossible to audit or swap
2. **Thin wrapper per provider** — better but still leaks provider APIs
3. **Unified gateway with schema enforcement** — single point of control

## Decision

All LLM calls go through the **`llm_gateway` package**. It exposes a single
`LLMGateway` class with typed methods. The gateway:

- Selects the provider (cloud or Ollama) based on configuration
- Enforces JSON-schema constraints on outputs (R5)
- Rejects invalid outputs rather than silently repairing them
- Logs all calls with token counts and latency for cost tracking
- Implements retry with exponential backoff

Direct SDK imports outside `llm_gateway` are banned and caught by linting rules.

## Consequences

- **Positive:** Single audit point for all model interactions. Easy to swap providers.
- **Positive:** Schema enforcement catches hallucinated or malformed output early.
- **Negative:** Slight latency overhead from validation layer.
- **Mitigation:** Validation is sub-millisecond for typical response sizes.

## Compliance

- R7: All external model calls go through the llm_gateway package.
- R5: LLM outputs are JSON-schema constrained and validated.
- R8: API keys come from environment/secret manager, never hardcoded.
