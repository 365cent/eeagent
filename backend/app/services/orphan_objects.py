"""Track object-store blobs written before a failed DB commit."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import StoredObjectOrphan
from app.services.objectstore import load_bytes


async def record_orphan_object(db: AsyncSession, object_key: str, reason: str) -> None:
    if not object_key:
        return
    existing = await db.get(StoredObjectOrphan, object_key)
    if existing is not None:
        return
    db.add(StoredObjectOrphan(object_key=object_key, reason=reason[:500]))


async def resolve_orphan_object(db: AsyncSession, object_key: str) -> None:
    row = await db.get(StoredObjectOrphan, object_key)
    if row is None:
        return
    row.resolved_at = datetime.now(timezone.utc)


async def prune_resolved_orphans(db: AsyncSession, *, limit: int = 200) -> int:
    """Delete orphan rows whose blobs are missing or marked resolved."""
    rows = (await db.execute(select(StoredObjectOrphan).limit(limit))).scalars().all()
    removed = 0
    for row in rows:
        if row.resolved_at is not None or load_bytes(row.object_key) is None:
            await db.execute(delete(StoredObjectOrphan).where(StoredObjectOrphan.object_key == row.object_key))
            removed += 1
    return removed
