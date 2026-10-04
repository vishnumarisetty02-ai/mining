"""Stage 5: Consistency Firewall validation task.

Runs the deterministic Consistency Firewall (R2) against all facts
for a document and records the verdict.
"""

from __future__ import annotations

import logging
from typing import Any

import structlog

from core_models.fact import Fact
from core_models.pipeline import PipelineStage
from consistency_firewall.engine import FirewallEngine
from consistency_firewall.rules import (
    CrossTotalRule,
    RangeCheckRule,
    TemporalConsistencyRule,
    UnitCompatibilityRule,
)

logger: structlog.stdlib.BoundLogger = structlog.get_logger()


def _build_default_engine() -> FirewallEngine:
    """Build the default Firewall engine with all standard rules."""
    return FirewallEngine(rules=[
        CrossTotalRule(),
        TemporalConsistencyRule(),
        RangeCheckRule(),
        UnitCompatibilityRule(),
    ])


async def validate_facts(
    ctx: dict[str, Any],
    document_sha256: str,
    subsidiary_id: str,
) -> dict[str, Any]:
    """Run Consistency Firewall validation on extracted facts.

    Steps:
        1. Load all facts for the document from the database
        2. Run the deterministic Firewall engine (R2: pure Python, no I/O)
        3. Store the verdict
        4. Update fact statuses based on findings
        5. Write audit records (R12)
        6. Enqueue Stage 6 (retrieve) if passed

    Args:
        ctx: arq worker context.
        document_sha256: SHA-256 of the document being validated.
        subsidiary_id: Tenant identifier (R13).

    Returns:
        Dict with verdict summary.
    """
    await logger.ainfo(
        "firewall_validation_started",
        document_sha256=document_sha256,
        stage=PipelineStage.VALIDATE,
    )

    # TODO: Load facts from database
    facts: list[Fact] = []

    # Run the deterministic engine (R2: no I/O, no LLM)
    engine = _build_default_engine()
    verdict = engine.run(facts)

    await logger.ainfo(
        "firewall_validation_completed",
        document_sha256=document_sha256,
        passed=verdict.passed,
        rules_executed=verdict.rules_executed,
        findings_count=len(verdict.findings),
        critical_count=verdict.critical_count,
        error_count=verdict.error_count,
        warning_count=verdict.warning_count,
        duration_ms=verdict.run_duration_ms,
    )

    # TODO: Update fact statuses (validated / conflicted)
    # TODO: Store verdict in pipeline_jobs result
    # TODO: Write audit records
    # TODO: Enqueue retrieve stage if passed

    return {
        "stage": PipelineStage.VALIDATE,
        "passed": verdict.passed,
        "findings_count": len(verdict.findings),
        "critical_count": verdict.critical_count,
        "error_count": verdict.error_count,
        "duration_ms": verdict.run_duration_ms,
    }
