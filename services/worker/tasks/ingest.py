"""Stage 1: Document ingestion task.

Receives a file upload event, computes SHA-256 (R3), stores the
original in MinIO, creates the database record, and enqueues Stage 2.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

import structlog

from core_models.document import DocumentStatus
from core_models.pipeline import PipelineStage
from document_ai.ingest import compute_sha256, detect_mime_type

logger: structlog.stdlib.BoundLogger = structlog.get_logger()


async def ingest_document(
    ctx: dict[str, Any],
    file_bytes: bytes,
    filename: str,
    subsidiary_id: str,
) -> dict[str, Any]:
    """Ingest a document into the GeoMine pipeline.

    Steps:
        1. Compute SHA-256 hash (R3: content-addressed storage)
        2. Detect and validate MIME type
        3. Store original in MinIO (immutable)
        4. Create pipeline_jobs record with idempotency key (R4)
        5. Write audit record (R12)
        6. Enqueue Stage 2 (understand)

    Args:
        ctx: arq worker context (contains Redis, DB connections).
        file_bytes: Raw file content.
        filename: Original filename.
        subsidiary_id: Tenant identifier for RLS (R13).

    Returns:
        Dict with document_id, sha256, and status.
    """
    sha256 = compute_sha256(file_bytes)
    mime_type = detect_mime_type(filename)

    await logger.ainfo(
        "document_ingestion_started",
        sha256=sha256,
        filename=filename,
        mime_type=mime_type,
        size_bytes=len(file_bytes),
        subsidiary_id=subsidiary_id,
    )

    document_id = uuid.uuid4()
    storage_key = f"{subsidiary_id}/{sha256[:8]}/{sha256}/{filename}"

    # TODO: Upload to MinIO
    # TODO: Insert into documents table (idempotent on sha256)
    # TODO: Insert pipeline_job (idempotent on sha256 + stage + version)
    # TODO: Write audit record
    # TODO: Enqueue understand stage

    await logger.ainfo(
        "document_ingestion_completed",
        document_id=str(document_id),
        sha256=sha256,
        storage_key=storage_key,
    )

    return {
        "document_id": str(document_id),
        "sha256": sha256,
        "storage_key": storage_key,
        "status": DocumentStatus.PROCESSING,
        "stage": PipelineStage.DOCUMENT,
    }
