"""arq worker entrypoint and task registry.

Registers all pipeline stage tasks and configures the arq worker.
"""

from __future__ import annotations

from arq import cron  # type: ignore[import-untyped]
from arq.connections import RedisSettings  # type: ignore[import-untyped]

from services.worker.config import WorkerSettings
from services.worker.tasks.ingest import ingest_document
from services.worker.tasks.validate import validate_facts
from services.worker.tasks.generate import generate_report


def create_worker_settings() -> type:
    """Create the arq WorkerSettings class dynamically from config."""

    config = WorkerSettings()

    class WorkerConfig:
        """arq worker configuration."""

        # Task functions — one per pipeline stage
        functions = [
            ingest_document,     # Stage 1: Document ingestion
            validate_facts,      # Stage 5: Firewall validation
            generate_report,     # Stage 8: Report generation
            # TODO: Add remaining stages:
            # understand_layout,   # Stage 2
            # extract_facts,       # Stage 3
            # normalise_facts,     # Stage 4
            # retrieve_context,    # Stage 6
            # calculate_derived,   # Stage 7
        ]

        # Redis connection
        redis_settings = RedisSettings.from_dsn(config.redis_url)

        # Worker settings
        max_jobs = config.max_concurrent_jobs
        job_timeout = config.job_timeout_seconds

        # Health check
        health_check_interval = 30

    return WorkerConfig
