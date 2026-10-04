"""FirewallEngine — orchestrates all rules and produces a FirewallVerdict.

This is the single entry point for validation. It is a pure function:
no I/O, no LLM, no database access (R2). All data is passed as arguments.
"""

from __future__ import annotations

import time

from core_models.fact import Fact

from consistency_firewall.rule_base import FirewallRule
from consistency_firewall.verdict import FirewallVerdict, Severity


class FirewallEngine:
    """Deterministic validation engine.

    Usage:
        engine = FirewallEngine(rules=[CrossTotalRule(), TemporalRule(), ...])
        verdict = engine.run(facts)
        if not verdict.passed:
            # handle findings
    """

    def __init__(self, rules: list[FirewallRule] | None = None) -> None:
        self._rules: list[FirewallRule] = rules or []

    def register(self, rule: FirewallRule) -> None:
        """Register an additional rule."""
        self._rules.append(rule)

    @property
    def rules(self) -> list[FirewallRule]:
        """Read-only access to registered rules."""
        return list(self._rules)

    def run(self, facts: list[Fact]) -> FirewallVerdict:
        """Execute all registered rules and return a deterministic verdict.

        Args:
            facts: The dataset to validate. Not mutated.

        Returns:
            FirewallVerdict with all findings aggregated.

        The verdict passes if and only if there are zero ERROR or CRITICAL
        findings. WARNINGs and INFOs do not block approval.
        """
        all_findings = []
        start = time.perf_counter_ns()

        for rule in self._rules:
            findings = rule.evaluate(facts)
            all_findings.extend(findings)

        elapsed_ms = (time.perf_counter_ns() - start) / 1_000_000

        has_blocking = any(
            f.severity >= Severity.ERROR for f in all_findings
        )

        return FirewallVerdict(
            passed=not has_blocking,
            findings=all_findings,
            rules_executed=len(self._rules),
            run_duration_ms=elapsed_ms,
        )
