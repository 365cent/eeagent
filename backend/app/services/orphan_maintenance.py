"""Prune resolved object-store orphans and stale capture metadata (BE-01)."""
from __future__ import annotations

import asyncio

from app.db.base import SessionLocal
from app.services.orphan_objects import prune_resolved_orphans


async def _main() -> int:
    async with SessionLocal() as db:
        removed = await prune_resolved_orphans(db, limit=500)
        await db.commit()
    print(f"pruned_orphans={removed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(_main()))
