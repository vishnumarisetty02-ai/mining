"""Document upload and management router."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, UploadFile, File, HTTPException, status, Query
from pydantic import BaseModel, Field

from core_models.document import DocumentStatus

router = APIRouter(prefix="/documents", tags=["documents"])


# ── Response schemas ──────────────────────────────────────────────────

class DocumentResponse(BaseModel):
    """API response for a document."""

    id: UUID
    sha256: str
    filename: str
    mime_type: str
    page_count: int | None = None
    status: DocumentStatus
    subsidiary_id: str


class DocumentListResponse(BaseModel):
    """Paginated list of documents."""

    items: list[DocumentResponse]
    total: int
    page: int
    page_size: int


class UploadResponse(BaseModel):
    """Response after successful upload."""

    id: UUID
    sha256: str
    filename: str
    message: str = "Document uploaded and queued for processing"


# ── Endpoints ─────────────────────────────────────────────────────────

@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a document for processing",
)
async def upload_document(
    file: UploadFile = File(..., description="PDF, DOCX, XLSX, CSV, or image file"),
) -> UploadResponse:
    """Upload a document to the GeoMine pipeline.

    The document is:
    1. SHA-256 hashed (R3: immutable content address)
    2. Stored in MinIO
    3. Queued for the 10-stage processing pipeline

    If a document with the same SHA-256 already exists, it is
    deduplicated (R4: idempotent).
    """
    if file.filename is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )

    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file",
        )

    from document_ai.ingest import compute_sha256, detect_mime_type

    try:
        mime_type = detect_mime_type(file.filename)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=str(exc),
        ) from exc

    sha256 = compute_sha256(content)

    # TODO: Store in MinIO, create DB record, enqueue pipeline job
    import uuid
    doc_id = uuid.uuid4()

    return UploadResponse(
        id=doc_id,
        sha256=sha256,
        filename=file.filename,
    )


@router.get(
    "/",
    response_model=DocumentListResponse,
    summary="List documents",
)
async def list_documents(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> DocumentListResponse:
    """List documents for the current subsidiary (RLS-filtered)."""
    # TODO: Query from database with RLS filtering
    return DocumentListResponse(
        items=[],
        total=0,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get document details",
)
async def get_document(document_id: UUID) -> DocumentResponse:
    """Get details of a specific document."""
    # TODO: Query from database
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Document {document_id} not found",
    )
