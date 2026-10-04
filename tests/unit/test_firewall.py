"""Unit tests for the Consistency Firewall engine and rules.

Test-first for parsers, normalisers and Firewall rules (Working Protocol #3).
"""

from __future__ import annotations

import datetime
from decimal import Decimal
from uuid import uuid4

import pytest

from core_models.fact import BoundingBox, Evidence, Fact, FactStatus
from consistency_firewall.engine import FirewallEngine
from consistency_firewall.verdict import Severity
from consistency_firewall.rules.cross_total import CrossTotalRule
from consistency_firewall.rules.temporal import TemporalConsistencyRule
from consistency_firewall.rules.range_check import RangeCheckRule
from consistency_firewall.rules.unit_compat import UnitCompatibilityRule


# ── Helpers ───────────────────────────────────────────────────────────

def _make_fact(
    metric_name: str = "production",
    numeric_value: Decimal | None = Decimal("100"),
    unit: str | None = "MT",
    period_start: datetime.date | None = None,
    period_end: datetime.date | None = None,
    subsidiary_id: str = "ECL",
    category: str = "production",
) -> Fact:
    """Create a test fact with sensible defaults."""
    fact_id = uuid4()
    doc_id = uuid4()
    return Fact(
        id=fact_id,
        document_id=doc_id,
        category=category,
        metric_name=metric_name,
        numeric_value=numeric_value,
        unit=unit,
        period_start=period_start,
        period_end=period_end,
        subsidiary_id=subsidiary_id,
        status=FactStatus.CANDIDATE,
        extractor_version="1.0.0",
        evidence=[
            Evidence(
                id=uuid4(),
                fact_id=fact_id,
                document_id=doc_id,
                page_number=1,
                extracted_text="test evidence",
                subsidiary_id=subsidiary_id,
            )
        ],
    )


# ── FirewallEngine tests ─────────────────────────────────────────────

class TestFirewallEngine:
    """Tests for the FirewallEngine orchestrator."""

    def test_empty_rules_passes(self) -> None:
        """Engine with no rules should always pass."""
        engine = FirewallEngine(rules=[])
        verdict = engine.run(facts=[])
        assert verdict.passed is True
        assert verdict.rules_executed == 0
        assert len(verdict.findings) == 0

    def test_engine_runs_all_rules(self) -> None:
        """Engine should execute all registered rules."""
        engine = FirewallEngine(rules=[
            CrossTotalRule(),
            TemporalConsistencyRule(),
            RangeCheckRule(),
            UnitCompatibilityRule(),
        ])
        facts = [_make_fact()]
        verdict = engine.run(facts)
        assert verdict.rules_executed == 4

    def test_engine_passes_with_clean_data(self) -> None:
        """Engine should pass when all facts are consistent."""
        engine = FirewallEngine(rules=[
            CrossTotalRule(),
            RangeCheckRule(),
        ])
        facts = [
            _make_fact(metric_name="production", numeric_value=Decimal("50")),
        ]
        verdict = engine.run(facts)
        assert verdict.passed is True

    def test_register_adds_rule(self) -> None:
        """register() should add a rule to the engine."""
        engine = FirewallEngine()
        assert len(engine.rules) == 0
        engine.register(CrossTotalRule())
        assert len(engine.rules) == 1

    def test_verdict_is_deterministic(self) -> None:
        """Same inputs must produce same output (R2)."""
        engine = FirewallEngine(rules=[CrossTotalRule(), RangeCheckRule()])
        facts = [_make_fact(numeric_value=Decimal("50"))]
        v1 = engine.run(facts)
        v2 = engine.run(facts)
        assert v1.passed == v2.passed
        assert len(v1.findings) == len(v2.findings)


# ── CrossTotalRule tests ──────────────────────────────────────────────

class TestCrossTotalRule:
    """Tests for the cross-total consistency rule."""

    def test_matching_totals_pass(self) -> None:
        """When total equals sum of components, no findings."""
        rule = CrossTotalRule()
        facts = [
            _make_fact(
                metric_name="total_production",
                numeric_value=Decimal("100"),
                period_start=datetime.date(2025, 1, 1),
                period_end=datetime.date(2025, 12, 31),
            ),
            _make_fact(
                metric_name="subsidiary_production",
                numeric_value=Decimal("60"),
                period_start=datetime.date(2025, 1, 1),
                period_end=datetime.date(2025, 12, 31),
                subsidiary_id="ECL",
            ),
            _make_fact(
                metric_name="subsidiary_production",
                numeric_value=Decimal("40"),
                period_start=datetime.date(2025, 1, 1),
                period_end=datetime.date(2025, 12, 31),
                subsidiary_id="BCCL",
            ),
        ]
        findings = rule.evaluate(facts)
        assert len(findings) == 0

    def test_mismatched_totals_critical(self) -> None:
        """When total doesn't match components, should produce CRITICAL finding."""
        rule = CrossTotalRule()
        facts = [
            _make_fact(
                metric_name="total_production",
                numeric_value=Decimal("100"),
                period_start=datetime.date(2025, 1, 1),
                period_end=datetime.date(2025, 12, 31),
            ),
            _make_fact(
                metric_name="subsidiary_production",
                numeric_value=Decimal("30"),
                period_start=datetime.date(2025, 1, 1),
                period_end=datetime.date(2025, 12, 31),
            ),
            _make_fact(
                metric_name="subsidiary_production",
                numeric_value=Decimal("40"),
                period_start=datetime.date(2025, 1, 1),
                period_end=datetime.date(2025, 12, 31),
            ),
        ]
        findings = rule.evaluate(facts)
        assert len(findings) == 1
        assert findings[0].severity == Severity.CRITICAL
        assert "100" in findings[0].message
        assert "70" in findings[0].message

    def test_no_components_no_finding(self) -> None:
        """Total with no components should not produce a finding."""
        rule = CrossTotalRule()
        facts = [
            _make_fact(
                metric_name="total_production",
                numeric_value=Decimal("100"),
                period_start=datetime.date(2025, 1, 1),
                period_end=datetime.date(2025, 12, 31),
            ),
        ]
        findings = rule.evaluate(facts)
        assert len(findings) == 0


