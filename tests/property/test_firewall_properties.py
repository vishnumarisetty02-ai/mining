"""Property-based tests for the Consistency Firewall (Hypothesis).

R10: Every change ships with tests. Property tests verify invariants
across random inputs.
"""

from __future__ import annotations

import datetime
from decimal import Decimal
from uuid import uuid4

from hypothesis import given, settings, strategies as st

from core_models.fact import Evidence, Fact, FactStatus
from consistency_firewall.engine import FirewallEngine
from consistency_firewall.rules.cross_total import CrossTotalRule
from consistency_firewall.rules.range_check import RangeCheckRule
from consistency_firewall.rules.temporal import TemporalConsistencyRule
from consistency_firewall.rules.unit_compat import UnitCompatibilityRule
from consistency_firewall.verdict import Severity


# ── Strategies ────────────────────────────────────────────────────────

@st.composite
def fact_strategy(draw: st.DrawFn) -> Fact:
    """Generate a random Fact for property testing."""
    fact_id = uuid4()
    doc_id = uuid4()
    return Fact(
        id=fact_id,
        document_id=doc_id,
        category=draw(st.sampled_from(["production", "geology", "finance", "safety"])),
        metric_name=draw(st.sampled_from([
            "production", "overburden_removal", "coal_dispatch",
            "total_production", "subsidiary_production",
            "cumulative_production", "stripping_ratio",
        ])),
        numeric_value=draw(st.one_of(
            st.none(),
            st.decimals(min_value=Decimal("-100"), max_value=Decimal("10000"), places=2),
        )),
        unit=draw(st.one_of(st.none(), st.sampled_from(["MT", "tonnes", "m³", "ha", "percent"]))),
        period_start=draw(st.one_of(st.none(), st.dates(
            min_value=datetime.date(2020, 1, 1),
            max_value=datetime.date(2025, 12, 31),
        ))),
        period_end=draw(st.one_of(st.none(), st.dates(
            min_value=datetime.date(2020, 1, 1),
            max_value=datetime.date(2025, 12, 31),
        ))),
        subsidiary_id=draw(st.sampled_from(["ECL", "BCCL", "CCL", "WCL", "SECL", "MCL", "NCL"])),
        status=FactStatus.CANDIDATE,
        extractor_version="1.0.0",
        evidence=[
            Evidence(
                id=uuid4(),
                fact_id=fact_id,
                document_id=doc_id,
                page_number=1,
                extracted_text="property test evidence",
                subsidiary_id="ECL",
            ),
        ],
    )


# ── Properties ────────────────────────────────────────────────────────

class TestFirewallProperties:
    """Property-based tests for Firewall invariants."""

    @given(facts=st.lists(fact_strategy(), min_size=0, max_size=20))
    @settings(max_examples=100)
    def test_engine_never_crashes(self, facts: list[Fact]) -> None:
        """The firewall engine must never crash on any valid input."""
        engine = FirewallEngine(rules=[
            CrossTotalRule(),
            TemporalConsistencyRule(),
            RangeCheckRule(),
            UnitCompatibilityRule(),
        ])
        verdict = engine.run(facts)
        # Must always return a valid verdict
        assert isinstance(verdict.passed, bool)
        assert verdict.rules_executed == 4
        assert verdict.run_duration_ms >= 0

    @given(facts=st.lists(fact_strategy(), min_size=0, max_size=20))
    @settings(max_examples=100)
    def test_deterministic_output(self, facts: list[Fact]) -> None:
        """Same input must always produce same findings (R2)."""
        engine = FirewallEngine(rules=[
            CrossTotalRule(),
            TemporalConsistencyRule(),
            RangeCheckRule(),
            UnitCompatibilityRule(),
        ])
        v1 = engine.run(facts)
        v2 = engine.run(facts)
        assert v1.passed == v2.passed
        assert len(v1.findings) == len(v2.findings)
        for f1, f2 in zip(v1.findings, v2.findings):
            assert f1.rule_id == f2.rule_id
            assert f1.severity == f2.severity

    @given(facts=st.lists(fact_strategy(), min_size=0, max_size=20))
    @settings(max_examples=100)
    def test_passed_iff_no_blocking_findings(self, facts: list[Fact]) -> None:
        """Verdict passes iff there are no ERROR or CRITICAL findings."""
        engine = FirewallEngine(rules=[
            CrossTotalRule(),
            TemporalConsistencyRule(),
            RangeCheckRule(),
            UnitCompatibilityRule(),
        ])
        verdict = engine.run(facts)
        has_blocking = any(f.severity >= Severity.ERROR for f in verdict.findings)
        assert verdict.passed == (not has_blocking)

    @given(facts=st.lists(fact_strategy(), min_size=0, max_size=20))
    @settings(max_examples=100)
    def test_every_finding_has_rule_id(self, facts: list[Fact]) -> None:
        """Every finding must be traceable to a specific rule."""
        engine = FirewallEngine(rules=[
            CrossTotalRule(),
            TemporalConsistencyRule(),
            RangeCheckRule(),
            UnitCompatibilityRule(),
        ])
        verdict = engine.run(facts)
        for finding in verdict.findings:
            assert finding.rule_id
            assert finding.rule_name
