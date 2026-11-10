"""Optional live gateway check for the agent workflow (synthetic only)."""

import os

import pytest

pytestmark = [pytest.mark.anyio, pytest.mark.live_maas]


@pytest.mark.skipif(os.environ.get("EEA_LLM_INTEGRATION") != "1", reason="set EEA_LLM_INTEGRATION=1")
async def test_live_agent_session_message(client):
    session = (await client.post("/api/v1/agent/sessions", json={"title": "live-smoke"})).json()
    resp = await client.post(
        f"/api/v1/agent/sessions/{session['id']}/messages",
        json={"message": "用一句话说明平台如何检索证据。"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] in {"completed", "approval_required", "failed"}
