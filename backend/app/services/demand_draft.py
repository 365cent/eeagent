"""Propose demand-point drafts from a tech theme and its retained signals (环节三)."""

from __future__ import annotations

import json
import uuid
from collections import Counter
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import Signal, SignalTag, TechTheme
from app.domains.evidence.signal_host import signal_host
from app.services.demand_agent import DemandAgentDeps, run_demand_agent_chat, signal_to_bot
from app.services.llm_gateway import (
    LLMNoModelError,
    LLMNotConfiguredError,
    LLMUpstreamError,
    chat_completion,
)

DEMAND_STEP_META: tuple[tuple[str, str], ...] = (
    ("fact_identification", "事实识别"),
    ("frequency_consensus", "频率与共识判断"),
    ("similarity_analysis", "相似性聚类"),
    ("stakeholder_attribution", "利益相关方归因"),
    ("demand_naming", "需求抽象与命名"),
)


def _pick_signals(signals: list[Signal], selected_ids: list[uuid.UUID] | None) -> list[Signal]:
    if not selected_ids:
        return signals
    allowed = {str(sid) for sid in selected_ids}
    picked = [s for s in signals if str(s.id) in allowed]
    if not picked:
        raise HTTPException(422, "所选信号不在该主题留存列表中")
    return picked


async def _theme_signals(db: AsyncSession, theme_id: uuid.UUID) -> tuple[TechTheme, list[Signal]]:
    theme = await db.get(TechTheme, theme_id)
    if theme is None:
        raise HTTPException(404, "theme not found")
    rows = (
        await db.execute(
            select(Signal)
            .options(selectinload(Signal.tags).selectinload(SignalTag.vocab))
            .where(
                Signal.tech_theme_id == theme_id,
                Signal.evidence_status_code == "retained",
                Signal.document_id.is_(None),
            )
            .order_by(Signal.updated_at.desc(), Signal.created_at.desc())
            .limit(200)
        )
    ).scalars().all()
    return theme, list(rows)


def _deterministic_draft(theme: TechTheme, signals: list[Signal]) -> dict:
    if len(signals) < 2:
        raise HTTPException(
            422,
            "该主题下至少需要两条已留存的网页信号才能自动归纳需求点",
        )

    stage_counts = Counter(s.value_chain_stage_code for s in signals if s.value_chain_stage_code)
    value_chain = stage_counts.most_common(1)[0][0] if stage_counts else "supply_chain"

    ordered = signals[:12]
    signal_ids = [str(s.id) for s in ordered]
    titles = [s.title.strip() for s in ordered if s.title.strip()]

    def hosts_for(ids: list[str]) -> set[str]:
        by_id = {str(s.id): s for s in ordered}
        return {signal_host(by_id[sid]) for sid in ids if sid in by_id}

    cross_ids: list[str] = []
    for candidate in ordered:
        if len(cross_ids) >= 2:
            break
        if cross_ids and signal_host(candidate) in hosts_for(cross_ids):
            continue
        cross_ids.append(str(candidate.id))
    if len(cross_ids) < 2:
        cross_ids = signal_ids[:2]

    steps: list[dict] = []
    for index, (key, label) in enumerate(DEMAND_STEP_META):
        picked = [signal_ids[index % len(signal_ids)]]
        if len(signal_ids) > 1:
            picked.append(signal_ids[(index + 1) % len(signal_ids)])
        picked = list(dict.fromkeys(picked))
        sample_titles = "；".join(titles[:3])
        steps.append(
            {
                "key": key,
                "content": (
                    f"【{label}】基于主题「{theme.working_name}」下 {len(signals)} 条留存信号归纳。"
                    f"代表性证据：{sample_titles}。"
                    "可在保存前根据对话助手建议微调表述。"
                ),
                "evidence_signal_ids": picked,
            }
        )

    perspectives = []
    for sid in cross_ids:
        sig = next(s for s in ordered if str(s.id) == sid)
        perspectives.append(f"{sig.publisher or signal_host(sig)}：{sig.title}")

    return {
        "name": f"{theme.working_name}相关技术需求",
        "value_chain_stage_code": value_chain,
        "source_tech_theme_id": str(theme.id),
        "derivation_trace": {"steps": steps},
        "cross_validation": {
            "conclusion": "通过",
            "perspectives": perspectives[:3],
            "evidence_signal_ids": cross_ids,
        },
        "time_series": [],
        "source": "deterministic",
    }


