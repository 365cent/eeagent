"""Chain traceability, audit records and the workbench overview
(REQ-RULE-02, REQ-RULE-03, REQ-UI-02, SCHEMA-CORRECTION-AUDIT)."""

from datetime import datetime, timedelta
import uuid

import pytest
from sqlalchemy import update

from app.db.base import SessionLocal
from app.models.models import CaptureJob, DemandPoint, Signal

from tests.support import (
    SUPPLY_CHAIN_BODY,
    assign_signal_theme,
    build_chain,
    create_signal,
    create_theme,
    create_confirmed_demand,
    create_function,
    create_landing_point,
    create_assessment,
    publish_function,
    put_standard,
    save_strategy_funnel,
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
        json={"value_chain_stage_code": "delivery_oem", "operator_subject": "伪造人员", "operator_role": "平台管理员"},
    )
    assert r.status_code == 200

    rows = (await client.get("/api/v1/audit", params={"entity_id": sig["id"]})).json()
    assert len(rows) == 1
    row = rows[0]
    assert row["entity_type"] == "signal"
    assert row["field_name"] == "value_chain_stage_code"
    assert row["machine_value"] == "creation_supply"  # machine value stays retrievable
    assert row["human_value"] == "delivery_oem"
    assert row["operator_subject"] == "eea-test-actor"
    assert row["operator_role"] == "platform_admin"
    assert row["old_value"] == "creation_supply"
    assert row["new_value"] == "delivery_oem"
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

    expected_signal_ids = {
        chain["signal"]["id"],
        *chain["demand"]["cross_validation"]["evidence_signal_ids"],
    }
    assert {signal["id"] for signal in trace["signals"]} == expected_signal_ids
    assert trace["signals"][0]["url"] == chain["signal"]["url"]

    assert trace["assessment"]["id"] == chain["assessment"]["id"]
    assert trace["assessment"]["is_current"] is True
    assert len(trace["standards"]) == 2
    assert trace["completeness"] == {
        "complete": True,
        "present_stages": ["landing_point", "vehicle_function", "demand_point", "theme", "signals"],
        "missing_stages": [],
        "unresolved_evidence_signal_ids": [],
        "unresolved_document_ids": [],
    }
    assert len(trace["assessment_versions"]) == 1
    assert sum(signal["trace_relationships"] == ["theme_member"] for signal in trace["signals"]) == 1
    assert sum(signal["trace_relationships"] == ["theme_member", "demand_evidence"] for signal in trace["signals"]) == 2
    assert trace["demand_review_status"] == "confirmed"
    assert trace["demand_cross_validation_conclusion"] == "通过"
    assert trace["function_published"] is True
    assert trace["basis_freshness"] == "unknown_untracked"
    assert all(signal["is_archived"] is False for signal in trace["signals"])


async def test_trace_exposes_persisted_archive_and_signal_update_state(client):
    from tests.test_capture import _capture_ok

    chain = await build_chain(client)
    archived = await _capture_ok(client, url="https://mp.weixin.qq.com/s/trace-archive")
    await assign_signal_theme(client, archived["id"], chain["theme"]["id"])
    updated = await client.patch(
        f"/api/v1/signals/{archived['id']}",
        json={"evidence_status_code": "archived"},
    )
    assert updated.status_code == 200, updated.text

    trace = (
        await client.get(f"/api/v1/trace/landing-points/{chain['landing_point']['id']}")
    ).json()
    archived_trace = next(item for item in trace["signals"] if item["id"] == archived["id"])
    assert archived_trace["evidence_status_code"] == "archived"
    assert archived_trace["is_archived"] is True
    assert archived_trace["archive_reference_present"] is True
    assert archived_trace["archive_endpoint"] == f"/api/v1/signals/{archived['id']}/archive"
    assert archived_trace["figures_endpoint"] == f"/api/v1/signals/{archived['id']}/figures"
    assert archived_trace["body_reference_present"] is True
    assert archived_trace["body_endpoint"] == f"/api/v1/signals/{archived['id']}/body"
    assert archived_trace["updated_at"] is not None
    assert archived_trace["publisher"] == "与非网"
    assert (await client.get(archived_trace["archive_endpoint"])).status_code == 200
    assert (await client.get(archived_trace["figures_endpoint"])).status_code == 200


