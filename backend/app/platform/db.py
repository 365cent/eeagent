"""Database engine, sessions, and worker-scoped session helper."""
from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import SessionLocal, engine, get_db

__all__ = ["SessionLocal", "engine", "get_db", "session_scope"]


@asynccontextmanager
async def session_scope() -> AsyncIterator[AsyncSession]:
    """One transactional async session for workers and scripts (not FastAPI Depends)."""
    async with SessionLocal() as session:
        yield session
