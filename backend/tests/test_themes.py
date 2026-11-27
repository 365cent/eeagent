"""Tech themes: the aggregation index and its computed metrics
(theme-fields, REQ-DEM-14, SCHEMA-THEME-METRICS-VIEWS, CONV-NO-PRIORITY-ORDER,
REQ-DEM-02)."""

import uuid

import pytest

from tests.support import (
    DEMAND_STEP_KEYS,
    assign_signal_theme,
    create_signal,
    create_theme,
    set_signal_tags,
)

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


async def test_theme_list_offers_no_priority_fields(client):
    """REQ-DEM-02 / CONV-NO-PRIORITY-ORDER: the theme table does not expose priority ordering."""
    await create_theme(client, working_name="主题甲")
    rows = (await client.get("/api/v1/themes")).json()
    for row in rows:
        assert "priority" not in row
        assert "sort_order" not in row


async def test_delete_theme_unassigns_signals(client):
    theme = await create_theme(client, working_name="待删除主题")
    sig = await _add_member(client, theme["id"], "https://del.example/1", idx=1)
    r = await client.delete(f"/api/v1/themes/{theme['id']}")
    assert r.status_code == 204
    assert (await client.get(f"/api/v1/themes/{theme['id']}")).status_code == 404
    detail = (await client.get(f"/api/v1/signals/{sig['id']}")).json()
    assert detail["tech_theme_id"] is None


async def test_delete_theme_blocked_when_demands_exist(client):
    theme = await create_theme(client, working_name="有需求点主题")
    sig = await create_signal(
        client,
        title="主题删除阻断样例",
        url=f"https://block-theme-delete-{uuid.uuid4()}.example/article",
        evidence_status_code="retained",
    )
    await assign_signal_theme(client, sig["id"], theme["id"])
    steps = [
        {"key": key, "content": f"测试步骤：{key}", "evidence_signal_ids": [sig["id"]]}
        for key in DEMAND_STEP_KEYS
    ]
    created = await client.post(
        "/api/v1/demands",
        json={
            "name": "关联主题的需求点",
            "value_chain_stage_code": "creation_supply",
            "source_tech_theme_id": theme["id"],
            "derivation_trace": {"steps": steps},
        },
    )
    assert created.status_code == 201, created.text
    r = await client.delete(f"/api/v1/themes/{theme['id']}")
    assert r.status_code == 409
    detail = r.json()["detail"]
    assert detail["code"] == "theme_has_demands"
    assert created.json()["id"] in detail["demand_ids"]


async def test_theme_detail_404(client):
    r = await client.get("/api/v1/themes/00000000-0000-0000-0000-0000000000aa")
    assert r.status_code == 404


async def test_patch_theme_working_name_and_stage(client):
    theme = await create_theme(client, working_name="低压系统智能化", stage="creation_supply")
    r = await client.patch(
        f"/api/v1/themes/{theme['id']}",
        json={"working_name": "区域供电与智能配电", "value_chain_stage_code": "delivery_oem"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["working_name"] == "区域供电与智能配电"
    assert body["value_chain_stage_code"] == "delivery_oem"
    detail = (await client.get(f"/api/v1/themes/{theme['id']}")).json()
    assert detail["working_name"] == "区域供电与智能配电"


async def test_theme_eight_signals_sixteen_sources(client):
    theme = await create_theme(client, working_name="低压系统智能化-验收样例")
    urls = [f"https://source-{i}.example.com/article" for i in range(16)]
    for idx, url in enumerate(urls[:8]):
        sig = await create_signal(
            client,
            title=f"活跃成员{idx + 1}",
            url=url,
            evidence_status_code="retained",
        )
        await assign_signal_theme(client, sig["id"], theme["id"])
    for idx, url in enumerate(urls[8:]):
        sig = await create_signal(
            client,
            title=f"归档成员{idx + 1}",
            url=url,
            evidence_status_code="archived",
        )
        await assign_signal_theme(client, sig["id"], theme["id"])
    detail = (await client.get(f"/api/v1/themes/{theme['id']}")).json()
    assert detail["metrics"]["signal_frequency"] == 8
    assert detail["metrics"]["source_count"] == 16


async def test_theme_name_suggestion_uses_tag_name_when_llm_is_down(client, monkeypatch):
    async def _no_llm(_brief: str):
        return None

    monkeypatch.setattr("app.domains.theme.naming.suggest_theme_name_with_llm", _no_llm)
    signal = await create_signal(
        client,
        title="低压网络多来源行业观察样本",
        url="https://example.com/theme-name-fallback",
        value_chain_stage_code="creation_supply",
    )
    await set_signal_tags(client, signal["id"], ["智能配电", "区域控制", "eFuse"])

    response = await client.post("/api/v1/themes/name-suggestion", json={"signal_ids": [signal["id"]]})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["source"] == "fallback"
    assert body["working_name"].startswith("创造端 · ")
    assert body["working_name"].endswith("相关需求")
    for tag in ("智能配电", "区域控制", "eFuse"):
        assert tag in body["working_name"]
    assert body["value_chain_stage_code"] == "creation_supply"
    themes = (await client.get("/api/v1/themes")).json()
    assert all(row["working_name"] != body["working_name"] for row in themes)


async def test_theme_name_suggestion_keeps_model_name(client, monkeypatch):
    class _Name:
        working_name = "区域智能配电与线控底盘"
        value_chain_stage_code = "delivery_oem"

    async def _llm(_brief: str):
        return _Name()

    monkeypatch.setattr("app.domains.theme.naming.suggest_theme_name_with_llm", _llm)
    signal = await create_signal(
        client,
        title="低压网络多来源行业观察样本二",
        url="https://example.com/theme-name-llm",
    )
    await set_signal_tags(client, signal["id"], ["智能配电"])
    response = await client.post("/api/v1/themes/name-suggestion", json={"signal_ids": [signal["id"]]})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["source"] == "llm"
    assert body["working_name"] == "区域智能配电与线控底盘"
    assert body["value_chain_stage_code"] == "delivery_oem"


async def test_theme_name_suggestion_unknown_signal(client):
    response = await client.post(
        "/api/v1/themes/name-suggestion",
        json={"signal_ids": ["00000000-0000-0000-0000-0000000000aa"]},
    )
    assert response.status_code == 404


async def test_theme_create_update_delete_are_audited(client):
    theme = await create_theme(client, working_name="审计主题", stage="creation_supply")
    audit = (await client.get("/api/v1/audit", params={"entity_id": theme["id"]})).json()
    assert [row["field_name"] for row in audit] == ["created"]
    assert audit[0]["new_value"]["working_name"] == "审计主题"

    updated = await client.patch(
        f"/api/v1/themes/{theme['id']}",
        json={"working_name": "审计主题改名", "value_chain_stage_code": "delivery_oem"},
    )
    assert updated.status_code == 200, updated.text
    audit = (await client.get("/api/v1/audit", params={"entity_id": theme["id"]})).json()
    fields = {row["field_name"] for row in audit}
    assert {"working_name", "value_chain_stage_code"} <= fields

    removable = await create_theme(client, working_name="待删除审计主题")
    deleted = await client.delete(f"/api/v1/themes/{removable['id']}")
    assert deleted.status_code == 204
    audit = (await client.get("/api/v1/audit", params={"entity_id": removable["id"]})).json()
    deletion = next(row for row in audit if row["field_name"] == "deleted")
    assert deletion["old_value"]["working_name"] == "待删除审计主题"
