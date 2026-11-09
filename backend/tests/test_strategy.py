"""Strategy funnel: pool entry condition, score validation, classification,
version chain on re-judgment (REQ-STR-01..07, funnel-pool-entry,
SCHEMA-ASSESSMENT-VERSION)."""

import asyncio
import pytest

from tests.support import (
    create_assessment,
    create_confirmed_demand,
    create_function,
    create_landing_point,
    publish_function,
    put_standard,
    save_strategy_funnel,
)

pytestmark = pytest.mark.anyio


async def _landing_point(client, with_standards=True):
    demand = await create_confirmed_demand(client)
    func = await create_function(client, demand["id"])
    await publish_function(client, func["id"])
    lp = await create_landing_point(client, func["id"])
    if with_standards:
        await put_standard(client, lp["id"], "设计", "工程化", "满足AEC-Q100")
        await put_standard(client, lp["id"], "制造", "工程化", "完成保护功能验证")
    return lp


async def test_pool_entry_requires_deployment_boundary_records(client):
    """funnel-pool-entry: only tech landing points with deployment-boundary
    records enter the filter pool."""
    lp = await _landing_point(client, with_standards=False)
    r = await client.post(
        f"/api/v1/strategy/landing-points/{lp['id']}/assessments",
        json={
            "funnel_step": 4,
            "score_business": 4,
            "score_maturity": 4,
            "score_moat": 3,
            "score_supply_chain": 4,
            "score_feasibility": 5,
            "classification": "产业投资/生态合作",
        },
    )
    assert r.status_code == 422
    assert "部署边界" in r.json()["detail"]
    assert (await client.get("/api/v1/strategy/assessments")).json() == []


async def test_funnel_gates_require_boundary_and_rejected_adaptation_exits(client):
    lp = await _landing_point(client, with_standards=False)
    path = f"/api/v1/strategy/landing-points/{lp['id']}/funnel"

    initial = (await client.get(path)).json()
    assert initial["current_step"] == "pool_entry_blocked"
    assert initial["pool_eligible"] is False
    assert initial["deployment_boundary_evidence_ids"] == []
    assert initial["score_total"] is None

    r = await client.patch(
        path,
        json={"scan_scope": "测试扫描范围", "scan_sources": ["测试来源"]},
    )
    assert r.status_code == 422

    # An explicit blank matrix cell is not deployment-boundary evidence.
    await put_standard(client, lp["id"], "运营", "经济性", None)
    assert (await client.get(path)).json()["pool_eligible"] is False
    r = await client.patch(
        path,
        json={"scan_scope": "测试扫描范围", "scan_sources": ["测试来源"]},
    )
    assert r.status_code == 422

    await put_standard(client, lp["id"], "设计", "工程化", "测试部署边界")
    assert (await client.get(path)).json()["current_step"] == "industry_scan"
    r = await client.patch(
        path,
        json={"adaptation_decision": "pass"},
    )
    assert r.status_code == 422

    r = await client.patch(
        path,
        json={"scan_scope": "测试扫描范围", "scan_sources": ["测试来源"]},
    )
    assert r.status_code == 200
    assert r.json()["current_step"] == "tier1_adaptation"
    r = await client.patch(
        path,
        json={"score_business": 4, "rationale_business": "不应越过适配门"},
    )
    assert r.status_code == 422

    rejected = await client.patch(
        path,
        json={
            "tier1_current_business_relation": "测试当前关系",
            "tier1_future_business_relation": "测试未来关系",
            "valuable_role": "测试有价值角色",
            "adaptation_decision": "reject",
            "adaptation_reason": "该场景不属于当前或未来业务",
        },
    )
    assert rejected.status_code == 200, rejected.text
    body = rejected.json()
    assert body["current_step"] == "rejected"
    assert body["score_drafts"]["business"] == {"score": None, "rationale": None}
    assert body["score_total"] is None
    assert body["classification"] is None
    assert body["strategy_note"] is None

    r = await client.patch(
        path,
        json={"score_business": 4, "rationale_business": "拒绝后不能评分"},
    )
    assert r.status_code == 422
    r = await client.post(
        f"/api/v1/strategy/landing-points/{lp['id']}/assessments",
        json={
            "funnel_step": 4,
            "score_business": 4,
            "score_maturity": 4,
            "score_moat": 3,
            "score_supply_chain": 4,
            "score_feasibility": 5,
            "classification": "产业投资/生态合作",
            "strategy_note": "不得绕过拒绝状态",
        },
    )
    assert r.status_code == 422
    assert (await client.get(f"/api/v1/strategy/landing-points/{lp['id']}/assessments/history")).json() == []


