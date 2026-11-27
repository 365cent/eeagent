"""AI topic titles for clustering candidates.

The page can already build a title from the shared tags and the member titles.
This asks the model for a better one: tags first, then the member summaries (the
top member's excerpt) to correct the wording. One batched call covers every
candidate, so a reclustering pass costs a single request instead of one per
cluster. Any failure leaves ``ai_name`` empty and the page keeps its own title.
"""

from __future__ import annotations

import asyncio
import re
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.semantic.llm import name_clusters_with_llm
from app.models.models import Signal
from app.schemas.schemas import ThemeClusterProposal, ThemeClusterReport

# The cards show a dozen candidates; naming more burns tokens for graphs nobody
# scrolls to, and the batched call gets slower with every entry.
MAX_NAMED = 12
EXCERPT_CHARS = 140
_SPACES = re.compile(r"\s+")


def _clean(text: str | None, limit: int) -> str:
    return _SPACES.sub(" ", text or "").strip()[:limit]


async def _excerpts(db: AsyncSession, signal_ids: list[uuid.UUID]) -> dict[uuid.UUID, str]:
    ids = [signal_id for signal_id in signal_ids if signal_id is not None]
    if not ids:
        return {}
    rows = (
        await db.execute(select(Signal.id, Signal.excerpt).where(Signal.id.in_(ids)))
    ).all()
    return {
        row.id: _clean(row.excerpt, EXCERPT_CHARS)
        for row in rows
        if row.excerpt and row.excerpt.strip()
    }


def cluster_brief(
    clusters: list[ThemeClusterProposal], excerpts: dict[uuid.UUID, str]
) -> str:
    lines = ["以下是标签聚类候选，请为每个 key 拟一个中文主题名。"]
    for cluster in clusters:
        tags = list(cluster.shared_tags) or [
            item.tag for item in cluster.tag_distribution[:6]
        ]
        titles = " / ".join(_clean(member.title, 60) for member in cluster.members[:3])
        summary = excerpts.get(cluster.members[0].signal_id) if cluster.members else ""
        lines.append(
            f"key: {cluster.key}\n"
            f"标签: {'、'.join(tags) or '（无）'}\n"
            f"成员标题: {titles or '（无）'}\n"
            f"内容摘要: {summary or '（无）'}"
        )
    return "\n\n".join(lines)


async def name_cluster_report(db: AsyncSession, report: ThemeClusterReport) -> None:
    """Fill ``ai_name`` on the report's clusters. Never raises: naming is optional."""
    clusters = [cluster for cluster in report.clusters if cluster.members][:MAX_NAMED]
    if not clusters:
        return
    try:
        excerpts = await _excerpts(db, [cluster.members[0].signal_id for cluster in clusters])
        result = await asyncio.wait_for(
            name_clusters_with_llm(cluster_brief(clusters, excerpts)),
            timeout=35,
        )
    except Exception:  # noqa: BLE001 - the page falls back to its own title
        return
    if result is None:
        return
    by_key = {entry.key: entry.name for entry in result.names}
    for cluster in report.clusters:
        name = by_key.get(cluster.key)
        if name:
            cluster.ai_name = name
