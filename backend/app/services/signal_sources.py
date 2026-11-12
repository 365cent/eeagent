"""Multi-URL provenance rows for signals (BE-05)."""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Signal, SignalSource
from app.services.tagging import normalize_url


async def ensure_primary_source(db: AsyncSession, signal: Signal) -> SignalSource:
    existing = (
        await db.execute(
            select(SignalSource).where(SignalSource.signal_id == signal.id, SignalSource.is_primary.is_(True))
        )
    ).scalar_one_or_none()
    if existing is not None:
        if existing.url != signal.url:
            existing.url = signal.url
            existing.url_normalized = signal.url_normalized
        return existing
    row = SignalSource(
        id=uuid.uuid4(),
        signal_id=signal.id,
        url=signal.url,
        url_normalized=signal.url_normalized,
        is_primary=True,
        provenance="primary",
    )
    db.add(row)
    return row


async def add_supplementary_url(
    db: AsyncSession,
    signal: Signal,
    url: str,
    *,
    provenance: str | None = None,
) -> SignalSource:
    normalized = normalize_url(url)
    dup = (
        await db.execute(
            select(SignalSource).where(SignalSource.signal_id == signal.id, SignalSource.url_normalized == normalized)
        )
    ).scalar_one_or_none()
    if dup is not None:
        return dup
    row = SignalSource(
        id=uuid.uuid4(),
        signal_id=signal.id,
        url=url.strip(),
        url_normalized=normalized,
        is_primary=False,
        provenance=provenance,
    )
    db.add(row)
    return row


async def list_sources(db: AsyncSession, signal_id: uuid.UUID) -> list[SignalSource]:
    return list(
        (
            await db.execute(
                select(SignalSource).where(SignalSource.signal_id == signal_id).order_by(
                    SignalSource.is_primary.desc(), SignalSource.created_at
                )
            )
        ).scalars()
    )
