"""Verdict data structures for the Consistency Firewall."""

from __future__ import annotations

import datetime
from enum import IntEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class Severity(IntEnum):
    """Severity of a firewall finding. Higher is more severe."""

    INFO = 0
    WARNING = 1
    ERROR = 2
    CRITICAL = 3


class Finding(BaseModel):
    """A single finding produced by a firewall rule.

    Each finding references the specific facts that triggered it,
    enabling the UI to highlight conflicting evidence.
    """

    model_config = ConfigDict(frozen=True)

    rule_id: str = Field(min_length=1, description="Unique ID of the rule, e.g. 'cross_total_001'")
    rule_name: str = Field(min_length=1)
    severity: Severity
    message: str = Field(min_length=1)
    fact_ids: list[UUID] = Field(
        default_factory=list,
        description="Facts involved in this finding.",
    )
    details: dict[str, object] = Field(
        default_factory=dict,
        description="Rule-specific structured details for debugging.",
    )


class FirewallVerdict(BaseModel):
    """Aggregate result of running all firewall rules on a dataset.

    The verdict is deterministic: same inputs always produce the same output.
    """

    model_config = ConfigDict(frozen=True)

    passed: bool = Field(description="True if no ERROR or CRITICAL findings exist.")
    findings: list[Finding] = Field(default_factory=list)
    rules_executed: int = Field(ge=0)
    run_duration_ms: float = Field(ge=0)
    run_at: datetime.datetime = Field(default_factory=datetime.datetime.now)

    @property
    def critical_count(self) -> int:
        """Count of CRITICAL findings."""
        return sum(1 for f in self.findings if f.severity == Severity.CRITICAL)

    @property
    def error_count(self) -> int:
        """Count of ERROR findings."""
        return sum(1 for f in self.findings if f.severity == Severity.ERROR)

    @property
    def warning_count(self) -> int:
        """Count of WARNING findings."""
        return sum(1 for f in self.findings if f.severity == Severity.WARNING)