async def test_trace_includes_persisted_document_reference_metadata(client):
    chain = await build_chain(client)
    uploaded = await client.post(
        "/api/v1/documents/raw",
        files={"file": ("trace-source.txt", b"Persisted source evidence for trace.", "text/plain")},
    )
    assert uploaded.status_code == 201, uploaded.text
    document = uploaded.json()
    signal = await create_signal(
        client,
        url="https://example.com/trace-document-source",
        document_id=document["id"],
        evidence_status_code="retained",
    )
    await assign_signal_theme(client, signal["id"], chain["theme"]["id"])

    trace = (
        await client.get(f"/api/v1/trace/landing-points/{chain['landing_point']['id']}")
    ).json()
    document_signal = next(item for item in trace["signals"] if item["id"] == signal["id"])
    assert document_signal["document"]["id"] == document["id"]
    assert document_signal["document"]["endpoint"] == f"/api/v1/documents/{document['id']}"
    assert document_signal["document"]["raw_object_reference_present"] is True
    assert document_signal["document"]["filename"] == "trace-source.txt"
    assert document_signal["document"]["figure_count"] == document["figure_count"]


async def test_trace_exposes_current_and_historical_assessment_versions(client):
    chain = await build_chain(client)
    latest = await create_assessment(
        client,
        chain["landing_point"]["id"],
        score_business=5,
        score_maturity=4,
        score_moat=4,
        score_supply_chain=3,
        score_feasibility=4,
    )

    trace = (
        await client.get(f"/api/v1/trace/landing-points/{chain['landing_point']['id']}")
    ).json()
    assert trace["assessment"]["id"] == latest["id"]
    assert [item["version"] for item in trace["assessment_versions"]] == [1, 2]
    assert [item["is_current"] for item in trace["assessment_versions"]] == [False, True]
    assert trace["assessment_versions"][0]["id"] == chain["assessment"]["id"]


async def test_trace_reports_empty_theme_and_dangling_evidence_links(client):
    chain = await build_chain(client)
    missing_signal_id = str(uuid.uuid4())
    async with SessionLocal() as db:
        await db.execute(
            update(DemandPoint)
            .where(DemandPoint.id == chain["demand"]["id"])
            .values(
                source_tech_theme_id=None,
                review_status="pending",
                derivation_trace=None,
                cross_validation={"conclusion": "未复核", "evidence_signal_ids": [missing_signal_id]},
            )
        )
        await db.commit()

    trace = (
        await client.get(f"/api/v1/trace/landing-points/{chain['landing_point']['id']}")
    ).json()
    assert trace["theme"] is None
    assert trace["signals"] == []
    assert trace["completeness"]["complete"] is False
    assert trace["completeness"]["missing_stages"] == ["theme", "signals"]
    assert trace["completeness"]["unresolved_evidence_signal_ids"] == [missing_signal_id]
    assert trace["demand_review_status"] == "pending"
    assert trace["basis_freshness"] == "unknown_untracked"


async def test_trace_404_for_unknown_landing_point(client):
    r = await client.get("/api/v1/trace/landing-points/00000000-0000-0000-0000-000000000004")
    assert r.status_code == 404


