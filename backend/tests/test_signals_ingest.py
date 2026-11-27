"""Signal ingestion: create flows, closed-vocabulary enforcement, machine
initial judgment and pre-tagging (REQ-SIG-01/02/03, REQ-SIG-09/10/11,
REQ-TAG-01/02/03/04/05, sig-local-collect-submit, CONV-CLOSED-VOCAB)."""

import pytest

from app.platform.objectstore import load_body
from tests.support import DEFAULT_SIGNAL, SUPPLY_CHAIN_BODY, create_signal

pytestmark = pytest.mark.anyio


async def _count_signals(client) -> int:
    return len((await client.get("/api/v1/signals")).json())


async def test_duplicate_url_gets_suffix_title(client):
    """Same canonical URL may be retained twice; second row gets a numbered suffix."""
    body = {
        "title": "第一次采集",
        "url": "https://example.com/same-source",
        "channel_code": "web",
        "body_text": SUPPLY_CHAIN_BODY,
        "value_chain_stage_code": "creation_supply",
        "evidence_status_code": "retained",
    }
    first = await client.post("/api/v1/signals", json=body)
    assert first.status_code == 201, first.text
    assert first.json()["url_duplicate_renamed"] is False
    second = await client.post("/api/v1/signals", json={**body, "title": "第二次采集"})
    assert second.status_code == 201, second.text
    payload = second.json()
    assert payload["url_duplicate_renamed"] is True
    assert payload["title"].endswith(" (重复采集 #2)")
    assert "第二次采集" in payload["title"]


async def test_create_signal_records_channel_and_metadata(client):
    """REQ-SIG-02 / sig-local-collect-submit: the submitted channel is
    recorded — 网页 and 微信公众号 are the two named channels."""
    web = await create_signal(client, channel_code="web")
    wechat = await create_signal(
        client,
        url="https://mp.weixin.qq.com/s/efuse-48v-era",
        channel_code="微信公众号",  # label form normalizes to the code
        publisher="微信公众平台",
    )
    assert web["channel_code"] == "web"
    assert wechat["channel_code"] == "wechat_mp"


async def test_create_signal_label_forms_normalize_to_codes(client):
    """CONV-CLOSED-VOCAB: labels and fixture aliases are accepted on input
    and normalized to canonical codes."""
    sig = await create_signal(
        client,
        value_chain_stage_code="供应链（创造端）",  # fixture alias
        signal_type_code="技术",  # label
        evolution_node_code="定点/验证",  # label
        evidence_status_code="已留存",  # label
        body_text="Label normalisation evidence",
    )
    assert sig["value_chain_stage_code"] == "creation_supply"
    assert sig["signal_type_code"] == "technology"
    assert sig["evolution_node_code"] == "nomination_validation"
    assert sig["evidence_status_code"] == "retained"


async def test_patch_body_keeps_old_version_and_audit(client):
    sig = await create_signal(client, body_text="旧正文")
    old_sha = sig["body_sha256"]
    patched = await client.patch(
        f"/api/v1/signals/{sig['id']}",
        json={"body_text": "新正文"},
    )
    assert patched.status_code == 200, patched.text
    new_sha = patched.json()["body_sha256"]
    assert new_sha != old_sha

    audit = (await client.get("/api/v1/audit", params={"entity_id": sig["id"]})).json()
    row = next(r for r in audit if r["field_name"] == "body_text")
    assert row["old_value"]["sha256"] == old_sha
    assert row["new_value"]["sha256"] == new_sha
    assert row["old_value"]["object_key"] != row["new_value"]["object_key"]
    assert load_body(row["old_value"]["object_key"]) == "旧正文"


async def test_unknown_channel_is_rejected_and_creates_nothing(client):
    """CONV-CLOSED-VOCAB: no third channel value exists and none can be created."""
    before = await _count_signals(client)
    r = await client.post(
        "/api/v1/signals",
        json={"title": "t", "url": "https://a.com/1", "channel_code": "carrier-pigeon"},
    )
    assert r.status_code == 422
    assert "channel" in r.text
    assert await _count_signals(client) == before


