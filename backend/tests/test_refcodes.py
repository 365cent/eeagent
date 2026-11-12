"""Closed reference-code registry (ref-code-registry, CONV-CLOSED-VOCAB,
REQ-SIG-09, REQ-SIG-10, REQ-TAG-01, REQ-TAG-02, SCHEMA-REFCODE).

All closed enumerations are served from one eea_ref_code registry keyed by
(domain, code) → label with an optional fixture_alias; the wordings and value
counts are fixed by the plan.
"""

import pytest

pytestmark = pytest.mark.anyio

EXPECTED = {
    "value_chain_stage": {
        "creation_supply": ("创造端（供应链）", "供应链（创造端）"),
        "delivery_oem": ("传递端（主机厂）", None),
        "realization_consumer": ("兑现端（消费者）", None),
        "regulation_standard": ("规制端（行业标准/规定）", "规则端（行业标准/规定）"),
    },
    "signal_type": {
        "strategy": ("战略", None),
        "technology": ("技术", None),
        "talent": ("人才", None),
        "capital": ("资本", None),
        "standard": ("标准", None),
    },
    "evolution_node": {
        "release": ("发布", None),
        "nomination_validation": ("定点/验证", None),
    },
    "evidence_status": {
        "fetching": ("抓取中", None),
        "fetch_failed": ("抓取失败", None),
        "retained": ("已留存", None),
        "pending_review": ("待人工复核", None),
        "archived": ("已归档/停用", None),
    },
    "channel": {
        "web": ("网页", None),
        "wechat_mp": ("微信公众号", None),
    },
}


async def _registry(client):
    r = await client.get("/api/v1/ref-codes")
    assert r.status_code == 200
    return r.json()


async def test_registry_domains_are_exactly_the_five_closed_domains(client):
    body = await _registry(client)
    domains = {row["domain"] for row in body}
    assert domains == set(EXPECTED)


async def test_registry_value_counts_and_wordings(client):
    body = await _registry(client)
    by_domain: dict[str, dict[str, dict]] = {}
    for row in body:
        by_domain.setdefault(row["domain"], {})[row["code"]] = row
    for domain, expected in EXPECTED.items():
        got = by_domain[domain]
        assert set(got) == set(expected), f"{domain}: {sorted(got)}"
        for code, (label, alias) in expected.items():
            assert got[code]["label"] == label
            assert got[code]["fixture_alias"] == alias


async def test_evolution_node_is_exactly_two_values(client):
    """REQ-SIG-09: closed vocabulary of exactly 发布 and 定点/验证."""
    body = await _registry(client)
    nodes = [r for r in body if r["domain"] == "evolution_node"]
    assert sorted(r["label"] for r in nodes) == ["发布", "定点/验证"]


async def test_evidence_status_is_exactly_five_values(client):
    """REQ-SIG-10: closed workflow vocabulary of exactly five values."""
    body = await _registry(client)
    statuses = [r for r in body if r["domain"] == "evidence_status"]
    assert {r["label"] for r in statuses} == {
        "抓取中",
        "抓取失败",
        "已留存",
        "待人工复核",
        "已归档/停用",
    }


async def test_stage_harness_alias_is_fixture_alias_only(client):
    """REQ-TAG-01: 供应链（创造端） is a display/import mapping on the
    canonical stage, never a separate entry."""
    body = await _registry(client)
    stages = [r for r in body if r["domain"] == "value_chain_stage"]
    assert len(stages) == 4
    creation = next(r for r in stages if r["code"] == "creation_supply")
    assert creation["fixture_alias"] == "供应链（创造端）"
    assert all(r["code"] != "供应链（创造端）" for r in stages)


async def test_domain_filter(client):
    r = await client.get("/api/v1/ref-codes", params={"domain": "channel"})
    assert r.status_code == 200
    body = r.json()
    assert {row["code"] for row in body} == {"web", "wechat_mp"}
    assert all(row["domain"] == "channel" for row in body)
