"""Tech direction tags: dynamic creation, global reuse, dedupe, and the
frequency listing (REQ-TAG-05/06, tag-list-with-frequency, REQ-RULE-01,
REQ-RULE-05, SCHEMA-VOCAB, SCHEMA-SIGNAL-TAG, vocab-registry)."""

import pytest

from tests.support import create_signal, set_signal_tags

pytestmark = pytest.mark.anyio


async def test_new_tag_enters_global_vocabulary_for_reuse(client):
    """REQ-TAG-06 / REQ-RULE-05: a newly created tag is immediately selectable
    when tagging another signal."""
    a = await create_signal(client)
    b = await create_signal(client, url="https://b.com/x")
    await set_signal_tags(client, a["id"], ["全新自定义标签"])

    vocab = (await client.get("/api/v1/vocab", params={"kind": "tech_tag"})).json()
    assert any(v["name"] == "全新自定义标签" for v in vocab)

    # reuse on another signal without re-creating
    await set_signal_tags(client, b["id"], ["全新自定义标签"])
    vocab = (await client.get("/api/v1/vocab", params={"kind": "tech_tag"})).json()
    assert sum(1 for v in vocab if v["name"] == "全新自定义标签") == 1


async def test_duplicate_tag_assignment_dedupes(client):
    """SCHEMA-SIGNAL-TAG: duplicate (signal, tag) pairs are impossible."""
    sig = await create_signal(client)
    detail = await set_signal_tags(client, sig["id"], ["智能配电", "智能配电", " 智能配电 "])
    assert detail["tags"] == ["智能配电"]
    # still exactly one row via the usage listing
    usage = (await client.get("/api/v1/vocab/usage")).json()
    row = next(u for u in usage if u["name"] == "智能配电")
    assert row["frequency"] == 1


async def test_vocab_create_is_idempotent_on_kind_name(client):
    """SCHEMA-VOCAB: creation is idempotent on (kind, name)."""
    r1 = await client.post("/api/v1/vocab", json={"kind": "tech_tag", "name": "重复标签"})
    r2 = await client.post("/api/v1/vocab", json={"kind": "tech_tag", "name": "重复标签"})
    assert r1.status_code == 201 and r2.status_code == 201
    assert r1.json()["id"] == r2.json()["id"]
    vocab = (await client.get("/api/v1/vocab", params={"kind": "tech_tag"})).json()
    assert sum(1 for v in vocab if v["name"] == "重复标签") == 1


async def test_vocab_kind_is_restricted_to_tech_tag_and_domain(client):
    r = await client.post("/api/v1/vocab", json={"kind": "mood", "name": "开心"})
    assert r.status_code == 422


async def test_vocab_usage_lists_all_tags_with_frequency(client):
    """tag-list-with-frequency (图2-3): all tech direction tags with their
    frequency counts (频次)."""
    a = await create_signal(client)
    b = await create_signal(client, url="https://b.com/y")
    await set_signal_tags(client, a["id"], ["共享标签", "独有标签"])
    await set_signal_tags(client, b["id"], ["共享标签"])

    usage = (await client.get("/api/v1/vocab/usage")).json()
    freq = {u["name"]: u["frequency"] for u in usage}
    assert freq["共享标签"] == 2
    assert freq["独有标签"] == 1
    # zero-frequency tags still appear (全部技术方向标签)
    await client.post("/api/v1/vocab", json={"kind": "tech_tag", "name": "未使用标签"})
    usage = (await client.get("/api/v1/vocab/usage")).json()
    assert any(u["name"] == "未使用标签" and u["frequency"] == 0 for u in usage)


async def test_tag_assignment_is_a_set_not_a_multiset(client):
    """SCHEMA-SIGNAL-TAG: the junction carries no extra attributes and
    assignment is set-valued."""
    sig = await create_signal(client)
    await set_signal_tags(client, sig["id"], ["甲", "乙"])
    detail = await set_signal_tags(client, sig["id"], ["乙", "甲"])  # order swap
    assert sorted(detail["tags"]) == ["乙", "甲"]
    usage = (await client.get("/api/v1/vocab/usage")).json()
    assert {u["name"]: u["frequency"] for u in usage}["甲"] == 1


async def test_tag_suggestions_from_signal_text(client):
    """REQ-TAG-05: the suggestion endpoint summarizes the signal's text."""
    from tests.support import SUPPLY_CHAIN_BODY

    sig = await create_signal(client, excerpt=SUPPLY_CHAIN_BODY)
    r = await client.get(f"/api/v1/signals/{sig['id']}/tag-suggestions")
    assert r.status_code == 200
    body = r.json()
    assert body["source"] in ("jieba-frequency", "embedding-rerank")
    assert len(body["suggested_tags"]) >= 1
    if body["source"] == "embedding-rerank":
        assert body.get("rerank_score") is not None


async def test_tag_suggestions_omit_corrected_fields(client):
    from tests.support import SUPPLY_CHAIN_BODY, set_signal_tags

    sig = await create_signal(client, title="eFuse 研究", url="https://example.com/b", body_text=SUPPLY_CHAIN_BODY)
    await client.patch(
        f"/api/v1/signals/{sig['id']}",
        json={"value_chain_stage_code": "delivery_oem", "signal_type_code": "technology"},
    )
    body = (await client.get(f"/api/v1/signals/{sig['id']}/tag-suggestions")).json()
    assert "value_chain_stage_code" in body["protected_fields"]
    assert body["value_chain_stage_code"] is None
    await set_signal_tags(client, sig["id"], ["eFuse"])
    body = (await client.get(f"/api/v1/signals/{sig['id']}/tag-suggestions")).json()
    assert "tech_tags" in body["protected_fields"]
    assert body["suggested_tags"] == []
