"""Reports router — generation, validation, approval, and export."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/reports", tags=["reports"])


# ── Request/Response schemas ──────────────────────────────────────────

class GenerateReportRequest(BaseModel):
    """Request to generate a new report from validated facts."""

    title: str = Field(min_length=1)
    report_type: str = Field(min_length=1)
    fact_ids: list[UUID] = Field(
        min_length=1,
        description="Facts to include in the report (R1: must have evidence).",
    )


class ReportResponse(BaseModel):
    """API response for a report."""

    id: UUID
    title: str
    report_type: str
    version: int
    status: str
    subsidiary_id: str
    firewall_passed: bool | None = None
    findings_count: int | None = None


class ReportListResponse(BaseModel):
    """Paginated list of reports."""

    items: list[ReportResponse]
    total: int
    page: int
    page_size: int


class ApprovalRequest(BaseModel):
    """Request to approve or reject a report."""

    action: str = Field(pattern=r"^(approve|reject)$")
    comment: str | None = None


# ── Endpoints ─────────────────────────────────────────────────────────

@router.post(
    "/generate",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a report from validated facts",
)
async def generate_report(request: GenerateReportRequest) -> ReportResponse:
    """Generate a new report.

    1. Verify all fact_ids exist and have evidence (R1)
    2. Run Consistency Firewall (R2)
    3. Generate report content via LLM Gateway (R7)
    4. Write audit record (R12)
    """
    # TODO: Implement full generation pipeline
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Report generation not yet implemented",
    )


@router.get("/", response_model=ReportListResponse, summary="List reports")
async def list_reports(
    page: int = 1,
    page_size: int = 20,
) -> ReportListResponse:
    """List reports for the current subsidiary (RLS-filtered)."""
    return ReportListResponse(items=[], total=0, page=page, page_size=page_size)


@router.get("/{report_id}", response_model=ReportResponse, summary="Get report")
async def get_report(report_id: UUID) -> ReportResponse:
    """Get a specific report."""
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Report {report_id} not found",
    )


@router.post(
    "/{report_id}/approve",
    response_model=ReportResponse,
    summary="Approve or reject a report",
)
async def approve_report(report_id: UUID, request: ApprovalRequest) -> ReportResponse:
    """Approve or reject a validated report.

    R2: This is a deterministic release decision — the Firewall verdict
    must already be passed before approval is allowed.
    R12: Writes an audit record.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Approval workflow not yet implemented",
    )


@router.get(
    "/{report_id}/export/{format}",
    summary="Export report as DOCX or PDF",
)
async def export_report(report_id: UUID, format: str) -> dict[str, str]:
    """Export an approved report as Word or PDF."""
    if format not in ("docx", "pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported export format: {format}. Use 'docx' or 'pdf'.",
        )
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Export not yet implemented",
    )
