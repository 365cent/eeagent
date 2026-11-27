"""BE-14 HTTP workflow: sessions, SSE, patches, isolation."""

from __future__ import annotations

import json
import uuid

import pytest
from pydantic_ai.messages import ModelMessage, ModelResponse, ToolCallPart
from pydantic_ai.models.function import AgentInfo, DeltaToolCall, FunctionModel

from app.core.identity import OperatorIdentity, get_operator_identity
from app.main import app
from app.services.agent_contract import AgentTurn
from tests.support import create_signal

pytestmark = pytest.mark.anyio


def _stub_agent_turn(messages: list[ModelMessage], info: AgentInfo) -> ModelResponse:
    del messages
    tool_name = info.output_tools[0].name
    return ModelResponse(
        parts=[
            ToolCallPart(
                tool_name,
                {"answer": "测试回答", "citation_refs": [], "patch_ids": []},
            )
        ]
    )


async def _stub_agent_stream(messages: list[ModelMessage], info: AgentInfo):
    del messages
    tool_name = info.output_tools[0].name
    payload = {"answer": "测试回答", "citation_refs": [], "patch_ids": []}
    yield {
        0: DeltaToolCall(
            name=tool_name,
            json_args=json.dumps(payload, ensure_ascii=False),
            tool_call_id="tc-0",
        )
    }


async def _agent_with_test_model():
    from app.services.agent_workflow import build_eea_agent

    model = FunctionModel(_stub_agent_turn, stream_function=_stub_agent_stream)
    return await build_eea_agent(model=model)


async def test_session_messages_and_skills_status(client):
    session = (await client.post("/api/v1/agent/sessions", json={"title": "history"})).json()
    messages = (await client.get(f"/api/v1/agent/sessions/{session['id']}/messages")).json()
    assert messages == []
    patches = (await client.get(f"/api/v1/agent/sessions/{session['id']}/patches")).json()
    assert patches == []

    skills = (await client.get("/api/v1/agent/skills/status")).json()
    assert "baseline_mode" in skills
    assert isinstance(skills["packs"], list)


async def test_session_create_list_and_isolation(client, monkeypatch):
    async def other_actor():
        return OperatorIdentity("actor-b", "researcher")

    created = await client.post("/api/v1/agent/sessions", json={"title": "研究"})
    assert created.status_code == 200
    session_id = created.json()["id"]

    app.dependency_overrides[get_operator_identity] = other_actor
    try:
        denied = await client.get(f"/api/v1/agent/sessions/{session_id}")
        assert denied.status_code == 403
    finally:
        app.dependency_overrides.pop(get_operator_identity, None)

    listed = await client.get("/api/v1/agent/sessions")
    assert any(row["id"] == session_id for row in listed.json())


async def test_list_sessions_filters_by_signal_page_context(client):
    sig = await create_signal(client, title="session filter target")
    other = await create_signal(client, title="other signal")
    scoped = (
        await client.post(
            "/api/v1/agent/sessions",
            json={"title": "scoped", "page_context": {"signal_id": sig["id"]}},
        )
    ).json()
    unrelated = (
        await client.post(
            "/api/v1/agent/sessions",
            json={"title": "unrelated", "page_context": {"signal_id": other["id"]}},
        )
    ).json()
    open_session = (await client.post("/api/v1/agent/sessions", json={"title": "open"})).json()

    filtered = await client.get("/api/v1/agent/sessions", params={"signal_id": sig["id"]})
    assert filtered.status_code == 200, filtered.text
    ids = {row["id"] for row in filtered.json()}
    assert scoped["id"] in ids
    assert unrelated["id"] not in ids
    assert open_session["id"] not in ids
    assert filtered.json()[0]["page_context"] == {"signal_id": sig["id"]}

    all_sessions = await client.get("/api/v1/agent/sessions")
    assert {row["id"] for row in all_sessions.json()} >= {scoped["id"], unrelated["id"], open_session["id"]}


