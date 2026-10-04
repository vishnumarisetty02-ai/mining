"""Unit tests for document_ai ingestion and normalisation."""

from __future__ import annotations

from decimal import Decimal

import pytest

from document_ai.ingest import compute_sha256, detect_mime_type
from document_ai.normaliser import (
    match_subsidiary,
    normalise_numeric,
    normalise_unit,
)


# ── SHA-256 tests ─────────────────────────────────────────────────────

class TestComputeSHA256:
    """Tests for SHA-256 hashing (R3)."""

    def test_deterministic(self) -> None:
        """Same bytes must produce same hash."""
        data = b"Coal India production report 2025"
        assert compute_sha256(data) == compute_sha256(data)

    def test_different_data_different_hash(self) -> None:
        """Different data must produce different hashes."""
        assert compute_sha256(b"data1") != compute_sha256(b"data2")

    def test_hash_length(self) -> None:
        """SHA-256 hex digest is always 64 characters."""
        h = compute_sha256(b"test")
        assert len(h) == 64
        assert all(c in "0123456789abcdef" for c in h)

    def test_empty_bytes(self) -> None:
        """Empty bytes should produce the well-known SHA-256 of empty string."""
        h = compute_sha256(b"")
        assert h == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"


# ── MIME detection tests ──────────────────────────────────────────────

class TestDetectMimeType:
    """Tests for MIME type detection."""

    @pytest.mark.parametrize("filename,expected", [
        ("report.pdf", "application/pdf"),
        ("data.csv", "text/csv"),
        ("doc.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        ("sheet.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        ("scan.png", "image/png"),
        ("photo.jpeg", "image/jpeg"),
    ])
    def test_supported_types(self, filename: str, expected: str) -> None:
        """Supported file types should be detected correctly."""
        actual = detect_mime_type(filename)
        if filename == "data.csv":
            assert actual in ("text/csv", "application/vnd.ms-excel")
        else:
            assert actual == expected

    def test_unsupported_type_raises(self) -> None:
        """Unsupported file types should raise ValueError."""
        with pytest.raises(ValueError, match="Unsupported"):
            detect_mime_type("script.py")

    def test_unknown_extension_raises(self) -> None:
        """Unknown extensions should raise ValueError."""
        with pytest.raises(ValueError, match="Cannot detect"):
            detect_mime_type("noext")


# ── Numeric normalisation tests ───────────────────────────────────────

class TestNormaliseNumeric:
    """Tests for numeric value parsing."""

    def test_simple_integer(self) -> None:
        assert normalise_numeric("12345") == Decimal("12345")

    def test_decimal(self) -> None:
        assert normalise_numeric("123.45") == Decimal("123.45")

    def test_western_commas(self) -> None:
        """Western-style comma thousands."""
        assert normalise_numeric("1,234,567") == Decimal("1234567")

    def test_indian_commas(self) -> None:
        """Indian-style comma grouping (1,23,456)."""
        assert normalise_numeric("1,23,456") == Decimal("123456")

    def test_negative(self) -> None:
        assert normalise_numeric("-42.5") == Decimal("-42.5")

    def test_empty_string_returns_none(self) -> None:
        assert normalise_numeric("") is None

    def test_non_numeric_returns_none(self) -> None:
        assert normalise_numeric("not a number") is None

    def test_whitespace_stripped(self) -> None:
        assert normalise_numeric("  123  ") == Decimal("123")


# ── Unit normalisation tests ──────────────────────────────────────────

class TestNormaliseUnit:
    """Tests for unit string normalisation."""

    @pytest.mark.parametrize("raw,expected", [
        ("mt", "MT"),
        ("Million Tonnes", "MT"),
        ("m.t.", "MT"),
        ("tonnes", "tonnes"),
        ("ha", "ha"),
        ("Hectares", "ha"),
        ("%", "percent"),
        ("Rs Crore", "Rs_crore"),
    ])
    def test_known_aliases(self, raw: str, expected: str) -> None:
        assert normalise_unit(raw) == expected

    def test_unknown_unit_passthrough(self) -> None:
        """Unknown units should be returned trimmed but unchanged."""
        assert normalise_unit("  widgets  ") == "widgets"


# ── Subsidiary matching tests ─────────────────────────────────────────

class TestMatchSubsidiary:
    """Tests for fuzzy entity name matching."""

    def test_exact_match(self) -> None:
        assert match_subsidiary("Eastern Coalfields Limited") == "ECL"

    def test_fuzzy_match(self) -> None:
        """Fuzzy match with minor spelling variation."""
        result = match_subsidiary("Eastern Coalfield Ltd")
        assert result == "ECL"

    def test_no_match(self) -> None:
        """Unrelated name should return None."""
        assert match_subsidiary("Random Company XYZ") is None

    def test_cmpdi(self) -> None:
        result = match_subsidiary("Central Mine Planning and Design Institute")
        assert result == "CMPDI"
