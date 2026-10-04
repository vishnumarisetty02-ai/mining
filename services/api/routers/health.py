"""Health check router (R11: observability from day one)."""

from __future__ import annotations

from fastapi import APIRouter, Response

router = APIRouter(tags=["health"])


@router.get("/healthz", summary="Liveness probe")
async def healthz() -> dict[str, str]:
    """Kubernetes liveness probe. Returns 200 if the process is alive."""
    return {"status": "alive"}


@router.get("/readyz", summary="Readiness probe")
async def readyz() -> dict[str, str]:
    """Kubernetes readiness probe.

    TODO: Check PostgreSQL, Redis, and MinIO connectivity.
    """
    # Placeholder — will be wired to actual dependency checks
    return {"status": "ready"}


@router.get("/metrics", summary="Prometheus metrics", include_in_schema=False)
async def metrics() -> Response:
    """Expose Prometheus metrics.

    TODO: Wire prometheus_client.generate_latest().
    """
    return Response(
        content="# Prometheus metrics placeholder\n",
        media_type="text/plain; version=0.0.4; charset=utf-8",
    )
