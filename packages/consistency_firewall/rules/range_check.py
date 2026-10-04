"""RangeCheckRule — validates physical plausibility of numeric values.

Example: coal production per mine cannot be negative, and values above
certain thresholds (e.g. > 500 MT for a single mine) are implausible.
"""

from __future__ import annotations

from decimal import Decimal

from core_models.fact import Fact

from consistency_firewall.rule_base import FirewallRule
from consistency_firewall.verdict import Finding, Severity


class RangeBound:
    """Defines plausible bounds for a metric category."""

    __slots__ = ("metric_pattern", "min_value", "max_value", "unit")

    def __init__(
        self,
        metric_pattern: str,
        min_value: Decimal | None,
        max_value: Decimal | None,
        unit: str,
    ) -> None:
        self.metric_pattern = metric_pattern
        self.min_value = min_value
        self.max_value = max_value
        self.unit = unit

    def matches(self, metric_name: str) -> bool:
        """Check if a metric name matches this bound's pattern (prefix match)."""
        return metric_name.startswith(self.metric_pattern)


# Default plausibility bounds for mining domain metrics.
_DEFAULT_BOUNDS: list[RangeBound] = [
    RangeBound("production", Decimal("0"), Decimal("1000"), "MT"),
    RangeBound("overburden_removal", Decimal("0"), Decimal("5000"), "Mm³"),
    RangeBound("stripping_ratio", Decimal("0"), Decimal("50"), "ratio"),
    RangeBound("manpower", Decimal("0"), Decimal("500000"), "persons"),
    RangeBound("output_per_man_shift", Decimal("0"), Decimal("200"), "tonnes"),
    RangeBound("coal_dispatch", Decimal("0"), Decimal("1000"), "MT"),
    RangeBound("grade", Decimal("0"), Decimal("10000"), "kcal/kg"),
]


class RangeCheckRule(FirewallRule):
    """Verify that numeric facts fall within physically plausible ranges.

    Pure function: no I/O, no LLM (R2).
    """

    def __init__(self, bounds: list[RangeBound] | None = None) -> None:
        self._bounds = bounds or _DEFAULT_BOUNDS

    @property
    def rule_id(self) -> str:
        return "range_check_001"

    @property
    def rule_name(self) -> str:
        return "Physical Range Check"

    def evaluate(self, facts: list[Fact]) -> list[Finding]:
        findings: list[Finding] = []

        for fact in facts:
            if fact.numeric_value is None:
                continue

            for bound in self._bounds:
                if not bound.matches(fact.metric_name):
                    continue

                if bound.min_value is not None and fact.numeric_value < bound.min_value:
                    findings.append(Finding(
                        rule_id=self.rule_id,
                        rule_name=self.rule_name,
                        severity=Severity.ERROR,
                        message=(
                            f"'{fact.metric_name}' = {fact.numeric_value} "
                            f"is below minimum {bound.min_value} {bound.unit}"
                        ),
                        fact_ids=[fact.id],
                        details={
                            "value": str(fact.numeric_value),
                            "min": str(bound.min_value),
                            "unit": bound.unit,
                        },
                    ))

                if bound.max_value is not None and fact.numeric_value > bound.max_value:
                    findings.append(Finding(
                        rule_id=self.rule_id,
                        rule_name=self.rule_name,
                        severity=Severity.ERROR,
                        message=(
                            f"'{fact.metric_name}' = {fact.numeric_value} "
                            f"exceeds maximum {bound.max_value} {bound.unit}"
                        ),
                        fact_ids=[fact.id],
                        details={
                            "value": str(fact.numeric_value),
                            "max": str(bound.max_value),
                            "unit": bound.unit,
                        },
                    ))

                break  # Only first matching bound applies

        return findings
