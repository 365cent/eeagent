"""Live tag clustering proposals (sklearn cosine / average linkage)."""

import uuid
from datetime import datetime, timezone

import pytest

from app.domains.tagging.clustering import TagSignal, cluster_tag_signals
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
def test_tag_map_places_tags_in_two_dimensions():
    power_a = _record(["智能配电", "eFuse", "区域控制"], "a.example")
    power_b = _record(["智能配电", "eFuse", "低压网络"], "b.example")
    talent_a = _record(["人才招聘", "组织架构"], "c.example", stage="delivery_oem")
    talent_b = _record(["人才招聘", "组织架构", "团队"], "d.example", stage="delivery_oem")

    report = cluster_tag_signals([power_a, power_b, talent_a, talent_b])

    tag_map = report.tag_map
    assert tag_map is not None, "the backend must return a laid-out map"
    assert tag_map.points, "the map must place the plotted tags"
    assert tag_map.width > 0 and tag_map.height > 0
    assert all(0.0 <= point.x <= tag_map.width for point in tag_map.points)
    assert all(0.0 <= point.y <= tag_map.height for point in tag_map.points)

    tags = {point.tag for point in tag_map.points}
    assert {"智能配电", "eFuse", "人才招聘"} <= tags
    cluster_keys = {point.tag: point.cluster_key for point in tag_map.points}
    assert cluster_keys["智能配电"] == cluster_keys["eFuse"]
    assert cluster_keys["智能配电"] != cluster_keys["人才招聘"]


@pytest.mark.no_db
def test_tag_map_preserves_similarity_projection_spacing():
    """Clusters must sit where the embedding put them, not on an even grid.

    A laid-out grid would give cluster centres identical or regularly spaced
    coordinates; an organic projection gives distinct, irregular ones.
    """
    families = [
        _record(["智能配电", "eFuse", "区域控制"], "a.example"),
        _record(["智能配电", "eFuse", "低压网络"], "b.example"),
        _record(["人才招聘", "组织架构"], "c.example", stage="delivery_oem"),
        _record(["人才招聘", "组织架构", "团队"], "d.example", stage="delivery_oem"),
        _record(["UCIe", "PCIe", "互连"], "e.example"),
        _record(["UCIe", "PCIe", "带宽"], "f.example"),
    ]
    report = cluster_tag_signals(families)

    tag_map = report.tag_map
    assert tag_map is not None
    regions = tag_map.regions
    assert len(regions) >= 3, "clusters must produce bounded regions"

    xs = [region.cx for region in regions]
    ys = [region.cy for region in regions]
    assert len({round(x, 4) for x in xs}) == len(regions), "cluster centres must not align on a grid column"
    assert len({round(y, 4) for y in ys}) == len(regions), "cluster centres must not align on a grid row"

    # The projection is fitted to the canvas, so it must actually use the height.
    points_y = [point.y for point in tag_map.points]
    used = (max(points_y) - min(points_y)) / tag_map.height
    assert used > 0.6, f"layout wastes vertical space: only {used:.0%} used"


@pytest.mark.no_db
def test_tag_map_weights_peak_at_cluster_core():
    left = _record(["智能配电", "eFuse", "区域控制"], "a.example")
    right = _record(["智能配电", "eFuse", "低压网络"], "b.example")

    report = cluster_tag_signals([left, right])

    points = report.tag_map.points if report.tag_map else []
    assert points
    for point in points:
        assert 0.0 <= point.weight <= 1.0, "weight must be a normalised density"
    assert any(point.weight > 0.5 for point in points), "cores must outweigh rims"


@pytest.mark.no_db
def test_tag_map_spreads_axes_when_every_tag_is_identical():
    left = _record(["智能配电", "eFuse"], "a.example")
    right = _record(["智能配电", "eFuse"], "b.example")

    report = cluster_tag_signals([left, right])

    points = report.tag_map.points if report.tag_map else []
    xs = {round(point.x, 6) for point in points}
    assert len(xs) > 1, "a degenerate projection must not collapse every tag onto one point"


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


