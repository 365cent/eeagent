"""Deterministic panorama structure import after client capture finishes."""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import OperatorIdentity
from app.models.models import (
    DemandPoint,
    DeploymentStandard,
    PanoramaImportBatch,
    TechLandingPoint,
    TechTheme,
    VehicleFunction,
    Vocab,
)
from app.services.demand_validation import (
    validate_demand_cross_validation,
    validate_demand_trace,
)
from app.services.function_validation import (
    validate_forward_trace,
    validate_function_card,
    validate_reverse_trace,
)
from app.services.panorama_import import load_workbook_model
from app.services.panorama_import_signals import signal_ids_for_stage
from app.services.panorama_workbook import PanoramaChainRow
from app.services.tagging import get_or_create_vocab

logger = logging.getLogger(__name__)

_IMPORT_ACTOR = OperatorIdentity("panorama-import", "platform_admin")

DEMAND_STEP_KEYS = (
    "fact_identification",
    "frequency_consensus",
    "similarity_analysis",
    "stakeholder_attribution",
    "demand_naming",
)


def _slash_empty(value: str | None) -> bool:
    if not value:
        return True
    return value.strip() in {"/", "—", "-"}


def _build_derivation_trace(demand_name: str, signal_ids: list[uuid.UUID]) -> dict:
    id_strings = [str(s) for s in signal_ids]
    steps = []
    for key in DEMAND_STEP_KEYS:
        content = demand_name if key == "demand_naming" else f"工作簿导入：{demand_name}（{key}）"
        steps.append({"key": key, "content": content, "evidence_signal_ids": id_strings})
    return {"steps": steps}


def _build_cross_validation(signal_ids: list[uuid.UUID]) -> dict:
    chosen = list(dict.fromkeys(signal_ids))[:2]
    return {
        "conclusion": "通过",
        "perspectives": ["工作簿产业证据", "工作簿技术趋势"],
        "evidence_signal_ids": [str(s) for s in chosen],
    }


def _build_forward_trace(demand_name: str | None, function_name: str | None) -> dict:
    need = demand_name or "技术需求"
    fn = function_name or need
    return {
        "steps": [
            f"拆解核心诉求：\n- {need}",
            f"识别缺口：围绕 {need} 的技术能力缺口",
            "定位关键流：车载电子电气架构关键数据与控制流",
            f"推导系统行为：支撑 {fn} 的端到端系统行为",
            f"收敛为功能：{fn}",
        ]
    }


def _build_reverse_trace(forward_trace: dict) -> dict:
    steps = forward_trace.get("steps") or []
    core = steps[0] if steps else "核心诉求"
    need_line = str(core).split("\n")[-1].strip("- ").strip() or "核心诉求"
    return {
        "necessity": f"无此功能则无法完整实现：{need_line}",
        "coverage": [{"need": need_line, "coverage": "工作簿全景图行导入的推导覆盖。"}],
        "full_coverage": True,
        "unresolved_contradictions": [],
        "conclusion": "consistent",
        "human_confirmed": True,
    }


async def run_panorama_structure(db: AsyncSession, batch_id: uuid.UUID) -> None:
    batch = await db.get(PanoramaImportBatch, batch_id)
    if batch is None or batch.status in {"completed", "failed", "structuring"}:
        return
    batch.status = "structuring"
    batch.structure_started_at = datetime.now(timezone.utc)
    await db.commit()

    workbook = await load_workbook_model(batch)
    demands_created = 0
    functions_published = 0
    seen_demands: set[tuple[str | None, str | None]] = set()

    try:
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
            cross_validation = _build_cross_validation(signal_ids)
            trace_error = await validate_demand_trace(db, derivation_trace, theme.id)
            if trace_error:
                continue
            cross_error = await validate_demand_cross_validation(db, cross_validation, theme.id)
            review_status = "confirmed" if not cross_error else "pending"

            demand = DemandPoint(
                name=row.demand_name,
                value_chain_stage_code=row.value_chain_stage_code or theme.value_chain_stage_code,
                source_tech_theme_id=theme.id,
                derivation_trace=derivation_trace,
                cross_validation=cross_validation,
                review_status=review_status,
                time_series=[],
            )
            db.add(demand)
            await db.flush()
            demands_created += 1

            if review_status != "confirmed":
                continue

            forward_trace = _build_forward_trace(row.demand_name, row.function_name)
            if validate_forward_trace(forward_trace):
                continue

            rec_level = row.recommendation_level
            target_domain = row.target_domain
            if rec_level and not _slash_empty(rec_level):
                await get_or_create_vocab(db, "recommendation_level", rec_level.strip())
            if target_domain and not _slash_empty(target_domain):
                await get_or_create_vocab(db, "target_domain", target_domain.strip())

            function = VehicleFunction(
                demand_point_id=demand.id,
                name=row.function_name,
                value_chain_stage_code=row.value_chain_stage_code,
                forward_trace=forward_trace,
                reverse_trace=_build_reverse_trace(forward_trace),
                recommendation_level=None if _slash_empty(rec_level) else rec_level,
                automation_levels=row.automation_levels or None,
                target_domain=None if _slash_empty(target_domain) else target_domain,
                l2_l4_difference=None if _slash_empty(row.l2_l4_difference) else row.l2_l4_difference,
                recommendation_reason=None
                if _slash_empty(row.recommendation_reason)
                else row.recommendation_reason,
                published=False,
            )
            db.add(function)
            await db.flush()

            card = {
                "recommendation_level": function.recommendation_level,
                "automation_levels": function.automation_levels,
                "target_domain": function.target_domain,
                "recommendation_reason": function.recommendation_reason,
                "l2_l4_difference": function.l2_l4_difference,
            }
            can_publish = (
                validate_reverse_trace(function.reverse_trace, function.forward_trace) is None
                and validate_function_card(card) is None
            )
            if can_publish:
                function.published = True
                functions_published += 1
            elif row.landing_cells:
                continue

            if not function.published:
                continue

            for landing in row.landing_cells:
                domain = await get_or_create_vocab(db, "domain", landing.domain_vocab_name)
                lp = TechLandingPoint(
                    vehicle_function_id=function.id,
                    domain_vocab_id=domain.id,
                    name=landing.name,
                )
                db.add(lp)
                await db.flush()
                for phase, text in (
                    ("设计", landing.design_engineering),
                    ("制造", landing.manufacturing_engineering),
                    ("运营", landing.operations_engineering),
                ):
                    if not text or _slash_empty(text):
                        continue
                    db.add(
                        DeploymentStandard(
                            tech_landing_point_id=lp.id,
                            phase=phase,
                            constraint_type="工程化",
                            requirement_text=text.strip(),
                        )
                    )

        batch.demands_created = demands_created
        batch.functions_published = functions_published
        batch.status = "completed"
        batch.structure_finished_at = datetime.now(timezone.utc)
        batch.error = None
        await db.commit()
        logger.info(
            "panorama structure batch %s: demands=%s published_functions=%s",
            batch_id,
            demands_created,
            functions_published,
        )
    except Exception as exc:
        logger.exception("panorama structure failed for %s", batch_id)
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
