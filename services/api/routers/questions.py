"""Parliamentary Questions router — evidence-based Q&A (R1, R6)."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter(prefix="/questions", tags=["questions"])


class QuestionRequest(BaseModel):
    """A high-priority question requiring an evidence-backed answer."""

    question: str = Field(min_length=10, description="The question text")
    context: str | None = Field(
        default=None,
        description="Optional context (e.g. 'Parliamentary Question, Lok Sabha Session 2025')",
    )
    required_subsidiary_ids: list[str] | None = Field(
        default=None,
        description="Limit search to specific subsidiaries",
    )


class EvidenceItem(BaseModel):
    """A single piece of evidence supporting the answer."""

    fact_id: UUID
    document_id: UUID
    document_name: str
    page_number: int
    extracted_text: str
    metric_name: str
    value: str
    unit: str | None = None


class QuestionResponse(BaseModel):
    """Evidence-backed answer to a question."""

    id: UUID
    question: str
    answer: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: list[EvidenceItem] = Field(
        min_length=0,
        description="Evidence items supporting the answer (R1).",
    )
    insufficient_evidence: bool = Field(
        default=False,
        description="True if evidence was insufficient to answer (R6).",
    )
    subsidiary_ids: list[str] = Field(default_factory=list)


@router.post(
    "/ask",
    response_model=QuestionResponse,
    summary="Ask a question with evidence package",
)
async def ask_question(request: QuestionRequest) -> QuestionResponse:
    """Answer a question using validated facts and evidence.

    R1: Answer is composed from facts, never fabricated.
    R6: If evidence is missing, returns insufficient_evidence=True.
    R7: Uses LLM Gateway for answer composition only.
    """
    # TODO: Vector retrieval → fact lookup → LLM composition → evidence packaging
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Q&A pipeline not yet implemented",
    )
