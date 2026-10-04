"""Document domain models.

R3: Originals are immutable and addressed by SHA-256.
"""

from __future__ import annotations

import datetime
from enum import StrEnum
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

# SHA-256 hex digest is always 64 lowercase hex characters.
SHA256Hash = Annotated[str, StringConstraints(pattern=r"^[0-9a-f]{64}$", min_length=64, max_length=64)]


class DocumentStatus(StrEnum):
    """Lifecycle status of an ingested document."""

    UPLOADED = "uploaded"
    PROCESSING = "processing"
    EXTRACTED = "extracted"
    FAILED = "failed"


class DocumentMetadata(BaseModel):
    """Arbitrary metadata attached to a document."""

    model_config = ConfigDict(frozen=True)

    source: str | None = None
    year: int | None = None
    mine_name: str | None = None
    district: str | None = None
    state: str | None = None
    language: str | None = Field(default=None, description="ISO 639-1 code, e.g. 'en', 'hi'")
    tags: list[str] = Field(default_factory=list)


class Document(BaseModel):
    """An immutable original document stored in MinIO, addressed by SHA-256."""

    model_config = ConfigDict(frozen=True)

    id: UUID
    sha256: SHA256Hash
    filename: str
    mime_type: str
    storage_key: str
    page_count: int | None = None
    subsidiary_id: str
    status: DocumentStatus = DocumentStatus.UPLOADED
    metadata: DocumentMetadata = Field(default_factory=DocumentMetadata)
    created_at: datetime.datetime | None = None
    updated_at: datetime.datetime | None = None
