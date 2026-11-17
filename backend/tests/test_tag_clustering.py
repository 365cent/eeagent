"""Live tag clustering proposals (sklearn cosine / average linkage)."""

import uuid
from datetime import datetime, timezone

import pytest

from app.services.tag_clustering import TagSignal, cluster_tag_signals
from tests.support import assign_signal_theme, create_signal, create_theme, set_signal_tags


def _record(tags: list[str], host: str, *, stage: str | None = "creation_supply") -> TagSignal:
    return TagSignal(
        id=uuid.uuid4(),
        title=f"低压智能配电与区域控制的多源证据{host}",
        tags=tuple(tags),
        stage=stage,
        updated_at=datetime(2026, 11, 1, tzinfo=timezone.utc),
        source_host=host,
        url_key=f"https://{host}/article",
    )


@pytest.mark.no_db
def test_cosine_clusters_separate_tag_families():
    power_a = _record(["智能配电", "eFuse", "区域控制"], "a.example")
    power_b = _record(["智能配电", "eFuse", "低压网络"], "b.example")
    talent_a = _record(["人才招聘", "组织架构"], "c.example", stage="delivery_oem")
    talent_b = _record(["人才招聘", "组织架构", "团队"], "d.example", stage="delivery_oem")

    report = cluster_tag_signals([power_a, power_b, talent_a, talent_b])

    assert report.method == "sklearn.cluster.AgglomerativeClustering"
    assert report.metric == "cosine"
    assert report.sample_size == 4
    assert report.silhouette is not None
    assert {item.tag for item in report.tag_distribution} >= {"智能配电", "人才招聘"}

    groups = [set(member.signal_id for member in cluster.members) for cluster in report.clusters]
    assert {power_a.id, power_b.id} in groups
    assert {talent_a.id, talent_b.id} in groups
    power = next(cluster for cluster in report.clusters if power_a.id in {m.signal_id for m in cluster.members})
    assert power.cohesion >= 0.5
    assert "智能配电" in power.shared_tags
    assert power.source_count == 2
    lift = {item.tag: item.lift for item in power.tag_distribution}
    assert lift["智能配电"] > 1

    neighbors = report.neighbors[str(power_a.id)]
    assert neighbors[0].signal_id == power_b.id
    assert neighbors[0].similarity > 0.5
    assert "智能配电" in neighbors[0].shared_tags


@pytest.mark.no_db
def test_distinct_singleton_stays_its_own_proposal():
    power_a = _record(["智能配电", "eFuse", "区域控制"], "a.example")
    power_b = _record(["智能配电", "eFuse", "低压网络"], "b.example")
    lone = _record(["架构", "智能", "蔚来"], "nio.example", stage="creation_supply")

    report = cluster_tag_signals([power_a, power_b, lone])

    assert len(report.clusters) == 2
    solo = next(cluster for cluster in report.clusters if lone.id in {m.signal_id for m in cluster.members})
    assert solo.signal_count == 1
    assert solo.source_count == 1
    assert "架构" in solo.shared_tags
    power = next(cluster for cluster in report.clusters if power_a.id in {m.signal_id for m in cluster.members})
    assert power.signal_count == 2
    assert lone.id not in {m.signal_id for m in power.members}


@pytest.mark.no_db
def test_single_source_pair_is_not_a_topic():
    left = _record(["智能配电", "eFuse"], "same.example")
    right = _record(["智能配电", "eFuse", "区域控制"], "same.example")
    report = cluster_tag_signals([left, right])
    assert report.clusters == []
    assert report.neighbors[str(left.id)][0].signal_id == right.id


@pytest.mark.anyio
async def test_cluster_report_uses_live_unassigned_tags(client):
    power_a = await create_signal(
        client,
        title="区域控制器与智能配电器件的量产进展",
        url="https://power-a.example/article",
        evidence_status_code="retained",
    )
    power_b = await create_signal(
        client,
        title="eFuse在低压配电网络中的保护策略",
        url="https://power-b.example/article",
        evidence_status_code="retained",
    )
    assigned = await create_signal(
        client,
        title="已归集的智能配电证据不应再进入候选",
        url="https://power-c.example/article",
        evidence_status_code="retained",
    )
    other = await create_signal(
        client,
        title="车载软件团队组织与人才招聘观察",
        url="https://talent.example/article",
        evidence_status_code="retained",
    )
    await set_signal_tags(client, power_a["id"], ["智能配电", "eFuse", "区域控制"])
    await set_signal_tags(client, power_b["id"], ["智能配电", "eFuse", "低压网络"])
    await set_signal_tags(client, assigned["id"], ["智能配电", "eFuse", "区域控制"])
    await set_signal_tags(client, other["id"], ["人才招聘", "组织架构"])
    theme = await create_theme(client, working_name="已占用主题")
    await assign_signal_theme(client, assigned["id"], theme["id"])

    report = (await client.get("/api/v1/themes/cluster-report")).json()
    assert report["method"] == "sklearn.cluster.AgglomerativeClustering"
    member_ids = {
        member["signal_id"]
        for cluster in report["clusters"]
        for member in cluster["members"]
    }
    assert power_a["id"] in member_ids
    assert power_b["id"] in member_ids
    assert assigned["id"] in member_ids
    power = next(
        cluster
        for cluster in report["clusters"]
        if power_a["id"] in {member["signal_id"] for member in cluster["members"]}
    )
    assert assigned["id"] in {member["signal_id"] for member in power["members"]}
    assert other["id"] not in {member["signal_id"] for member in power["members"]}
    solo = next(
        cluster
        for cluster in report["clusters"]
        if other["id"] in {member["signal_id"] for member in cluster["members"]}
    )
    assert solo["signal_count"] == 1
    assert solo["source_count"] == 1
    neighbors = {item["signal_id"]: item for item in report["neighbors"][power_a["id"]]}
    assert power_b["id"] in neighbors
    assert neighbors[power_b["id"]]["assigned"] is False
    assert neighbors[assigned["id"]]["assigned"] is True
