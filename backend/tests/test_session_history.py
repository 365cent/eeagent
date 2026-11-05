"""IP-identity access history shown on the profile page."""

import pytest

pytestmark = pytest.mark.anyio

UA_CHROME = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
)
UA_FIREFOX = "Mozilla/5.0 (Macintosh; Intel Mac OS X 15.2; rv:121.0) Gecko/20100101 Firefox/121.0"


def _headers(ip, ua=UA_CHROME):
    return {"x-forwarded-for": ip, "user-agent": ua}


async def test_visit_is_deduped_and_history_is_per_ip(client):
    first = await client.post(
        "/api/v1/session/visit", json={"page": "signals"}, headers=_headers("10.215.8.74")
    )
    assert first.status_code == 200, first.text
    body = first.json()
    assert body["ip"] == "10.215.8.74"
    assert body["ua_browser"] == "Chrome 141"
    assert body["ua_os"] == "Windows 10/11"

    again = await client.post(
        "/api/v1/session/visit", json={"page": "signals"}, headers=_headers("10.215.8.74")
    )
    assert again.json()["id"] == body["id"], "identical visit within 10m must collapse"

    other = await client.post(
        "/api/v1/session/visit",
        json={"page": "overview"},
        headers=_headers("10.215.8.74", UA_FIREFOX),
    )
    assert other.json()["ua_browser"] == "Firefox 121"
    assert other.json()["ua_os"] == "macOS 15"

    history = await client.get("/api/v1/session/history", headers=_headers("10.215.8.74"))
    rows = history.json()
    assert len(rows) == 2
    assert {row["ua_browser"] for row in rows} == {"Chrome 141", "Firefox 121"}

    me = await client.get("/api/v1/session/me", headers=_headers("10.215.8.74"))
    assert me.json()["visits"] == 2


async def test_history_is_isolated_by_ip(client):
    await client.post("/api/v1/session/visit", json={"page": "signals"}, headers=_headers("10.215.8.74"))
    empty = await client.get("/api/v1/session/history", headers=_headers("10.9.9.9"))
    assert empty.json() == []
    me = await client.get("/api/v1/session/me", headers=_headers("10.9.9.9"))
    assert me.json()["visits"] == 0
    assert me.json()["ip"] == "10.9.9.9"
