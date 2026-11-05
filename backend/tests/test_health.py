"""App wiring: health endpoint and the registered v1 route surface."""

import pytest

pytestmark = pytest.mark.anyio

EXPECTED_PATHS = {
    "/api/v1/overview",
    "/api/v1/ref-codes",
    "/api/v1/vocab",
    "/api/v1/vocab/usage",
    "/api/v1/signals",
    "/api/v1/themes",
    "/api/v1/demands",
    "/api/v1/functions",
    "/api/v1/landing-points",
    "/api/v1/panorama",
    "/api/v1/strategy/assessments",
    "/api/v1/trace/landing-points/{lp_id}",
    "/api/v1/audit",
    "/healthz",
}


@pytest.mark.parametrize("path", sorted(EXPECTED_PATHS))
async def test_route_registered(client, path):
    r = await client.get("/openapi.json")
    assert r.status_code == 200
    assert path in r.json()["paths"]


async def test_healthz(client):
    r = await client.get("/healthz")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"


async def test_unknown_signal_returns_404(client):
    r = await client.get("/api/v1/signals/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404
