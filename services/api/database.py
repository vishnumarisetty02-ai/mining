"""Async database engine and session management.

R13: Multi-tenancy via PostgreSQL RLS. The subsidiary_id is set as a session
variable before every query.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy import text

from services.api.config import Settings


def create_engine(settings: Settings) -> AsyncEngine:
    """Create the async SQLAlchemy engine."""
    return create_async_engine(
        settings.database_url,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        echo=settings.debug,
    )


def create_session_factory(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    """Create the session factory."""
    return async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


@asynccontextmanager
async def get_tenant_session(
    session_factory: async_sessionmaker[AsyncSession],
    subsidiary_id: str,
) -> AsyncGenerator[AsyncSession, None]:
    """Create a database session with RLS tenant context set (R13).

    Sets the PostgreSQL session variable `app.subsidiary_id` so that
    RLS policies filter all queries to the correct subsidiary.

    Args:
        session_factory: SQLAlchemy async session factory.
        subsidiary_id: The authenticated user's subsidiary.

    Yields:
        AsyncSession with RLS context configured.
    """
    async with session_factory() as session:
        # Set the RLS variable for this session (R13)
        await session.execute(
            text("SET app.subsidiary_id = :sid"),
            {"sid": subsidiary_id},
        )
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
