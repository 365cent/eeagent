"""Vehicle functions: forward five-step derivation, reverse verification,
bidirectional publish gating and stage recording (REQ-MAP-01..06,
SCHEMA-FUNCTION-PUBLISHED)."""

import pytest
from tests.support import (
    FORWARD_TRACE,
    create_confirmed_demand,
    create_function,
    set_signal_tags,
)

pytestmark = pytest.mark.anyio

VALID_REVERSE_TRACE = {
    "necessity": "无此功能则需求无法完整实现",
    "coverage": [
        {"need": "节点级状态感知与软件定义通断", "coverage": "对应节点传感与控制。"},
        {"need": "快速故障隔离与自动恢复", "coverage": "对应故障隔离与恢复。"},
    ],
    "full_coverage": True,
    "unresolved_contradictions": [],
    "conclusion": "consistent",
    "human_confirmed": True,
}


async def _publish_data(client):
    for kind, name in (("recommendation_level", "建议"), ("target_domain", "底盘")):
        r = await client.post("/api/v1/vocab", json={"kind": kind, "name": name})
        assert r.status_code in (201, 200), r.text
    return {
        "forward_trace": FORWARD_TRACE,
        "reverse_trace": VALID_REVERSE_TRACE,
        "recommendation_level": "建议",
        "automation_levels": ["L2", "L4"],
        "target_domain": "底盘",
        "recommendation_reason": "对应已确认需求",
        "l2_l4_difference": "L2由驾驶员确认，L4由系统完成闭环",
    }


async def _confirmed_demand(client, **kwargs):
    return await create_confirmed_demand(client, **kwargs)


async def test_function_records_forward_five_step_derivation(client):
    """REQ-MAP-02: the forward derivation follows the fixed five steps and
    the record is kept on the function."""
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"], forward_trace=FORWARD_TRACE)
    assert len(func["forward_trace"]["steps"]) == 5
    assert func["forward_trace"]["steps"][0].startswith("拆解核心诉求")
    assert func["forward_trace"]["steps"][-1].startswith("收敛为功能")


async def test_function_records_reverse_necessity_check(client):
    """REQ-MAP-03: the necessity check is recorded — without this vehicle
    function, can the demand point still be fully realized?"""
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"], reverse_trace=VALID_REVERSE_TRACE)
    assert "necessity" in func["reverse_trace"]
    assert [item["need"] for item in func["reverse_trace"]["coverage"]] == [
        "节点级状态感知与软件定义通断",
        "快速故障隔离与自动恢复",
    ]


async def test_new_function_defaults_to_unpublished(client):
    """SCHEMA-FUNCTION-PUBLISHED: published defaults to false."""
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"])
    assert func["published"] is False


async def test_demand_evidence_changes_are_rechecked_before_function_creation(client):
    demand = await _confirmed_demand(client)
    evidence_signal_id = demand["cross_validation"]["evidence_signal_ids"][1]
    await set_signal_tags(client, evidence_signal_id, [])
    response = await client.post(
        "/api/v1/functions",
        json={"demand_point_id": demand["id"], "name": "证据变化后不可继续推导"},
    )
    assert response.status_code == 422
    assert "REQ-DEM-10" in response.json()["detail"]
    assert (await client.get("/api/v1/functions")).json() == []


async def test_function_create_requires_complete_forward_trace(client):
    demand = await _confirmed_demand(client)
    base = {"demand_point_id": demand["id"], "name": "功能"}
    missing = await client.post("/api/v1/functions", json=base)
    assert missing.status_code == 422
    incomplete = await client.post(
        "/api/v1/functions",
        json={**base, "forward_trace": {"steps": ["诉求", "", "关键流", "行为", "功能"]}},
    )
    assert incomplete.status_code == 422
    assert (await client.get("/api/v1/functions")).json() == []


