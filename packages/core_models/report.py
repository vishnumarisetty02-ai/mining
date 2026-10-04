"""Report and ReportSection domain models."""

from __future__ import annotations

import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ReportStatus(StrEnum):
    """Report lifecycle states. Transitions are enforced by the API."""

    DRAFT = "draft"
    VALIDATED = "validated"    # Passed Consistency Firewall
    APPROVED = "approved"     # Human-approved
    PUBLISHED = "published"   # Exported and released
    REJECTED = "rejected"


class ReportSection(BaseModel):
    """A single section of a structured report."""

    model_config = ConfigDict(frozen=True)

    heading: str
    content: str
    fact_ids: list[UUID] = Field(
        default_factory=list,
        description="Facts cited in this section — ensures traceability to evidence (R1).",
    )
    order: int = Field(ge=0)


class FirewallResult(BaseModel):
    """Snapshot of the Consistency Firewall verdict for a report version."""

    model_config = ConfigDict(frozen=True)

    passed: bool
    findings_count: int = Field(ge=0)
    critical_count: int = Field(ge=0)
    run_at: datetime.datetime
    verdict_json: dict[str, object] = Field(
        default_factory=dict,
        description="Full serialised FirewallVerdict for audit trail.",
    )


class Report(BaseModel):
    """A generated report composed entirely from validated facts."""

    model_config = ConfigDict(frozen=True)

    id: UUID
    title: str = Field(min_length=1)
    report_type: str = Field(min_length=1)
    version: int = Field(ge=1, default=1)
    status: ReportStatus = ReportStatus.DRAFT
    sections: list[ReportSection] = Field(default_factory=list)
    firewall_result: FirewallResult | None = None
    subsidiary_id: str
    created_by: UUID | None = None
    approved_by: UUID | None = None
    approved_at: datetime.datetime | None = None
    created_at: datetime.datetime | None = None
    updated_at: datetime.datetime | None = None
