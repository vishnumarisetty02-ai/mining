"""Unit and entity normalisation for extracted facts.

Uses pint for unit conversion and rapidfuzz for entity name matching.
"""

from __future__ import annotations

import re
from decimal import Decimal

from rapidfuzz import fuzz


# ── Unit normalisation ─────────────────────────────────────────────────
# Common unit aliases found in Coal India documents.
_UNIT_ALIASES: dict[str, str] = {
    "mt": "MT",
    "million tonnes": "MT",
    "m.t.": "MT",
    "million tonne": "MT",
    "lakh tonnes": "lakh_tonnes",
    "lt": "lakh_tonnes",
    "tonnes": "tonnes",
    "te": "tonnes",
    "t": "tonnes",
    "cum": "m³",
    "cu.m": "m³",
    "cubic metre": "m³",
    "cubic meters": "m³",
    "mcum": "Mm³",
    "million cubic metres": "Mm³",
    "mm³": "Mm³",
    "ha": "ha",
    "hectare": "ha",
    "hectares": "ha",
    "nos": "count",
    "numbers": "count",
    "nos.": "count",
    "persons": "persons",
    "mandays": "mandays",
    "man-days": "mandays",
    "kcal/kg": "kcal/kg",
    "rs crore": "Rs_crore",
    "rs. crore": "Rs_crore",
    "crore": "Rs_crore",
    "%": "percent",
    "percent": "percent",
}


def normalise_unit(raw_unit: str) -> str:
    """Normalise a unit string to a canonical form.

    Args:
        raw_unit: The raw unit string from extraction.

    Returns:
        Normalised unit string.
    """
    cleaned = raw_unit.strip().lower()
    return _UNIT_ALIASES.get(cleaned, raw_unit.strip())


# ── Numeric normalisation ─────────────────────────────────────────────

# Pattern for numbers with optional commas and decimals.
_NUMBER_PATTERN = re.compile(r"^[+-]?[\d,]+\.?\d*$")


def normalise_numeric(raw_value: str) -> Decimal | None:
    """Parse a raw numeric string to Decimal, handling Indian-style commas.

    Args:
        raw_value: The raw string, e.g. "1,23,456.78" or "12345.6".

    Returns:
        Decimal value or None if parsing fails.
    """
    cleaned = raw_value.strip().replace(" ", "")
    if not cleaned:
        return None

    # Remove commas (handles both Indian and Western notation)
    cleaned = cleaned.replace(",", "")

    if _NUMBER_PATTERN.match(cleaned):
        try:
            return Decimal(cleaned)
        except Exception:  # noqa: BLE001
            return None
    return None


# ── Entity name matching ───────────────────────────────────────────────

# Canonical subsidiary names for fuzzy matching.
_SUBSIDIARY_NAMES: dict[str, str] = {
    "Eastern Coalfields Limited": "ECL",
    "Bharat Coking Coal Limited": "BCCL",
    "Central Coalfields Limited": "CCL",
    "Western Coalfields Limited": "WCL",
    "South Eastern Coalfields Limited": "SECL",
    "Mahanadi Coalfields Limited": "MCL",
    "Northern Coalfields Limited": "NCL",
    "Central Mine Planning and Design Institute": "CMPDI",
}


def match_subsidiary(raw_name: str, threshold: int = 80) -> str | None:
    """Fuzzy-match a raw entity name to a canonical subsidiary ID.

    Args:
        raw_name: The raw name from document extraction.
        threshold: Minimum fuzzy match score (0-100).

    Returns:
        Canonical subsidiary ID or None if no match above threshold.
    """
    best_score = 0
    best_match: str | None = None

    for canonical, code in _SUBSIDIARY_NAMES.items():
        score = fuzz.token_sort_ratio(raw_name.lower(), canonical.lower())
        if score > best_score and score >= threshold:
            best_score = score
            best_match = code

    return best_match