async def test_unknown_evolution_node_is_rejected(client):
    """REQ-SIG-09: the API must not accept or create any other node value."""
    r = await client.post(
        "/api/v1/signals",
        json={"title": "t", "url": "https://a.com/2", "channel_code": "web",
              "evolution_node_code": "量产"},
    )
    assert r.status_code == 422
    assert await _count_signals(client) == 0


async def test_unknown_value_chain_stage_is_rejected(client):
    r = await client.post(
        "/api/v1/signals",
        json={"title": "t", "url": "https://a.com/3", "channel_code": "web",
              "value_chain_stage_code": "自由端"},
    )
    assert r.status_code == 422
    assert await _count_signals(client) == 0


async def test_unknown_signal_type_is_rejected(client):
    """REQ-TAG-02: no value outside the five types is accepted."""
    r = await client.post(
        "/api/v1/signals",
        json={"title": "t", "url": "https://a.com/4", "channel_code": "web",
              "signal_type_code": "其他"},
    )
    assert r.status_code == 422
    assert await _count_signals(client) == 0


async def test_unknown_evidence_status_is_rejected(client):
    """REQ-SIG-10 / REQ-SIG-11: no sixth evidence-status value exists."""
    r = await client.post(
        "/api/v1/signals",
        json={"title": "t", "url": "https://a.com/5", "channel_code": "web",
              "evidence_status_code": "已粘贴"},
    )
    assert r.status_code == 422
    assert await _count_signals(client) == 0


async def test_default_evidence_status_is_fetching(client):
    sig = await create_signal(client)  # no body, no explicit status
    assert sig["evidence_status_code"] == "fetching"


