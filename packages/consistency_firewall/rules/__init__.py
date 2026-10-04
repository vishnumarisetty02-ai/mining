"""Built-in Consistency Firewall rules."""

from consistency_firewall.rules.cross_total import CrossTotalRule
from consistency_firewall.rules.range_check import RangeCheckRule
from consistency_firewall.rules.temporal import TemporalConsistencyRule
from consistency_firewall.rules.unit_compat import UnitCompatibilityRule

__all__ = [
    "CrossTotalRule",
    "RangeCheckRule",
    "TemporalConsistencyRule",
    "UnitCompatibilityRule",
]