async def test_patch_propose_confirm_and_duplicate(client, monkeypatch):
    sig = await create_signal(client, title="patch target")
    session = (await client.post("/api/v1/agent/sessions", json={})).json()

    from app.services.agent_patches import propose_signal_patch
    from app.models.agent_models import AgentSession
    from app.db.base import SessionLocal
    from app.services.agent_contract import PatchFieldChange, CitationLedger
    from app.core.identity import OperatorIdentity
    from app.services.agent_citations import make_signal_citation

    async with SessionLocal() as db:
        row = await db.get(AgentSession, uuid.UUID(session["id"]))
        ledger = CitationLedger()
        ledger.register(
            make_signal_citation(
                signal_id=uuid.UUID(sig["id"]),
                title=sig["title"],
                summary="ok",
            )
        )
        patch = await propose_signal_patch(
            db,
            session=row,
            signal_id=uuid.UUID(sig["id"]),
            changes=[PatchFieldChange(field_name="value_chain_stage_code", new_value="regulation_standard")],
            reason="对齐环节",
            citation_refs=[f"sig:{sig['id']}"],
            ledger=ledger,
            run_id=None,
        )
        await db.commit()
        patch_id = str(patch.id)

    before = (await client.get(f"/api/v1/signals/{sig['id']}")).json()
    assert before["value_chain_stage_code"] != "regulation_standard"

    confirm = await client.post(f"/api/v1/agent/sessions/{session['id']}/patches/{patch_id}/confirm")
    assert confirm.status_code == 200
    after = (await client.get(f"/api/v1/signals/{sig['id']}")).json()
    assert after["value_chain_stage_code"] == "regulation_standard"

    dup = await client.post(f"/api/v1/agent/sessions/{session['id']}/patches/{patch_id}/confirm")
    assert dup.status_code == 409


async def test_sse_replay_order(client, monkeypatch):
    monkeypatch.setattr("app.services.agent_runtime.build_eea_agent", _agent_with_test_model)
    session = (await client.post("/api/v1/agent/sessions", json={})).json()
    resp = await client.post(
        f"/api/v1/agent/sessions/{session['id']}/messages",
        json={"message": "hello"},
    )
    assert resp.status_code == 200
    served_model = resp.json().get("served_model")
    assert served_model and served_model.startswith("function:"), served_model

    events = await client.get(
        f"/api/v1/agent/sessions/{session['id']}/events",
        headers={"Last-Event-ID": "0"},
    )
    body = events.text
    assert "turn.started" in body
    assert "id: 1" in body or "id: 2" in body

    from sqlalchemy import select

    from app.db.base import SessionLocal
    from app.models.agent_models import AgentRun

    async with SessionLocal() as db:
        run = (
            await db.execute(select(AgentRun).where(AgentRun.session_id == uuid.UUID(session["id"])))
        ).scalar_one()
    assert run.usage_json["task"] == "durable_agent"
    assert run.usage_json["usage_source"] == "local_model"
    assert run.usage_json["input_tokens"] is None
    assert run.usage_json["cache_read_tokens"] is None
    assert "hello" not in str(run.usage_json)


