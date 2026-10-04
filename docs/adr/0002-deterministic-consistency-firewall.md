# ADR-0002: Deterministic Consistency Firewall

**Status:** Accepted  
**Date:** 2026-10-03  
**Decision Makers:** GeoMine Architecture Team

## Context

Generated reports must be verified for internal consistency before human review.
The system must guarantee that validation results are reproducible and auditable.

Options considered:
1. **LLM-based validation** — flexible but non-deterministic, unprovable correctness
2. **Rule engine with I/O** — allows database lookups but makes testing harder
3. **Pure Python deterministic engine** — testable, reproducible, auditable

## Decision

The **Consistency Firewall** is implemented as a pure Python module with **no I/O** and
**no LLM calls**. It receives all required data as function arguments and returns a
`FirewallVerdict` containing findings with severity levels.

An LLM may phrase human-readable explanations of findings, but the LLM **never decides**
whether a finding is a pass or fail.

## Consequences

- **Positive:** 100% reproducible results. Easy to test with Hypothesis property tests.
- **Positive:** No network calls = microsecond-level validation.
- **Negative:** New validation rules require code changes and deployment.
- **Mitigation:** Rules are individual Python classes, easy to add via a plugin pattern.

## Compliance

- R2: Release decisions are deterministic. The Consistency Firewall is pure Python with no
  I/O and no LLM call.
