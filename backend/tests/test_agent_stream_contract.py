"""The chat stream contract: typed events, and a failed turn keeps its text.

Two guarantees the UI depends on:

- every event the server sends validates against a pydantic model, so the
  browser never has to guess a shape;
- a turn that dies midway still hands over the tokens it already produced
  (``turn.failed.partial_text`` plus a stored assistant message), so the reader
  sees the partial answer with an error and a retry instead of a blank bubble.
"""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from pydantic import ValidationError

from app.core.identity import OperatorIdentity
from app.domains.agent.runtime import execute_user_message
from app.models.agent_models import AgentSession
from app.schemas.agent import AgentMessageRecord
from app.schemas.agent_stream import parse_stream_event, stream_event_payload

pytestmark = [pytest.mark.no_db, pytest.mark.anyio]


def test_failure_event_defaults_are_filled() -> None:
    payload = stream_event_payload("turn.failed", {"error": "boom"})

    assert payload == {
        "type": "turn.failed",
        "error": "boom",
        "partial_text": "",
        "retryable": True,
    }
    parsed = parse_stream_event(payload)
    assert getattr(parsed, "partial_text") == ""


def test_citation_defaults_its_kind() -> None:
    payload = stream_event_payload("citation", {"ref_id": "sig:abc"})

    assert payload["kind"] == "unknown"


def test_a_broken_event_fails_at_the_producer() -> None:
    with pytest.raises(ValidationError):
        stream_event_payload("text.delta", {"delta": None})


def test_unknown_events_pass_through() -> None:
    payload = stream_event_payload("turn.something-new", {"x": 1})

    assert payload == {"type": "turn.something-new", "x": 1}


def test_message_record_exposes_the_run_failure() -> None:
    record = AgentMessageRecord(
        id=uuid.uuid4(),
        session_id=uuid.uuid4(),
        run_id=uuid.uuid4(),
        role="assistant",
        content="部分答复",
        created_at="2026-11-27T00:00:00Z",
        status="failed",
        error="Agent 运行失败",
    )

    assert record.status == "failed"
    assert record.error == "Agent 运行失败"


async def test_failed_turn_keeps_the_partial_reply(monkeypatch):
    session = AgentSession(
        id=uuid.uuid4(),
        operator_subject="subj",
        project_key="default",
        page_context={},
    )
    actor = OperatorIdentity("subj", "researcher")
    db = AsyncMock()
    added: list[object] = []
    db.add = MagicMock(side_effect=lambda row: added.append(row))
    db.flush = AsyncMock()
    db.commit = AsyncMock()

    failed_payloads: list[dict] = []

    async def append_event(db, *, event_type, payload, **kwargs):  # noqa: ANN001
        if event_type == "turn.failed":
            failed_payloads.append(payload)

    monkeypatch.setattr("app.domains.agent.runtime.append_event", append_event)

    async def fake_turn(agent, **kwargs):  # noqa: ANN001
        sink = kwargs["event_sink"]
        holder = kwargs["partial_holder"]
        await sink("text.delta", {"delta": "先写一半"})
        holder[:] = ["先写一半的答复"]
        raise RuntimeError("model died mid-stream")

    monkeypatch.setattr("app.domains.agent.runtime.run_agent_turn", fake_turn)
    monkeypatch.setattr(
        "app.domains.agent.runtime.build_eea_agent", AsyncMock(return_value=MagicMock())
    )
    monkeypatch.setattr(
        "app.domains.agent.runtime.build_instruction_addon", AsyncMock(return_value="")
    )

    run, _, error, served = await execute_user_message(
        db, session=session, actor=actor, message="hi"
    )

    assert run.status == "failed"
    assert error == "Agent 运行失败"
    assert served is None

    assistant_rows = [row for row in added if getattr(row, "role", None) == "assistant"]
    assert [row.content for row in assistant_rows] == ["先写一半的答复"]
    assert assistant_rows[0].run_id == run.id

    assert failed_payloads, "turn.failed must be emitted"
    payload = failed_payloads[-1]
    assert payload["partial_text"] == "先写一半的答复"
    assert payload["retryable"] is True
    assert payload["error"] == "Agent 运行失败"
