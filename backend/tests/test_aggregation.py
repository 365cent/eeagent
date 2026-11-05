"""Upward aggregation into tech themes: automatic tag-based aggregation and
the audited manual assign / remove / re-select actions (REQ-SIG-08,
signal-theme-cardinality, SCHEMA-SIGNAL-THEME-SINGLE)."""

import pytest

from tests.support import (
    SUPPLY_CHAIN_BODY,
    assign_signal_theme,
    create_signal,
    create_theme,
    set_signal_tags,
)

pytestmark = pytest.mark.anyio


async def _theme_with_tags(client, working_name, tags):
    """A theme whose display tags come from one member signal's tags."""
    theme = await create_theme(client, working_name=working_name)
    sig = await create_signal(client, url=f"https://example.com/{working_name}")
    await set_signal_tags(client, sig["id"], tags)
    await assign_signal_theme(client, sig["id"], theme["id"])
    return theme


async def test_fetch_auto_aggregates_by_tag_overlap(client):
    """REQ-SIG-08 (图2-1-1 header): after fetch the platform auto-aggregates
    upward by chain and tags — a second signal sharing ≥2 tags lands on the
    theme with no manual call."""
    theme = await _theme_with_tags(client, "主题甲", ["智能配电", "区域控制", "eFuse"])

    # body whose machine tags (智能/区域/控制/配电/低压/eFuse) overlap the
    # theme's compound display tags by containment — jieba splits compounds
    body = "智能配电与区域控制是低压系统的核心，智能配电架构在区域控制器上实现，智能配电、区域控制、eFuse 器件被广泛讨论。"
    second = await create_signal(
        client,
        title="汽车低压智能化",
        url="https://example.com/second",
        body_text=body,
    )
    assert second["tech_theme_id"] == theme["id"]
    assert second["theme"]["working_name"] == "主题甲"


async def test_auto_aggregate_endpoint_assigns_unique_match(client):
    """REQ-SIG-08 (图2-1-2 action 自动归集): re-run tag matching on demand."""
    theme_a = await _theme_with_tags(client, "主题甲", ["alpha", "beta"])
    theme_b = await _theme_with_tags(client, "主题乙", ["gamma", "delta"])
    sig = await create_signal(client, url="https://example.com/s3")
    await set_signal_tags(client, sig["id"], ["alpha", "beta", "epsilon"])

    r = await client.post(f"/api/v1/signals/{sig['id']}/auto-aggregate")
    assert r.status_code == 200
    assert r.json()["tech_theme_id"] == theme_a["id"]


async def test_auto_aggregate_conflict_returns_409_with_reason(client):
    """REQ-SIG-08: no unique match (two themes tie) → 409 with a reason;
    manual assignment stays available as the override."""
    theme_a = await _theme_with_tags(client, "主题甲", ["alpha", "beta"])
    theme_b = await _theme_with_tags(client, "主题乙", ["gamma", "delta"])
    sig = await create_signal(client, url="https://example.com/s4")
    await set_signal_tags(client, sig["id"], ["alpha", "beta", "gamma", "delta"])

    r = await client.post(f"/api/v1/signals/{sig['id']}/auto-aggregate")
    assert r.status_code == 409
    assert "无法自动归集" in r.json()["detail"]
    assert sig["tech_theme_id"] is None  # nothing was assigned


async def test_auto_aggregate_without_tags_returns_409(client):
    sig = await create_signal(client, url="https://example.com/s5")
    r = await client.post(f"/api/v1/signals/{sig['id']}/auto-aggregate")
    assert r.status_code == 409


async def test_auto_aggregate_below_overlap_threshold_returns_409(client):
    theme_a = await _theme_with_tags(client, "主题甲", ["alpha", "beta"])
    sig = await create_signal(client, url="https://example.com/s6")
    await set_signal_tags(client, sig["id"], ["alpha", "zeta"])  # only 1 overlap
    r = await client.post(f"/api/v1/signals/{sig['id']}/auto-aggregate")
    assert r.status_code == 409


async def test_signal_belongs_to_at_most_one_theme(client):
    """signal-theme-cardinality / SCHEMA-SIGNAL-THEME-SINGLE: assignment is
    single-valued — re-aggregating replaces, never accumulates."""
    theme_a = await _theme_with_tags(client, "主题甲", ["alpha", "beta"])
    theme_b = await _theme_with_tags(client, "主题乙", ["gamma", "delta"])
    sig = await create_signal(client, url="https://example.com/s7")

    await assign_signal_theme(client, sig["id"], theme_a["id"])
    detail = (await client.get(f"/api/v1/signals/{sig['id']}")).json()
    assert detail["tech_theme_id"] == theme_a["id"]

    # re-aggregate into another theme replaces the previous assignment
    await assign_signal_theme(client, sig["id"], theme_b["id"])
    detail = (await client.get(f"/api/v1/signals/{sig['id']}")).json()
    assert detail["tech_theme_id"] == theme_b["id"]
    assert detail["theme"]["id"] == theme_b["id"]


async def test_signal_can_be_removed_from_theme_and_reassigned(client):
    """REQ-SIG-08 (图2-1-2 action 移出): removal then re-aggregation."""
    theme_a = await _theme_with_tags(client, "主题甲", ["alpha", "beta"])
    sig = await create_signal(client, url="https://example.com/s8")
    await assign_signal_theme(client, sig["id"], theme_a["id"])

    removed = await assign_signal_theme(client, sig["id"], None)  # 移出
    assert removed["tech_theme_id"] is None
    assert removed["theme"] is None

    reassigned = await assign_signal_theme(client, sig["id"], theme_a["id"])
    assert reassigned["tech_theme_id"] == theme_a["id"]


async def test_assign_unknown_theme_returns_404(client):
    sig = await create_signal(client)
    r = await client.put(
        f"/api/v1/signals/{sig['id']}/theme",
        json={"tech_theme_id": "00000000-0000-0000-0000-0000000000ff"},
    )
    assert r.status_code == 404


async def test_manual_assignment_overrides_auto_aggregation(client):
    """REQ-SIG-08: 自动归集 is the initial pass; the manual PUT /theme stays
    the audited override path (audit covered in test_audit.py)."""
    theme_a = await _theme_with_tags(client, "主题甲", ["alpha", "beta"])
    theme_b = await create_theme(client, working_name="主题乙")
    sig = await create_signal(client, url="https://example.com/s9")
    await set_signal_tags(client, sig["id"], ["alpha", "beta"])
    r = await client.post(f"/api/v1/signals/{sig['id']}/auto-aggregate")
    assert r.json()["tech_theme_id"] == theme_a["id"]

    overridden = await assign_signal_theme(client, sig["id"], theme_b["id"])
    assert overridden["tech_theme_id"] == theme_b["id"]
