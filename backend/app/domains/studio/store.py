"""Persist successful evidence-studio generations per (signal, kind)."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import SignalStudioArtifact
from app.schemas.schemas import SignalStudioKind

STUDIO_KINDS: tuple[SignalStudioKind, ...] = ("audio", "mindmap", "report", "infographic")


async def get_studio_artifact(
    db: AsyncSession,
    signal_id: uuid.UUID,
    kind: SignalStudioKind,
    *,
    body_sha256: str | None,
) -> SignalStudioArtifact | None:
    row = (
        await db.execute(
            select(SignalStudioArtifact).where(
                SignalStudioArtifact.signal_id == signal_id,
                SignalStudioArtifact.kind == kind,
            )
        )
    ).scalar_one_or_none()
    if row is None:
        return None
    if body_sha256 and row.source_body_sha256 and row.source_body_sha256 != body_sha256:
        return None
    if kind == "report":
        return row if row.content_text else None
    return row if row.content_json is not None else None


async def list_studio_artifacts(
    db: AsyncSession,
    signal_id: uuid.UUID,
    *,
    body_sha256: str | None,
) -> dict[str, Any]:
    rows = (
        await db.execute(
            select(SignalStudioArtifact).where(SignalStudioArtifact.signal_id == signal_id)
        )
    ).scalars().all()
    out: dict[str, Any] = {}
    for row in rows:
        if row.kind not in STUDIO_KINDS:
            continue
        if body_sha256 and row.source_body_sha256 and row.source_body_sha256 != body_sha256:
            continue
        if row.kind == "report":
            if row.content_text:
                out[row.kind] = row.content_text
        elif row.content_json is not None:
            out[row.kind] = row.content_json
    return out


async def upsert_studio_artifact(
    db: AsyncSession,
    *,
    signal_id: uuid.UUID,
    kind: SignalStudioKind,
    body_sha256: str | None,
    llm_model: str | None,
    content_json: dict | list | None = None,
    content_text: str | None = None,
) -> None:
    stmt = insert(SignalStudioArtifact).values(
        id=uuid.uuid4(),
        signal_id=signal_id,
        kind=kind,
        content_json=content_json,
        content_text=content_text,
        source_body_sha256=body_sha256,
        llm_model=llm_model,
    )
    stmt = stmt.on_conflict_do_update(
        constraint="uq_signal_studio_kind",
        set_={
            "content_json": stmt.excluded.content_json,
            "content_text": stmt.excluded.content_text,
            "source_body_sha256": stmt.excluded.source_body_sha256,
            "llm_model": stmt.excluded.llm_model,
            "updated_at": func.now(),
        },
    )
    await db.execute(stmt)
    await db.flush()