"""Unit tests for core_models Pydantic schemas."""

from __future__ import annotations

import datetime
from decimal import Decimal
from uuid import uuid4

import pytest
from pydantic import ValidationError

from core_models.document import Document, DocumentMetadata, DocumentStatus, SHA256Hash
from core_models.fact import BoundingBox, Evidence, Fact, FactStatus
from core_models.report import Report, ReportSection, ReportStatus
from core_models.audit import AuditAction, AuditRecord
from core_models.pipeline import JobStatus, PipelineJob, PipelineStage, StageResult
from core_models.subsidiary import SubsidiaryId


class TestSubsidiaryId:
    """Tests for subsidiary enum."""

    def test_all_subsidiaries_present(self) -> None:
        expected = {"ECL", "BCCL", "CCL", "WCL", "SECL", "MCL", "NCL", "CMPDI"}
        actual = {s.value for s in SubsidiaryId}
        assert actual == expected

    def test_str_enum(self) -> None:
        """SubsidiaryId should be usable as a string."""
        assert SubsidiaryId.ECL == "ECL"
        assert f"subsidiary: {SubsidiaryId.BCCL}" == "subsidiary: BCCL"


class TestDocument:
    """Tests for Document model."""

    def test_valid_document(self) -> None:
        doc = Document(
            id=uuid4(),
            sha256="a" * 64,
            filename="report.pdf",
            mime_type="application/pdf",
            storage_key="docs/abc123.pdf",
            subsidiary_id="ECL",
        )
        assert doc.status == DocumentStatus.UPLOADED
        assert len(doc.sha256) == 64

    def test_invalid_sha256_rejected(self) -> None:
        """SHA-256 must be exactly 64 hex characters."""
        with pytest.raises(ValidationError):
            Document(
                id=uuid4(),
                sha256="tooshort",
                filename="report.pdf",
                mime_type="application/pdf",
                storage_key="docs/abc.pdf",
                subsidiary_id="ECL",
            )

    def test_frozen(self) -> None:
        """Document should be immutable (R3)."""
        doc = Document(
            id=uuid4(),
            sha256="b" * 64,
            filename="report.pdf",
            mime_type="application/pdf",
            storage_key="docs/abc.pdf",
            subsidiary_id="ECL",
        )
        with pytest.raises(ValidationError):
            doc.filename = "changed.pdf"  # type: ignore[misc]


class TestFact:
    """Tests for Fact model."""

    def test_valid_fact(self) -> None:
        fact = Fact(
            id=uuid4(),
            document_id=uuid4(),
            category="production",
            metric_name="coal_output",
            numeric_value=Decimal("123.45"),
            unit="MT",
            subsidiary_id="SECL",
            extractor_version="1.0.0",
        )
        assert fact.status == FactStatus.CANDIDATE

    def test_confidence_bounds(self) -> None:
        """Confidence must be between 0 and 1."""
        with pytest.raises(ValidationError):
            Fact(
                id=uuid4(),
                document_id=uuid4(),
                category="production",
                metric_name="test",
                subsidiary_id="ECL",
                extractor_version="1.0.0",
                confidence=1.5,
            )


class TestPipelineJob:
    """Tests for PipelineJob model."""

    def test_valid_job(self) -> None:
        job = PipelineJob(
            id=uuid4(),
            document_sha256="c" * 64,
            stage=PipelineStage.EXTRACT,
            extractor_version="1.0.0",
            subsidiary_id="CCL",
        )
        assert job.status == JobStatus.PENDING

    def test_invalid_sha256_rejected(self) -> None:
        with pytest.raises(ValidationError):
            PipelineJob(
                id=uuid4(),
                document_sha256="invalid",
                stage=PipelineStage.EXTRACT,
                extractor_version="1.0.0",
                subsidiary_id="CCL",
            )

    def test_all_stages_defined(self) -> None:
        """All 10 pipeline stages must be present."""
        assert len(PipelineStage) == 10


class TestAuditRecord:
    """Tests for AuditRecord model."""

    def test_valid_record(self) -> None:
        record = AuditRecord(
            id=uuid4(),
            entity_type="fact",
            entity_id=uuid4(),
            action=AuditAction.CREATED,
            subsidiary_id="MCL",
        )
        assert record.actor_type == "system"

    def test_frozen(self) -> None:
        """Audit records must be immutable (R12)."""
        record = AuditRecord(
            id=uuid4(),
            entity_type="report",
            entity_id=uuid4(),
            action=AuditAction.APPROVED,
            subsidiary_id="NCL",
        )
        with pytest.raises(ValidationError):
            record.action = AuditAction.REJECTED  # type: ignore[misc]
