"""consistency_firewall — Deterministic validation engine (R2).

Pure Python. No I/O. No LLM calls. All data passed as function arguments.
"""

from consistency_firewall.engine import FirewallEngine
from consistency_firewall.verdict import Finding, FirewallVerdict, Severity

__all__ = [
    "Finding",
    "FirewallEngine",
    "FirewallVerdict",
    "Severity",
]
