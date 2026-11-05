"""Tech themes: the aggregation index and its computed metrics
(theme-fields, REQ-DEM-14, SCHEMA-THEME-METRICS-VIEWS, CONV-NO-PRIORITY-ORDER,
REQ-DEM-02)."""

import pytest

from tests.support import assign_signal_theme, create_signal, create_theme, set_signal_tags

pytestmark = pytest.mark.anyio


async def _add_member(client, theme_id, url, tags=(), status=None, idx=0):
    sig = await create_signal(
        client,
        title=f"成员信号{idx}",
        url=url,
        evidence_status_code=status or "retained",
    )
    if tags:
        await set_signal_tags(client, sig["id"], tags)
    await assign_signal_theme(client, sig["id"], theme_id)
    return sig


async def test_theme_carries_working_name_and_stage(client):
    """theme-fields: an aggregation index name (system working name allowed
    before formal naming) and a value chain stage (may be an initial judgment)."""
    theme = await create_theme(client, working_name="低压系统智能化", stage="creation_supply")
    assert theme["working_name"] == "低压系统智能化"
    assert theme["value_chain_stage_code"] == "creation_supply"

    unnamed = await create_theme(client, working_name="临时聚合索引-未命名", stage=None)
    assert unnamed["value_chain_stage_code"] is None  # may be empty before attribution


async def test_theme_stage_rejects_unknown_value(client):
    """REQ-TAG-01: no new stage may be created."""
    r = await client.post("/api/v1/themes", json={"working_name": "x", "value_chain_stage_code": "新环节"})
    assert r.status_code == 422


async def test_theme_metrics_signal_frequency_and_source_count(client):
    """REQ-DEM-14: 信号频次 = member signal records (each counting 1);
    来源数 = distinct normalized URLs."""
    theme = await create_theme(client)
    await _add_member(client, theme["id"], "https://a.com/1", idx=1)
    await _add_member(client, theme["id"], "https://a.com/1/", idx=2)  # same normalized URL
    await _add_member(client, theme["id"], "https://b.com/2", idx=3)

    detail = (await client.get(f"/api/v1/themes/{theme['id']}")).json()
    assert detail["metrics"]["signal_frequency"] == 3
    assert detail["metrics"]["source_count"] == 2


async def test_archived_signals_excluded_from_signal_frequency(client):
    """SCHEMA-THEME-METRICS-VIEWS: the metrics view excludes
    evidence_status_code = 'archived' from signal_frequency (source_count
    keeps distinct URLs)."""
    theme = await create_theme(client)
    active = await _add_member(client, theme["id"], "https://a.com/1", idx=1)
    await _add_member(client, theme["id"], "https://b.com/2", status="archived", idx=2)

    detail = (await client.get(f"/api/v1/themes/{theme['id']}")).json()
    assert detail["metrics"]["signal_frequency"] == 1
    assert detail["metrics"]["source_count"] == 2


async def test_theme_display_tags_aggregated_from_member_signals(client):
    """theme-fields: display tags are aggregated from the theme's signals'
    tags — served from the read-only view, never written back."""
    theme = await create_theme(client)
    await _add_member(client, theme["id"], "https://a.com/1", tags=["智能配电", "eFuse"], idx=1)
    await _add_member(client, theme["id"], "https://b.com/2", tags=["eFuse", "区域控制"], idx=2)

    detail = (await client.get(f"/api/v1/themes/{theme['id']}")).json()
    assert set(detail["display_tags"]) == {"智能配电", "eFuse", "区域控制"}
    # the theme row itself carries no tag columns
    assert "tags" not in detail


async def test_theme_list_returns_every_theme_with_metrics(client):
    a = await create_theme(client, working_name="主题甲")
    b = await create_theme(client, working_name="主题乙")
    await _add_member(client, a["id"], "https://a.com/1", idx=1)

    rows = (await client.get("/api/v1/themes")).json()
    assert {r["working_name"] for r in rows} == {"主题甲", "主题乙"}
    by_name = {r["working_name"]: r for r in rows}
    assert by_name["主题甲"]["metrics"]["signal_frequency"] == 1
    assert by_name["主题乙"]["metrics"]["signal_frequency"] == 0
    assert by_name["主题乙"]["metrics"]["source_count"] == 0


async def test_theme_list_offers_no_merge_and_no_priority_sort(client):
    """REQ-DEM-02 / CONV-NO-PRIORITY-ORDER: the theme table exposes no merge
    and no priority-ordering operations — only add/remove of member signals."""
    await create_theme(client, working_name="主题甲")
    await create_theme(client, working_name="主题乙")

    spec = (await client.get("/openapi.json")).json()
    theme_paths = [p for p in spec["paths"] if "themes" in p]
    assert set(theme_paths) == {"/api/v1/themes", "/api/v1/themes/{theme_id}"}
    for path in theme_paths:
        assert set(spec["paths"][path]) <= {"get", "post"}
    # no priority field is served on the theme resource
    rows = (await client.get("/api/v1/themes")).json()
    for row in rows:
        assert "priority" not in row
        assert "sort_order" not in row


async def test_theme_detail_404(client):
    r = await client.get("/api/v1/themes/00000000-0000-0000-0000-0000000000aa")
    assert r.status_code == 404