async def test_publish_requires_both_forward_and_reverse_records(client):
    """REQ-MAP-05: the mapping is formally established only when forward
    derivation and reverse verification converge."""
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"])

    # neither trace → rejected
    r = await client.patch(f"/api/v1/functions/{func['id']}", json={"published": True})
    assert r.status_code == 422
    assert "REQ-MAP-" in r.json()["detail"]

    # forward only → still rejected
    r = await client.patch(f"/api/v1/functions/{func['id']}", json={"forward_trace": FORWARD_TRACE})
    assert r.status_code == 200
    r = await client.patch(f"/api/v1/functions/{func['id']}", json={"published": True})
    assert r.status_code == 422

    # Both traces must be re-submitted in the publication request.
    r = await client.patch(
        f"/api/v1/functions/{func['id']}",
        json={**await _publish_data(client), "published": True},
    )
    assert r.status_code == 200
    assert r.json()["published"] is True


async def test_publish_blocked_when_demand_not_validated(client):
    """REQ-DEM-10 (阶段C): no published mapping may exist for an unvalidated
    demand point — even with both traces recorded. The gate is state-driven."""
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"])  # passes the create gate
    publish_data = {**await _publish_data(client), "published": True}
    published = await client.patch(f"/api/v1/functions/{func['id']}", json=publish_data)
    assert published.status_code == 200, published.text

    # the demand loses its human confirmation afterwards
    await client.patch(f"/api/v1/demands/{demand['id']}", json={"review_status": "pending"})
    r = await client.patch(f"/api/v1/functions/{func['id']}", json=publish_data)
    assert r.status_code == 422
    assert (await client.get(f"/api/v1/functions/{func['id']}")).json()["published"] is False

    # re-confirm the demand → the same publish now succeeds
    await client.patch(f"/api/v1/demands/{demand['id']}", json={"review_status": "confirmed"})
    r = await client.patch(f"/api/v1/functions/{func['id']}", json=publish_data)
    assert r.status_code == 200
    assert r.json()["published"] is True


async def test_function_records_source_demand_and_stage(client):
    """REQ-MAP-06: a vehicle function records the demand point it comes from
    and its attributed value chain stage."""
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"], value_chain_stage_code="creation_supply")
    assert func["demand_point_id"] == demand["id"]
    assert func["value_chain_stage_code"] == "creation_supply"


async def test_function_stage_correction_restricted_to_existing_categories(client):
    """REQ-TAG-03: the correction API accepts only existing codes."""
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"])
    r = await client.patch(
        f"/api/v1/functions/{func['id']}", json={"value_chain_stage_code": "自创环节"}
    )
    assert r.status_code == 422


async def test_function_list_filters_by_demand_and_published(client):
    demand = await _confirmed_demand(client)
    other = await _confirmed_demand(client, name="另一需求点")
    f1 = await create_function(client, demand["id"])
    f2 = await create_function(client, other["id"])
    await client.patch(
        f"/api/v1/functions/{f2['id']}",
        json={**await _publish_data(client), "published": True},
    )

    by_demand = (
        await client.get("/api/v1/functions", params={"demand_point_id": demand["id"]})
    ).json()
    assert {f["id"] for f in by_demand} == {f1["id"]}
    published = (await client.get("/api/v1/functions", params={"published": True})).json()
    assert {f["id"] for f in published} == {f2["id"]}
    unpublished = (await client.get("/api/v1/functions", params={"published": False})).json()
    assert {f["id"] for f in unpublished} == {f1["id"]}


async def test_function_404(client):
    r = await client.get("/api/v1/functions/00000000-0000-0000-0000-0000000000dd")
    assert r.status_code == 404


async def test_publish_rejects_missing_forward_step(client):
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"])
    publish_data = await _publish_data(client)
    publish_data.update(
        {
            "forward_trace": {"steps": ["诉求", "", "车端关键流", "系统行为", "功能"]},
            "published": True,
        }
    )
    r = await client.patch(
        f"/api/v1/functions/{func['id']}",
        json=publish_data,
    )
    assert r.status_code == 422
    assert (await client.get(f"/api/v1/functions/{func['id']}")).json()["published"] is False


async def test_publish_rejects_partial_reverse_coverage(client):
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"])
    publish_data = await _publish_data(client)
    publish_data.update(
        {"reverse_trace": {**VALID_REVERSE_TRACE, "full_coverage": False}, "published": True}
    )
    r = await client.patch(
        f"/api/v1/functions/{func['id']}",
        json=publish_data,
    )
    assert r.status_code == 422


