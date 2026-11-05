"""Demand points: cross-validation, time series, human-review gate, naming
and stakeholder attribution (REQ-DEM-01/06/07/08/09/10/11/13, REQ-DEM-15,
SCHEMA-DEMAND-POINT)."""

import pytest

from tests.support import (
    create_confirmed_demand,
    create_function,
    create_signal,
    create_theme,
)

pytestmark = pytest.mark.anyio


async def test_demand_records_cross_validation_and_time_series(client):
    """REQ-DEM-01: extraction records answers to both questions; REQ-DEM-09:
    the cross-validation conclusion is recorded on the demand point;
    REQ-DEM-11: the time series is strung by the events' actual time."""
    demand = await create_confirmed_demand(client)
    assert demand["cross_validation"]["conclusion"] == "通过"
    assert set(demand["cross_validation"]["perspectives"]) == {
        "架构变化",
        "器件供给",
        "产业化发展",
    }
    assert demand["time_series"] == [{"time": "2026-03", "event": "48V+eFuse 量产标配"}]
    assert demand["review_status"] == "confirmed"


async def test_demand_is_a_separate_resource_from_its_theme(client):
    """REQ-DEM-15: themes and demand points are two separate resources — the
    demand point carries a source-tech-theme reference and its own id."""
    theme = await create_theme(client)
    demand = await create_confirmed_demand(client, theme_id=theme["id"])
    assert demand["id"] != theme["id"]
    assert demand["source_tech_theme_id"] == theme["id"]

    themes = (await client.get("/api/v1/themes")).json()
    demands = (await client.get("/api/v1/demands")).json()
    assert len(themes) == 1 and len(demands) == 1
    assert themes[0]["id"] != demands[0]["id"]
    assert "cross_validation" not in themes[0]  # theme is only the index


async def test_demand_requires_stage_from_closed_vocabulary(client):
    """REQ-DEM-06: stakeholder attribution lands on exactly one value chain
    stage; REQ-TAG-01: no new stage may be created."""
    r = await client.post(
        "/api/v1/demands",
        json={"name": "x", "value_chain_stage_code": "自创环节"},
    )
    assert r.status_code == 422
    r = await client.post(
        "/api/v1/demands",
        json={"name": "x", "value_chain_stage_code": "兑现端（消费者）"},
    )
    assert r.status_code == 201
    assert r.json()["value_chain_stage_code"] == "realization_consumer"


async def test_demand_requires_a_stage(client):
    r = await client.post("/api/v1/demands", json={"name": "x"})
    assert r.status_code == 422  # value_chain_stage_code is NOT NULL


async def test_demand_unknown_theme_returns_404(client):
    r = await client.post(
        "/api/v1/demands",
        json={
            "name": "x",
            "value_chain_stage_code": "creation_supply",
            "source_tech_theme_id": "00000000-0000-0000-0000-0000000000bb",
        },
    )
    assert r.status_code == 404


async def test_unvalidated_demand_cannot_enter_function_derivation(client):
    """REQ-DEM-10: a demand point that has not passed cross-validation must
    not enter function derivation."""
    r = await client.post(
        "/api/v1/demands",
        json={"name": "单点伪需求", "value_chain_stage_code": "creation_supply"},
    )
    assert r.status_code == 201
    unvalidated = r.json()
    assert unvalidated["cross_validation"] is None

    r = await client.post(
        "/api/v1/functions",
        json={"demand_point_id": unvalidated["id"], "name": "某功能"},
    )
    assert r.status_code == 422
    assert "REQ-DEM-10" in r.json()["detail"]
    assert (await client.get("/api/v1/functions")).json() == []


async def test_validated_but_unreviewed_demand_cannot_enter_derivation(client):
    """REQ-DEM-13: only a demand point that passed cross-validation AND was
    human-confirmed may serve as input to function mapping."""
    demand = await create_confirmed_demand(client, review_status="pending")
    r = await client.post(
        "/api/v1/functions",
        json={"demand_point_id": demand["id"], "name": "某功能"},
    )
    assert r.status_code == 422
    assert "REQ-DEM-13" in r.json()["detail"]


