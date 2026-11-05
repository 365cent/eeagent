"""Tech landing points: multiple landing points per function, open domain
vocabulary, role recording (REQ-TECH-01/02/03, SCHEMA-LANDING-DOMAIN)."""

import pytest

from tests.support import create_confirmed_demand, create_function, create_landing_point

pytestmark = pytest.mark.anyio


async def _function(client):
    demand = await create_confirmed_demand(client)
    return await create_function(client, demand["id"])


async def test_function_decomposes_into_multiple_landing_points(client):
    """REQ-TECH-01: a vehicle function has multiple landing points."""
    func = await _function(client)
    lp1 = await create_landing_point(client, func["id"], name="智能保险丝（eFuse）", domain="硬件")
    lp2 = await create_landing_point(client, func["id"], name="配电诊断中间件", domain="软件")
    assert lp1["vehicle_function_id"] == func["id"]
    assert lp2["vehicle_function_id"] == func["id"]

    rows = (
        await client.get("/api/v1/landing-points", params={"vehicle_function_id": func["id"]})
    ).json()
    assert {r["id"] for r in rows} == {lp1["id"], lp2["id"]}


async def test_one_function_carries_landing_points_in_multiple_domains(client):
    """REQ-TECH-02: one function may simultaneously carry landing points in
    multiple domains, and the domain vocabulary is open."""
    func = await _function(client)
    a = await create_landing_point(client, func["id"], name="eFuse器件", domain="硬件")
    b = await create_landing_point(client, func["id"], name="配电调度算法", domain="软件")
    c = await create_landing_point(client, func["id"], name="新域落脚点", domain="全新域")
    assert {lp["domain_name"] for lp in (a, b, c)} == {"硬件", "软件", "全新域"}


async def test_new_domain_immediately_reusable_by_other_landing_points(client):
    """REQ-TECH-02 / SCHEMA-VOCAB: a newly created domain name enters the
    global vocabulary immediately and is reusable."""
    func = await _function(client)
    first = await create_landing_point(client, func["id"], name="甲", domain="电源")
    second = await create_landing_point(client, func["id"], name="乙", domain="电源")
    assert first["domain_vocab_id"] == second["domain_vocab_id"]

    vocab = (await client.get("/api/v1/vocab", params={"kind": "domain"})).json()
    assert sum(1 for v in vocab if v["name"] == "电源") == 1


async def test_landing_point_records_role_within_function(client):
    """REQ-TECH-03: each landing point records its role within its vehicle
    function and may associate zero standards."""
    func = await _function(client)
    lp = await create_landing_point(
        client,
        func["id"],
        name="智能保险丝（eFuse）",
        domain="硬件",
        role="全节点智能配电的执行层硬件：每个配电支路一个可被软件定义和驱动的保护器件。",
    )
    detail = (await client.get(f"/api/v1/landing-points/{lp['id']}")).json()
    assert detail["role_description"].startswith("全节点智能配电的执行层硬件")
    assert detail["standard_count"] == 0  # zero or more deployment standards


async def test_landing_point_requires_existing_function(client):
    r = await client.post(
        "/api/v1/landing-points",
        json={
            "vehicle_function_id": "00000000-0000-0000-0000-0000000000ee",
            "name": "x",
            "domain": "硬件",
        },
    )
    assert r.status_code == 404


async def test_landing_point_detail_and_404(client):
    func = await _function(client)
    lp = await create_landing_point(client, func["id"])
    r = await client.get(f"/api/v1/landing-points/{lp['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == lp["id"]
    r = await client.get("/api/v1/landing-points/00000000-0000-0000-0000-0000000000ff")
    assert r.status_code == 404
