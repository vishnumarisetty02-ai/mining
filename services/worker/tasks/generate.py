"""Stage 8: Report generation task.

Uses the LLM Gateway (R7) to compose reports from validated facts only.
The LLM never invents figures — it structures text around fact data (R1).
"""

from __future__ import annotations

from typing import Any

import structlog

from core_models.pipeline import PipelineStage

logger: structlog.stdlib.BoundLogger = structlog.get_logger()


async def generate_report(
    ctx: dict[str, Any],
    document_sha256: str,
    subsidiary_id: str,
    report_type: str = "production_summary",
) -> dict[str, Any]:
    """Generate a report from validated facts via LLM Gateway.

    Steps:
        1. Load validated facts for the document
        2. Retrieve related context via vector search (Stage 6 output)
        3. Calculate derived metrics (Stage 7 output)
        4. Compose report via LLM Gateway with JSON-schema constraint (R7)
        5. Validate LLM output against schema (R5)
        6. Store report as draft
        7. Write audit record (R12)

    The LLM is NEVER the source of truth for numbers (R1).
    All figures come from the fact table with evidence.

    Args:
        ctx: arq worker context.
        document_sha256: SHA-256 of the source document.
        subsidiary_id: Tenant identifier (R13).
        report_type: Type of report to generate.

    Returns:
        Dict with report_id and status.
    """
    await logger.ainfo(
        "report_generation_started",
        document_sha256=document_sha256,
        report_type=report_type,
        stage=PipelineStage.GENERATE,
    )

    # TODO: Load validated facts
    # TODO: Build prompt with fact data (not raw document text)
    # TODO: Call LLM Gateway with JSON-schema constraint
    # TODO: Validate response
    # TODO: Create report record
    # TODO: Run Firewall on generated report
    # TODO: Write audit record

    await logger.ainfo(
        "report_generation_completed",
        document_sha256=document_sha256,
        report_type=report_type,
    )

    return {
        "stage": PipelineStage.GENERATE,
        "status": "draft",
        "report_type": report_type,
    }