# ── RangeCheckRule tests ──────────────────────────────────────────────

class TestRangeCheckRule:
    """Tests for physical range validation."""

    def test_valid_range_passes(self) -> None:
        """Value within plausible range produces no findings."""
        rule = RangeCheckRule()
        facts = [_make_fact(metric_name="production", numeric_value=Decimal("50"))]
        findings = rule.evaluate(facts)
        assert len(findings) == 0

    def test_negative_production_errors(self) -> None:
        """Negative production is physically implausible."""
        rule = RangeCheckRule()
        facts = [_make_fact(metric_name="production", numeric_value=Decimal("-10"))]
        findings = rule.evaluate(facts)
        assert len(findings) == 1
        assert findings[0].severity == Severity.ERROR

    def test_extreme_value_errors(self) -> None:
        """Extremely high production exceeds plausible bounds."""
        rule = RangeCheckRule()
        facts = [_make_fact(metric_name="production", numeric_value=Decimal("9999"))]
        findings = rule.evaluate(facts)
        assert len(findings) == 1
        assert findings[0].severity == Severity.ERROR

    def test_none_value_ignored(self) -> None:
        """Facts with None numeric_value should be skipped."""
        rule = RangeCheckRule()
        facts = [_make_fact(metric_name="production", numeric_value=None)]
        findings = rule.evaluate(facts)
        assert len(findings) == 0


# ── TemporalConsistencyRule tests ─────────────────────────────────────

class TestTemporalConsistencyRule:
    """Tests for temporal ordering validation."""

    def test_monotonic_cumulative_passes(self) -> None:
        """Non-decreasing cumulative values pass."""
        rule = TemporalConsistencyRule()
        facts = [
            _make_fact(
                metric_name="cumulative_production",
                numeric_value=Decimal("100"),
                period_end=datetime.date(2025, 3, 31),
            ),
            _make_fact(
                metric_name="cumulative_production",
                numeric_value=Decimal("200"),
                period_end=datetime.date(2025, 6, 30),
            ),
        ]
        findings = rule.evaluate(facts)
        # Filter only monotonicity findings (not future date warnings)
        mono_findings = [f for f in findings if "decreased" in f.message]
        assert len(mono_findings) == 0

    def test_decreasing_cumulative_errors(self) -> None:
        """Decreasing cumulative value should produce ERROR."""
        rule = TemporalConsistencyRule()
        facts = [
            _make_fact(
                metric_name="cumulative_production",
                numeric_value=Decimal("200"),
                period_end=datetime.date(2024, 3, 31),
            ),
            _make_fact(
                metric_name="cumulative_production",
                numeric_value=Decimal("150"),
                period_end=datetime.date(2024, 6, 30),
            ),
        ]
        findings = rule.evaluate(facts)
        mono_findings = [f for f in findings if "decreased" in f.message]
        assert len(mono_findings) == 1
        assert mono_findings[0].severity == Severity.ERROR


# ── UnitCompatibilityRule tests ───────────────────────────────────────

class TestUnitCompatibilityRule:
    """Tests for unit compatibility validation."""

    def test_compatible_units_pass(self) -> None:
        """Same unit family should pass."""
        rule = UnitCompatibilityRule()
        facts = [
            _make_fact(metric_name="production", unit="MT"),
            _make_fact(metric_name="production", unit="tonnes"),
        ]
        findings = rule.evaluate(facts)
        # MT and tonnes are in the same 'mass' family — should pass
        critical = [f for f in findings if f.severity >= Severity.ERROR]
        assert len(critical) == 0

    def test_incompatible_units_critical(self) -> None:
        """Mixing mass and volume units should be CRITICAL."""
        rule = UnitCompatibilityRule()
        facts = [
            _make_fact(metric_name="production", unit="MT"),
            _make_fact(metric_name="production", unit="m³"),
        ]
        findings = rule.evaluate(facts)
        critical = [f for f in findings if f.severity == Severity.CRITICAL]
        assert len(critical) == 1

    def test_unknown_unit_warns(self) -> None:
        """Unrecognised unit should produce WARNING."""
        rule = UnitCompatibilityRule()
        facts = [
            _make_fact(metric_name="production", unit="blorps"),
        ]
        findings = rule.evaluate(facts)
        warnings = [f for f in findings if f.severity == Severity.WARNING]
        assert len(warnings) == 1
