"""Live technical-tag clustering for theme proposals.

Reads retained signals and their current ``tech_tag`` names.
Builds a binary tag matrix, then uses scikit-learn average-linkage
agglomerative clustering on cosine distance. A lone signal that does not
join any multi-source family stays its own proposal. The report is a
suggestion: creating a theme stays a separate, confirmed write.
"""

from __future__ import annotations

import hashlib
import math
import re
import uuid
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from urllib.parse import urlparse

import numpy as np
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics import silhouette_score
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import Signal, SignalTag
from app.schemas.schemas import (
    ClusterMemberOut,
    SignalNeighborOut,
    TagDistributionItem,
    ThemeClusterProposal,
    ThemeClusterReport,
)

POOL_LIMIT = 800
COSINE_DISTANCE_THRESHOLD = 0.45
MIN_COHESION = 0.5
NEIGHBOR_MIN_SIMILARITY = 0.4
NEIGHBOR_LIMIT = 6
CORPUS_TAG_LIMIT = 24
CLUSTER_TAG_LIMIT = 8

_UNRELIABLE_TITLE = re.compile(
    r"安全验证|security\s*verification|captcha|verify\s*you\s*are|访问验证|异常访问|chrome-error|人机验证|滑动验证",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class TagSignal:
    id: uuid.UUID
    title: str
    tags: tuple[str, ...]
    stage: str | None
    updated_at: datetime
    source_host: str
    url_key: str
    assigned: bool = False


def source_host(url: str | None, publisher: str | None, channel: str | None) -> str:
    raw = (url or "").strip()
    if raw:
        try:
            href = raw if "://" in raw else f"https://{raw}"
            host = urlparse(href).hostname
            if host:
                return host.lower()
        except ValueError:
            pass
    if publisher and publisher.strip():
        return publisher.strip().lower()
    return (channel or "unknown").strip().lower() or "unknown"


def reliable_title(title: str) -> bool:
    text = re.sub(r"\s+", " ", title or "").strip()
    if len(text) < 10:
        return False
    if _UNRELIABLE_TITLE.search(text):
        return False
    if re.match(r"^https?://", text, re.IGNORECASE):
        return False
    return True


def _round(value: float) -> float:
    if not math.isfinite(value):
        return 0.0
    return round(float(value), 4)


def _distribution(
    support: dict[str, int],
    denominator: int,
    corpus_share: dict[str, float],
    *,
    limit: int,
) -> list[TagDistributionItem]:
    if denominator <= 0:
        return []
    rows: list[TagDistributionItem] = []
    for tag, count in support.items():
        if count <= 0:
            continue
        share = count / denominator
        base = corpus_share.get(tag, 0.0)
        lift = share / base if base > 0 else 0.0
        rows.append(
            TagDistributionItem(
                tag=tag,
                support=count,
                cluster_share=_round(share),
                corpus_share=_round(base),
                lift=_round(lift),
            )
        )
    rows.sort(key=lambda item: (-item.lift, -item.support, item.tag))
    return rows[:limit]


def _majority_stage(stages: list[str | None]) -> str | None:
    counts = Counter(stage for stage in stages if stage)
    if not counts:
        return None
    best = max(counts.values())
    winners = sorted(code for code, count in counts.items() if count == best)
    return winners[0]


def _member(record: TagSignal) -> ClusterMemberOut:
    return ClusterMemberOut(
        signal_id=record.id,
        title=record.title,
        tags=list(record.tags),
        value_chain_stage_code=record.stage,
        updated_at=record.updated_at,
        source_host=record.source_host,
        assigned=record.assigned,
    )


def _neighbor(record: TagSignal, similarity: float, shared: list[str]) -> SignalNeighborOut:
    return SignalNeighborOut(
        signal_id=record.id,
        title=record.title,
        tags=list(record.tags),
        similarity=_round(similarity),
        shared_tags=shared,
        value_chain_stage_code=record.stage,
        updated_at=record.updated_at,
        source_host=record.source_host,
        assigned=record.assigned,
    )


def cluster_tag_signals(records: list[TagSignal], *, truncated: bool = False) -> ThemeClusterReport:
    """Cluster a prepared sample. ``records`` must already be the live tag snapshot."""
    sample = list(records)
    n = len(sample)
    corpus_counts: Counter[str] = Counter()
    for record in sample:
        corpus_counts.update(record.tags)
    corpus_share = {tag: count / n for tag, count in corpus_counts.items()} if n else {}
    corpus_distribution = _distribution(dict(corpus_counts), n, corpus_share, limit=CORPUS_TAG_LIMIT)
    unassigned_count = sum(1 for record in sample if not record.assigned)
    empty = ThemeClusterReport(
        method="sklearn.cluster.AgglomerativeClustering",
        metric="cosine",
        linkage="average",
        distance_threshold=COSINE_DISTANCE_THRESHOLD,
        sample_size=n,
        unassigned_count=unassigned_count,
        truncated=truncated,
        silhouette=None,
        tag_distribution=corpus_distribution,
        clusters=[],
        neighbors={},
    )
    if n < 2:
        return empty

    vocabulary = sorted(corpus_counts)
    index = {tag: pos for pos, tag in enumerate(vocabulary)}
    matrix = np.zeros((n, len(vocabulary)), dtype=np.float64)
    for row, record in enumerate(sample):
        for tag in record.tags:
            matrix[row, index[tag]] = 1.0

    similarity = np.clip(cosine_similarity(matrix), 0.0, 1.0)
    np.fill_diagonal(similarity, 1.0)
    distance = 1.0 - similarity
    np.fill_diagonal(distance, 0.0)

    labels = AgglomerativeClustering(
        n_clusters=None,
        metric="precomputed",
        linkage="average",
        distance_threshold=COSINE_DISTANCE_THRESHOLD,
    ).fit_predict(distance)

    grouped: dict[int, list[int]] = {}
    for row, label in enumerate(labels.tolist()):
        grouped.setdefault(int(label), []).append(row)

    proposals: list[ThemeClusterProposal] = []
    kept_rows: list[int] = []
    kept_labels: list[int] = []
    for label, rows in grouped.items():
        # Assigned rows stay in the family so an existing theme can be split
        # into the tag groups the sample actually supports.
        member_rows = list(rows)
        if not member_rows:
            continue
        members = [sample[row] for row in member_rows]
        hosts = {member.source_host for member in members}
        if len(members) >= 2:
            pair_scores = [
                float(similarity[member_rows[left], member_rows[right]])
                for left in range(len(member_rows))
                for right in range(left + 1, len(member_rows))
            ]
            cohesion = sum(pair_scores) / len(pair_scores) if pair_scores else 0.0
            if cohesion < MIN_COHESION or len(hosts) < 2:
                continue
        else:
            cohesion = 1.0
        support = Counter()
        for member in members:
            support.update(member.tags)
        shared = sorted(
            (tag for tag, count in support.items() if count == len(members)),
            key=lambda tag: (-corpus_counts[tag], tag),
        )
        if not shared:
            shared = [
                item.tag
                for item in _distribution(dict(support), len(members), corpus_share, limit=3)
                if item.cluster_share >= 0.5
            ]
        key_src = ",".join(sorted(str(member.id) for member in members))
        key = "cluster-" + hashlib.sha1(key_src.encode()).hexdigest()[:12]
        ordered = sorted(members, key=lambda member: (member.title, str(member.id)))
        proposals.append(
            ThemeClusterProposal(
                key=key,
                members=[_member(member) for member in ordered],
                shared_tags=list(shared),
                tag_distribution=_distribution(
                    dict(support), len(members), corpus_share, limit=CLUSTER_TAG_LIMIT
                ),
                cohesion=_round(cohesion),
                signal_count=len(members),
                source_count=len(hosts),
                value_chain_stage_code=_majority_stage([member.stage for member in members]),
            )
        )
        for row in member_rows:
            kept_rows.append(row)
            kept_labels.append(label)

    proposals.sort(key=lambda item: (-item.signal_count, -item.cohesion, item.key))

    silhouette: float | None = None
    distinct_kept = set(kept_labels)
    if len(distinct_kept) >= 2 and len(kept_rows) > len(distinct_kept):
        subset = np.ix_(kept_rows, kept_rows)
        score = float(silhouette_score(distance[subset], kept_labels, metric="precomputed"))
        if math.isfinite(score):
            silhouette = _round(score)

    neighbors: dict[str, list[SignalNeighborOut]] = {}
    for row, record in enumerate(sample):
        order = np.argsort(-similarity[row])
        nearest: list[SignalNeighborOut] = []
        own_tags = set(record.tags)
        for other in order.tolist():
            if other == row:
                continue
            score = float(similarity[row, other])
            if score < NEIGHBOR_MIN_SIMILARITY:
                break
            peer = sample[other]
            shared = sorted(own_tags & set(peer.tags))
            nearest.append(_neighbor(peer, score, shared))
            if len(nearest) >= NEIGHBOR_LIMIT:
                break
        if nearest:
            neighbors[str(record.id)] = nearest

    return ThemeClusterReport(
        method="sklearn.cluster.AgglomerativeClustering",
        metric="cosine",
        linkage="average",
        distance_threshold=COSINE_DISTANCE_THRESHOLD,
        sample_size=n,
        unassigned_count=unassigned_count,
        truncated=truncated,
        silhouette=silhouette,
        tag_distribution=corpus_distribution,
        clusters=proposals,
        neighbors=neighbors,
    )


async def build_theme_cluster_report(db: AsyncSession) -> ThemeClusterReport:
    """Cluster live tech tags. Families may already belong to a theme; writing stays a separate confirm."""
    rows = (
        (
            await db.execute(
                select(Signal)
                .options(selectinload(Signal.tags).selectinload(SignalTag.vocab))
                .where(
                    Signal.document_id.is_(None),
                    Signal.evidence_status_code == "retained",
                )
                .order_by(Signal.updated_at.desc())
            )
        )
        .scalars()
        .unique()
        .all()
    )
    by_url: dict[str, TagSignal] = {}
    for signal in rows:
        if not reliable_title(signal.title):
            continue
        tags = tuple(
            sorted(
                {
                    tag.vocab.name.strip()
                    for tag in signal.tags
                    if tag.vocab is not None and tag.vocab.kind == "tech_tag" and tag.vocab.name.strip()
                }
            )
        )
        if not tags:
            continue
        url_key = (signal.url_normalized or signal.url or str(signal.id)).strip().lower()
        record = TagSignal(
            id=signal.id,
            title=signal.title,
            tags=tags,
            stage=signal.value_chain_stage_code,
            updated_at=signal.updated_at,
            source_host=source_host(signal.url_normalized or signal.url, signal.publisher, signal.channel_code),
            url_key=url_key,
            assigned=signal.tech_theme_id is not None,
        )
        current = by_url.get(url_key)
        if current is None or record.updated_at >= current.updated_at:
            by_url[url_key] = record
    ordered = sorted(by_url.values(), key=lambda record: (record.updated_at, str(record.id)), reverse=True)
    truncated = len(ordered) > POOL_LIMIT
    return cluster_tag_signals(ordered[:POOL_LIMIT], truncated=truncated)
