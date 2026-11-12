from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import DemandPoint


async def compute_basis_freshness(db: AsyncSession, demand: DemandPoint | None) -> str:
    """BE-11 placeholder: compare only after an explicit review baseline exists."""
    del db, demand
    return "unknown_untracked"