async def test_landing_point_with_standards_enters_the_pool(client):
    lp = await _landing_point(client)
    assessment = await create_assessment(client, lp["id"])
    assert assessment["tech_landing_point_id"] == lp["id"]
    assert assessment["version"] == 1
    assert assessment["is_current"] is True


async def test_scores_accept_only_integers_1_to_5(client):
    """REQ-STR-04: each dimension accepts only integers 1–5 — no decimals,
    no 0, no out-of-range."""
    lp = await _landing_point(client)
    base = {
        "funnel_step": 4,
        "score_business": 4,
        "score_maturity": 4,
        "score_moat": 3,
        "score_supply_chain": 4,
        "score_feasibility": 5,
        "classification": "产业投资/生态合作",
    }
    for field, bad in [
        ("score_business", 0),
        ("score_business", 6),
        ("score_business", 3.5),
        ("score_business", 4.0),
        ("score_business", True),
        ("score_maturity", -1),
        ("score_feasibility", "high"),
    ]:
        payload = {**base, field: bad}
        r = await client.post(
            f"/api/v1/strategy/landing-points/{lp['id']}/assessments", json=payload
        )
        assert r.status_code == 422, f"{field}={bad!r} should be rejected"


async def test_total_is_server_computed_sum_of_five_dimensions(client):
    """REQ-STR-04 / SCHEMA-ASSESSMENT-VERSION: score_total is generated as the
    sum of the five dimensions (max 25), never client-writable."""
    lp = await _landing_point(client)
    a = await create_assessment(
        client,
        lp["id"],
        score_business=4,
        score_maturity=4,
        score_moat=3,
        score_supply_chain=4,
        score_feasibility=5,
    )
    assert a["score_total"] == 20
    assert a["score_total"] == sum(
        a[k] for k in ("score_business", "score_maturity", "score_moat", "score_supply_chain", "score_feasibility")
    )

    b = await create_assessment(
        client,
        lp["id"],
        score_business=5,
        score_maturity=5,
        score_moat=5,
        score_supply_chain=5,
        score_feasibility=5,
    )
    assert b["score_total"] == 25  # max


async def test_funnel_score_pairs_total_and_explicit_classification(client):
    lp = await _landing_point(client)
    path = f"/api/v1/strategy/landing-points/{lp['id']}/funnel"
    await client.patch(path, json={"scan_scope": "测试扫描范围", "scan_sources": ["测试来源"]})
    await client.patch(
        path,
        json={
            "tier1_current_business_relation": "测试当前关系",
            "tier1_future_business_relation": "测试未来关系",
            "valuable_role": "测试系统集成角色",
            "adaptation_decision": "pass",
            "adaptation_reason": "测试适配依据",
        },
    )
    for bad in (0, 6, 3.5, 4.0, True):
        r = await client.patch(
            path,
            json={"score_business": bad, "rationale_business": "无效值不得保存"},
        )
        assert r.status_code == 422, f"score_business={bad!r} should be rejected"
    r = await client.patch(
        path,
        json={
            "score_business": 4,
            "score_maturity": 4,
            "score_moat": 3,
            "score_supply_chain": 4,
            "score_feasibility": 5,
        },
    )
    assert r.status_code == 422  # each dimension needs its rationale

    scoring = await client.patch(
        path,
        json={
            "score_business": 4,
            "rationale_business": "业务匹配测试依据",
            "score_maturity": 4,
            "rationale_maturity": "成熟度窗口测试依据",
            "score_moat": 3,
            "rationale_moat": "差异化测试依据",
            "score_supply_chain": 4,
            "rationale_supply_chain": "生态位测试依据",
            "score_feasibility": 5,
            "rationale_feasibility": "可落地性测试依据",
        },
    )
    assert scoring.status_code == 200, scoring.text
    assert scoring.json()["current_step"] == "classification"
    assert scoring.json()["score_total"] == 20
    assert scoring.json()["classification"] is None
    r = await client.patch(
        path,
        json={"score_total": 20},
    )
    assert r.status_code == 422

    classified = await client.patch(
        path,
        json={"classification": "前瞻布局", "strategy_note": "由操作员明确选择，不按总分自动推断"},
    )
    assert classified.status_code == 200, classified.text
    assert classified.json()["score_total"] == 20
    assert classified.json()["classification"] == "前瞻布局"
    assert classified.json()["current_step"] == "ready_to_finalize"
    finalized = await client.patch(path, json={"finalize": True})
    assert finalized.status_code == 200, finalized.text
    out = finalized.json()
    assert out["current_step"] == "complete"
    assert out["score_total"] == 20
    assessment = out["latest_assessment"]
    assert assessment["version"] == 1
    assert assessment["score_rationales"] == {
        "business": "业务匹配测试依据",
        "maturity": "成熟度窗口测试依据",
        "moat": "差异化测试依据",
        "supply_chain": "生态位测试依据",
        "feasibility": "可落地性测试依据",
    }
    assert assessment["funnel_snapshot"]["adaptation_decision"] == "pass"
    assert assessment["funnel_snapshot"]["deployment_boundary_evidence_ids"]
    assert assessment["classification"] == "前瞻布局"
    assert assessment["operator_subject"] == "eea-test-actor"
    assert assessment["assessed_at"]


