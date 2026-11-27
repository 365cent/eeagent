"""AI titles for clustering candidates.

One batched model call names every candidate from its tags and member summaries;
any failure leaves ``ai_name`` empty so the page keeps the title it already has.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import pytest

from app.db.base import SessionLocal
from app.domains.semantic.llm import LLMClusterName, LLMClusterNames
from app.domains.theme import cluster_naming
from app.schemas.schemas import (
    ClusterMemberOut,
    TagDistributionItem,
    ThemeClusterProposal,
    ThemeClusterReport,
)

pytestmark = [pytest.mark.anyio, pytest.mark.db]


def _member(title: str) -> ClusterMemberOut:
    return ClusterMemberOut(
        signal_id=uuid.uuid4(),
        title=title,
        tags=["架构"],
        value_chain_stage_code="delivery_oem",
        updated_at=datetime.now(timezone.utc),
        source_host="example.com",
        url="https://example.com/article",
    )


def _cluster(key: str, titles: list[str]) -> ThemeClusterProposal:
    return ThemeClusterProposal(
        key=key,
        members=[_member(title) for title in titles],
        shared_tags=["架构", "区域控制器"],
        tag_distribution=[
            TagDistributionItem(
                tag="架构", support=2, cluster_share=1.0, corpus_share=0.5, lift=2.0
            )
        ],
        cohesion=0.6,
        signal_count=len(titles),
        source_count=len(titles),
        value_chain_stage_code="delivery_oem",
    )


def _report() -> ThemeClusterReport:
    return ThemeClusterReport(
        method="agglomerative",
        metric="cosine",
        linkage="average",
        distance_threshold=0.75,
        sample_size=4,
        unassigned_count=4,
        truncated=False,
        silhouette=None,
        tag_distribution=[],
        clusters=[_cluster("k1", ["区域控制器架构演进", "中央域控SoC架构"]), _cluster("k2", ["车用芯片"])],
        neighbors={},
    )


async def test_titles_come_from_one_batched_call(monkeypatch):
    calls: list[str] = []

    async def fake(brief: str):
        calls.append(brief)
        return LLMClusterNames(names=[LLMClusterName(key="k1", name="区域控制器中央架构收敛")])

    monkeypatch.setattr(cluster_naming, "name_clusters_with_llm", fake)
    report = _report()

    async with SessionLocal() as db:
        await cluster_naming.name_cluster_report(db, report)

    assert len(calls) == 1, "one clustered pass must not fan out into per-cluster requests"
    assert "标签: 架构、区域控制器" in calls[0]
    assert "成员标题: 区域控制器架构演进" in calls[0]
    assert report.clusters[0].ai_name == "区域控制器中央架构收敛"
    assert report.clusters[1].ai_name is None


async def test_naming_failure_keeps_the_page_title(monkeypatch):
    async def fake(_brief: str):
        return None

    monkeypatch.setattr(cluster_naming, "name_clusters_with_llm", fake)
    report = _report()

    async with SessionLocal() as db:
        await cluster_naming.name_cluster_report(db, report)

    assert all(cluster.ai_name is None for cluster in report.clusters)


async def test_exception_never_breaks_the_clustering_pass(monkeypatch):
    async def boom(_brief: str):
        raise RuntimeError("gateway down")

    monkeypatch.setattr(cluster_naming, "name_clusters_with_llm", boom)
    report = _report()

    async with SessionLocal() as db:
        await cluster_naming.name_cluster_report(db, report)

    assert all(cluster.ai_name is None for cluster in report.clusters)
