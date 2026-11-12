"""Compare demand review baseline against upstream evidence updates (BE-11)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import DemandPoint, Document, Signal
from app.services.objectstore import load_bytes


def _aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


async def _evidence_signal_ids(demand: DemandPoint) -> list[uuid.UUID]:
    raw = demand.cross_validation if isinstance(demand.cross_validation, dict) else {}
    ids: list[uuid.UUID] = []
    for item in raw.get("evidence_signal_ids") or []:
        try:
            ids.append(uuid.UUID(str(item)))
        except (ValueError, TypeError):
            continue
    return ids


async def compute_basis_freshness(db: AsyncSession, demand: DemandPoint | None) -> str:
    if demand is None:
        return "unknown_untracked"
    if demand.review_status != "confirmed":
        return "unconfirmed"
    baseline = _aware(demand.confirmed_at)
    if baseline is None:
        return "unknown_untracked"

    latest: datetime | None = _aware(demand.updated_at)

    theme_id = demand.source_tech_theme_id
    if theme_id is not None:
        theme_max = (
            await db.execute(
                select(func.max(Signal.updated_at)).where(Signal.tech_theme_id == theme_id)
            )
        ).scalar_one_or_none()
        theme_max = _aware(theme_max)
        if theme_max and (latest is None or theme_max > latest):
            latest = theme_max

    cited_ids = await _evidence_signal_ids(demand)
    if cited_ids:
        cited_max = (
            await db.execute(select(func.max(Signal.updated_at)).where(Signal.id.in_(cited_ids)))
        ).scalar_one_or_none()
        cited_max = _aware(cited_max)
        if cited_max and (latest is None or cited_max > latest):
            latest = cited_max

        doc_max = (
            await db.execute(
                select(func.max(func.coalesce(Document.ingested_at, Document.created_at))).where(
                    Document.id.in_(
                        select(Signal.document_id).where(
                            Signal.id.in_(cited_ids), Signal.document_id.is_not(None)
                        )
                    )
                )
            )
        ).scalar_one_or_none()
        doc_max = _aware(doc_max)
        if doc_max and (latest is None or doc_max > latest):
            latest = doc_max

    if latest and latest > baseline:
        return "stale"

    stale_blob = await _broken_blob_reference(db, theme_id, cited_ids)
    if stale_blob:
        return "stale"

    return "fresh"


async def _broken_blob_reference(
    db: AsyncSession,
    theme_id: uuid.UUID | None,
    cited_ids: list[uuid.UUID],
) -> bool:
    q = select(Signal).where(Signal.evidence_status_code != "archived")
    if cited_ids:
        q = q.where(Signal.id.in_(cited_ids))
    elif theme_id is not None:
        q = q.where(Signal.tech_theme_id == theme_id)
    else:
        return False
    rows = (await db.execute(q.limit(50))).scalars().all()
    for signal in rows:
        if signal.body_object_key and load_bytes(signal.body_object_key) is None:
            return True
        if signal.snapshot_html_object_key and load_bytes(signal.snapshot_html_object_key) is None:
            return True
        if signal.document_id:
            doc = await db.get(Document, signal.document_id)
            if doc and doc.object_key and load_bytes(doc.object_key) is None:
                return True
    return False
