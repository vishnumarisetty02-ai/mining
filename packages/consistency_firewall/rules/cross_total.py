"""CrossTotalRule — validates that declared totals match the sum of their parts.

Example: if a report states "Total production = 100 MT" and lists
subsidiary production of 30 + 40 + 20 = 90, that's a CRITICAL finding.
"""

from __future__ import annotations

from collections import defaultdict
from decimal import Decimal

from core_models.fact import Fact

from consistency_firewall.rule_base import FirewallRule
from consistency_firewall.verdict import Finding, Severity

# Metric names that are expected to be totals of their components.
# Format: (total_metric, component_metric)
_TOTAL_COMPONENT_PAIRS: list[tuple[str, str]] = [
    ("total_production", "subsidiary_production"),
    ("total_overburden_removal", "subsidiary_overburden_removal"),
    ("total_coal_dispatch", "subsidiary_coal_dispatch"),
    ("total_manpower", "subsidiary_manpower"),
]

# Relative tolerance for floating point comparison (0.1%).
_RELATIVE_TOLERANCE = Decimal("0.001")


class CrossTotalRule(FirewallRule):
    """Verify that declared totals equal the sum of their constituent parts.

    Pure function: no I/O, no LLM (R2).
    """

    @property
    def rule_id(self) -> str:
        return "cross_total_001"

    @property
    def rule_name(self) -> str:
        return "Cross-Total Consistency"

    def evaluate(self, facts: list[Fact]) -> list[Finding]:
        """Check all known total-component pairs for consistency."""
        findings: list[Finding] = []

        for total_metric, component_metric in _TOTAL_COMPONENT_PAIRS:
            findings.extend(
                self._check_pair(facts, total_metric, component_metric)
            )

        return findings

    def _check_pair(
        self,
        facts: list[Fact],
        total_metric: str,
        component_metric: str,
    ) -> list[Finding]:
        """Check one total-component pair across all matching periods."""
        findings: list[Finding] = []

        # Group by period
        totals_by_period: dict[tuple[object, object], list[Fact]] = defaultdict(list)
        components_by_period: dict[tuple[object, object], list[Fact]] = defaultdict(list)

        for fact in facts:
            if fact.numeric_value is None:
                continue
            period_key = (fact.period_start, fact.period_end)
            if fact.metric_name == total_metric:
                totals_by_period[period_key].append(fact)
            elif fact.metric_name == component_metric:
                components_by_period[period_key].append(fact)

        for period_key, total_facts in totals_by_period.items():
            components = components_by_period.get(period_key, [])
            if not components:
                continue  # No components to compare — not a finding

            for total_fact in total_facts:
                declared_total = total_fact.numeric_value
                if declared_total is None:
                    continue

                computed_sum = sum(
                    (c.numeric_value for c in components if c.numeric_value is not None),
                    Decimal(0),
                )

                if declared_total == Decimal(0):
                    if computed_sum != Decimal(0):
                        findings.append(self._make_finding(
                            total_fact, components, declared_total, computed_sum,
                        ))
                    continue

                relative_error = abs(declared_total - computed_sum) / abs(declared_total)
                if relative_error > _RELATIVE_TOLERANCE:
                    findings.append(self._make_finding(
                        total_fact, components, declared_total, computed_sum,
                    ))

        return findings

    def _make_finding(
        self,
        total_fact: Fact,
        component_facts: list[Fact],
        declared: Decimal,
        computed: Decimal,
    ) -> Finding:
        """Create a CRITICAL finding for a total mismatch."""
        diff = declared - computed
        fact_ids = [total_fact.id] + [c.id for c in component_facts]
        return Finding(
            rule_id=self.rule_id,
            rule_name=self.rule_name,
            severity=Severity.CRITICAL,
            message=(
                f"Declared total ({total_fact.metric_name}) = {declared} "
                f"but sum of components = {computed} (difference: {diff})"
            ),
            fact_ids=fact_ids,
            details={
                "declared_total": str(declared),
                "computed_sum": str(computed),
                "difference": str(diff),
                "period_start": str(total_fact.period_start),
                "period_end": str(total_fact.period_end),
            },
        )
