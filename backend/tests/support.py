"""Async factory helpers for the interface tests.

Every helper creates a resource through the public REST API (the interface
under test) and fails loudly on an unexpected status, so a broken create flow
surfaces as an assertion error with the response body instead of a cascade of
confusing downstream failures.
"""

import hashlib

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
        "拆解核心诉求：低压配电节点级感知与软件定义通断",
        "识别缺口：传统保险丝与机械继电器无法节点级控制",
        "定位关键流：低压配电网络",
        "推导系统行为：监测、控制、保护、诊断、恢复闭环",
        "收敛为功能：全节点智能配电",
    ]
}

REVERSE_TRACE = {
    "necessity": "无此功能则节点级状态感知、软件定义通断、快速故障隔离与自动恢复不能完整实现",
    "coverage": "仅远程开关、仅电流采集或仅电子熔断均不足以承接该需求",
}


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
    payload = {
        "name": "低压系统智能化",
        "value_chain_stage_code": "creation_supply",
        "cross_validation": {
            "conclusion": "通过",
            "perspectives": ["架构变化", "器件供给", "产业化发展"],
        },
        "time_series": [{"time": "2026-03", "event": "48V+eFuse 量产标配"}],
        "review_status": "confirmed",
    }
    if theme_id is not None:
        payload["source_tech_theme_id"] = str(theme_id)
    payload.update(overrides)
    r = await client.post("/api/v1/demands", json=payload)
    assert r.status_code == 201, r.text
    return r.json()


async def create_function(client, demand_id, name="全节点智能配电", **overrides) -> dict:
    payload = {"demand_point_id": str(demand_id), "name": name}
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
        "operator_subject": "test-admin",
    }
    payload.update(overrides)
    r = await client.post(f"/api/v1/strategy/landing-points/{lp_id}/assessments", json=payload)
    assert r.status_code == 201, r.text
    return r.json()


async def set_signal_tags(client, signal_id, tag_names, operator="test-admin") -> dict:
    r = await client.put(
        f"/api/v1/signals/{signal_id}/tags",
        json={"tag_names": tag_names, "operator_subject": operator},
    )
    assert r.status_code == 200, r.text
    return r.json()


async def assign_signal_theme(client, signal_id, theme_id, operator="test-admin") -> dict:
    r = await client.put(
        f"/api/v1/signals/{signal_id}/theme",
        json={
            "tech_theme_id": str(theme_id) if theme_id else None,
            "operator_subject": operator,
        },
    )
    assert r.status_code == 200, r.text
    return r.json()


async def publish_function(client, function_id) -> dict:
    """Record forward + reverse traces, then publish (REQ-MAP-05 gate)."""
    r = await client.patch(
        f"/api/v1/functions/{function_id}",
        json={"forward_trace": FORWARD_TRACE, "reverse_trace": REVERSE_TRACE},
    )
    assert r.status_code == 200, r.text
    r = await client.patch(f"/api/v1/functions/{function_id}", json={"published": True})
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