async def test_funnel_edits_write_field_level_audit_with_old_new_actor_and_time(client):
    lp = await _landing_point(client)
    path = f"/api/v1/strategy/landing-points/{lp['id']}/funnel"
    first = await client.patch(
        path,
        json={"scan_scope": "初始扫描范围", "scan_sources": ["来源 A", "来源 B"]},
    )
    assert first.status_code == 200, first.text
    second = await client.patch(path, json={"scan_sources": ["来源 A", "来源 C"]})
    assert second.status_code == 200, second.text

    audit = await client.get("/api/v1/audit", params={"entity_id": lp["id"]})
    assert audit.status_code == 200, audit.text
    rows = audit.json()
    scan_sources = [
        row for row in rows
        if row["entity_type"] == "strategic_funnel" and row["field_name"] == "scan_sources"
    ]
    assert len(scan_sources) == 2
    latest = next(row for row in scan_sources if row["new_value"] == ["来源 A", "来源 C"])
    assert latest["old_value"] == ["来源 A", "来源 B"]
    assert latest["new_value"] == ["来源 A", "来源 C"]
    assert latest["operator_subject"] == "eea-test-actor"
    assert latest["operator_role"] == "platform_admin"
    assert latest["corrected_at"]

    await client.patch(
        path,
        json={
            "tier1_current_business_relation": "当前关系",
            "tier1_future_business_relation": "未来关系",
            "valuable_role": "系统集成角色",
            "adaptation_decision": "pass",
            "adaptation_reason": "通过依据",
        },
    )
    score = await client.patch(
        path,
        json={"score_business": 4, "rationale_business": "业务评分依据"},
    )
    assert score.status_code == 200, score.text
    audit = await client.get("/api/v1/audit", params={"entity_id": lp["id"]})
    score_row = next(row for row in audit.json() if row["field_name"] == "score_business")
    rationale_row = next(row for row in audit.json() if row["field_name"] == "rationale_business")
    assert score_row["old_value"] is None and score_row["new_value"] == 4
    assert rationale_row["old_value"] is None and rationale_row["new_value"] == "业务评分依据"


async def test_legacy_assessment_requires_matching_completed_funnel(client):
    lp = await _landing_point(client)
    path = f"/api/v1/strategy/landing-points/{lp['id']}/assessments"
    payload = {
        "funnel_step": 4,
        "score_business": 4,
        "score_maturity": 4,
        "score_moat": 3,
        "score_supply_chain": 4,
        "score_feasibility": 5,
        "classification": "产业投资/生态合作",
        "strategy_note": "测试策略备注",
    }
    assert (await client.post(path, json=payload)).status_code == 422
    await save_strategy_funnel(client, lp["id"], payload)
    mismatch = {**payload, "classification": "前瞻布局"}
    assert (await client.post(path, json=mismatch)).status_code == 422
    accepted = await client.post(path, json=payload)
    assert accepted.status_code == 201, accepted.text
    assert accepted.json()["version"] == 1


