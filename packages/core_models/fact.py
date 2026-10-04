"""Fact and Evidence domain models.

R1: Every figure lives in the fact table with at least one evidence row
    (document, page, table, bounding box).
R6: If the evidence is missing, answer 'insufficient evidence'.
"""

from __future__ import annotations

import datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FactStatus(StrEnum):
    """Lifecycle of a fact through the pipeline."""

    CANDIDATE = "candidate"      # Extracted but not yet validated
    VALIDATED = "validated"      # Passed Consistency Firewall
    CONFLICTED = "conflicted"   # Flagged by Firewall, needs review
    APPROVED = "approved"       # Human-approved
    REJECTED = "rejected"       # Discarded


class BoundingBox(BaseModel):
    """Pixel-space bounding box for evidence localisation."""

    model_config = ConfigDict(frozen=True)

    x0: float
    y0: float
    x1: float
    y1: float


class Evidence(BaseModel):
    """Links a fact to its source location in a document (R1).

    Every fact must have at least one evidence row. The bounding box
    lets the UI highlight the exact source on the scanned page.
    """

    model_config = ConfigDict(frozen=True)

    id: UUID
    fact_id: UUID
    document_id: UUID
    page_number: int = Field(ge=1)
    table_index: int | None = None
    bbox: BoundingBox | None = None
    extracted_text: str = Field(min_length=1)
    subsidiary_id: str


class Fact(BaseModel):
    """A single extracted datum with provenance.

    Numeric values are stored as Decimal to preserve precision for
    financial and production figures.
    """

    model_config = ConfigDict(frozen=True)

    id: UUID
    document_id: UUID
    category: str = Field(
        min_length=1,
        description="Domain category: production, geology, finance, safety, etc.",
    )
    metric_name: str = Field(min_length=1)
    numeric_value: Decimal | None = None
    text_value: str | None = None
    unit: str | None = None
    period_start: datetime.date | None = None
    period_end: datetime.date | None = None
    subsidiary_id: str
    status: FactStatus = FactStatus.CANDIDATE
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    extractor_version: str = Field(
        min_length=1,
        description="Version of the extractor that produced this fact (R4).",
    )
    evidence: list[Evidence] = Field(
        default_factory=list,
        description="At least one evidence row required before status=validated (R1).",
    )
    created_at: datetime.datetime | None = None
    updated_at: datetime.datetime | None = None