async def test_overview_counts_match_underlying_resources(client):
    """REQ-UI-02: the workbench overview exposes the chain's key counts plus
    to-do hints; each count matches the underlying resources."""
    await build_chain(client)

    overview = (await client.get("/api/v1/overview")).json()
    assert overview["signals"] == 3
    assert overview["signal_sources"] == 3
    assert overview["signals_pending_review"] == 0
    assert overview["demand_points_pending_review"] == 0
    assert overview["tech_themes"] == 1
    assert overview["demand_points"] == 1
    assert overview["vehicle_functions"] == 1
    assert overview["landing_points"] == 1
    assert overview["substantive_standards"] == 2
    assert overview["funnel_pool"] == 1
    assert overview["weekly_new"] == {
        "signals": 3,
        "tech_themes": 1,
        "demand_points": 1,
        "vehicle_functions": 1,
        "landing_points": 1,
        "strategic_assessments": 1,
        "documents": 0,
    }
    assert overview["strategy_funnel"] == {
        "industry_scan": 0,
        "tier1_adaptation": 0,
        "scoring": 0,
        "classification": 1,
        "rejected": 0,
        "pool_entry_blocked": 0,
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


async def test_overview_separates_signal_states_and_deduplicates_sources(client):
    chain = await build_chain(client)
    for index, status in enumerate(("pending_review", "fetching", "fetch_failed", "archived")):
        # The archived row reuses an existing normalized URL to prove source
        # count is distinct URLs rather than signal rows.
        url = (
            chain["signal"]["url"]
            if status == "archived"
            else f"https://example.com/signal-state/{index}"
        )
        await create_signal(
            client,
            title=f"信号状态 {status}",
            url=url,
            body_text="状态计数测试正文",
            evidence_status_code=status,
        )

    overview = (await client.get("/api/v1/overview")).json()
    assert overview["signals"] == 7
    assert overview["signal_sources"] == 6
    assert overview["signals_retained"] == 3
    assert overview["signals_pending_review"] == 1
    assert overview["signals_fetching"] == 1
    assert overview["signals_fetch_failed"] == 1
    assert overview["signals_archived"] == 1


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
    assert before["signal_sources"] == 0
    assert before["weekly_new"]["signals"] == 0
    assert before["strategy_funnel"] == {
        "industry_scan": 0,
        "tier1_adaptation": 0,
        "scoring": 0,
        "classification": 0,
        "rejected": 0,
        "pool_entry_blocked": 0,
    }

    await create_signal(client)
    after = (await client.get("/api/v1/overview")).json()
    assert after["signals"] == 1
    assert after["tech_themes"] == before["tech_themes"]


async def test_overview_weekly_counts_use_utc_week_created_rows(client):
    current = await create_signal(client, url="https://example.com/current-week")
    previous = await create_signal(client, url="https://example.com/previous-week")
    before = (await client.get("/api/v1/overview")).json()
    old_created_at = datetime.fromisoformat(
        before["weekly_window_start_utc"].replace("Z", "+00:00")
    ) - timedelta(seconds=1)
    async with SessionLocal() as db:
        await db.execute(
            update(Signal).where(Signal.id == previous["id"]).values(created_at=old_created_at)
        )
        await db.commit()

    overview = (await client.get("/api/v1/overview")).json()
    assert overview["signals"] == 2
    assert overview["signal_sources"] == 2
    assert overview["weekly_new"]["signals"] == 1
    assert overview["weekly_window_start_utc"] <= overview["as_of_utc"]
    assert current["id"] != previous["id"]


async def test_overview_counts_each_strategy_landing_point_at_its_current_step(client):
    demand = await create_confirmed_demand(client)
    vehicle_function = await create_function(client, demand["id"])
    await publish_function(client, vehicle_function["id"])

    async def new_lp(index, *, boundary=True):
        lp = await create_landing_point(
            client, vehicle_function["id"], name=f"测试落脚点{index}"
        )
        if boundary:
            await put_standard(client, lp["id"], "设计", "工程化", "有实质部署边界")
        return lp

    await new_lp(1)
    adaptation_lp = await new_lp(2)
    scoring_lp = await new_lp(3)
    classification_lp = await new_lp(4)
    complete_lp = await new_lp(5)
    rejected_lp = await new_lp(6)
    await new_lp(7, boundary=False)

    for lp in (adaptation_lp, scoring_lp):
        response = await client.patch(
            f"/api/v1/strategy/landing-points/{lp['id']}/funnel",
            json={"scan_scope": "范围", "scan_sources": ["来源"]},
        )
        assert response.status_code == 200
    response = await client.patch(
        f"/api/v1/strategy/landing-points/{scoring_lp['id']}/funnel",
        json={
            "tier1_current_business_relation": "当前关系",
            "tier1_future_business_relation": "未来关系",
            "valuable_role": "系统集成",
            "adaptation_decision": "pass",
            "adaptation_reason": "有明确适配价值",
        },
    )
    assert response.status_code == 200

    await save_strategy_funnel(client, classification_lp["id"])
    await save_strategy_funnel(client, complete_lp["id"])
    response = await client.patch(
        f"/api/v1/strategy/landing-points/{complete_lp['id']}/funnel",
        json={"finalize": True},
    )
    assert response.status_code == 200, response.text
    await save_strategy_funnel(client, rejected_lp["id"], rejected=True)

    overview = (await client.get("/api/v1/overview")).json()
    assert overview["strategy_funnel"] == {
        "industry_scan": 1,
        "tier1_adaptation": 1,
        "scoring": 1,
        "classification": 2,
        "rejected": 1,
        "pool_entry_blocked": 1,
    }
    assert sum(
        overview["strategy_funnel"][stage]
        for stage in ("industry_scan", "tier1_adaptation", "scoring", "classification", "rejected")
    ) == 6


async def test_overview_failed_document_todo_tracks_retryable_ingest_state(client, monkeypatch):
    from app.services import doc_ingest

    async def fail_ingest(data, filename, mime):
        raise RuntimeError("expected parser failure")

    monkeypatch.setattr("app.api.v1.documents.ingest_document", fail_ingest)
    uploaded = await client.post(
        "/api/v1/documents/raw",
        files={"file": ("retryable.bin", b"retryable raw bytes", "application/octet-stream")},
    )
    assert uploaded.status_code == 201
    document = uploaded.json()
    assert document["ingest_status"] == "failed"
    overview = (await client.get("/api/v1/overview")).json()
    assert overview["documents_failed_ingest"] == 1

    async def succeed_ingest(data, filename, mime):
        return doc_ingest.IngestResult(
            canonical_md="# Parsed after retry\n", markitdown_version="test", figures=[]
        )

    monkeypatch.setattr("app.api.v1.documents.ingest_document", succeed_ingest)
    retried = await client.post(f"/api/v1/documents/{document['id']}/ingest")
    assert retried.status_code == 200
    assert retried.json()["ingest_status"] == "parsed"
    overview = (await client.get("/api/v1/overview")).json()
    assert overview["documents_failed_ingest"] == 0


async def test_overview_capture_job_todos_follow_persisted_retry_status(client):
    created = await client.post(
        "/api/v1/capture/jobs",
        data={
            "submission_id": str(uuid.uuid4()),
            "url": "https://example.com/queued-capture-job",
        },
    )
    assert created.status_code == 202, created.text
    job_id = created.json()["id"]
    overview = (await client.get("/api/v1/overview")).json()
    assert overview["capture_jobs_open"] == 1
    assert overview["capture_jobs_failed"] == 0

    async with SessionLocal() as db:
        await db.execute(
            update(CaptureJob)
            .where(CaptureJob.id == job_id)
            .values(status="failed", stage="failed", error="test failure")
        )
        await db.commit()
    overview = (await client.get("/api/v1/overview")).json()
    assert overview["capture_jobs_open"] == 0
    assert overview["capture_jobs_failed"] == 1

    retried = await client.post(f"/api/v1/capture/jobs/{job_id}/retry")
    assert retried.status_code == 202, retried.text
    assert retried.json()["status"] == "queued"
    overview = (await client.get("/api/v1/overview")).json()
    assert overview["capture_jobs_open"] == 1
    assert overview["capture_jobs_failed"] == 0