async def test_one_click_fetch_and_archive_completes_in_one_operation(client):
    """REQ-SIG-01 / sig-local-collect-submit: one POST with URL + channel +
    metadata + body snapshot completes ingestion and archive — the signal ends
    已留存 with the snapshot stored."""
    sig = await create_signal(client, body_text=SUPPLY_CHAIN_BODY)
    assert sig["evidence_status_code"] == "retained"
    assert sig["body_object_key"] is not None
    assert sig["captured_at"] is not None
    # retrievable afterwards (§8 阶段A)
    r = await client.get(f"/api/v1/signals/{sig['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == sig["id"]


async def test_explicit_evidence_status_is_not_overridden(client):
    sig = await create_signal(client, body_text=SUPPLY_CHAIN_BODY,
                              evidence_status_code="待人工复核")
    assert sig["evidence_status_code"] == "pending_review"


async def test_retained_requires_body_text_on_create(client):
    bodyless = await client.post(
        "/api/v1/signals",
        json={**DEFAULT_SIGNAL, "evidence_status_code": "retained"},
    )
    assert bodyless.status_code == 422
    assert "require stored body text" in bodyless.json()["detail"]
    sig = await create_signal(client, body_text=SUPPLY_CHAIN_BODY, evidence_status_code="retained")
    assert sig["evidence_status_code"] == "retained"


async def test_signal_exposes_all_req_sig_03_fields(client):
    """REQ-SIG-03: title, link, channel, publisher, publish time, stage,
    type, tags, evolution node, evidence status."""
    sig = await create_signal(client, body_text=SUPPLY_CHAIN_BODY)
    for field in (
        "title",
        "url",
        "channel_code",
        "publisher",
        "published_at",
        "value_chain_stage_code",
        "signal_type_code",
        "evolution_node_code",
        "evidence_status_code",
        "tags",
    ):
        assert field in sig, f"missing {field}"
    assert sig["title"] == "48V低压供电网络研究"
    assert sig["publisher"] == "与非网"
    assert isinstance(sig["tags"], list)


async def test_stage_auto_judged_from_title_and_snapshot(client):
    """REQ-TAG-04: the platform auto-initial-judges the value chain stage
    from the article title and the evidence snapshot (48V supply chain +
    supplier names → 创造端（供应链）)."""
    sig = await create_signal(client, body_text=SUPPLY_CHAIN_BODY)
    assert sig["value_chain_stage_code"] == "creation_supply"


async def test_stage_stays_null_when_no_rule_matches(client):
    sig = await create_signal(
        client,
        title="完全无关的短讯",
        body_text="一段与价值链环节无关的普通叙述文字。",
    )
    assert sig["value_chain_stage_code"] is None


async def test_explicit_stage_beats_auto_judgment(client):
    sig = await create_signal(
        client, body_text=SUPPLY_CHAIN_BODY, value_chain_stage_code="delivery_oem"
    )
    assert sig["value_chain_stage_code"] == "delivery_oem"


async def test_machine_pre_tags_generated_from_snapshot(client):
    """REQ-TAG-05: a high-frequency summary over the snapshot's keywords
    generates tech direction tags; the count is not fixed."""
    sig = await create_signal(client, body_text=SUPPLY_CHAIN_BODY)
    assert len(sig["tags"]) >= 1
    assert len(sig["tags"]) <= 6  # adjusts to content richness, capped by the summarizer
    # tags are content-derived: every tag occurs in the title/body text
    haystack = sig["title"] + SUPPLY_CHAIN_BODY
    assert all(tag in haystack for tag in sig["tags"])


async def test_no_body_yields_no_machine_tags(client):
    sig = await create_signal(client)
    assert sig["tags"] == []


async def test_url_normalized_is_stored(client):
    """SCHEMA-SIGNAL-SNAPSHOT: url_normalized is stored (NOT NULL, indexed)."""
    a = await create_signal(client, url="https://Example.com/path/")
    b = await create_signal(client, url="https://example.com/path")
    assert a["url_normalized"] == b["url_normalized"]
    assert a["url_normalized"].endswith("/path")


async def test_correction_restricted_to_existing_categories(client):
    """REQ-TAG-03: the correction API accepts only codes already present in
    the closed vocabularies."""
    sig = await create_signal(client)
    r = await client.patch(
        f"/api/v1/signals/{sig['id']}",
        json={"value_chain_stage_code": "自创环节"},
    )
    assert r.status_code == 422
    # a valid label-form correction is accepted and normalized
    r = await client.patch(
        f"/api/v1/signals/{sig['id']}",
        json={"value_chain_stage_code": "传递端（主机厂）"},
    )
    assert r.status_code == 200
    assert r.json()["value_chain_stage_code"] == "delivery_oem"


async def test_signal_records_classification_basis(client):
    sig = await create_signal(client, body_text=SUPPLY_CHAIN_BODY)
    basis = sig["classification_basis"]
    assert isinstance(basis, dict)
    assert basis["baseline_mode"] is True
    assert set(basis["sources"]) == {"value_chain_stage", "signal_type", "tech_tags"}
    assert isinstance(basis["tag_candidates"], list)



async def test_business_skill_rules_override_fallbacks_and_record_basis(
    client, tmp_path, monkeypatch
):
    import json

    pack = {
        "schema_version": 1,
        "name": "signal-rule-test",
        "version": "1.0",
        "rules": [
            {
                "id": "stage-high",
                "field": "value_chain_stage",
                "match": {"any": ["eFuse"]},
                "value": "creation_supply",
                "priority": 10,
            },
            {
                "id": "stage-low",
                "field": "value_chain_stage",
                "match": {"any": ["eFuse"]},
                "value": "delivery_oem",
                "priority": 1,
            },
            {
                "id": "type",
                "field": "signal_type",
                "match": {"any": ["eFuse"]},
                "value": "technology",
                "priority": 5,
            },
            {
                "id": "tags",
                "field": "tech_tags",
                "match": {"any": ["eFuse"]},
                "add": ["eFuse", "智能配电"],
                "priority": 5,
            },
        ],
    }
    (tmp_path / "pack.json").write_text(json.dumps(pack, ensure_ascii=False), encoding="utf-8")
    from app.services.skills import load_skill_registry

    registry = load_skill_registry(tmp_path)
    monkeypatch.setattr("app.services.skills.load_skill_registry", lambda root=None: registry)

    sig = await create_signal(
        client,
        title="eFuse 智能配电方案",
        url="https://example.com/skill-rule",
        body_text="器件厂商发布 eFuse 与智能配电控制器",
        signal_type_code=None,
    )
    assert sig["value_chain_stage_code"] == "creation_supply"
    assert sig["signal_type_code"] == "technology"
    assert "eFuse" in sig["tags"]
    basis = sig["classification_basis"]
    assert basis["sources"]["value_chain_stage"] == "skill"
    assert basis["sources"]["signal_type"] == "skill"
    assert basis["conflicts"]
