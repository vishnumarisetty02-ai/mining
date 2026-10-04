"""TemporalConsistencyRule — validates that time-series data respects ordering.

Examples of violations:
- Cumulative production decreases between consecutive periods
- A future date appears in historical data
"""

from __future__ import annotations

import datetime
from collections import defaultdict

from core_models.fact import Fact

from consistency_firewall.rule_base import FirewallRule
from consistency_firewall.verdict import Finding, Severity

# Metrics where values must be non-decreasing over time (cumulative).
_CUMULATIVE_METRICS: set[str] = {
    "cumulative_production",
    "cumulative_overburden_removal",
    "cumulative_dispatch",
}


class TemporalConsistencyRule(FirewallRule):
    """Verify temporal ordering and monotonicity constraints on facts.

    Pure function: no I/O, no LLM (R2).
    """

    @property
    def rule_id(self) -> str:
        return "temporal_001"

    @property
    def rule_name(self) -> str:
        return "Temporal Consistency"

    def evaluate(self, facts: list[Fact]) -> list[Finding]:
        findings: list[Finding] = []
        findings.extend(self._check_cumulative_monotonicity(facts))
        findings.extend(self._check_future_dates(facts))
        return findings

    def _check_cumulative_monotonicity(self, facts: list[Fact]) -> list[Finding]:
        """Cumulative metrics must be non-decreasing over time."""
        findings: list[Finding] = []

        # Group cumulative facts by (metric_name, subsidiary_id)
        groups: dict[tuple[str, str], list[Fact]] = defaultdict(list)
        for fact in facts:
            if (
                fact.metric_name in _CUMULATIVE_METRICS
                and fact.numeric_value is not None
                and fact.period_end is not None
            ):
                groups[(fact.metric_name, fact.subsidiary_id)].append(fact)

        for (_metric, _sub), group_facts in groups.items():
            # Sort by period_end
            sorted_facts = sorted(
                group_facts,
                key=lambda f: f.period_end or datetime.date.min,
            )

            for i in range(1, len(sorted_facts)):
                prev = sorted_facts[i - 1]
                curr = sorted_facts[i]
                if (
                    prev.numeric_value is not None
                    and curr.numeric_value is not None
                    and curr.numeric_value < prev.numeric_value
                ):
                    findings.append(Finding(
                        rule_id=self.rule_id,
                        rule_name=self.rule_name,
                        severity=Severity.ERROR,
                        message=(
                            f"Cumulative metric '{curr.metric_name}' decreased "
                            f"from {prev.numeric_value} (period ending {prev.period_end}) "
                            f"to {curr.numeric_value} (period ending {curr.period_end})"
                        ),
                        fact_ids=[prev.id, curr.id],
                        details={
                            "previous_value": str(prev.numeric_value),
                            "current_value": str(curr.numeric_value),
                            "previous_period_end": str(prev.period_end),
                            "current_period_end": str(curr.period_end),
                        },
                    ))

        return findings

    def _check_future_dates(self, facts: list[Fact]) -> list[Finding]:
        """Flag facts with period_end dates in the future."""
        findings: list[Finding] = []
        today = datetime.date.today()

        for fact in facts:
            if fact.period_end is not None and fact.period_end > today:
                findings.append(Finding(
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    severity=Severity.WARNING,
                    message=(
                        f"Fact '{fact.metric_name}' has period_end={fact.period_end} "
                        f"which is in the future (today={today})"
                    ),
                    fact_ids=[fact.id],
                    details={
                        "period_end": str(fact.period_end),
                        "today": str(today),
                    },
                ))

        return findings
