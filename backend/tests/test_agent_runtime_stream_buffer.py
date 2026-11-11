"""Regression: streamed events must not be appended twice on failure after flush."""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.identity import OperatorIdentity
from app.models.agent_models import AgentSession
from app.services.agent_contract import AgentRunOutput
from app.services.agent_runtime import execute_user_message

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

    monkeypatch.setattr("app.services.agent_runtime.append_event", append_event)

    async def fake_turn(agent, **kwargs):
        sink = kwargs["event_sink"]
        await sink("text.delta", {"delta": "x"})
        output = AgentRunOutput(answer="ok", citation_refs=[], patch_ids=[])
        return output, [], None

    monkeypatch.setattr("app.services.agent_runtime.run_agent_turn", fake_turn)
    monkeypatch.setattr(
        "app.services.agent_runtime.build_eea_agent",
        AsyncMock(return_value=MagicMock()),
    )
    monkeypatch.setattr(
        "app.services.agent_runtime.build_instruction_addon",
        AsyncMock(return_value=""),
    )

    run, _, error = await execute_user_message(
        db,
        session=session,
        actor=actor,
        message="hi",
    )
    assert error == "Agent 运行失败"
    assert run.status == "failed"
    delta_count = sum(1 for t in append_calls if t == "text.delta")
    assert delta_count == 1
    assert append_calls.count("turn.started") == 1
    assert append_calls.count("turn.failed") == 1
