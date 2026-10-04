"""Facts query router — retrieve facts with evidence (R1)."""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/facts", tags=["facts"])


# ── Response schemas ──────────────────────────────────────────────────

class EvidenceResponse(BaseModel):
    """Evidence linking a fact to its source document location (R1)."""

    id: UUID
    document_id: UUID
    page_number: int
    table_index: int | None = None
    bbox: dict[str, float] | None = None
    extracted_text: str


class FactResponse(BaseModel):
    """A fact with its evidence chain."""

    id: UUID
    document_id: UUID
    category: str
    metric_name: str
    numeric_value: Decimal | None = None
    text_value: str | None = None
    unit: str | None = None
    period_start: str | None = None
    period_end: str | None = None
    status: str
    confidence: float | None = None
    evidence: list[EvidenceResponse] = Field(default_factory=list)


class FactListResponse(BaseModel):
    """Paginated list of facts."""

    items: list[FactResponse]
    total: int
    page: int
    page_size: int


# ── Endpoints ─────────────────────────────────────────────────────────

@router.get(
    "/",
    response_model=FactListResponse,
    summary="Query facts with evidence",
)
async def list_facts(
    category: str | None = Query(None, description="Filter by category"),
    metric_name: str | None = Query(None, description="Filter by metric name"),
    document_id: UUID | None = Query(None, description="Filter by source document"),
    page: int = 1,
    page_size: int = Query(default=20, ge=1, le=100),
) -> FactListResponse:
    """Query facts for the current subsidiary (RLS-filtered).

    R1: Every fact returned includes its evidence chain.
    """
    # TODO: Database query with RLS
    return FactListResponse(items=[], total=0, page=page, page_size=page_size)


@router.get(
    "/{fact_id}",
    response_model=FactResponse,
    summary="Get a fact with full evidence",
)
async def get_fact(fact_id: UUID) -> FactResponse:
    """Get a specific fact with all evidence rows (R1)."""
    # TODO: Database query
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Fact {fact_id} not found",
    )
