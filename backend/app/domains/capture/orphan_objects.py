"""Track object-store blobs written before a failed DB commit."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import StoredObjectOrphan
from app.platform.objectstore import load_bytes


@dataclass(frozen=True)
class OrphanPruneResult:
    """What one prune scan saw and would remove."""

    scanned: int
    pruned: int
    resolved: int
    missing_blob: int
    object_keys: tuple[str, ...] = ()


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


async def prune_resolved_orphans(
    db: AsyncSession, *, limit: int = 200, apply: bool = True
) -> OrphanPruneResult:
    """Delete orphan rows whose blobs are missing or marked resolved.

    With apply=False, only counts rows that would be removed. Resolved rows
    count once even when their blob is also missing.
    """
    rows = (await db.execute(select(StoredObjectOrphan).limit(limit))).scalars().all()
    pruned = resolved = missing_blob = 0
    pruned_keys: list[str] = []
    for row in rows:
        if row.resolved_at is not None:
            resolved += 1
        elif load_bytes(row.object_key) is None:
            missing_blob += 1
        else:
            continue
        if apply:
            await db.execute(
                delete(StoredObjectOrphan).where(StoredObjectOrphan.object_key == row.object_key)
            )
        pruned += 1
        pruned_keys.append(row.object_key)
    return OrphanPruneResult(
        scanned=len(rows),
        pruned=pruned,
        resolved=resolved,
        missing_blob=missing_blob,
        object_keys=tuple(sorted(pruned_keys)),
    )
