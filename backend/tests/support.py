"""Async factory helpers for the interface tests.

Every helper creates a resource through the public REST API (the interface
under test) and fails loudly on an unexpected status, so a broken create flow
surfaces as an assertion error with the response body instead of a cascade of
confusing downstream failures.
"""

import hashlib
import uuid

DEFAULT_SIGNAL = {
    "title": "48V低压供电网络研究",
    "url": "https://example.com/industry/48v-low-voltage-network",
    "channel_code": "web",
    "publisher": "与非网",
    "published_at": "2026-06-01T00:00:00Z",
    "signal_type_code": "strategy",
    "evolution_node_code": "release",
}

# REQ-TAG-04 harness reasoning: the title names the 48V supply chain and the
# snapshot names suppliers → 创造端（供应链） (creation_supply)
SUPPLY_CHAIN_BODY = (
    "48V供应链活跃，多家功率半导体厂商布局eFuse、SSCB等智能配电器件，"
    "将优先落地线控底盘等高功率场景。"
)

FORWARD_TRACE = {
    "steps": [
        "拆解核心诉求：\n- 节点级状态感知与软件定义通断\n- 快速故障隔离与自动恢复",
        "识别缺口：传统保险丝与机械继电器无法节点级控制",
        "定位关键流：低压配电网络",
        "推导系统行为：监测、控制、保护、诊断、恢复闭环",
        "收敛为功能：全节点智能配电",
    ]
}

REVERSE_TRACE = {
    "necessity": "无此功能则节点级状态感知、软件定义通断、快速故障隔离与自动恢复不能完整实现",
    "coverage": [
        {
            "need": "节点级状态感知与软件定义通断",
            "coverage": "通过节点级采集与软件控制实现状态识别和通断。",
        },
        {
            "need": "快速故障隔离与自动恢复",
            "coverage": "保护策略隔离故障支路，并支持故障排除后的恢复。",
        },
    ],
    "full_coverage": True,
    "unresolved_contradictions": [],
    "conclusion": "consistent",
    "human_confirmed": True,
}

DEMAND_STEP_KEYS = (
    "fact_identification",
    "frequency_consensus",
    "similarity_analysis",
    "stakeholder_attribution",
    "demand_naming",
)


