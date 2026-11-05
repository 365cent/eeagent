"""Strategy funnel: pool entry condition, score validation, classification,
version chain on re-judgment (REQ-STR-01..07, funnel-pool-entry,
SCHEMA-ASSESSMENT-VERSION)."""

import pytest

from tests.support import (
    create_assessment,
    create_confirmed_demand,
    create_function,
    create_landing_point,
    put_standard,
)

pytestmark = pytest.mark.anyio


async def _landing_point(client, with_standards=True):
    demand = await create_confirmed_demand(client)
    func = await create_function(client, demand["id"])
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
    a = await create_assessment(client, lp["id"], funnel_step=2)
    assert a["funnel_step"] == 2


async def test_assessment_records_classification_total_and_note(client):
    """REQ-STR-06: a technology in the pool records classification, total
    score and strategy note."""
    lp = await _landing_point(client)
    a = await create_assessment(client, lp["id"], strategy_note="建议通过战略投资锁定供给")
    assert a["classification"] == "产业投资/生态合作"
    assert a["score_total"] == 20
    assert a["strategy_note"] == "建议通过战略投资锁定供给"
    assert a["operator_subject"] == "test-admin"


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