async def test_funnel_reassessment_appends_history_and_reject_keeps_prior_versions(client):
    lp = await _landing_point(client)
    path = f"/api/v1/strategy/landing-points/{lp['id']}/funnel"
    await save_strategy_funnel(client, lp["id"])
    first = await client.patch(path, json={"finalize": True})
    assert first.status_code == 200
    first_assessment = first.json()["latest_assessment"]
    assert first_assessment["version"] == 1

    rejected = await client.patch(
        path,
        json={
            "tier1_current_business_relation": "重新评估的当前关系",
            "tier1_future_business_relation": "重新评估的未来关系",
            "valuable_role": "重新评估的角色",
            "adaptation_decision": "reject",
            "adaptation_reason": "重新评估后退出",
        },
    )
    assert rejected.status_code == 200
    assert rejected.json()["current_step"] == "rejected"
    assert rejected.json()["latest_assessment"]["id"] == first_assessment["id"]
    history = (
        await client.get(f"/api/v1/strategy/landing-points/{lp['id']}/assessments/history")
    ).json()
    assert [item["version"] for item in history] == [1]
    assert history[0]["is_current"] is True
    assert history[0]["funnel_snapshot"]["tier1_current_business_relation"] == "测试当前业务关系"

    reentry = await client.patch(
        path,
        json={
            "tier1_current_business_relation": "重新评估的当前关系",
            "tier1_future_business_relation": "重新评估的未来关系",
            "valuable_role": "重新评估的角色",
            "adaptation_decision": "pass",
            "adaptation_reason": "重新評估後通過",
        },
    )
    assert reentry.status_code == 200
    assert reentry.json()["current_step"] == "scoring"
    assert reentry.json()["score_total"] is None
    assert reentry.json()["score_drafts"]["business"] == {"score": None, "rationale": None}

    await client.patch(
        path,
        json={
            "score_business": 5,
            "rationale_business": "新业务理由",
            "score_maturity": 5,
            "rationale_maturity": "新成熟度理由",
            "score_moat": 4,
            "rationale_moat": "新差异化理由",
            "score_supply_chain": 4,
            "rationale_supply_chain": "新生态位理由",
            "score_feasibility": 5,
            "rationale_feasibility": "新落地理由",
        },
    )
    await client.patch(
        path,
        json={"classification": "短期可落地", "strategy_note": "重新评估后选择短期落地"},
    )
    second = await client.patch(path, json={"finalize": True})
    assert second.status_code == 200
    assert second.json()["latest_assessment"]["version"] == 2

    history = (
        await client.get(f"/api/v1/strategy/landing-points/{lp['id']}/assessments/history")
    ).json()
    assert [item["version"] for item in history] == [1, 2]
    assert [item["is_current"] for item in history] == [False, True]
    assert history[0]["score_business"] == 4
    assert history[1]["score_business"] == 5
    assert history[1]["score_rationales"]["business"] == "新业务理由"


async def test_concurrent_legacy_finalization_serializes_versions(client):
    lp = await _landing_point(client)
    payload = {
        "funnel_step": 4,
        "score_business": 4,
        "score_maturity": 4,
        "score_moat": 3,
        "score_supply_chain": 4,
        "score_feasibility": 5,
        "classification": "产业投资/生态合作",
        "strategy_note": "并发版本测试",
    }
    await save_strategy_funnel(client, lp["id"], payload)
    url = f"/api/v1/strategy/landing-points/{lp['id']}/assessments"
    first, second = await asyncio.gather(client.post(url, json=payload), client.post(url, json=payload))
    assert first.status_code == second.status_code == 201
    assert {first.json()["version"], second.json()["version"]} == {1, 2}
    history = (
        await client.get(f"/api/v1/strategy/landing-points/{lp['id']}/assessments/history")
    ).json()
    assert [item["version"] for item in history] == [1, 2]
    assert sum(item["is_current"] for item in history) == 1


async def test_classification_is_three_way_choice(client):
    """REQ-STR-05: exactly one of 前瞻布局 / 短期可落地 / 产业投资/生态合作."""
    lp = await _landing_point(client)
    r = await client.post(
        f"/api/v1/strategy/landing-points/{lp['id']}/assessments",
        json={
            "funnel_step": 4,
            "score_business": 4,
            "score_maturity": 4,
            "score_moat": 3,
            "score_supply_chain": 4,
            "score_feasibility": 5,
            "classification": "观望",
        },
    )
    assert r.status_code == 422