def sha256_of(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


async def create_signal(client, **overrides) -> dict:
    payload = {**DEFAULT_SIGNAL, **overrides}
    r = await client.post("/api/v1/signals", json=payload)
    assert r.status_code == 201, r.text
    return r.json()


async def create_theme(client, working_name="低压系统智能化", stage="creation_supply") -> dict:
    payload = {"working_name": working_name}
    if stage is not None:
        payload["value_chain_stage_code"] = stage
    r = await client.post("/api/v1/themes", json=payload)
    assert r.status_code == 201, r.text
    return r.json()


async def create_confirmed_demand(client, theme_id=None, **overrides) -> dict:
    """A demand point that has passed cross-validation and human review —
    the 环节四 entry condition (REQ-DEM-10/REQ-DEM-13)."""
    desired_review_status = overrides.pop("review_status", "confirmed")
    if theme_id is None:
        theme_id = (await create_theme(client))["id"]
    evidence_signal_ids = []
    independent_sources = [
        {
            "url": f"https://example.com/demand-evidence/{uuid.uuid4()}",
            "channel_code": "web",
            "publisher": "行业技术媒体（测试样本）",
            "title": "48V低压供电网络与智能配电",
            "tags": ["智能配电", "eFuse"],
        },
        {
            "url": f"https://mp.weixin.qq.com/s/demand-evidence-{uuid.uuid4()}",
            "channel_code": "wechat_mp",
            "publisher": "车载电源研究机构（测试样本）",
            "title": "车载48V电气架构应用进展",
            "tags": ["48V电气架构", "车载电源"],
        },
    ]
    for source in independent_sources:
        signal = await create_signal(
            client,
            url=source["url"],
            title=source["title"],
            publisher=source["publisher"],
            channel_code=source["channel_code"],
            body_text=SUPPLY_CHAIN_BODY,
            evidence_status_code="retained",
        )
        await set_signal_tags(client, signal["id"], source["tags"])
        linked = await assign_signal_theme(client, signal["id"], theme_id)
        evidence_signal_ids.append(linked["id"])
    derivation_trace = {
        "steps": [
            {
                "key": key,
                "content": f"测试推导步骤：{key}",
                "evidence_signal_ids": evidence_signal_ids,
            }
            for key in DEMAND_STEP_KEYS
        ]
    }
    payload = {
        "name": "低压系统智能化",
        "value_chain_stage_code": "creation_supply",
        "source_tech_theme_id": str(theme_id),
        "derivation_trace": derivation_trace,
        "cross_validation": {
            "conclusion": "通过",
            "perspectives": ["架构变化", "器件供给", "产业化发展"],
            "evidence_signal_ids": evidence_signal_ids,
        },
        "time_series": [{"time": "2026-03", "event": "48V+eFuse 量产标配"}],
    }
    if theme_id is not None:
        payload["source_tech_theme_id"] = str(theme_id)
    payload.update(overrides)
    r = await client.post("/api/v1/demands", json=payload)
    assert r.status_code == 201, r.text
    demand = r.json()
    if desired_review_status == "confirmed":
        r = await client.patch(
            f"/api/v1/demands/{demand['id']}",
            json={"review_status": "confirmed"},
        )
        assert r.status_code == 200, r.text
        demand = r.json()
    return demand


async def create_function(client, demand_id, name="全节点智能配电", **overrides) -> dict:
    payload = {
        "demand_point_id": str(demand_id),
        "name": name,
        "forward_trace": FORWARD_TRACE,
    }
    payload.update(overrides)
    r = await client.post("/api/v1/functions", json=payload)
    assert r.status_code == 201, r.text
    return r.json()


async def create_landing_point(
    client, function_id, name="智能保险丝（eFuse）", domain="硬件", role="执行层硬件"
) -> dict:
    r = await client.post(
        "/api/v1/landing-points",
        json={
            "vehicle_function_id": str(function_id),
            "name": name,
            "domain": domain,
            "role_description": role,
        },
    )
    assert r.status_code == 201, r.text
    return r.json()


async def put_standard(client, lp_id, phase, constraint_type, requirement_text) -> dict:
    r = await client.put(
        f"/api/v1/landing-points/{lp_id}/standards",
        json={
            "phase": phase,
            "constraint_type": constraint_type,
            "requirement_text": requirement_text,
        },
    )
    assert r.status_code == 200, r.text
    return r.json()


async def save_strategy_funnel(client, lp_id, assessment_values=None, *, rejected=False) -> dict:
    """Create a complete synthetic funnel draft for backend API tests."""
    values = {
        "score_business": 4,
        "score_maturity": 4,
        "score_moat": 3,
        "score_supply_chain": 4,
        "score_feasibility": 5,
        "classification": "产业投资/生态合作",
        "strategy_note": "测试策略备注",
    }
    if assessment_values:
        values.update(assessment_values)
    path = f"/api/v1/strategy/landing-points/{lp_id}/funnel"

    response = await client.patch(
        path,
        json={"scan_scope": "测试行业扫描范围", "scan_sources": ["测试来源一", "测试来源二"]},
    )
    assert response.status_code == 200, response.text
    decision = "reject" if rejected else "pass"
    response = await client.patch(
        path,
        json={
            "tier1_current_business_relation": "测试当前业务关系",
            "tier1_future_business_relation": "测试未来业务关系",
            "valuable_role": "测试有价值角色",
            "adaptation_decision": decision,
            "adaptation_reason": "测试适配判断依据" if not rejected else "测试退出理由",
        },
    )
    assert response.status_code == 200, response.text
    if rejected:
        return response.json()

    score_body = {}
    for dimension, field in (
        ("business", "score_business"),
        ("maturity", "score_maturity"),
        ("moat", "score_moat"),
        ("supply_chain", "score_supply_chain"),
        ("feasibility", "score_feasibility"),
    ):
        score_body[field] = values[field]
        score_body[f"rationale_{dimension}"] = f"测试{dimension}评分依据"
    response = await client.patch(path, json=score_body)
    assert response.status_code == 200, response.text
    response = await client.patch(
        path,
        json={
            "classification": values["classification"],
            "strategy_note": values["strategy_note"],
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


async def create_assessment(client, lp_id, **overrides) -> dict:
    payload = {
        "funnel_step": 4,
        "score_business": 4,
        "score_maturity": 4,
        "score_moat": 3,
        "score_supply_chain": 4,
        "score_feasibility": 5,
        "classification": "产业投资/生态合作",
        "strategy_note": "建议通过战略投资或生态合作锁定供给",
    }
    payload.update(overrides)
    await save_strategy_funnel(client, lp_id, payload)
    r = await client.post(f"/api/v1/strategy/landing-points/{lp_id}/assessments", json=payload)
    assert r.status_code == 201, r.text
    return r.json()


async def set_signal_tags(client, signal_id, tag_names) -> dict:
    r = await client.put(
        f"/api/v1/signals/{signal_id}/tags",
        json={"tag_names": tag_names},
    )
    assert r.status_code == 200, r.text
    return r.json()


async def assign_signal_theme(client, signal_id, theme_id) -> dict:
    r = await client.put(
        f"/api/v1/signals/{signal_id}/theme",
        json={
            "tech_theme_id": str(theme_id) if theme_id else None,
        },
    )
    assert r.status_code == 200, r.text
    return r.json()


async def publish_function(client, function_id) -> dict:
    """Record forward + reverse traces, then publish (REQ-MAP-05 gate)."""
    for kind, name in (("recommendation_level", "建议"), ("target_domain", "底盘")):
        r = await client.post("/api/v1/vocab", json={"kind": kind, "name": name})
        assert r.status_code in (201, 200), r.text
    r = await client.patch(
        f"/api/v1/functions/{function_id}",
        json={
            "forward_trace": FORWARD_TRACE,
            "reverse_trace": REVERSE_TRACE,
            "recommendation_level": "建议",
            "automation_levels": ["L2", "L4"],
            "target_domain": "底盘",
            "recommendation_reason": "基于已确认的需求推导",
            "l2_l4_difference": "L2 需要驾驶员确认；L4 由系统完成闭环",
            "published": True,
        },
    )
    assert r.status_code == 200, r.text
    return r.json()


async def build_chain(client) -> dict:
    """Full acceptance chain built purely through the API:
    signal → theme → confirmed demand → published function → landing point
    (+2 standards + assessment) — used by trace/panorama/overview tests."""
    theme = await create_theme(client)
    signal = await create_signal(client, excerpt=SUPPLY_CHAIN_BODY)
    await set_signal_tags(client, signal["id"], ["智能配电", "区域控制", "eFuse"])
    await assign_signal_theme(client, signal["id"], theme["id"])

    demand = await create_confirmed_demand(client, theme_id=theme["id"])
    function = await create_function(client, demand["id"])
    await publish_function(client, function["id"])

    lp = await create_landing_point(client, function["id"])
    await put_standard(client, lp["id"], "设计", "工程化", "满足AEC-Q100标准，支持过流/过压/过热保护")
    await put_standard(client, lp["id"], "制造", "工程化", "完成保护功能验证")
    assessment = await create_assessment(client, lp["id"])

    return {
        "theme": theme,
        "signal": signal,
        "demand": demand,
        "function": function,
        "landing_point": lp,
        "assessment": assessment,
    }
