"""Persisted SSE agent events."""

from __future__ import annotations

import json
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent_models import AgentEvent, AgentSession


async def append_event(
    db: AsyncSession,
    *,
    session: AgentSession,
    event_type: str,
    payload: dict[str, Any],
    run_id: uuid.UUID | None = None,
) -> AgentEvent:
    session.next_event_seq += 1
    event = AgentEvent(
        session_id=session.id,
        seq=session.next_event_seq,
        event_type=event_type,
        payload=payload,
        run_id=run_id,
    )
    db.add(event)
    await db.flush()
    return event


def format_sse(event: AgentEvent) -> str:
    data = json.dumps({"type": event.event_type, **event.payload}, ensure_ascii=False)
    return f"id: {event.seq}\nevent: {event.event_type}\ndata: {data}\n\n"


async def list_events_after(
    db: AsyncSession, session_id: uuid.UUID, *, after_seq: int = 0, limit: int = 200
) -> list[AgentEvent]:
    rows = (
        await db.execute(
            select(AgentEvent)
            .where(AgentEvent.session_id == session_id, AgentEvent.seq > after_seq)
            .order_by(AgentEvent.seq.asc())
            .limit(limit)
        )
    ).scalars()
    return list(rows)
