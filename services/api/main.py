"""GeoMine API — FastAPI application factory.

R11: Observability from day one (structured logs, OTEL, Prometheus).
R13: Multi-tenancy middleware for RLS.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.api.config import Settings
from services.api.routers import (
    documents_router,
    facts_router,
    health_router,
    questions_router,
    reports_router,
)


def configure_logging(settings: Settings) -> None:
    """Configure structured JSON logging (R11)."""
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.getLevelName(settings.log_level)
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def create_app(settings: Settings | None = None) -> FastAPI:
    """Create and configure the FastAPI application.

    Args:
        settings: Application settings. If None, loaded from environment.

    Returns:
        Configured FastAPI instance.
    """
    settings = settings or Settings()

    configure_logging(settings)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
        """Application lifespan: startup and shutdown."""
        log = structlog.get_logger()
        await log.ainfo("geomine_api_starting", version=settings.api_version)

        # TODO: Initialize database engine, Redis, MinIO client
        yield

        await log.ainfo("geomine_api_shutting_down")
        # TODO: Close connections

    app = FastAPI(
        title=settings.api_title,
        version=settings.api_version,
        description=(
            "GeoMine Intelligence & Reporting Platform API. "
            "Governed AI for CMPDI and Coal India subsidiaries."
        ),
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # ── CORS ──────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────
    app.include_router(health_router)
    app.include_router(documents_router, prefix="/api/v1")
    app.include_router(facts_router, prefix="/api/v1")
    app.include_router(reports_router, prefix="/api/v1")
    app.include_router(questions_router, prefix="/api/v1")

    return app


# Default app instance for uvicorn
app = create_app()
