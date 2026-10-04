"""Unit tests for the FastAPI API endpoints."""

from __future__ import annotations

import pytest
from httpx import AsyncClient, ASGITransport

from services.api.main import create_app
from services.api.config import Settings


@pytest.fixture
def app():
    """Create a test app instance."""
    settings = Settings(debug=True)
    return create_app(settings)


@pytest.fixture
async def client(app):
    """Create an async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


class TestHealthEndpoints:
    """Tests for health check endpoints (R11)."""

    @pytest.mark.asyncio
    async def test_healthz(self, client: AsyncClient) -> None:
        resp = await client.get("/healthz")
        assert resp.status_code == 200
        assert resp.json()["status"] == "alive"

    @pytest.mark.asyncio
    async def test_readyz(self, client: AsyncClient) -> None:
        resp = await client.get("/readyz")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ready"


class TestDocumentEndpoints:
    """Tests for document API endpoints."""

    @pytest.mark.asyncio
    async def test_list_documents_empty(self, client: AsyncClient) -> None:
        resp = await client.get("/api/v1/documents/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["items"] == []
        assert data["total"] == 0

    @pytest.mark.asyncio
    async def test_upload_empty_file_rejected(self, client: AsyncClient) -> None:
        resp = await client.post(
            "/api/v1/documents/upload",
            files={"file": ("empty.pdf", b"", "application/pdf")},
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_upload_unsupported_type_rejected(self, client: AsyncClient) -> None:
        resp = await client.post(
            "/api/v1/documents/upload",
            files={"file": ("script.py", b"print('hello')", "text/x-python")},
        )
        assert resp.status_code == 415

    @pytest.mark.asyncio
    async def test_upload_valid_pdf(self, client: AsyncClient) -> None:
        resp = await client.post(
            "/api/v1/documents/upload",
            files={"file": ("report.pdf", b"%PDF-1.4 test content", "application/pdf")},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert "sha256" in data
        assert len(data["sha256"]) == 64
        assert data["filename"] == "report.pdf"

    @pytest.mark.asyncio
    async def test_get_nonexistent_document(self, client: AsyncClient) -> None:
        resp = await client.get("/api/v1/documents/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404


class TestFactEndpoints:
    """Tests for facts API endpoints."""

    @pytest.mark.asyncio
    async def test_list_facts_empty(self, client: AsyncClient) -> None:
        resp = await client.get("/api/v1/facts/")
        assert resp.status_code == 200
        assert resp.json()["items"] == []


class TestReportEndpoints:
    """Tests for report API endpoints."""

    @pytest.mark.asyncio
    async def test_list_reports_empty(self, client: AsyncClient) -> None:
        resp = await client.get("/api/v1/reports/")
        assert resp.status_code == 200
        assert resp.json()["items"] == []


class TestQuestionEndpoints:
    """Tests for parliamentary Q&A endpoints."""

    @pytest.mark.asyncio
    async def test_ask_not_implemented(self, client: AsyncClient) -> None:
        resp = await client.post(
            "/api/v1/questions/ask",
            json={
                "question": "What is the total coal production for FY 2024-25?",
            },
        )
        # Currently returns 501 as pipeline is not yet wired
        assert resp.status_code == 501


class TestOpenAPISchema:
    """Tests for OpenAPI contract generation."""

    @pytest.mark.asyncio
    async def test_openapi_available(self, client: AsyncClient) -> None:
        resp = await client.get("/openapi.json")
        assert resp.status_code == 200
        schema = resp.json()
        assert schema["info"]["title"] == "GeoMine API"
        assert "paths" in schema
