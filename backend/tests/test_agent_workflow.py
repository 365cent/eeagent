"""BE-14 HTTP workflow: sessions, SSE, patches, isolation."""

from __future__ import annotations

import uuid

import pytest
from pydantic_ai.models.test import TestModel

from app.core.identity import OperatorIdentity, get_operator_identity
from app.main import app
from app.services.agent_contract import AgentTurn
from tests.support import create_signal

pytestmark = pytest.mark.anyio


async def _agent_with_test_model():
    from app.services.agent_workflow import build_eea_agent

    return await build_eea_agent(model=TestModel())


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

    events = await client.get(
        f"/api/v1/agent/sessions/{session['id']}/events",
        headers={"Last-Event-ID": "0"},
    )
    body = events.text
    assert "turn.started" in body
    assert "id: 1" in body or "id: 2" in body


async def test_gateway_unconfigured_returns_failed_turn(client, monkeypatch):
    async def boom(**kwargs):
        from app.services.llm_gateway import LLMNotConfiguredError

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
