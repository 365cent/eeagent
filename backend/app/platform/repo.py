"""Repository helpers shared across domains."""
from __future__ import annotations

from typing import TypeVar

from sqlalchemy import Select
from sqlalchemy.ext.asyncio import AsyncSession

from app.platform.errors import NotFoundError

T = TypeVar("T")


async def scalar_one_or_not_found(
    db: AsyncSession,
    stmt: Select[tuple[T]],
    *,
    detail: str,
) -> T:
    row = (await db.execute(stmt)).scalar_one_or_none()
    if row is None:
        raise NotFoundError(detail)
    return row
