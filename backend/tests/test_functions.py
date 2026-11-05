"""Vehicle functions: forward five-step derivation, reverse verification,
bidirectional publish gating and stage recording (REQ-MAP-01..06,
SCHEMA-FUNCTION-PUBLISHED)."""

import pytest

from tests.support import (
    FORWARD_TRACE,
    REVERSE_TRACE,
    create_confirmed_demand,
    create_function,
)

pytestmark = pytest.mark.anyio


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
    func = await create_function(client, demand["id"], reverse_trace=REVERSE_TRACE)
    assert "necessity" in func["reverse_trace"]
    assert func["reverse_trace"]["coverage"] == (
        "仅远程开关、仅电流采集或仅电子熔断均不足以承接该需求"
    )


async def test_new_function_defaults_to_unpublished(client):
    """SCHEMA-FUNCTION-PUBLISHED: published defaults to false."""
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"])
    assert func["published"] is False


async def test_publish_requires_both_forward_and_reverse_records(client):
    """REQ-MAP-05: the mapping is formally established only when forward
    derivation and reverse verification converge."""
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"])

    # neither trace → rejected
    r = await client.patch(f"/api/v1/functions/{func['id']}", json={"published": True})
    assert r.status_code == 422
    assert "REQ-MAP-05" in r.json()["detail"]

    # forward only → still rejected
    r = await client.patch(f"/api/v1/functions/{func['id']}", json={"forward_trace": FORWARD_TRACE})
    assert r.status_code == 200
    r = await client.patch(f"/api/v1/functions/{func['id']}", json={"published": True})
    assert r.status_code == 422

    # both traces → publish succeeds
    r = await client.patch(f"/api/v1/functions/{func['id']}", json={"reverse_trace": REVERSE_TRACE})
    assert r.status_code == 200
    r = await client.patch(f"/api/v1/functions/{func['id']}", json={"published": True})
    assert r.status_code == 200
    assert r.json()["published"] is True


async def test_publish_blocked_when_demand_not_validated(client):
    """REQ-DEM-10 (阶段C): no published mapping may exist for an unvalidated
    demand point — even with both traces recorded. The gate is state-driven."""
    demand = await _confirmed_demand(client)
    func = await create_function(client, demand["id"])  # passes the create gate
    await client.patch(
        f"/api/v1/functions/{func['id']}",
        json={"forward_trace": FORWARD_TRACE, "reverse_trace": REVERSE_TRACE},
    )

    # the demand loses its human confirmation afterwards
    await client.patch(f"/api/v1/demands/{demand['id']}", json={"review_status": "pending"})
    r = await client.patch(f"/api/v1/functions/{func['id']}", json={"published": True})
    assert r.status_code == 422
    assert (await client.get(f"/api/v1/functions/{func['id']}")).json()["published"] is False

    # re-confirm the demand → the same publish now succeeds
    await client.patch(f"/api/v1/demands/{demand['id']}", json={"review_status": "confirmed"})
    r = await client.patch(f"/api/v1/functions/{func['id']}", json={"published": True})
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
        json={"forward_trace": FORWARD_TRACE, "reverse_trace": REVERSE_TRACE},
    )
    await client.patch(f"/api/v1/functions/{f2['id']}", json={"published": True})

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
