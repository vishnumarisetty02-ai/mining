"""Firewall rule base class and protocol."""

from __future__ import annotations

from abc import ABC, abstractmethod

from core_models.fact import Fact

from consistency_firewall.verdict import Finding


class FirewallRule(ABC):
    """Abstract base class for all Consistency Firewall rules.

    Each rule is a pure function: it receives facts and returns findings.
    No I/O, no LLM calls, no side effects (R2).
    """

    @property
    @abstractmethod
    def rule_id(self) -> str:
        """Unique identifier for this rule, e.g. 'cross_total_001'."""

    @property
    @abstractmethod
    def rule_name(self) -> str:
        """Human-readable name for this rule."""

    @abstractmethod
    def evaluate(self, facts: list[Fact]) -> list[Finding]:
        """Evaluate this rule against the given facts.

        Args:
            facts: The facts to validate. Must not be mutated.

        Returns:
            A list of findings. Empty list means the rule passed.
        """