async def test_funnel_step_bounded_1_to_4(client):
    """REQ-STR-01: the four funnel steps in fixed order — the current step is
    recorded on the assessment and bounded to the funnel."""
    lp = await _landing_point(client)
    for bad in (0, 5):
        r = await client.post(
            f"/api/v1/strategy/landing-points/{lp['id']}/assessments",
            json={
                "funnel_step": bad,
                "score_business": 4,
                "score_maturity": 4,
                "score_moat": 3,
                "score_supply_chain": 4,
                "score_feasibility": 5,
                "classification": "前瞻布局",
            },
        )
        assert r.status_code == 422
    a = await create_assessment(client, lp["id"], funnel_step=4)
    assert a["funnel_step"] == 4
    r = await client.post(
        f"/api/v1/strategy/landing-points/{lp['id']}/assessments",
        json={
            "funnel_step": 2,
            "score_business": 4,
            "score_maturity": 4,
            "score_moat": 3,
            "score_supply_chain": 4,
            "score_feasibility": 5,
            "classification": "前瞻布局",
            "strategy_note": "不允许由旧接口跳过步骤",
        },
    )
    assert r.status_code == 422


async def test_assessment_records_classification_total_and_note(client):
    """REQ-STR-06: a technology in the pool records classification, total
    score and strategy note."""
    lp = await _landing_point(client)
    a = await create_assessment(client, lp["id"], strategy_note="建议通过战略投资锁定供给")
    assert a["classification"] == "产业投资/生态合作"
    assert a["score_total"] == 20
    assert a["strategy_note"] == "建议通过战略投资锁定供给"
    assert a["operator_subject"] == "eea-test-actor"


async def test_rejudgment_appends_version_and_keeps_history(client):
    """REQ-STR-07: a re-judgment appends a new version while preserving the
    full history — never overwriting or deleting."""
    lp = await _landing_point(client)
    v1 = await create_assessment(client, lp["id"], score_business=2, classification="前瞻布局")
    v2 = await create_assessment(
        client, lp["id"], score_business=4, classification="产业投资/生态合作"
    )

    assert v2["version"] == v1["version"] + 1
    assert v2["is_current"] is True

    history = (
        await client.get(f"/api/v1/strategy/landing-points/{lp['id']}/assessments/history")
    ).json()
    assert [h["version"] for h in history] == [1, 2]
    assert history[0]["classification"] == "前瞻布局"  # v1 preserved verbatim
    assert history[0]["score_business"] == 2
    assert history[1]["is_current"] is True
    assert history[0]["is_current"] is False

    # the default listing shows the latest version only
    current = (await client.get("/api/v1/strategy/assessments")).json()
    assert len(current) == 1
    assert current[0]["version"] == 2

    # current_only=False exposes the version timeline
    all_rows = (
        await client.get("/api/v1/strategy/assessments", params={"current_only": False})
    ).json()
    assert len(all_rows) == 2


async def test_exactly_one_current_assessment_per_landing_point(client):
    lp = await _landing_point(client)
    await create_assessment(client, lp["id"])
    await create_assessment(client, lp["id"], score_business=5)
    current = (
        await client.get(
            "/api/v1/strategy/assessments", params={"lp_id": str(lp["id"]), "current_only": True}
        )
    ).json()
    assert len(current) == 1


async def test_assessment_list_filters_by_classification(client):
    lp_a = await _landing_point(client)
    lp_b = await _landing_point(client)
    await create_assessment(client, lp_a["id"], classification="前瞻布局")
    await create_assessment(client, lp_b["id"], classification="短期可落地")
    rows = (
        await client.get("/api/v1/strategy/assessments", params={"classification": "前瞻布局"})
    ).json()
    assert {r["classification"] for r in rows} == {"前瞻布局"}
    assert {r["tech_landing_point_id"] for r in rows} == {lp_a["id"]}


async def test_assessment_404(client):
    r = await client.get("/api/v1/strategy/assessments/00000000-0000-0000-0000-000000000002")
    assert r.status_code == 404
    r = await client.post(
        "/api/v1/strategy/landing-points/00000000-0000-0000-0000-000000000003/assessments",
        json={
            "funnel_step": 4,
            "score_business": 4,
            "score_maturity": 4,
            "score_moat": 3,
            "score_supply_chain": 4,
            "score_feasibility": 5,
            "classification": "前瞻布局",
        },
    )
    assert r.status_code == 404