async def test_confirmed_demand_enters_derivation(client):
    demand = await create_confirmed_demand(client)
    func = await create_function(client, demand["id"])
    assert func["demand_point_id"] == demand["id"]


async def test_demand_counts_follow_theme_metrics_convention(client):
    """REQ-DEM-08 / REQ-DEM-14: the demand point records signal frequency
    (and source count) using the same counting convention as the theme."""
    from tests.support import assign_signal_theme

    theme = await create_theme(client)
    demand = await create_confirmed_demand(client, theme_id=theme["id"])
    for i, url in enumerate(["https://a.com/1", "https://b.com/2", "https://c.com/3"]):
        sig = await create_signal(client, url=url, evidence_status_code="retained")
        await assign_signal_theme(client, sig["id"], theme["id"])

    detail = (await client.get(f"/api/v1/demands/{demand['id']}")).json()
    theme_detail = (await client.get(f"/api/v1/themes/{theme['id']}")).json()
    assert detail["signal_frequency"] == theme_detail["metrics"]["signal_frequency"] == 3
    assert detail["source_count"] == theme_detail["metrics"]["source_count"] == 3


async def test_demand_patch_updates_review_status_and_stage(client):
    demand = await create_confirmed_demand(client, review_status="pending")
    r = await client.patch(
        f"/api/v1/demands/{demand['id']}",
        json={"review_status": "confirmed", "value_chain_stage_code": "delivery_oem"},
    )
    assert r.status_code == 200
    assert r.json()["review_status"] == "confirmed"
    assert r.json()["value_chain_stage_code"] == "delivery_oem"


async def test_demand_patch_rejects_unknown_stage(client):
    demand = await create_confirmed_demand(client)
    r = await client.patch(
        f"/api/v1/demands/{demand['id']}", json={"value_chain_stage_code": "新环节"}
    )
    assert r.status_code == 422


async def test_demand_maps_multiple_vehicle_functions(client):
    """REQ-DEM-08: one demand point may map multiple vehicle functions — the
    count is a count, not a constant 1."""
    from tests.support import create_function

    demand = await create_confirmed_demand(client)
    await create_function(client, demand["id"], name="全节点智能配电")
    await create_function(client, demand["id"], name="低压网络健康诊断")

    detail = (await client.get(f"/api/v1/demands/{demand['id']}")).json()
    assert detail["function_count"] == 2
    funcs = (
        await client.get("/api/v1/functions", params={"demand_point_id": demand["id"]})
    ).json()
    assert {f["name"] for f in funcs} == {"全节点智能配电", "低压网络健康诊断"}


async def test_demand_list_and_detail(client):
    a = await create_confirmed_demand(client, name="需求点甲")
    b = await create_confirmed_demand(client, name="需求点乙")
    rows = (await client.get("/api/v1/demands")).json()
    assert {r["name"] for r in rows} == {"需求点甲", "需求点乙"}
    detail = (await client.get(f"/api/v1/demands/{a['id']}")).json()
    assert detail["name"] == "需求点甲"
    assert detail["function_count"] == 0


async def test_demand_list_offers_no_merge_and_no_priority_sort(client):
    """REQ-DEM-02 / CONV-NO-PRIORITY-ORDER: no demand merging and no priority
    ranking of demand points either."""
    await create_confirmed_demand(client)
    spec = (await client.get("/openapi.json")).json()
    demand_paths = [p for p in spec["paths"] if "demands" in p]
    assert set(demand_paths) == {"/api/v1/demands", "/api/v1/demands/{demand_id}"}
    for path in demand_paths:
        assert set(spec["paths"][path]) <= {"get", "post", "patch"}
    rows = (await client.get("/api/v1/demands")).json()
    for row in rows:
        assert "priority" not in row
        assert "sort_order" not in row


async def test_demand_404(client):
    r = await client.get("/api/v1/demands/00000000-0000-0000-0000-0000000000cc")
    assert r.status_code == 404
