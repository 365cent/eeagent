"""Demand-point assistant: pydantic-ai agent over a「signal bot group」."""

from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass

from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    TextPart,
    UserPromptPart,
)

from app.models.models import Signal
from app.domains.evidence.signal_host import signal_host
from app.services.pydantic_agent import build_model
from app.core.config import get_settings
from app.services.llm_gateway import (
    LLMNoModelError,
    LLMNotConfiguredError,
    LLMUpstreamError,
    _upstream_retryable,
    resolve_chat_model,
    upstream_from_pydantic_ai,
)
from app.services.llm_usage import (
    http_status_of,
    log_llm_call,
    usage_from_agent_result,
    usage_without_result,
)
from pydantic_ai.exceptions import ModelAPIError


class SignalBotBrief(BaseModel):
    """One retained signal presented to the model as a dedicated bot persona."""

    signal_id: uuid.UUID
    title: str
    host: str
    publisher: str | None = None
    channel_code: str | None = None
    tags: list[str] = Field(default_factory=list)
    excerpt: str = ""


@dataclass
class DemandAgentDeps:
    theme_name: str
    bots: list[SignalBotBrief]


def _signal_bot_excerpt(signal: Signal) -> str:
    """Plain-text context for the coordinator; uses persisted ``Signal.excerpt``."""
    title = (signal.title or "").strip() or str(signal.id)
    body = (signal.excerpt or "").strip()
    if body and body != title:
        return f"{title} — {body[:280]}"
    return body or title


def signal_to_bot(signal: Signal) -> SignalBotBrief:
    tags: list[str] = []
    for tag in signal.tags or []:
        vocab = getattr(tag, "vocab", None)
        label = getattr(vocab, "label", None) if vocab is not None else None
        if label:
            tags.append(str(label))
    title = (signal.title or "").strip() or str(signal.id)
    excerpt = _signal_bot_excerpt(signal)
    return SignalBotBrief(
        signal_id=signal.id,
        title=title,
        host=signal_host(signal),
        publisher=(signal.publisher or "").strip() or None,
        channel_code=signal.channel_code,
        tags=tags[:12],
        excerpt=excerpt,
    )


def bots_context_markdown(bots: list[SignalBotBrief]) -> str:
    lines = []
    for index, bot in enumerate(bots, start=1):
        tag_line = "、".join(bot.tags[:8]) if bot.tags else "（无标签）"
        lines.append(
            f"### 助手 {index:02d} · {bot.signal_id}\n"
            f"- 标题：{bot.title}\n"
            f"- 来源：{bot.publisher or bot.host}"
            + (f" · 渠道 {bot.channel_code}" if bot.channel_code else "")
            + f"\n- 技术标签：{tag_line}\n"
            f"- 摘要：{bot.excerpt}\n"
        )
    return "\n".join(lines)


def chat_history_to_messages(history: list[dict[str, str]]) -> list[ModelMessage]:
    messages: list[ModelMessage] = []
    for turn in history[-12:]:
        role = turn.get("role")
        content = (turn.get("content") or "").strip()
        if not content:
            continue
        if role == "user":
            messages.append(ModelRequest(parts=[UserPromptPart(content=content)]))
        elif role == "assistant":
            messages.append(ModelResponse(parts=[TextPart(content=content)]))
    return messages


_demand_agent: Agent[DemandAgentDeps, str] | None = None
_demand_agent_requested_model: str | None = None


async def get_demand_agent() -> Agent[DemandAgentDeps, str]:
    global _demand_agent, _demand_agent_requested_model
    if _demand_agent is not None:
        return _demand_agent

    settings = get_settings()
    base = settings.llm_base_url_normalized
    if not base:
        raise LLMNotConfiguredError("LLM_BASE_URL must be set in backend/.env")
    chosen = await resolve_chat_model()
    _demand_agent_requested_model = chosen
    model = build_model(chosen, base_url=base, api_key=settings.llm_api_key)

    agent: Agent[DemandAgentDeps, str] = Agent(
        model,
        deps_type=DemandAgentDeps,
        output_type=str,
    )

    @agent.instructions
    async def demand_instructions(ctx: RunContext[DemandAgentDeps]) -> str:
        catalog = bots_context_markdown(ctx.deps.bots)
        from app.services.llm_prompts import DEMAND_COORDINATOR_RULES

        return (
            f"{DEMAND_COORDINATOR_RULES}\n"
            f"当前主题：「{ctx.deps.theme_name}」，编组规模：{len(ctx.deps.bots)} 名助手。\n\n"
            f"{catalog}"
        )

    _demand_agent = agent
    return agent


async def run_demand_agent_chat(
    deps: DemandAgentDeps,
    message: str,
    history: list[dict[str, str]],
) -> tuple[str, str]:
    agent = await get_demand_agent()
    model_name = (
        _demand_agent_requested_model
        or str(getattr(getattr(agent, "model", None), "model_name", None) or "").strip()
        or await resolve_chat_model()
    )
    last_upstream: LLMUpstreamError | None = None
    for attempt in range(2):
        started = time.perf_counter()
        try:
            result = await agent.run(
                message.strip(),
                deps=deps,
                message_history=chat_history_to_messages(history),
            )
        except LLMUpstreamError as exc:
            log_llm_call(
                usage_without_result(
                    task="demand_coordinator",
                    requested_model=model_name,
                    caller_attempt=attempt + 1,
                    fallback=attempt > 0,
                    latency_ms=int((time.perf_counter() - started) * 1000),
                    http_status=exc.status,
                )
            )
            raise
        except ModelAPIError as exc:
            upstream = upstream_from_pydantic_ai(exc)
            log_llm_call(
                usage_without_result(
                    task="demand_coordinator",
                    requested_model=model_name,
                    caller_attempt=attempt + 1,
                    fallback=attempt > 0,
                    latency_ms=int((time.perf_counter() - started) * 1000),
                    http_status=http_status_of(exc),
                )
            )
            if attempt == 0 and _upstream_retryable(upstream):
                last_upstream = upstream
                await asyncio.sleep(0.6)
                continue
            raise upstream from exc
        usage = usage_from_agent_result(
            result,
            task="demand_coordinator",
            requested_model=model_name,
            caller_attempt=attempt + 1,
            fallback=attempt > 0,
            latency_ms=int((time.perf_counter() - started) * 1000),
        )
        log_llm_call(usage)
        served = (usage.served_model or model_name).strip() or model_name
        return result.output, served
    if last_upstream is not None:
        raise last_upstream
    raise LLMUpstreamError(502, "LLM 请求未完成")
