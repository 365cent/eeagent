"""Create reviewable demand drafts from a captured panorama workbook.

The workbook snapshot remains available on the batch.  It is not evidence of
human review and cannot authorize confirmation or downstream publication.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import DemandPoint, PanoramaImportBatch, TechTheme
from app.services.demand_validation import DEMAND_STEP_KEYS, validate_demand_trace
from app.services.panorama_import import load_workbook_model
from app.services.panorama_import_signals import signal_ids_for_stage
from app.services.panorama_workbook import PanoramaChainRow

logger = logging.getLogger(__name__)


def _build_derivation_trace(demand_name: str, signal_ids: list[uuid.UUID]) -> dict:
    id_strings = [str(s) for s in signal_ids]
    return {
        "steps": [
            {
                "key": key,
                "content": demand_name if key == "demand_naming" else f"工作簿导入：{demand_name}（{key}）",
                "evidence_signal_ids": id_strings,
            }
            for key in DEMAND_STEP_KEYS
        ]
    }


async def run_panorama_structure(db: AsyncSession, batch_id: uuid.UUID) -> None:
    batch = await db.get(PanoramaImportBatch, batch_id)
    if batch is None or batch.status in {"completed", "failed", "structuring"}:
        return
    batch.status = "structuring"
    batch.structure_started_at = datetime.now(timezone.utc)
    await db.commit()

    try:
        workbook = await load_workbook_model(batch)
        demands_created = 0
        seen_demands: set[tuple[str | None, str | None]] = set()
        for row in workbook.chain_rows:
            if not row.demand_name or not row.function_name:
                continue
            key = (row.value_chain_stage_code, row.demand_name)
            if key in seen_demands:
                continue
            seen_demands.add(key)
            signal_ids = await signal_ids_for_stage(db, batch_id, row.value_chain_stage_code)
            if len(signal_ids) < 2:
                continue
            theme = await _theme_for_row(db, row)
            if theme is None:
                continue
            derivation_trace = _build_derivation_trace(row.demand_name, signal_ids)
            if await validate_demand_trace(db, derivation_trace, theme.id):
                continue
            db.add(DemandPoint(
                name=row.demand_name,
                value_chain_stage_code=row.value_chain_stage_code or theme.value_chain_stage_code,
                source_tech_theme_id=theme.id,
                derivation_trace=derivation_trace,
                cross_validation=None,
                review_status="pending",
                time_series=[],
            ))
            demands_created += 1

        batch.demands_created = demands_created
        batch.functions_published = 0
        batch.status = "completed"
        batch.structure_finished_at = datetime.now(timezone.utc)
        batch.error = None
        await db.commit()
        logger.info("panorama structure batch %s: pending_demands=%s", batch_id, demands_created)
    except Exception as exc:
        logger.exception("panorama structure failed for %s", batch_id)
        # Do not publish partial business records when any row fails.
        await db.rollback()
        batch = await db.get(PanoramaImportBatch, batch_id)
        if batch is None:
            raise
        batch.status = "failed"
        batch.error = str(exc)[:2000]
        batch.structure_finished_at = datetime.now(timezone.utc)
        await db.commit()


async def _theme_for_row(db: AsyncSession, row: PanoramaChainRow) -> TechTheme | None:
    if not row.value_chain_stage_code:
        return None
    label = row.value_chain_stage_label or row.value_chain_stage_code
    existing = (
        await db.execute(
            select(TechTheme).where(
                TechTheme.value_chain_stage_code == row.value_chain_stage_code,
                TechTheme.working_name == label,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        return existing
    theme = TechTheme(working_name=label, value_chain_stage_code=row.value_chain_stage_code)
    db.add(theme)
    await db.flush()
    return theme
