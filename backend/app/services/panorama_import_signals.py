"""Apply panorama import metadata to captured signals."""
from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import PanoramaImportUrl, Signal, TechTheme
from app.services.refcodes import normalize as normalize_ref_code
from app.services.tagging_guard import human_corrected_fields


async def sync_import_url_signal(
    db: AsyncSession, *, batch_id: uuid.UUID, job_id: uuid.UUID, signal_id: uuid.UUID
) -> None:
    row = (
        await db.execute(
            select(PanoramaImportUrl).where(
                PanoramaImportUrl.batch_id == batch_id,
                PanoramaImportUrl.capture_job_id == job_id,
            )
        )
    ).scalar_one_or_none()
    if row is None:
        return
    row.signal_id = signal_id
    signal = await db.get(Signal, signal_id)
    if signal is None:
        await db.commit()
        return

    stage_code = None
    signal_type = None
    for ctx in row.contexts or []:
        if isinstance(ctx, dict):
            if ctx.get("value_chain_stage_code"):
                stage_code = ctx["value_chain_stage_code"]
            if ctx.get("signal_type_code"):
                signal_type = ctx["signal_type_code"]
    protected = await human_corrected_fields(db, signal_id)
    if stage_code and "value_chain_stage_code" not in protected:
        signal.value_chain_stage_code = normalize_ref_code(
            "value_chain_stage", stage_code
        ) or stage_code
    if signal_type and "signal_type_code" not in protected:
        signal.signal_type_code = normalize_ref_code("signal_type", signal_type) or signal_type
    stage_label = ""
    for ctx in row.contexts or []:
        if isinstance(ctx, dict) and ctx.get("value_chain_stage_label"):
            stage_label = str(ctx["value_chain_stage_label"])
            break
    if (
        stage_label
        and signal.value_chain_stage_code
        and "tech_theme_id" not in protected
        and "value_chain_stage_code" not in protected
    ):
        theme = await _get_or_create_stage_theme(db, stage_label, signal.value_chain_stage_code)
        if theme is not None:
            signal.tech_theme_id = theme.id
    await db.commit()


async def _get_or_create_stage_theme(
    db: AsyncSession, working_name: str, stage_code: str
) -> TechTheme | None:
    existing = (
        await db.execute(
            select(TechTheme).where(
                TechTheme.working_name == working_name,
                TechTheme.value_chain_stage_code == stage_code,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        return existing
    theme = TechTheme(working_name=working_name, value_chain_stage_code=stage_code)
    db.add(theme)
    await db.flush()
    return theme


async def signal_ids_for_stage(
    db: AsyncSession, batch_id: uuid.UUID, stage_code: str | None
) -> list[uuid.UUID]:
    if not stage_code:
        return []
    rows = (
        await db.execute(
            select(PanoramaImportUrl.signal_id, PanoramaImportUrl.contexts).where(
                PanoramaImportUrl.batch_id == batch_id,
                PanoramaImportUrl.signal_id.is_not(None),
            )
        )
    ).all()
    ids: list[uuid.UUID] = []
    for signal_id, contexts in rows:
        if signal_id is None:
            continue
        for ctx in contexts or []:
            if isinstance(ctx, dict) and ctx.get("value_chain_stage_code") == stage_code:
                ids.append(signal_id)
                break
    return list(dict.fromkeys(ids))
