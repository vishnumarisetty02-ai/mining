"""UnitCompatibilityRule — validates that facts being compared use compatible units.

Example: adding production in MT and production in tonnes without conversion
is a CRITICAL error.
"""

from __future__ import annotations

from collections import defaultdict

from core_models.fact import Fact

from consistency_firewall.rule_base import FirewallRule
from consistency_firewall.verdict import Finding, Severity

# Groups of compatible units (case-insensitive normalisation).
_UNIT_FAMILIES: dict[str, set[str]] = {
    "mass": {"mt", "million tonnes", "tonnes", "t", "kg", "quintals"},
    "volume": {"m³", "mm³", "million m³", "cubic metres", "litres"},
    "area": {"ha", "hectares", "km²", "sq km", "acres"},
    "energy": {"kcal", "kcal/kg", "mj", "mj/kg", "gj"},
    "count": {"persons", "nos", "numbers", "count"},
    "ratio": {"ratio", "%", "percent"},
}

# Build reverse map: normalised unit → family name
_UNIT_TO_FAMILY: dict[str, str] = {}
for family, units in _UNIT_FAMILIES.items():
    for unit in units:
        _UNIT_TO_FAMILY[unit.lower()] = family


def _get_family(unit: str | None) -> str | None:
    """Look up the unit family for a given unit string."""
    if unit is None:
        return None
    return _UNIT_TO_FAMILY.get(unit.lower().strip())


class UnitCompatibilityRule(FirewallRule):
    """Verify that facts sharing a metric name use compatible units.

    Pure function: no I/O, no LLM (R2).
    """

    @property
    def rule_id(self) -> str:
        return "unit_compat_001"

    @property
    def rule_name(self) -> str:
        return "Unit Compatibility"

    def evaluate(self, facts: list[Fact]) -> list[Finding]:
        findings: list[Finding] = []

        # Group facts by metric_name
        by_metric: dict[str, list[Fact]] = defaultdict(list)
        for fact in facts:
            if fact.unit is not None and fact.numeric_value is not None:
                by_metric[fact.metric_name].append(fact)

        for metric_name, metric_facts in by_metric.items():
            families_seen: dict[str, list[Fact]] = defaultdict(list)
            unknown_units: list[Fact] = []

            for fact in metric_facts:
                family = _get_family(fact.unit)
                if family is None:
                    unknown_units.append(fact)
                else:
                    families_seen[family].append(fact)

            # If more than one family is present, that's a conflict
            if len(families_seen) > 1:
                all_involved = [f for group in families_seen.values() for f in group]
                families_str = ", ".join(sorted(families_seen.keys()))
                findings.append(Finding(
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    severity=Severity.CRITICAL,
                    message=(
                        f"Metric '{metric_name}' has facts with incompatible "
                        f"unit families: {families_str}"
                    ),
                    fact_ids=[f.id for f in all_involved],
                    details={
                        "families": {
                            fam: [str(f.unit) for f in fcts]
                            for fam, fcts in families_seen.items()
                        },
                    },
                ))

            # Warn about unknown units
            for fact in unknown_units:
                findings.append(Finding(
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    severity=Severity.WARNING,
                    message=(
                        f"Fact '{fact.metric_name}' has unrecognised unit '{fact.unit}'"
                    ),
                    fact_ids=[fact.id],
                    details={"unit": str(fact.unit)},
                ))

        return findings
