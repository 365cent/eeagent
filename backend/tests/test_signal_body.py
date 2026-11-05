"""Evidence snapshot body persistence and the WeChat paste fallback
(REQ-SIG-07, REQ-SIG-11, SCHEMA-SIGNAL-SNAPSHOT, BOUND-OBJECT-STORAGE)."""

import pytest

from tests.support import SUPPLY_CHAIN_BODY, create_signal, sha256_of

pytestmark = pytest.mark.anyio


async def test_body_round_trip_exact_text(client):
    """REQ-SIG-07: the snapshot holds the raw collected data and the API
    serves it back by object-storage reference."""
    body = "48V供应链活跃，多家功率半导体厂商布局eFuse、SSCB等智能配电器件。"
    sig = await create_signal(client, body_text=body)
    assert sig["body_object_key"].startswith("signals/")
    assert sig["body_sha256"] == sha256_of(body)

    r = await client.get(f"/api/v1/signals/{sig['id']}/body")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/plain")
    assert r.text == body


async def test_signal_without_body_returns_404(client):
    sig = await create_signal(client)
    assert sig["body_object_key"] is None
    r = await client.get(f"/api/v1/signals/{sig['id']}/body")
    assert r.status_code == 404


async def test_pasted_body_via_patch_persists_and_keeps_url(client):
    """REQ-SIG-11: the researcher pastes the already-collected body into the
    evidence snapshot while keeping the original URL."""
    original_url = "https://mp.weixin.qq.com/s/unfetchable-article"
    sig = await create_signal(
        client,
        url=original_url,
        channel_code="wechat_mp",
        evidence_status_code="fetch_failed",  # fetch failed even via the local collector
    )
    assert sig["body_object_key"] is None

    pasted = "微信正文：48V eFuse 时代加速，多家厂商集体入场。"
    r = await client.patch(
        f"/api/v1/signals/{sig['id']}",
        json={"body_text": pasted, "evidence_status_code": "待人工复核"},
    )
    assert r.status_code == 200
    updated = r.json()
    assert updated["url"] == original_url  # original URL retained
    assert updated["body_object_key"] is not None
    assert updated["body_sha256"] == sha256_of(pasted)

    served = await client.get(f"/api/v1/signals/{sig['id']}/body")
    assert served.status_code == 200
    assert served.text == pasted


async def test_paste_fallback_lands_in_existing_status_vocabulary(client):
    """REQ-SIG-11: after the snapshot completes, the status is one of the
    five existing values (已留存 or 待人工复核) — no new status value."""
    sig = await create_signal(
        client, channel_code="wechat_mp", evidence_status_code="fetch_failed"
    )
    r = await client.patch(
        f"/api/v1/signals/{sig['id']}",
        json={"body_text": "粘贴的正文内容", "evidence_status_code": "已留存"},
    )
    assert r.status_code == 200
    assert r.json()["evidence_status_code"] == "retained"

    # and a bogus sixth value is still rejected
    r = await client.patch(
        f"/api/v1/signals/{sig['id']}", json={"evidence_status_code": "已粘贴"}
    )
    assert r.status_code == 422


async def test_body_completing_snapshot_defaults_to_retained(client):
    """REQ-SIG-11: once the pasted body completes the snapshot the signal is
    已留存 — not 抓取中 — unless the client set an explicit status."""
    sig = await create_signal(client, body_text=SUPPLY_CHAIN_BODY)
    assert sig["evidence_status_code"] == "retained"


async def test_body_is_content_addressed(client):
    """SCHEMA-SIGNAL-SNAPSHOT: body_object_key references object storage; the
    DB keeps only the reference and the sha256."""
    a = await create_signal(client, url="https://a.com/1", body_text="same text")
    b = await create_signal(client, url="https://b.com/2", body_text="same text")
    assert a["body_object_key"] == b["body_object_key"]
    assert a["body_sha256"] == b["body_sha256"]
