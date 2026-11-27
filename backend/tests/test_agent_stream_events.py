"""Streamed chat events: reasoning tokens and tool calls reach the client.

pydantic-ai hands an `event_stream_handler` an async iterable of stream events
(not one event at a time). These tests pin the translation layer so the chat no
longer shows only a spinner while a reasoning model thinks.
"""

from __future__ import annotations

import pytest
from pydantic_ai.messages import (
    FunctionToolCallEvent,
    OutputToolCallEvent,
    PartDeltaEvent,
    PartStartEvent,
    TextPartDelta,
    ThinkingPart,
    ThinkingPartDelta,
    ToolCallPart,
)

from app.domains.agent.workflow import forward_stream_event

pytestmark = [pytest.mark.no_db, pytest.mark.anyio]


def _collector() -> tuple[list[tuple[str, dict]], object]:
    events: list[tuple[str, dict]] = []

    async def sink(event_type: str, payload: dict) -> None:
        events.append((event_type, payload))

    return events, sink


async def test_reasoning_tokens_are_forwarded_as_thinking_deltas():
    events, sink = _collector()

    await forward_stream_event(
        PartStartEvent(index=0, part=ThinkingPart(content="先看证据")), sink, set()
    )
    await forward_stream_event(
        PartDeltaEvent(index=0, delta=ThinkingPartDelta(content_delta="再下结论")), sink, set()
    )

    assert events == [
        ("thinking.delta", {"delta": "先看证据"}),
        ("thinking.delta", {"delta": "再下结论"}),
    ]


async def test_function_tool_call_is_sent_once_and_output_tool_stays_hidden():
    events, sink = _collector()
    seen_tools: set[str] = set()
    call = FunctionToolCallEvent(
        part=ToolCallPart(tool_name="search_evidence", args={}, tool_call_id="tc-1")
    )

    await forward_stream_event(call, sink, seen_tools)
    await forward_stream_event(call, sink, seen_tools)
    await forward_stream_event(
        OutputToolCallEvent(
            part=ToolCallPart(tool_name="final_result", args={}, tool_call_id="tc-2")
        ),
        sink,
        seen_tools,
    )

    assert events == [("tool.call", {"tool": "search_evidence"})]
    assert seen_tools == {"search_evidence"}


async def test_plain_text_parts_are_not_mistaken_for_the_answer():
    events, sink = _collector()

    await forward_stream_event(
        PartDeltaEvent(index=0, delta=TextPartDelta(content_delta="草稿")), sink, set()
    )

    assert events == []
