"""Read-only signal → chain traversal for draft_trace_report."""

from __future__ import annotations

import uuid
from typing import Any, Mapping

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import DemandPoint, Signal, TechLandingPoint, TechTheme, VehicleFunction
from app.services.agent_citations import make_signal_citation
from app.services.agent_contract import AgentCitation


def _evidence_signal_ids(demand: DemandPoint | None) -> set[uuid.UUID]:
    if demand is None:
        return set()
    ids: list[str] = []

    def append_from(value: Any) -> None:
        if not isinstance(value, Mapping):
            return
        refs = value.get("evidence_signal_ids")
        if isinstance(refs, list):
            ids.extend(str(item).strip() for item in refs if str(item).strip())

    append_from(demand.cross_validation)
    trace = demand.derivation_trace
    if isinstance(trace, Mapping):
        append_from(trace)
        steps = trace.get("steps")
        if isinstance(steps, list):
            for step in steps:
                append_from(step)
    parsed: set[uuid.UUID] = set()
    for raw in ids:
        try:
            parsed.add(uuid.UUID(raw))
        except ValueError:
            continue
    return parsed


async def build_signal_trace_markdown(
    db: AsyncSession, signal_id: uuid.UUID
) -> tuple[str, list[AgentCitation]]:
    signal = (
        await db.execute(
            select(Signal)
            .options(selectinload(Signal.tags))
            .where(Signal.id == signal_id)
        )
    ).scalar_one_or_none()
    if signal is None:
        raise ValueError("signal not found")

    citations = [
        make_signal_citation(
            signal_id=signal.id,
            title=signal.title,
            summary=signal.excerpt or signal.title,
        )
    ]
    lines = [
        "# 信号链路追溯",
        "",
        f"## 信号",
        f"- {signal.title} (`{signal.id}`)",
        f"- 环节：{signal.value_chain_stage_code or '—'}",
        f"- 类型：{signal.signal_type_code or '—'}",
    ]

    theme: TechTheme | None = None
    if signal.tech_theme_id:
        theme = await db.get(TechTheme, signal.tech_theme_id)
    if theme:
        lines.extend(["", "## 主题", f"- {theme.working_name} (`{theme.id}`)"])
    else:
        lines.extend(["", "## 主题", "- 未关联主题"])

    demand_rows: list[DemandPoint] = []
    if theme:
        demands = (
            await db.execute(
                select(DemandPoint).where(DemandPoint.source_tech_theme_id == theme.id)
            )
        ).scalars().all()
        for demand in demands:
            if signal_id in _evidence_signal_ids(demand):
                demand_rows.append(demand)

    lines.extend(["", "## 需求点"])
    if demand_rows:
        for demand in demand_rows:
            lines.append(f"- {demand.name} (`{demand.id}`)，审核：{demand.review_status or '—'}")
    else:
        lines.append("- 无已持久化且引用本信号的需求点")

    functions: list[VehicleFunction] = []
    if demand_rows:
        demand_ids = {d.id for d in demand_rows}
        functions = (
            await db.execute(
                select(VehicleFunction).where(VehicleFunction.demand_point_id.in_(demand_ids))
            )
        ).scalars().all()

    lines.extend(["", "## 车辆功能"])
    if functions:
        for fn in functions:
            pub = "已发布" if fn.published else "未发布"
            lines.append(f"- {fn.name} (`{fn.id}`)，{pub}")
    else:
        lines.append("- 无关联车辆功能")

    if functions:
        fn_ids = [f.id for f in functions]
        lps = (
            await db.execute(
                select(TechLandingPoint)
                .options(
                    selectinload(TechLandingPoint.standards),
                    selectinload(TechLandingPoint.assessments),
                    selectinload(TechLandingPoint.domain),
                )
                .where(TechLandingPoint.vehicle_function_id.in_(fn_ids))
            )
        ).scalars().all()
        lines.extend(["", "## 落脚点与标准/评估"])
        for lp in lps:
            domain = lp.domain.name if lp.domain else "—"
            lines.append(f"- {lp.name}（域：{domain}，`{lp.id}`）")
            std_count = len(lp.standards)
            assess = next((a for a in lp.assessments if a.is_current), None)
            assess_line = assess.classification if assess else "—"
            lines.append(f"  - 标准格：{std_count} 格已持久化")
            lines.append(f"  - 当前战略评估：{assess_line}")
    else:
        lines.extend(["", "## 落脚点与标准/评估", "- 无关联落脚点"])

    lines.extend(
        [
            "",
            "## 局限",
            "仅包含数据库中已关联且可遍历的节点；未展开的链路段不会推断补全。",
        ]
    )
    return "\n".join(lines), citations
