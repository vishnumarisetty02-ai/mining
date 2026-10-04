"""Pipeline job domain models (R4).

Every pipeline job is idempotent and resumable.
Key: (document_sha256, stage, extractor_version).
"""

from __future__ import annotations

import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PipelineStage(StrEnum):
    """The ten stages of the GeoMine processing pipeline."""

    DOCUMENT = "document"
    UNDERSTAND = "understand"
    EXTRACT = "extract"
    NORMALISE = "normalise"
    VALIDATE = "validate"
    RETRIEVE = "retrieve"
    CALCULATE = "calculate"
    GENERATE = "generate"
    AUDIT = "audit"
    APPROVE = "approve"


class JobStatus(StrEnum):
    """Lifecycle of a pipeline job."""

    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"
    SKIPPED = "skipped"


class StageResult(BaseModel):
    """Output of a single pipeline stage execution."""

    model_config = ConfigDict(frozen=True)

    stage: PipelineStage
    success: bool
    facts_extracted: int = Field(ge=0, default=0)
    errors: list[str] = Field(default_factory=list)
    duration_ms: float = Field(ge=0, default=0)
    metadata: dict[str, object] = Field(default_factory=dict)


class PipelineJob(BaseModel):
    """Tracks execution of a single stage for a document (R4).

    The unique constraint (document_sha256, stage, extractor_version)
    ensures idempotency — re-running the same stage with the same
    extractor version is a no-op if already completed.
    """

    model_config = ConfigDict(frozen=True)

    id: UUID
    document_sha256: str = Field(
        min_length=64,
        max_length=64,
        pattern=r"^[0-9a-f]{64}$",
    )
    stage: PipelineStage
    extractor_version: str = Field(min_length=1)
    status: JobStatus = JobStatus.PENDING
    result: StageResult | None = None
    error: str | None = None
    subsidiary_id: str
    started_at: datetime.datetime | None = None
    completed_at: datetime.datetime | None = None
    created_at: datetime.datetime | None = None
