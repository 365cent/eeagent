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


async def test_registry_is_the_five_closed_domains(client):
    r = await client.get("/api/v1/ref-codes")
    assert r.status_code == 200
    body = r.json()
    by_domain: dict[str, dict[str, dict]] = {}
    for row in body:
        by_domain.setdefault(row["domain"], {})[row["code"]] = row
    assert set(by_domain) == set(EXPECTED)
    for domain, expected in EXPECTED.items():
        got = by_domain[domain]
        assert set(got) == set(expected), f"{domain}: {sorted(got)}"
        for code, (label, alias) in expected.items():
            assert got[code]["label"] == label
            assert got[code]["fixture_alias"] == alias
    stages = by_domain["value_chain_stage"]
    assert len(stages) == 4
    assert stages["creation_supply"]["fixture_alias"] == "供应链（创造端）"
    assert all(code != "供应链（创造端）" for code in stages)


async def test_domain_filter(client):
    r = await client.get("/api/v1/ref-codes", params={"domain": "channel"})
    assert r.status_code == 200
    body = r.json()
    assert {row["code"] for row in body} == {"web", "wechat_mp"}
    assert all(row["domain"] == "channel" for row in body)