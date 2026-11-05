"""Chain traceability, audit records and the workbench overview
(REQ-RULE-02, REQ-RULE-03, REQ-UI-02, SCHEMA-CORRECTION-AUDIT)."""

import pytest

from tests.support import (
    SUPPLY_CHAIN_BODY,
    assign_signal_theme,
    build_chain,
    create_signal,
    create_theme,
    set_signal_tags,
)

pytestmark = pytest.mark.anyio


async def test_audit_row_for_signal_stage_correction(client):
    """REQ-RULE-02: every human correction of value chain stage leaves an
    audit record with both machine and human values."""
    sig = await create_signal(client, body_text=SUPPLY_CHAIN_BODY)
    assert sig["value_chain_stage_code"] == "creation_supply"  # machine initial judgment

    r = await client.patch(
        f"/api/v1/signals/{sig['id']}",
        json={"value_chain_stage_code": "delivery_oem", "operator_subject": "复核员甲"},
    )
    assert r.status_code == 200

    rows = (await client.get("/api/v1/audit", params={"entity_id": sig["id"]})).json()
    assert len(rows) == 1
    row = rows[0]
    assert row["entity_type"] == "signal"
    assert row["field_name"] == "value_chain_stage_code"
    assert row["machine_value"] == "creation_supply"  # machine value stays retrievable
    assert row["human_value"] == "delivery_oem"
    assert row["operator_subject"] == "复核员甲"
    assert row["operator_role"] == "方法论/词表管理员"
    assert row["corrected_at"] is not None


async def test_audit_row_for_signal_type_and_tags(client):
    sig = await create_signal(client)
    await client.patch(f"/api/v1/signals/{sig['id']}", json={"signal_type_code": "技术"})
    await set_signal_tags(client, sig["id"], ["智能配电"])

    rows = (await client.get("/api/v1/audit", params={"entity_id": sig["id"]})).json()
    fields = {r["field_name"] for r in rows}
    assert "signal_type_code" in fields
    assert "tech_tags" in fields


async def test_audit_row_for_aggregation_correction(client):
    """REQ-RULE-02: aggregation corrections leave a record too."""
    theme = await create_theme(client)
    sig = await create_signal(client)
    await assign_signal_theme(client, sig["id"], theme["id"])

    rows = (await client.get("/api/v1/audit", params={"entity_id": sig["id"]})).json()
    agg = [r for r in rows if r["field_name"] == "tech_theme_id"]
    assert len(agg) == 1
    assert agg[0]["human_value"] == theme["id"]


async def test_audit_row_for_demand_and_function_stage_correction(client):
    from tests.support import create_confirmed_demand, create_function

    theme = await create_theme(client)
    demand = await create_confirmed_demand(client, theme_id=theme["id"])
    func = await create_function(client, demand["id"])

    await client.patch(f"/api/v1/demands/{demand['id']}", json={"value_chain_stage_code": "delivery_oem"})
    await client.patch(f"/api/v1/functions/{func['id']}", json={"value_chain_stage_code": "delivery_oem"})

    demand_rows = (await client.get("/api/v1/audit", params={"entity_id": demand["id"]})).json()
    assert demand_rows[0]["entity_type"] == "demand_point"
    assert demand_rows[0]["machine_value"] == "creation_supply"
    assert demand_rows[0]["human_value"] == "delivery_oem"

    func_rows = (await client.get("/api/v1/audit", params={"entity_id": func["id"]})).json()
    assert func_rows[0]["entity_type"] == "vehicle_function"


async def test_noop_correction_leaves_no_audit_row(client):
    sig = await create_signal(client, value_chain_stage_code="delivery_oem")
    before = len((await client.get("/api/v1/audit")).json())
    await client.patch(f"/api/v1/signals/{sig['id']}", json={"value_chain_stage_code": "delivery_oem"})
    after = len((await client.get("/api/v1/audit")).json())
    assert before == after


async def test_machine_initial_judgment_never_replaced_without_trace(client):
    """REQ-RULE-02: a machine initial judgment must never be replaced
    without trace — auto-aggregation (no human) writes no audit row, the
    manual override does."""
    theme = await create_theme(client)
    seed_sig = await create_signal(client, url="https://example.com/theme-seed")
    await set_signal_tags(client, seed_sig["id"], ["智能配电", "区域控制", "eFuse"])
    await assign_signal_theme(client, seed_sig["id"], theme["id"])

    body = (
        "智能配电与区域控制是低压系统的核心，智能配电架构在区域控制器上实现，"
        "智能配电、区域控制、eFuse 器件被广泛讨论。"
    )
    auto = await create_signal(client, title="汽车低压智能化", url="https://x.com/1", body_text=body)
    assert auto["tech_theme_id"] == theme["id"]  # machine aggregation happened

    rows = (await client.get("/api/v1/audit", params={"entity_id": auto["id"]})).json()
    assert rows == []  # machine pass: no correction, no trace

    # the human override is traced
    other = await create_theme(client, working_name="另一主题")
    await assign_signal_theme(client, auto["id"], other["id"])
    rows = (await client.get("/api/v1/audit", params={"entity_id": auto["id"]})).json()
    assert len(rows) == 1
    assert rows[0]["field_name"] == "tech_theme_id"


