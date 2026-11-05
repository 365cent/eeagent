"""GET /llm/status exposes configured model id without secrets."""

import pytest

pytestmark = pytest.mark.anyio


async def test_llm_status_shape(client):
    r = await client.get("/api/v1/llm/status")
    assert r.status_code == 200, r.text
    body = r.json()
    assert "configured" in body
    assert "model" in body
    if body["model"]:
        assert body["configured"] is True
