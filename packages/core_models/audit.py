"""Audit trail domain models (R12).

Every state change on a fact, report, or approval writes an append-only audit record.
"""

from __future__ import annotations

import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AuditAction(StrEnum):
    """Auditable actions in the system."""

    CREATED = "created"
    UPDATED = "updated"
    VALIDATED = "validated"
    APPROVED = "approved"
    REJECTED = "rejected"
    PUBLISHED = "published"
    DELETED = "deleted"


class AuditRecord(BaseModel):
    """Append-only audit record (R12). Never updated or deleted."""

    model_config = ConfigDict(frozen=True)

    id: UUID
    entity_type: str = Field(min_length=1, description="document | fact | report")
    entity_id: UUID
    action: AuditAction
    actor_id: UUID | None = None
    actor_type: str = Field(default="system", description="system | user")
    old_value: dict[str, object] | None = None
    new_value: dict[str, object] | None = None
    subsidiary_id: str
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.now)
