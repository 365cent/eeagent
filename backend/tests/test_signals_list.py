"""Signal list API: keyword search and filtering (REQ-SIG-04), detail view
for every list row (REQ-SIG-05), the drawer's three-part structure
(REQ-SIG-06), and the implemented limit/offset window (the plan itself
states no pagination contract — CONV-API-UNSTATED)."""

import pytest

from tests.support import SUPPLY_CHAIN_BODY, create_signal

pytestmark = pytest.mark.anyio


async def _seed_three(client):
    a = await create_signal(
        client,
        title="48V低压供电网络研究",
        excerpt="48V供应链活跃",
        publisher="与非网",
        value_chain_stage_code="creation_supply",
    )
    b = await create_signal(
        client,
        title="汽车加速进入48V eFuse时代",
        url="https://mp.weixin.qq.com/s/efuse-48v-era",
        channel_code="wechat_mp",
        excerpt="eFuse标配化趋势",
        publisher="微信公众平台",
        value_chain_stage_code="creation_supply",
    )
    c = await create_signal(
        client,
        title="座舱域控制器集中化观察",
        excerpt="域控制器供应商动态",
        publisher="TechPortal",
        value_chain_stage_code="delivery_oem",
    )
    return a, b, c


async def test_keyword_search_matches_title(client):
    a, b, c = await _seed_three(client)
    rows = (await client.get("/api/v1/signals", params={"keyword": "48V"})).json()
    ids = {r["id"] for r in rows}
    assert ids == {a["id"], b["id"]}


async def test_keyword_search_matches_publisher_and_excerpt(client):
    a, b, c = await _seed_three(client)
    by_publisher = (await client.get("/api/v1/signals", params={"keyword": "TechPortal"})).json()
    assert {r["id"] for r in by_publisher} == {c["id"]}
    by_excerpt = (await client.get("/api/v1/signals", params={"keyword": "标配化"})).json()
    assert {r["id"] for r in by_excerpt} == {b["id"]}


async def test_filter_by_value_chain_stage_code_and_label(client):
    a, b, c = await _seed_three(client)
    by_code = (await client.get("/api/v1/signals", params={"value_chain_stage": "creation_supply"})).json()
    by_label = (
        await client.get("/api/v1/signals", params={"value_chain_stage": "创造端（供应链）"})
    ).json()
    assert {r["id"] for r in by_code} == {a["id"], b["id"]}
    assert {r["id"] for r in by_label} == {r["id"] for r in by_code}


async def test_filter_by_source_is_case_insensitive_substring(client):
    """REQ-SIG-04: 来源 filter (图2-1-1 筛选：价值链环节、来源、关键词)."""
    a, b, c = await _seed_three(client)
    rows = (await client.get("/api/v1/signals", params={"source": "与非网"})).json()
    assert {r["id"] for r in rows} == {a["id"]}
    lower = (await client.get("/api/v1/signals", params={"source": "techportal"})).json()
    assert {r["id"] for r in lower} == {c["id"]}


async def test_source_and_keyword_filters_intersect(client):
    a, b, c = await _seed_three(client)
    rows = (
        await client.get("/api/v1/signals", params={"source": "与非网", "keyword": "48V"})
    ).json()
    assert {r["id"] for r in rows} == {a["id"]}
    wider = (await client.get("/api/v1/signals", params={"source": "公众平台"})).json()
    assert {r["id"] for r in wider} == {b["id"]}


async def test_filter_by_channel(client):
    a, b, c = await _seed_three(client)
    rows = (await client.get("/api/v1/signals", params={"channel": "web"})).json()
    assert {r["id"] for r in rows} == {a["id"], c["id"]}
    wechat = (await client.get("/api/v1/signals", params={"channel": "微信公众号"})).json()
    assert {r["id"] for r in wechat} == {b["id"]}
    bogus = await client.get("/api/v1/signals", params={"channel": "传真"})
    assert bogus.status_code == 422


async def test_filter_by_evidence_status_label_and_code(client):
    await create_signal(client, evidence_status_code="retained")
    await create_signal(client, evidence_status_code="pending_review")
    by_label = (await client.get("/api/v1/signals", params={"evidence_status": "已留存"})).json()
    by_code = (await client.get("/api/v1/signals", params={"evidence_status": "retained"})).json()
    assert {r["id"] for r in by_label} == {r["id"] for r in by_code}
    assert len(by_label) == 1


async def test_filter_by_theme_id(client):
    from tests.support import assign_signal_theme, create_theme

    theme = await create_theme(client)
    a, b, c = await _seed_three(client)
    await assign_signal_theme(client, a["id"], theme["id"])
    rows = (await client.get("/api/v1/signals", params={"theme_id": theme["id"]})).json()
    assert {r["id"] for r in rows} == {a["id"]}


async def test_every_list_row_has_a_detail_view(client):
    """REQ-SIG-05: the drawer is openable for any signal in the list."""
    a, b, c = await _seed_three(client)
    listed = (await client.get("/api/v1/signals")).json()
    assert len(listed) == 3
    for row in listed:
        r = await client.get(f"/api/v1/signals/{row['id']}")
        assert r.status_code == 200
        assert r.json()["id"] == row["id"]


async def test_detail_is_structured_in_three_parts(client):
    """REQ-SIG-06 (图2-1-2): top link/publisher/publish time; middle tech
    direction tags + upward aggregation; bottom the evidence snapshot."""
    from tests.support import assign_signal_theme, create_theme, set_signal_tags

    theme = await create_theme(client)
    sig = await create_signal(
        client, body_text=SUPPLY_CHAIN_BODY, excerpt=SUPPLY_CHAIN_BODY, source_label="与非网"
    )
    await set_signal_tags(client, sig["id"], ["智能配电", "eFuse"])
    await assign_signal_theme(client, sig["id"], theme["id"])

    detail = (await client.get(f"/api/v1/signals/{sig['id']}")).json()
    # top
    assert detail["url"] == sig["url"]
    assert detail["publisher"] == "与非网"
    assert detail["published_at"] is not None
    # middle
    assert set(detail["tags"]) == {"智能配电", "eFuse"}
    assert detail["theme"]["id"] == theme["id"]
    assert detail["theme"]["working_name"] == "低压系统智能化"
    # bottom (snapshot)
    assert detail["source_label"] == "与非网"
    assert detail["excerpt"] == SUPPLY_CHAIN_BODY
    assert detail["body_object_key"] is not None
    assert detail["body_sha256"] is not None
    assert detail["captured_at"] is not None


async def test_list_limit_and_offset_window(client):
    """Implemented list window (limit/offset). The plan states no pagination
    contract (CONV-API-UNSTATED) — this pins the implemented behavior only."""
    await _seed_three(client)
    limited = (await client.get("/api/v1/signals", params={"limit": 2})).json()
    assert len(limited) == 2
    offset = (await client.get("/api/v1/signals", params={"limit": 2, "offset": 2})).json()
    assert len(offset) == 1
    over = await client.get("/api/v1/signals", params={"limit": 500})
    assert over.status_code == 422  # le=200
