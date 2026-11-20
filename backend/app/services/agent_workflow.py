"""Pydantic AI orchestration for BE-14."""

from __future__ import annotations

import time
import uuid
from typing import Any, Awaitable, Callable

from pydantic_ai import Agent, DeferredToolRequests, ModelRetry, RunContext
from pydantic_ai.messages import (
    FunctionToolCallEvent,
    ModelMessagesTypeAdapter,
    PartDeltaEvent,
    PartStartEvent,
    ThinkingPart,
    ThinkingPartDelta,
)
from pydantic_ai.models import Model
from pydantic_ai.models.openai import OpenAIChatModel

from app.core.identity import OperatorIdentity
from app.services.agent_citations import assert_citations_usable
from app.services.agent_contract import (
    AGENT_SYSTEM_INSTRUCTIONS,
    ALLOWED_AGENT_TOOLS,
    AgentDeps,
    AgentRunOutput,
    AgentTurn,
    CitationLedger,
)
from app.services.agent_tools import (
    apply_confirmed_patch_tool,
    draft_trace_report_tool,
    propose_db_patch_tool,
    search_evidence_tool,
    search_rag_tool,
    suggest_signal_tags_tool,
    suggest_theme_membership_tool,
)
from app.services import model_speed
from app.services.llm_gateway import LLMNotConfiguredError
from app.services.llm_usage import (
    http_status_of,
    log_llm_call,
    usage_from_agent_result,
    usage_without_result,
)
from app.services.pydantic_agent import build_hedged_model, build_model
from app.core.config import get_settings


async def build_eea_agent(*, model: Model | None = None) -> Agent[AgentDeps, AgentRunOutput]:
    if model is None:
        settings = get_settings()
        base = settings.chat_base_url_normalized
        if not base:
            raise LLMNotConfiguredError("CHAT_BASE_URL must be set in backend/.env")
        model = await build_hedged_model()

    agent: Agent[AgentDeps, AgentRunOutput] = Agent(
        model,
        system_prompt=AGENT_SYSTEM_INSTRUCTIONS,
        deps_type=AgentDeps,
        output_type=[AgentTurn, DeferredToolRequests],
        retries=2,
    )

    agent.tool(search_evidence_tool, name="search_evidence")
    agent.tool(search_rag_tool, name="search_rag")
    agent.tool(suggest_signal_tags_tool, name="suggest_signal_tags")
    agent.tool(suggest_theme_membership_tool, name="suggest_theme_membership")
    agent.tool(propose_db_patch_tool, name="propose_db_patch")
    agent.tool(apply_confirmed_patch_tool, name="apply_confirmed_patch", requires_approval=True)
    agent.tool(draft_trace_report_tool, name="draft_trace_report")

    @agent.instructions
    def runtime_context(ctx: RunContext[AgentDeps]) -> str:
        """Trusted server-side context preloaded on AgentDeps before each run."""
        return ctx.deps.instruction_addon

    @agent.output_validator
    async def _validate_turn(ctx, output: AgentRunOutput) -> AgentRunOutput:
        if isinstance(output, DeferredToolRequests):
            return output
        invalid = ctx.deps.ledger.validate_refs(output.citation_refs)
        if invalid:
            raise ModelRetry(f"无效或不可引用的 citation ref: {', '.join(invalid)}")
        return output

    return agent


def registered_tool_names(agent: Agent[AgentDeps, AgentRunOutput]) -> set[str]:
    tools = agent._function_toolset.tools  # noqa: SLF001 — contract tests
    return set(tools.keys()) & ALLOWED_AGENT_TOOLS


def dumps_message_history(messages: list[Any]) -> bytes:
    return ModelMessagesTypeAdapter.dump_json(messages)


def loads_message_history(raw: bytes | None) -> list[Any]:
    if not raw:
        return []
    return ModelMessagesTypeAdapter.validate_json(raw)


EventSink = Callable[[str, dict[str, Any]], Awaitable[None]]


async def forward_stream_event(
    event: Any, event_sink: EventSink, seen_tools: set[str]
) -> None:
    """Translate one pydantic-ai stream event into a chat event.

    Only the parts a reader can act on are forwarded: reasoning tokens
    (`thinking.delta`) and function tool calls (`tool.call`). The model's final
    answer is streamed from the validated output in `run_agent_turn`, and the
    output tool call (`final_result`) is not a business tool. Dispatching on
    the concrete event classes keeps this working with the event kinds the
    installed pydantic-ai version actually emits.
    """
    if isinstance(event, PartStartEvent):
        part = event.part
        if isinstance(part, ThinkingPart) and part.content:
            await event_sink("thinking.delta", {"delta": part.content})
        return
    if isinstance(event, PartDeltaEvent):
        delta = event.delta
        if isinstance(delta, ThinkingPartDelta) and delta.content_delta:
            await event_sink("thinking.delta", {"delta": delta.content_delta})
        return
    if isinstance(event, FunctionToolCallEvent):
        name = getattr(event.part, "tool_name", None)
        if isinstance(name, str) and name and name not in seen_tools:
            seen_tools.add(name)
            await event_sink("tool.call", {"tool": name})


