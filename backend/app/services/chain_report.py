"""Deterministic chain Markdown/PDF export for demand or landing point."""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Mapping

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import (
    ChainReport,
    DemandPoint,
    DeploymentStandard,
    StrategicAssessment,
    StrategicFunnel,
    TechLandingPoint,
    TechTheme,
    VehicleFunction,
)
from app.services.agent_trace import build_signal_trace_markdown
from app.services.chain_report_pdf import render_markdown_to_pdf_bytes
from app.services.objectstore import save_bytes


async def create_chain_report(
    db: AsyncSession,
    *,
    demand_point_id: uuid.UUID | None,
    landing_point_id: uuid.UUID | None,
    fmt: str,
    subject: str,
    role: str,
) -> ChainReport:
    if bool(demand_point_id) == bool(landing_point_id):
        raise ValueError("specify exactly one of demand_point_id or landing_point_id")
    report = ChainReport(
        id=uuid.uuid4(),
        demand_point_id=demand_point_id,
        landing_point_id=landing_point_id,
        status="queued",
        format=fmt,
        requested_by_subject=subject,
        requested_by_role=role,
    )
    db.add(report)
    await db.flush()
    try:
        markdown = await build_chain_report_markdown(
            db, demand_point_id=demand_point_id, landing_point_id=landing_point_id
        )
        if fmt == "pdf":
            payload = render_markdown_to_pdf_bytes(markdown)
            ext = "pdf"
        else:
            payload = markdown.encode("utf-8")
            ext = "md"
        key = save_bytes(payload, folder="reports", ext=ext)
        report.object_key = key
        report.status = "succeeded"
        report.finished_at = datetime.now(timezone.utc)
        report.data_snapshot_json = {"bytes": len(payload), "format": fmt}
    except Exception as exc:  # noqa: BLE001
        report.status = "failed"
        report.error = str(exc)[:1000]
        report.finished_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(report)
    return report


def _fmt_json_block(value: Any) -> list[str]:
    if value is None:
        return ["- （无）"]
    try:
        text = json.dumps(value, ensure_ascii=False, indent=2)
    except TypeError:
        text = str(value)
    return ["```json", text, "```"]


def _append_derivation_steps(lines: list[str], demand: DemandPoint | None) -> None:
    lines.extend(["", "## 需求五步推导"])
    trace = demand.derivation_trace if demand and isinstance(demand.derivation_trace, Mapping) else None
    if not trace:
        lines.append("- 未持久化推导步骤")
        return
    steps = trace.get("steps")
    if isinstance(steps, list) and steps:
        for index, step in enumerate(steps, start=1):
            if not isinstance(step, Mapping):
                continue
            title = step.get("title") or step.get("name") or f"步骤 {index}"
            body = step.get("content") or step.get("text") or ""
            lines.append(f"### {index}. {title}")
            if body:
                lines.append(str(body))
            refs = step.get("evidence_signal_ids")
            if isinstance(refs, list) and refs:
                lines.append(f"- 引用信号：{', '.join(str(r) for r in refs)}")
    else:
        lines.extend(_fmt_json_block(trace))


def _append_cross_validation(lines: list[str], demand: DemandPoint | None) -> None:
    lines.extend(["", "## 交叉验证"])
    if demand is None:
        lines.append("- 无关联需求点")
        return
    cv = demand.cross_validation if isinstance(demand.cross_validation, Mapping) else {}
    status = cv.get("status") or demand.review_status or "—"
    lines.append(f"- 状态：{status}")
    if cv.get("conclusion"):
        lines.append(f"- 结论：{cv['conclusion']}")
    if demand.confirmed_at:
        lines.append(f"- 确认时间（UTC）：{demand.confirmed_at.isoformat()}")
    if not cv:
        lines.append("- 未记录交叉验证明细")


def _append_function_traces(lines: list[str], fn: VehicleFunction | None) -> None:
    lines.extend(["", "## 车辆功能"])
    if fn is None:
        lines.append("- 无关联车辆功能")
        return
    pub = "已发布" if fn.published else "未发布"
    lines.append(f"- {fn.name}（`{fn.id}`），{pub}")
    lines.extend(["", "### 正向推导（五步）"])
    lines.extend(_fmt_json_block(fn.forward_trace))
    lines.extend(["", "### 反向验证"])
    lines.extend(_fmt_json_block(fn.reverse_trace))


def _append_standards_grid(lines: list[str], standards: list[DeploymentStandard]) -> None:
    lines.extend(["", "## 部署标准九宫格"])
    phases = ("设计", "制造", "运营")
    constraints = ("工程化", "经济性", "安全合规")
    by_key = {(s.phase, s.constraint_type): s for s in standards}
    for phase in phases:
        for constraint in constraints:
            cell = by_key.get((phase, constraint))
            if cell is None:
                state = "未填写"
                text = ""
            elif cell.requirement_text is None:
                state = "明确留空"
                text = ""
            else:
                state = "实质条款"
                text = cell.requirement_text
            lines.append(f"- {phase} × {constraint}：{state}")
            if text:
                lines.append(f"  - {text}")