@pytest.mark.no_db
def test_document_urls_count_one_source_per_document():
    """`eea://document/<id>` must not collapse every upload into one source."""
    from app.domains.tagging.clustering import cluster_source_host, document_source_key

    a = document_source_key("eea://document/9a20400c-4e07-4fc4-9592-787119bde1f1")
    b = document_source_key("eea://document/6a4ada10-600c-4c04-a7a1-6a1eb182969e")
    assert a == "document-9a20400c"
    assert b == "document-6a4ada10"
    assert a != b, "two uploaded reports are two sources (REQ-DEM-14 counts by primary URL)"
    assert document_source_key("https://reports.example/a") is None
    assert document_source_key("") is None
    assert (
        cluster_source_host("eea://document/9a20400c-4e07-4fc4-9592-787119bde1f1", None, None, "web")
        == a
    )
    assert cluster_source_host("https://a.example/x", None, None, "web") == "a.example"


@pytest.mark.anyio
async def test_cluster_report_covers_a_document_only_corpus(client, monkeypatch):
    """Production shape: every retained signal is an uploaded report.

    The report pool used to filter `document_id IS NULL`, so a document-only
    corpus clustered 0 samples and /createTopic could never propose a topic.
    """
    from app.domains.evidence import doc_ingest

    async def fake_ingest(data, filename, mime, **kwargs):
        return doc_ingest.IngestResult(
            canonical_md=f"# {filename}\n\n区域控制器与跨域电子电气架构的段落正文。\n",
            markitdown_version="0.1.9",
            figures=[],
            vision_model=None,
        )

    monkeypatch.setattr(
        "app.domains.evidence.document_pipeline.ingest_document", fake_ingest
    )

    async def document_signal(filename: str, content: bytes) -> dict:
        uploaded = await client.post(
            "/api/v1/documents/raw",
            files={"file": (filename, content, "application/octet-stream")},
        )
        assert uploaded.status_code == 201, uploaded.text
        created = await client.post(
            "/api/v1/signals",
            json={"document_id": uploaded.json()["id"], "channel_code": "web"},
        )
        assert created.status_code == 201, created.text
        return created.json()

    doc_a = await document_signal("区域架构系列研究报告.docx", b"doc-a-bytes")
    doc_b = await document_signal("跨域控制器架构研究报告.docx", b"doc-b-bytes")
    await set_signal_tags(client, doc_a["id"], ["区域控制", "架构", "跨域"])
    await set_signal_tags(client, doc_b["id"], ["区域控制", "架构", "电子电气"])

    report = (await client.get("/api/v1/themes/cluster-report")).json()
    assert report["sample_size"] >= 2, "document-derived retained signals must join the pool"
    assert report["unassigned_count"] >= 2
    family = next(
        cluster
        for cluster in report["clusters"]
        if {doc_a["id"], doc_b["id"]} <= {m["signal_id"] for m in cluster["members"]}
    )
    assert family["source_count"] == 2, "two uploaded documents are two distinct sources"
    members = {m["signal_id"]: m for m in family["members"]}
    assert members[doc_a["id"]]["url"].startswith("eea://document/")
    assert members[doc_b["id"]]["url"].startswith("eea://document/")
    assert len({m["source_host"] for m in family["members"]}) == 2


@pytest.mark.no_db
def test_sparse_tag_sets_sharing_two_tags_are_grouped():
    """Real captures carry 2-6 tags; sharing two of them must still form a family.

    Regression: the old 0.45 distance threshold demanded similarity 0.55, which a
    four-tag article sharing two tags only reaches at 0.5, so every article stayed
    a singleton and no candidate topic could satisfy the two-source rule.
    """
    left = _record(["TSN", "确定性网络", "车载以太网", "时间同步"], "a.example")
    right = _record(["TSN", "确定性网络", "自动化", "测试"], "b.example")
    unrelated = _record(["人才招聘", "组织架构", "团队", "培训"], "c.example")

    report = cluster_tag_signals([left, right, unrelated])

    groups = [set(member.signal_id for member in cluster.members) for cluster in report.clusters]
    assert {left.id, right.id} in groups
    family = next(c for c in report.clusters if left.id in {m.signal_id for m in c.members})
    assert family.signal_count == 2
    assert family.source_count == 2
    assert family.cohesion >= 0.3
    assert "TSN" in family.shared_tags