async def test_gateway_unconfigured_returns_failed_turn(client, monkeypatch):
    async def boom(**kwargs):
        from app.platform.llm_gateway import LLMNotConfiguredError

        raise LLMNotConfiguredError("unset")

    monkeypatch.setattr("app.services.agent_runtime.build_eea_agent", boom)
    session = (await client.post("/api/v1/agent/sessions", json={})).json()
    resp = await client.post(
        f"/api/v1/agent/sessions/{session['id']}/messages",
        json={"message": "hi"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "failed"
    assert data["error"]


async def test_memory_owner_scoped(client):
    created = await client.post(
        "/api/v1/agent/memories",
        json={"scope": "user", "key": "pref", "content": "关注 eFuse"},
    )
    assert created.status_code == 200
    mem_id = created.json()["id"]
    listed = (await client.get("/api/v1/agent/memories")).json()
    assert any(m["id"] == mem_id for m in listed)
    deleted = await client.delete(f"/api/v1/agent/memories/{mem_id}")
    assert deleted.status_code == 204


async def _propose_stage_patch(client, session_id: str, sig: dict, stage: str) -> str:
    from app.db.base import SessionLocal
    from app.models.agent_models import AgentSession
    from app.services.agent_patches import propose_signal_patch
    from app.services.agent_contract import PatchFieldChange, CitationLedger
    from app.services.agent_citations import make_signal_citation

    async with SessionLocal() as db:
        row = await db.get(AgentSession, uuid.UUID(session_id))
        ledger = CitationLedger()
        ledger.register(
            make_signal_citation(
                signal_id=uuid.UUID(sig["id"]),
                title=sig["title"],
                summary="ok",
            )
        )
        patch = await propose_signal_patch(
            db,
            session=row,
            signal_id=uuid.UUID(sig["id"]),
            changes=[PatchFieldChange(field_name="value_chain_stage_code", new_value=stage)],
            reason="测试变更",
            citation_refs=[f"sig:{sig['id']}"],
            ledger=ledger,
            run_id=None,
        )
        await db.commit()
        return str(patch.id)


async def test_patch_reject_leaves_signal_unchanged(client):
    sig = await create_signal(client, title="reject patch")
    session = (await client.post("/api/v1/agent/sessions", json={})).json()
    patch_id = await _propose_stage_patch(
        client, session["id"], sig, "regulation_standard"
    )
    reject = await client.post(
        f"/api/v1/agent/sessions/{session['id']}/patches/{patch_id}/reject"
    )
    assert reject.status_code == 200
    after = (await client.get(f"/api/v1/signals/{sig['id']}")).json()
    assert after["value_chain_stage_code"] != "regulation_standard"


async def test_stale_patch_confirmation_rejected(client):
    sig = await create_signal(client, title="stale patch")
    session = (await client.post("/api/v1/agent/sessions", json={})).json()
    patch_id = await _propose_stage_patch(
        client, session["id"], sig, "regulation_standard"
    )
    await client.patch(
        f"/api/v1/signals/{sig['id']}",
        json={"value_chain_stage_code": "creation_supply"},
    )
    stale = await client.post(
        f"/api/v1/agent/sessions/{session['id']}/patches/{patch_id}/confirm"
    )
    assert stale.status_code == 409


async def test_expired_patch_confirmation_rejected(client, monkeypatch):
    from datetime import datetime, timedelta, timezone

    from app.db.base import SessionLocal
    from app.models.agent_models import AgentPatch

    sig = await create_signal(client, title="expired patch")
    session = (await client.post("/api/v1/agent/sessions", json={})).json()
    patch_id = await _propose_stage_patch(
        client, session["id"], sig, "regulation_standard"
    )
    async with SessionLocal() as db:
        patch = await db.get(AgentPatch, uuid.UUID(patch_id))
        patch.expires_at = datetime.now(timezone.utc) - timedelta(hours=1)
        await db.commit()

    expired = await client.post(
        f"/api/v1/agent/sessions/{session['id']}/patches/{patch_id}/confirm"
    )
    assert expired.status_code == 409


async def test_session_messages_list_user_before_assistant(client, monkeypatch):
    monkeypatch.setattr("app.services.agent_runtime.build_eea_agent", _agent_with_test_model)
    session = (await client.post("/api/v1/agent/sessions", json={})).json()
    post = await client.post(
        f"/api/v1/agent/sessions/{session['id']}/messages",
        json={"message": "用户问题"},
    )
    assert post.status_code == 200, post.text
    listed = (await client.get(f"/api/v1/agent/sessions/{session['id']}/messages")).json()
    assert len(listed) == 2
    assert listed[0]["role"] == "user"
    assert listed[0]["content"] == "用户问题"
    assert listed[1]["role"] == "assistant"


async def test_session_message_history_persists(client, monkeypatch):
    monkeypatch.setattr("app.services.agent_runtime.build_eea_agent", _agent_with_test_model)
    session = (await client.post("/api/v1/agent/sessions", json={})).json()
    first = await client.post(
        f"/api/v1/agent/sessions/{session['id']}/messages",
        json={"message": "第一轮"},
    )
    assert first.status_code == 200
    second = await client.post(
        f"/api/v1/agent/sessions/{session['id']}/messages",
        json={"message": "第二轮"},
    )
    assert second.status_code == 200
    from app.db.base import SessionLocal
    from app.models.agent_models import AgentSession

    async with SessionLocal() as db:
        row = await db.get(AgentSession, uuid.UUID(session["id"]))
        assert row.model_messages_json and len(row.model_messages_json) > 32


async def test_cancel_run_emits_event(client):
    from datetime import datetime, timezone

    from app.db.base import SessionLocal
    from app.models.agent_models import AgentRun, AgentSession

    session = (await client.post("/api/v1/agent/sessions", json={})).json()
    async with SessionLocal() as db:
        row = await db.get(AgentSession, uuid.UUID(session["id"]))
        run = AgentRun(session_id=row.id, status="running", started_at=datetime.now(timezone.utc))
        db.add(run)
        await db.commit()
        run_id = str(run.id)

    cancel = await client.post(
        f"/api/v1/agent/sessions/{session['id']}/runs/{run_id}/cancel"
    )
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "cancelled"
    events = await client.get(f"/api/v1/agent/sessions/{session['id']}/events")
    assert "turn.cancelled" in events.text


async def test_patch_confirm_writes_single_audit(client):
    from sqlalchemy import func, select

    from app.db.base import SessionLocal
    from app.models.models import CorrectionAudit

    sig = await create_signal(client, title="audit once")
    session = (await client.post("/api/v1/agent/sessions", json={})).json()
    patch_id = await _propose_stage_patch(
        client, session["id"], sig, "regulation_standard"
    )
    async with SessionLocal() as db:
        before = await db.scalar(
            select(func.count())
            .select_from(CorrectionAudit)
            .where(
                CorrectionAudit.entity_type == "signal",
                CorrectionAudit.entity_id == uuid.UUID(sig["id"]),
                CorrectionAudit.field_name == "value_chain_stage_code",
            )
        )
    confirm = await client.post(
        f"/api/v1/agent/sessions/{session['id']}/patches/{patch_id}/confirm"
    )
    assert confirm.status_code == 200
    async with SessionLocal() as db:
        after = await db.scalar(
            select(func.count())
            .select_from(CorrectionAudit)
            .where(
                CorrectionAudit.entity_type == "signal",
                CorrectionAudit.entity_id == uuid.UUID(sig["id"]),
                CorrectionAudit.field_name == "value_chain_stage_code",
            )
        )
    assert after == (before or 0) + 1


async def test_workflow_smoke_sequence(client, monkeypatch):
    """10-step acceptance path from BE-14 (HTTP/SSE, two actors)."""
    monkeypatch.setattr("app.services.agent_runtime.build_eea_agent", _agent_with_test_model)
    session = (await client.post("/api/v1/agent/sessions", json={"title": "smoke"})).json()
    turn = await client.post(
        f"/api/v1/agent/sessions/{session['id']}/messages",
        json={"message": "检索 eFuse"},
    )
    assert turn.status_code == 200
    partial = await client.get(
        f"/api/v1/agent/sessions/{session['id']}/events",
        headers={"Last-Event-ID": "0"},
    )
    assert "turn.started" in partial.text
    sig = await create_signal(client, title="smoke patch")
    patch_id = await _propose_stage_patch(
        client, session["id"], sig, "regulation_standard"
    )
    unchanged = (await client.get(f"/api/v1/signals/{sig['id']}")).json()
    assert unchanged["value_chain_stage_code"] != "regulation_standard"
    confirm = await client.post(
        f"/api/v1/agent/sessions/{session['id']}/patches/{patch_id}/confirm"
    )
    assert confirm.status_code == 200
    dup = await client.post(
        f"/api/v1/agent/sessions/{session['id']}/patches/{patch_id}/confirm"
    )
    assert dup.status_code == 409
    await client.patch(
        f"/api/v1/signals/{sig['id']}",
        json={"value_chain_stage_code": "creation_supply"},
    )
    stale = await client.post(
        f"/api/v1/agent/sessions/{session['id']}/patches/{patch_id}/confirm"
    )
    assert stale.status_code == 409

    async def other_actor():
        return OperatorIdentity("actor-smoke-b", "researcher")

    app.dependency_overrides[get_operator_identity] = other_actor
    try:
        denied = await client.get(f"/api/v1/agent/sessions/{session['id']}")
        assert denied.status_code == 403
    finally:
        app.dependency_overrides.pop(get_operator_identity, None)


async def test_message_stream_returns_completed_sse(client, monkeypatch):
    monkeypatch.setattr("app.services.agent_runtime.build_eea_agent", _agent_with_test_model)
    session = (await client.post("/api/v1/agent/sessions", json={"title": "stream"})).json()

    response = await client.post(
        f"/api/v1/agent/sessions/{session['id']}/messages/stream",
        json={"message": "hello"},
    )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/event-stream")
    assert "event: message.completed" in response.text
    assert '"status": "completed"' in response.text
    assert '"served_model"' in response.text

    messages = (
        await client.get(f"/api/v1/agent/sessions/{session['id']}/messages")
    ).json()
    assert [row["role"] for row in messages] == ["user", "assistant"]
    reply = messages[1]
    assert reply["served_model"] and reply["served_model"].startswith("function:")
    assert reply["finished_at"]
    assert messages[0]["served_model"] is None
async def test_agent_turn_timeout_marks_the_run_failed(client, monkeypatch):
    import asyncio

    from pydantic_ai.messages import ModelResponse, TextPart

    from app.core.config import get_settings
    from app.services.agent_workflow import build_eea_agent

    settings = get_settings().model_copy(update={"agent_turn_timeout_seconds": 0.5})
    monkeypatch.setattr("app.services.agent_runtime.get_settings", lambda: settings)

    async def hang(messages, info):
        del messages, info
        await asyncio.sleep(30)
        return ModelResponse(parts=[TextPart("late")])

    async def hang_stream(messages, info):
        del messages, info
        await asyncio.sleep(30)
        yield {}

    async def slow_agent(*, model=None):
        del model
        return await build_eea_agent(
            model=FunctionModel(hang, stream_function=hang_stream)
        )

    monkeypatch.setattr("app.services.agent_runtime.build_eea_agent", slow_agent)

    session = (await client.post("/api/v1/agent/sessions", json={})).json()
    response = await client.post(
        f"/api/v1/agent/sessions/{session['id']}/messages",
        json={"message": "hello"},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "failed"
    from sqlalchemy import select
    from app.db.base import SessionLocal
    from app.models.agent_models import AgentRun
    async with SessionLocal() as db:
        run = (
            await db.execute(select(AgentRun).where(AgentRun.id == uuid.UUID(body["run_id"])))
        ).scalar_one()
    assert "未返回完整结果" in (body["error"] or ""), (body, run.error_message)
