"""App wiring: health endpoint and minimal API smoke."""

import pytest

pytestmark = pytest.mark.anyio


@pytest.mark.no_db
async def test_healthz(client):
    r = await client.get("/healthz")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"


async def test_unknown_signal_returns_404(client):
    r = await client.get("/api/v1/signals/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404