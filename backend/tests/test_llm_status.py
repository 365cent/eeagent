"""GET /llm/status exposes configured model and runtime tuning without secrets."""

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
    # Operator visibility: the attempt budget and hedge knobs the resolver uses.
    assert isinstance(body["attempt_budget"], int) and body["attempt_budget"] >= 1
    assert isinstance(body["hedge_delay_seconds"], float)
    assert isinstance(body["hedge_max_models"], int)
    assert isinstance(body["speeds"], list)
    for entry in body["speeds"]:
        assert set(entry) == {"model", "tps", "samples", "failures", "age_s", "unavailable"}