async def _drain_stream_events(
    ctx: Any, events: Any, event_sink: EventSink, seen_tools: set[str]
) -> None:
    """Consume the handler stream; pydantic-ai hands over an async iterable."""
    del ctx
    if hasattr(events, "__aiter__"):
        async for event in events:
            await forward_stream_event(event, event_sink, seen_tools)
        return
    # Older pydantic-ai versions called the handler once per event.
    await forward_stream_event(events, event_sink, seen_tools)


async def run_agent_turn(
    agent: Agent[AgentDeps, AgentRunOutput],
    *,
    user_message: str,
    deps: AgentDeps,
    message_history: list[Any] | None = None,
    deferred_tool_results=None,
    event_sink: EventSink | None = None,
) -> tuple[AgentRunOutput, list[Any], dict[str, Any] | None]:
    model = getattr(agent, "model", None)
    requested_model = str(getattr(model, "model_name", None) or "")
    started = time.perf_counter()
    seen_tools: set[str] = set()

    async def handler(ctx, events) -> None:
        if event_sink is None:
            return
        await _drain_stream_events(ctx, events, event_sink, seen_tools)

    try:
        if event_sink is not None:
            last_answer = ""
            async with agent.run_stream(
                user_message,
                deps=deps,
                message_history=message_history or [],
                deferred_tool_results=deferred_tool_results,
                event_stream_handler=handler,
            ) as streamed:
                async for partial in streamed.stream_output(debounce_by=0.05):
                    answer = getattr(partial, "answer", None)
                    if not isinstance(answer, str) or answer == last_answer:
                        continue
                    if answer.startswith(last_answer):
                        await event_sink("text.delta", {"delta": answer[len(last_answer) :]})
                    else:
                        # Partial validation rewrote earlier text; replace it so
                        # the client never shows a broken concatenation.
                        await event_sink("text.replace", {"text": answer})
                    last_answer = answer
                output = await streamed.get_output()
                messages = streamed.all_messages()
                final_answer = getattr(output, "answer", None)
                if isinstance(final_answer, str) and final_answer.startswith(last_answer):
                    if len(final_answer) > len(last_answer):
                        await event_sink(
                            "text.delta", {"delta": final_answer[len(last_answer) :]}
                        )
                elif isinstance(final_answer, str):
                    await event_sink("text.replace", {"text": final_answer})
        else:
            result = await agent.run(
                user_message,
                deps=deps,
                message_history=message_history or [],
                deferred_tool_results=deferred_tool_results,
            )
            output = result.output
            messages = result.all_messages()
            streamed = result
        usage = usage_from_agent_result(
            streamed,
            task="durable_agent",
            requested_model=requested_model,
            latency_ms=int((time.perf_counter() - started) * 1000),
        )
    except Exception as exc:
        # A model that wins the stream but breaks the agent contract costs the
        # user a whole reply: demote it hard so the next turn starts elsewhere.
        winner = getattr(getattr(agent, "model", None), "last_winner", None)
        if winner:
            await model_speed.record_failure(
                winner, error=f"{type(exc).__name__}: {exc}", kind="turn", weight=3
            )
        log_llm_call(
            usage_without_result(
                task="durable_agent",
                requested_model=requested_model,
                latency_ms=int((time.perf_counter() - started) * 1000),
                http_status=http_status_of(exc),
            )
        )
        raise
    log_llm_call(usage)

    if isinstance(output, AgentTurn) and event_sink:
        for ref in output.citation_refs:
            citation = deps.ledger.get(ref)
            if citation:
                await event_sink("citation", {"ref_id": ref, "kind": citation.kind})
    elif isinstance(output, DeferredToolRequests) and event_sink:
        for call in output.approvals:
            await event_sink(
                "approval.required",
                {"tool": call.tool_name, "tool_call_id": call.tool_call_id},
            )
    return output, messages, usage.as_dict()


def deps_for_session(
    db,
    actor: OperatorIdentity,
    session_id: uuid.UUID,
    project_key: str | None,
    page_context: dict | None,
    *,
    run_id: uuid.UUID | None = None,
    approved_patch_ids: set[uuid.UUID] | None = None,
) -> AgentDeps:
    return AgentDeps(
        db=db,
        actor=actor,
        session_id=session_id,
        project_key=project_key,
        page_context=page_context,
        run_id=run_id,
        ledger=CitationLedger(),
        approved_patch_ids=approved_patch_ids or set(),
    )
