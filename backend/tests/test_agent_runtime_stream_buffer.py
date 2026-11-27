"""Regression: streamed events must not be appended twice on failure after flush."""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.identity import OperatorIdentity
from app.models.agent_models import AgentSession
from app.domains.agent.contract import AgentRunOutput
from app.domains.agent.runtime import execute_user_message

pytestmark = [pytest.mark.no_db, pytest.mark.anyio]


async def test_stream_buffer_not_duplicated_when_terminal_append_fails(monkeypatch):
    session = AgentSession(
        id=uuid.uuid4(),
        operator_subject="subj",
        project_key="default",
        page_context={},
    )
    actor = OperatorIdentity("subj", "researcher")
    db = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.commit = AsyncMock()

    append_calls: list[str] = []
    async def append_event(db, *, event_type, **kwargs):
        del db, kwargs
        append_calls.append(event_type)
        if event_type == "turn.completed":
            raise RuntimeError("simulate DB failure on terminal event")

    monkeypatch.setattr("app.domains.agent.runtime.append_event", append_event)

    async def fake_turn(agent, **kwargs):
        sink = kwargs["event_sink"]
        await sink("tool.call", {"tool": "search_evidence"})
        await sink("text.delta", {"delta": "x"})
        output = AgentRunOutput(answer="ok", citation_refs=[], patch_ids=[])
        return output, [], None

    monkeypatch.setattr("app.domains.agent.runtime.run_agent_turn", fake_turn)
    monkeypatch.setattr(
        "app.domains.agent.runtime.build_eea_agent",
        AsyncMock(return_value=MagicMock()),
    )
    monkeypatch.setattr(
        "app.domains.agent.runtime.build_instruction_addon",
        AsyncMock(return_value=""),
    )

    run, _, error, _ = await execute_user_message(
        db,
        session=session,
        actor=actor,
        message="hi",
    )
    assert error == "Agent 运行失败"
    assert run.status == "failed"
    # Durable events are buffered once; token deltas are not persisted at all.
    assert append_calls.count("tool.call") == 1
    assert append_calls.count("text.delta") == 0
    assert append_calls.count("turn.started") == 1
    assert append_calls.count("turn.failed") == 1