async def test_publish_rejects_reverse_coverage_missing_a_forward_core_need(client):
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"])
    publish_data = await _publish_data(client)
    publish_data["reverse_trace"] = {
        **VALID_REVERSE_TRACE,
        "coverage": VALID_REVERSE_TRACE["coverage"][:1],
        "full_coverage": True,
    }
    publish_data["published"] = True
    r = await client.patch(f"/api/v1/functions/{func['id']}", json=publish_data)
    assert r.status_code == 422
    assert "不得遗漏" in r.json()["detail"]


async def test_publish_rejects_inconsistent_conclusion(client):
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"])
    publish_data = await _publish_data(client)
    publish_data.update(
        {"reverse_trace": {**VALID_REVERSE_TRACE, "conclusion": "inconsistent"}, "published": True}
    )
    r = await client.patch(
        f"/api/v1/functions/{func['id']}",
        json=publish_data,
    )
    assert r.status_code == 422


async def test_publish_rejects_unpassed_demand_validation(client):
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"])
    await client.patch(
        f"/api/v1/demands/{demand['id']}", json={"cross_validation": {"perspectives": ["仅非空"]}}
    )
    publish_data = await _publish_data(client)
    publish_data["published"] = True
    r = await client.patch(
        f"/api/v1/functions/{func['id']}",
        json=publish_data,
    )
    assert r.status_code == 422


async def test_complete_traces_and_publish_in_one_patch(client):
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"])
    publish_data = await _publish_data(client)
    publish_data["published"] = True
    r = await client.patch(
        f"/api/v1/functions/{func['id']}",
        json=publish_data,
    )
    assert r.status_code == 200, r.text
    assert r.json()["published"] is True


async def test_publish_requires_complete_function_card(client):
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"])
    publish_data = await _publish_data(client)
    publish_data.pop("l2_l4_difference")
    publish_data["published"] = True
    r = await client.patch(f"/api/v1/functions/{func['id']}", json=publish_data)
    assert r.status_code == 422
    assert "l2_l4_difference" in r.json()["detail"]


async def test_function_card_vocab_values_must_exist(client):
    demand = await _confirmed_demand(client)
    r = await client.post(
        "/api/v1/functions",
        json={
            "demand_point_id": demand["id"],
            "name": "功能",
            "forward_trace": FORWARD_TRACE,
            "target_domain": "未配置域",
        },
    )
    assert r.status_code == 422
    assert "target_domain" in r.json()["detail"]


async def test_function_correction_uses_server_operator_identity(client):
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"])
    r = await client.patch(
        f"/api/v1/functions/{func['id']}",
        json={"value_chain_stage_code": "delivery_oem", "operator_subject": "forged-user"},
    )
    assert r.status_code == 200, r.text
    rows = (await client.get("/api/v1/audit", params={"entity_id": func["id"]})).json()
    assert len(rows) == 1
    assert rows[0]["operator_subject"] != "forged-user"


async def test_rejected_patch_does_not_write_other_fields(client):
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"])
    r = await client.patch(
        f"/api/v1/functions/{func['id']}",
        json={"name": "不得部分保存", "forward_trace": {"steps": ["仅一步"]}, "published": True},
    )
    assert r.status_code == 422
    saved = (await client.get(f"/api/v1/functions/{func['id']}")).json()
    assert saved["name"] == func["name"]
    assert saved["forward_trace"] == func["forward_trace"]
    assert saved["published"] is False


async def test_published_function_requires_fresh_bidirectional_confirmation(client):
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"])
    publish_data = {**await _publish_data(client), "published": True}
    r = await client.patch(f"/api/v1/functions/{func['id']}", json=publish_data)
    assert r.status_code == 200 and r.json()["published"] is True

    r = await client.patch(
        f"/api/v1/functions/{func['id']}",
        json={"recommendation_reason": "复核后调整理由"},
    )
    assert r.status_code == 200 and r.json()["published"] is False
    r = await client.patch(f"/api/v1/functions/{func['id']}", json={"published": True})
    assert r.status_code == 422

    r = await client.patch(f"/api/v1/functions/{func['id']}", json=publish_data)
    assert r.status_code == 200 and r.json()["published"] is True
