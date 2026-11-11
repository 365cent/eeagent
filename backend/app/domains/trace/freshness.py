from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import DemandPoint, Signal
from app.services.objectstore import load_bytes


async def compute_basis_freshness(db: AsyncSession, demand: DemandPoint | None) -> str:
    if demand is None:
        return "unknown_untracked"
    if demand.confirmed_at is None:
        return "unconfirmed"
    baseline = demand.confirmed_at
    if baseline.tzinfo is None:
        baseline = baseline.replace(tzinfo=timezone.utc)
    refs = _demand_evidence_ids(demand)
    if not refs:
        return "unknown_untracked"
    rows = (await db.execute(select(Signal).where(Signal.id.in_(refs)))).scalars().all()
    if not rows:
        return "stale"
    newest: datetime | None = None
    for signal in rows:
        candidate = signal.updated_at or signal.created_at
        if candidate.tzinfo is None:
            candidate = candidate.replace(tzinfo=timezone.utc)
        newest = candidate if newest is None or candidate > newest else newest
        if signal.body_object_key and load_bytes(signal.body_object_key) is None:
            return "stale"
        if signal.snapshot_html_object_key and load_bytes(signal.snapshot_html_object_key) is None:
            return "stale"
    if newest is None:
        return "unknown_untracked"
    return "stale" if newest > baseline else "fresh"


def _demand_evidence_ids(demand: DemandPoint) -> list:
    raw: list[str] = []

    def append_from(value):
        if not isinstance(value, dict):
            return
        refs = value.get("evidence_signal_ids")
        if isinstance(refs, list):
            raw.extend(str(item).strip() for item in refs if str(item).strip())

    append_from(demand.cross_validation)
    derivation = demand.derivation_trace
    if isinstance(derivation, dict):
        append_from(derivation)
        steps = derivation.get("steps")
        if isinstance(steps, list):
            for step in steps:
                append_from(step)
    import uuid

    parsed = []
    for item in dict.fromkeys(raw):
        try:
            parsed.append(uuid.UUID(item))
        except ValueError:
            continue
    return parsed
