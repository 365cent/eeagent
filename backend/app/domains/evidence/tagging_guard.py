"""Human-correction guards and optimistic concurrency for signals."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import CorrectionAudit, Signal

PROTECTED_SUGGESTION_FIELDS = frozenset(
    {
        "value_chain_stage_code",
        "signal_type_code",
        "tech_tags",
        "tech_theme_id",
    }
)


async def human_corrected_fields(db: AsyncSession, signal_id: uuid.UUID) -> set[str]:
    """Fields that already have a human correction audit row must not be re-suggested."""
    rows = (
        await db.execute(
            select(CorrectionAudit.field_name)
            .where(
                CorrectionAudit.entity_type == "signal",
                CorrectionAudit.entity_id == signal_id,
                CorrectionAudit.field_name.in_(PROTECTED_SUGGESTION_FIELDS),
            )
            .distinct()
        )
    ).scalars().all()
    return set(rows)


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def assert_expected_signal_revision(signal: Signal, expected: datetime | None) -> None:
    if expected is None:
        return
    if _as_utc(signal.updated_at) != _as_utc(expected):
        raise HTTPException(409, "记录已被他人更新，请刷新页面后重试")