def _append_strategy(lines: list[str], lp_id: uuid.UUID, assessments: list[StrategicAssessment], funnel: StrategicFunnel | None) -> None:
    lines.extend(["", "## 战略研判"])
    if funnel is not None:
        if funnel.adaptation_decision:
            lines.append(f"- Tier1 适配：{funnel.adaptation_decision}")
        if funnel.classification:
            lines.append(f"- 分类：{funnel.classification}")
    current = next((a for a in assessments if a.is_current), None)
    if current:
        lines.append(
            f"- 当前版本 v{current.version}：总分 {current.score_total}，分类 {current.classification}"
        )
        if current.strategy_note:
            lines.append(f"- 策略备注：{current.strategy_note}")
    if assessments:
        lines.append("- 历史版本：")
        for assess in sorted(assessments, key=lambda item: item.version):
            mark = "（当前）" if assess.is_current else ""
            lines.append(
                f"  - v{assess.version}{mark}：{assess.score_total} 分，{assess.classification}，{assess.assessed_at.isoformat()}"
            )
    elif funnel is None:
        lines.append("- 无战略记录")


async def _load_landing_point(db: AsyncSession, landing_point_id: uuid.UUID) -> TechLandingPoint:
    lp = (
        await db.execute(
            select(TechLandingPoint)
            .options(
                selectinload(TechLandingPoint.domain),
                selectinload(TechLandingPoint.standards),
                selectinload(TechLandingPoint.assessments),
                selectinload(TechLandingPoint.vehicle_function).selectinload(
                    VehicleFunction.demand_point
                ),
            )
            .where(TechLandingPoint.id == landing_point_id)
        )
    ).scalar_one_or_none()
    if lp is None:
        raise ValueError("landing point not found")
    return lp


async def build_chain_report_markdown(
    db: AsyncSession,
    *,
    demand_point_id: uuid.UUID | None,
    landing_point_id: uuid.UUID | None,
) -> str:
    generated_at = datetime.now(timezone.utc).isoformat()
    lines = [
        "# EEA 链路报告",
        "",
        f"- 生成时间（UTC）：{generated_at}",
        f"- 数据快照：导出时数据库已持久化记录",
    ]

    lp: TechLandingPoint | None = None
    demand: DemandPoint | None = None
    if landing_point_id is not None:
        lp = await _load_landing_point(db, landing_point_id)
        fn = lp.vehicle_function
        demand = fn.demand_point if fn else None
        domain = lp.domain.name if lp.domain else "—"
        lines.extend(
            [
                "",
                "## 技术落脚点",
                f"- 名称：{lp.name}",
                f"- 技术域：{domain}",
                f"- 角色：{lp.role_description or '—'}",
                f"- ID：`{lp.id}`",
            ]
        )
        _append_function_traces(lines, fn)
        _append_derivation_steps(lines, demand)
        _append_cross_validation(lines, demand)
        _append_standards_grid(lines, list(lp.standards))
        funnel = (
            await db.execute(
                select(StrategicFunnel).where(StrategicFunnel.tech_landing_point_id == lp.id)
            )
        ).scalar_one_or_none()
        _append_strategy(lines, lp.id, list(lp.assessments), funnel)

        theme: TechTheme | None = None
        if demand and demand.source_tech_theme_id:
            theme = await db.get(TechTheme, demand.source_tech_theme_id)
        if theme:
            lines.extend(["", "## 来源主题", f"- {theme.working_name} (`{theme.id}`)"])
        signal = None
        if theme:
            from app.models.models import Signal

            signal = (
                await db.execute(
                    select(Signal).where(Signal.tech_theme_id == theme.id).limit(1)
                )
            ).scalar_one_or_none()
        if signal is not None:
            trace_md, _ = await build_signal_trace_markdown(db, signal.id)
            lines.extend(["", "## 追溯摘要", trace_md])
        else:
            lines.extend(["", "## 追溯摘要", "_无可追溯信号_"])
    else:
        demand = await db.get(DemandPoint, demand_point_id)
        if demand is None:
            raise ValueError("demand not found")
        lines.extend(["", "## 需求点", f"- {demand.name} (`{demand.id}`)"])
        _append_derivation_steps(lines, demand)
        _append_cross_validation(lines, demand)
        if demand.source_tech_theme_id:
            theme = await db.get(TechTheme, demand.source_tech_theme_id)
            if theme:
                lines.extend(["", "## 来源主题", f"- {theme.working_name} (`{theme.id}`)"])
                from app.models.models import Signal

                signal = (
                    await db.execute(
                        select(Signal).where(Signal.tech_theme_id == theme.id).limit(1)
                    )
                ).scalar_one_or_none()
                if signal is not None:
                    trace_md, _ = await build_signal_trace_markdown(db, signal.id)
                    lines.extend(["", "## 追溯摘要", trace_md])

    lines.extend(
        [
            "",
            "## 局限",
            "报告仅包含导出时可遍历的数据库节点；缺失环节保持为空，不推断补全。",
        ]
    )
    return "\n".join(lines)
