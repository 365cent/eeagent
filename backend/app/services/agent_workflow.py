"""Pydantic AI orchestration for BE-14."""

from __future__ import annotations

import uuid
from typing import Any, Awaitable, Callable

from pydantic_ai import Agent, DeferredToolRequests, ModelRetry
from pydantic_ai.messages import ModelMessagesTypeAdapter
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
from app.services.llm_gateway import LLMNotConfiguredError, resolve_chat_model
from app.services.pydantic_agent import build_model
from app.core.config import get_settings


async def build_eea_agent(*, model: OpenAIChatModel | None = None) -> Agent[AgentDeps, AgentRunOutput]:
    if model is None:
        settings = get_settings()
        base = settings.llm_base_url_normalized
        if not base:
            raise LLMNotConfiguredError("LLM_BASE_URL must be set in backend/.env")
        chosen = await resolve_chat_model()
        model = build_model(chosen, base_url=base, api_key=settings.llm_api_key)

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


async def run_agent_turn(
    agent: Agent[AgentDeps, AgentRunOutput],
    *,
    user_message: str,
    deps: AgentDeps,
    message_history: list[Any] | None = None,
    deferred_tool_results=None,
    event_sink: EventSink | None = None,
) -> tuple[AgentRunOutput, list[Any]]:
    async def handler(ctx, event) -> None:
        if event_sink is None:
            return
        delta = getattr(event, "delta", None)
        if delta:
            await event_sink("text.delta", {"delta": delta})
        tool_name = getattr(event, "tool_name", None)
        if tool_name:
            await event_sink("tool.call", {"tool": tool_name})

    result = await agent.run(
        user_message,
        deps=deps,
        message_history=message_history or [],
        deferred_tool_results=deferred_tool_results,
        event_stream_handler=handler,
    )

    output = result.output
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
    return output, result.all_messages()


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
