"""Shared evidence queries and response projections.

The HTTP routes decide how to report a missing signal; this module only
loads evidence and builds the existing public representations.
"""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import DemandPoint, Signal, SignalTag
from app.schemas.schemas import SignalBase, SignalDetail, SignalOut, ThemeOut
from app.services.signal_duplicate import title_indicates_duplicate_url


async def find_signal(db: AsyncSession, signal_id: uuid.UUID) -> Signal | None:
    return (
        await db.execute(
            select(Signal)
            .options(
                selectinload(Signal.tags).selectinload(SignalTag.vocab),
                selectinload(Signal.theme),
                selectinload(Signal.document),
            )
            .where(Signal.id == signal_id)
            # Refresh the identity map after a relationship or FK changes.
            .execution_options(populate_existing=True)
        )
    ).scalar_one_or_none()


def signal_out(signal: Signal) -> SignalOut:
    out = SignalOut(**SignalBase.model_validate(signal).model_dump())
    out.tags = [tag.vocab.name for tag in signal.tags]
    out.url_duplicate_renamed = title_indicates_duplicate_url(signal.title)
    return out


async def linked_demand_points(
    db: AsyncSession, theme_id: uuid.UUID | None
) -> list[DemandPoint]:
    if theme_id is None:
        return []
    return list(
        (
            await db.execute(
                select(DemandPoint)
                .where(DemandPoint.source_tech_theme_id == theme_id)
                .order_by(DemandPoint.created_at)
            )
        ).scalars()
    )


def signal_detail(signal: Signal) -> SignalDetail:
    out = SignalDetail(
        **SignalBase.model_validate(signal).model_dump(),
        body_object_key=signal.body_object_key,
        body_sha256=signal.body_sha256,
        snapshot_html_object_key=signal.snapshot_html_object_key,
        theme=ThemeOut.model_validate(signal.theme) if signal.theme else None,
    )
    out.tags = [tag.vocab.name for tag in signal.tags]
    out.url_duplicate_renamed = title_indicates_duplicate_url(signal.title)
    return out


async def get_signal_detail(db: AsyncSession, signal_id: uuid.UUID) -> SignalDetail | None:
    signal = await find_signal(db, signal_id)
    if signal is None:
        return None
    out = signal_detail(signal)
    out.linked_demand_points = await linked_demand_points(db, signal.tech_theme_id)
    return out