async def propose_demand_draft(
    db: AsyncSession,
    theme_id: uuid.UUID,
    *,
    user_hint: str | None = None,
    use_llm: bool = True,
    selected_signal_ids: list[uuid.UUID] | None = None,
) -> dict:
    theme, signals = await _theme_signals(db, theme_id)
    signals = _pick_signals(signals, selected_signal_ids)
    base = _deterministic_draft(theme, signals)
    hint = (user_hint or "").strip()
    if not use_llm or not hint:
        return base

    from app.services.llm_prompts import DEMAND_DRAFT_SYSTEM, demand_draft_user_message

    catalog = "\n".join(
        f"- {s.id}: {s.title} ({signal_host(s)})"
        for s in signals[:30]
    )
    baseline_json = json.dumps(base, ensure_ascii=False)
    messages = [
        {"role": "system", "content": DEMAND_DRAFT_SYSTEM},
        {
            "role": "user",
            "content": demand_draft_user_message(
                theme_name=theme.working_name,
                value_chain_suggestion=str(base["value_chain_stage_code"]),
                user_hint=hint,
                signal_catalog=catalog,
                baseline_json=baseline_json,
            ),
        },
    ]
    try:
        reply, _model = await chat_completion(
            messages, temperature=0.2, task="demand_draft"
        )
    except (LLMNotConfiguredError, LLMNoModelError, LLMUpstreamError):
        base["llm_note"] = "LLM 不可用，已返回规则归纳草稿"
        return base

    start = reply.find("{")
    end = reply.rfind("}")
    if start < 0 or end <= start:
        base["llm_note"] = "模型未返回 JSON，已返回规则归纳草稿"
        return base
    try:
        parsed = json.loads(reply[start : end + 1])
    except json.JSONDecodeError:
        base["llm_note"] = "模型 JSON 解析失败，已返回规则归纳草稿"
        return base

    allowed = {str(s.id) for s in signals}
    merged = {**base, **parsed, "source_tech_theme_id": str(theme.id), "source": "llm"}
    steps = merged.get("derivation_trace", {}).get("steps") if isinstance(merged.get("derivation_trace"), dict) else None
    if isinstance(steps, list):
        for step in steps:
            if not isinstance(step, dict):
                continue
            ids = step.get("evidence_signal_ids") or []
            step["evidence_signal_ids"] = [i for i in ids if str(i) in allowed]
    cv = merged.get("cross_validation")
    if isinstance(cv, dict):
        ids = cv.get("evidence_signal_ids") or []
        cv["evidence_signal_ids"] = [i for i in ids if str(i) in allowed]
    return merged


async def demand_assistant_reply(
    db: AsyncSession,
    theme_id: uuid.UUID,
    message: str,
    history: list[dict[str, str]],
    *,
    selected_signal_ids: list[uuid.UUID] | None = None,
) -> tuple[str, str | None, dict | None]:
    theme, signals = await _theme_signals(db, theme_id)
    signals = _pick_signals(signals, selected_signal_ids)
    if len(signals) < 2:
        raise HTTPException(422, "编组中至少需要两条留存信号才能使用需求助手")

    draft: dict | None = None
    if any(token in message for token in ("生成", "草稿", "自动", "归纳", "一键")):
        draft = await propose_demand_draft(
            db,
            theme_id,
            user_hint=message,
            use_llm=False,
            selected_signal_ids=[s.id for s in signals],
        )

    deps = DemandAgentDeps(
        theme_name=theme.working_name,
        bots=[signal_to_bot(s) for s in signals[:40]],
    )

    try:
        reply, model = await run_demand_agent_chat(deps, message, history)
    except LLMNotConfiguredError:
        if draft:
            bot_count = len(deps.bots)
            reply = (
                f"已根据编组内 {bot_count} 条信号生成规则归纳草稿。请在右侧预览并保存；"
                "配置 LLM 后可由 pydantic-ai 助手统筹各信号助手作答。"
            )
            return reply, None, draft
        raise HTTPException(
            503,
            "LLM 未配置：可仍使用「生成需求草稿」按钮获取规则归纳结果",
        )
    except LLMNoModelError as exc:
        raise HTTPException(503, f"LLM 无可用模型：{exc}") from exc
    except LLMUpstreamError as exc:
        raise HTTPException(502, f"LLM 上游错误（{exc.status}）：{exc.detail}") from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            500,
            "需求协调助手处理失败；请确认 backend 已重启到最新代码并重试。",
        ) from exc

    return reply, model, draft
