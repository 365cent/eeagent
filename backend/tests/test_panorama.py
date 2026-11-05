"""The 图2-5 tech panorama: demand points grouped by value chain stage, then
functions, then landing points with domain chips and standard counts, with
per-stage counts (REQ-TECH-04)."""

import pytest

from tests.support import (
    build_chain,
    create_confirmed_demand,
    create_function,
    create_landing_point,
    put_standard,
)

pytestmark = pytest.mark.anyio

ALL_STAGES = ["creation_supply", "delivery_oem", "realization_consumer", "regulation_standard"]


async def test_panorama_lists_all_four_stage_rows(client):
    rows = (await client.get("/api/v1/panorama")).json()
    assert [r["stage_code"] for r in rows] == ALL_STAGES
    labels = {r["stage_label"] for r in rows}
    assert labels == {
        "创造端（供应链）",
        "传递端（主机厂）",
        "兑现端（消费者）",
        "规制端（行业标准/规定）",
    }


async def test_panorama_nests_the_full_chain_with_counts(client):
    """REQ-TECH-04: stage → demand points → functions → landing points with
    domain chips, standard counts and per-stage counts."""
    chain = await build_chain(client)

    rows = (await client.get("/api/v1/panorama")).json()
    by_code = {r["stage_code"]: r for r in rows}

    stage = by_code["creation_supply"]
    assert stage["stage_label"] == "创造端（供应链）"
    assert stage["demand_count"] == 1
    assert stage["function_count"] == 1
    assert stage["landing_point_count"] == 1

    demand = stage["demand_points"][0]
    assert demand["id"] == chain["demand"]["id"]
    assert demand["name"] == "低压系统智能化"

    func = demand["functions"][0]
    assert func["id"] == chain["function"]["id"]
    assert func["name"] == "全节点智能配电"

    lp = func["landing_points"][0]
    assert lp["id"] == chain["landing_point"]["id"]
    assert lp["name"] == "智能保险丝（eFuse）"
    assert lp["domain_name"] == "硬件"
    assert lp["standard_count"] == 2

    # empty stages show zero counts and no demand points
    empty = by_code["realization_consumer"]
    assert empty["demand_count"] == 0
    assert empty["demand_points"] == []
    assert empty["function_count"] == 0
    assert empty["landing_point_count"] == 0


async def test_panorama_counts_match_underlying_resources(client):
    """Nested counts equal the underlying resources exactly."""
    chain = await build_chain(client)
    # a second demand in a different stage, with two landing points
    other_demand = await create_confirmed_demand(
        client, name="座舱集中算力需求", value_chain_stage_code="delivery_oem"
    )
    other_func = await create_function(client, other_demand["id"], name="中央计算平台")
    await create_landing_point(client, other_func["id"], name="域控制器", domain="硬件")
    await create_landing_point(client, other_func["id"], name="调度中间件", domain="软件")

    rows = (await client.get("/api/v1/panorama")).json()
    by_code = {r["stage_code"]: r for r in rows}

    total_demands = sum(r["demand_count"] for r in rows)
    total_functions = sum(r["function_count"] for r in rows)
    total_lps = sum(r["landing_point_count"] for r in rows)
    assert total_demands == len((await client.get("/api/v1/demands")).json()) == 2
    assert total_functions == len((await client.get("/api/v1/functions")).json()) == 2
    assert total_lps == len((await client.get("/api/v1/landing-points")).json()) == 3

    assert by_code["creation_supply"]["landing_point_count"] == 1
    assert by_code["delivery_oem"]["landing_point_count"] == 2
    delivery = by_code["delivery_oem"]["demand_points"][0]
    domains = {lp["domain_name"] for f in delivery["functions"] for lp in f["landing_points"]}
    assert domains == {"硬件", "软件"}


async def test_panorama_standard_count_reflects_grid(client):
    chain = await build_chain(client)
    lp_id = chain["landing_point"]["id"]
    await put_standard(client, lp_id, "运营", "安全合规", "全生命周期安全监控")

    rows = (await client.get("/api/v1/panorama")).json()
    stage = next(r for r in rows if r["stage_code"] == "creation_supply")
    lp = stage["demand_points"][0]["functions"][0]["landing_points"][0]
    assert lp["standard_count"] == 3