async def test_trace_from_landing_point_reaches_signals(client):
    """REQ-RULE-03: from any tech landing point the API traces back through
    the vehicle function and demand point to the aggregation index (theme)
    and the raw signals, served in chain segments."""
    chain = await build_chain(client)
    lp_id = chain["landing_point"]["id"]

    r = await client.get(f"/api/v1/trace/landing-points/{lp_id}")
    assert r.status_code == 200
    trace = r.json()

    assert trace["landing_point"]["id"] == lp_id
    assert trace["landing_point"]["domain_name"] == "硬件"
    assert trace["landing_point"]["standard_count"] == 2

    assert trace["vehicle_function"]["id"] == chain["function"]["id"]
    assert trace["vehicle_function"]["published"] is True
    assert len(trace["vehicle_function"]["forward_trace"]["steps"]) == 5
    assert "necessity" in trace["vehicle_function"]["reverse_trace"]

    assert trace["demand_point"]["id"] == chain["demand"]["id"]
    assert trace["demand_point"]["cross_validation"]["conclusion"] == "通过"
    assert trace["demand_point"]["review_status"] == "confirmed"

    assert trace["theme"]["id"] == chain["theme"]["id"]
    assert trace["theme"]["working_name"] == "低压系统智能化"

    assert [s["id"] for s in trace["signals"]] == [chain["signal"]["id"]]
    assert trace["signals"][0]["url"] == chain["signal"]["url"]

    assert trace["assessment"]["id"] == chain["assessment"]["id"]
    assert trace["assessment"]["is_current"] is True
    assert len(trace["standards"]) == 2


async def test_trace_404_for_unknown_landing_point(client):
    r = await client.get("/api/v1/trace/landing-points/00000000-0000-0000-0000-000000000004")
    assert r.status_code == 404


async def test_overview_counts_match_underlying_resources(client):
    """REQ-UI-02: the workbench overview exposes the chain's key counts plus
    to-do hints; each count matches the underlying resources."""
    await build_chain(client)

    overview = (await client.get("/api/v1/overview")).json()
    assert overview == {
        "signals": 1,
        "signals_pending_review": 0,
        "tech_themes": 1,
        "demand_points": 1,
        "vehicle_functions": 1,
        "landing_points": 1,
        "funnel_pool": 1,
    }

    # cross-check against the underlying list endpoints
    assert overview["signals"] == len((await client.get("/api/v1/signals")).json())
    assert overview["tech_themes"] == len((await client.get("/api/v1/themes")).json())
    assert overview["demand_points"] == len((await client.get("/api/v1/demands")).json())
    assert overview["vehicle_functions"] == len((await client.get("/api/v1/functions")).json())
    assert overview["landing_points"] == len((await client.get("/api/v1/landing-points")).json())
    assert overview["funnel_pool"] == len(
        (await client.get("/api/v1/strategy/assessments")).json()
    )


async def test_overview_pending_review_count_equals_pending_signals(client):
    """REQ-UI-02: the pending-review to-do equals the signals in
    待人工复核 status."""
    await create_signal(client, evidence_status_code="retained")
    await create_signal(client, url="https://x.com/2", evidence_status_code="待人工复核")
    await create_signal(client, url="https://x.com/3", evidence_status_code="pending_review")
    await create_signal(client, url="https://x.com/4", evidence_status_code="fetching")

    overview = (await client.get("/api/v1/overview")).json()
    pending = (
        await client.get("/api/v1/signals", params={"evidence_status": "待人工复核"})
    ).json()
    assert overview["signals_pending_review"] == len(pending) == 2


async def test_overview_reflects_live_state_not_a_frozen_snapshot(client):
    """REQ-RULE-04: the API serves live current state — counts move as data
    is written."""
    before = (await client.get("/api/v1/overview")).json()
    assert before["signals"] == 0

    await create_signal(client)
    after = (await client.get("/api/v1/overview")).json()
    assert after["signals"] == 1
    assert after["tech_themes"] == before["tech_themes"]
