"""Live technical-tag clustering for theme proposals.

Reads retained signals and their current ``tech_tag`` names - web captures and
uploaded-document signals alike, because a corpus may be entirely documents.
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
from sklearn.manifold import MDS
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
    ThemeClusterMap,
    ThemeClusterMapRegion,
    ThemeClusterProposal,
    ThemeClusterReport,
    ThemeClusterTagPoint,
)

POOL_LIMIT = 800
# Average-linkage cosine distance at which two articles are joined. A captured
# article carries only a handful of tags (2-6), so two articles that share two
# tags sit around 0.5 distance even when they describe the same technology.
# 0.45 (= similarity 0.55) therefore left every article a singleton and no
# candidate topic could ever satisfy the two-source rule. 0.75 = similarity
# 0.25 keeps a real overlap bar while still joining reports that share one of
# three or four tags (1/sqrt(3*4) = 0.29, 1/4 = 0.25): measured on the 2026-11-26
# production corpus of uploaded reports, 0.7 left all five as singletons.
COSINE_DISTANCE_THRESHOLD = 0.75
# Cohesion is the mean pairwise similarity of a family, i.e. 1 - distance.
# Keep it derived so the two knobs cannot contradict each other.
MIN_COHESION = round(1.0 - COSINE_DISTANCE_THRESHOLD, 4)
NEIGHBOR_MIN_SIMILARITY = 0.4
NEIGHBOR_LIMIT = 6
CORPUS_TAG_LIMIT = 24
CLUSTER_TAG_LIMIT = 8
# 2-D map: MDS is O(k^2) in memory, so embed the most-used tags only.
TAG_MAP_LIMIT = 240
MAP_WIDTH = 220.0
MAP_HEIGHT = 100.0
MAP_PAD = 2.0
REGION_PAD_X = 1.8
REGION_PAD_Y = 1.6

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
    url: str = ""


def source_host(url: str | None, publisher: str | None, channel: str | None) -> str:
    raw = (url or "").strip()
    if raw:
        try:
            href = raw if "://" in raw else f"https://{raw}"
            host = urlparse(href).hostname
            if host and host.lower() != "document":
                return host.lower()
        except ValueError:
            pass
    if publisher and publisher.strip():
        return publisher.strip().lower()
    return (channel or "unknown").strip().lower() or "unknown"


_DOCUMENT_URL_PREFIX = "eea://document/"


def document_source_key(url: str | None) -> str | None:
    """`eea://document/<id>` → one stable source id per uploaded document.

    Theme source counting dedups by a signal's primary URL (REQ-DEM-14), where
    every document URL is distinct, so two uploaded reports are two sources.
    The bare `document` host would collapse every upload into one source and a
    document-only corpus could never satisfy the two-source topic rule.
    """
    raw = (url or "").strip()
    if not raw.lower().startswith(_DOCUMENT_URL_PREFIX):
        return None
    doc_id = raw[len(_DOCUMENT_URL_PREFIX) :].strip().split("/", 1)[0]
    return f"document-{doc_id[:8]}" if doc_id else None


def cluster_source_host(
    url: str | None,
    publisher: str | None,
    source_label: str | None,
    channel: str | None,
) -> str:
    """Source identity for the cluster report; documents count per document."""
    doc_key = document_source_key(url)
    if doc_key:
        return doc_key
    return source_host(url, publisher, channel)


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


def _fill_axis(values: np.ndarray) -> np.ndarray:
    """Stretch a 1-D embedding across 0..1 so the map fills the canvas."""
    if values.size == 0:
        return values
    lo = float(values.min())
    hi = float(values.max())
    span = hi - lo
    if span < 1e-9:
        # Degenerate axis: fan out evenly instead of collapsing to a line.
        return np.linspace(0.0, 1.0, values.size)
    return (values - lo) / span


def _embed_tags(matrix: np.ndarray, columns: list[int]) -> np.ndarray:
    """2-D MDS over tag-tag cosine distance. Returns an (n, 2) array in 0..1."""
    tag_matrix = matrix[:, columns]
    similarity = np.clip(cosine_similarity(tag_matrix.T), 0.0, 1.0)
    np.fill_diagonal(similarity, 1.0)
    distance = 1.0 - similarity
    np.fill_diagonal(distance, 0.0)
    try:
        coords = MDS(
            n_components=2,
            metric="precomputed",
            init="classical_mds",
            random_state=17,
            n_init=1,
            max_iter=300,
            normalized_stress="auto",
        ).fit_transform(distance)
    except Exception:  # noqa: BLE001 - a failed projection must not break clustering
        coords = np.zeros((len(columns), 2), dtype=np.float64)
    return np.column_stack([_fill_axis(coords[:, 0]), _fill_axis(coords[:, 1])])


def _place_clusters(
    coords: np.ndarray,
    keys: list[str | None],
    counts: dict[str, int],
) -> tuple[np.ndarray, dict[str, tuple[float, float, float, float]], np.ndarray]:
    """Map the MDS projection onto the canvas without re-spacing the clusters.

    Cluster positions and gaps are whatever the similarity embedding produced:
    similar keyword families sit close together, dissimilar ones far apart, and
    nothing is nudged to fill the rectangle. One uniform scale fits the cloud,
    which preserves every distance ratio. Overlapping glows are intentional — a
    family that overlaps another is genuinely close to it.

    Returns coordinates, per-cluster (cx, cy, rx, ry) and a 0..1 density weight
    per point (1 at the core, lower toward the rim).
    """
    n = len(keys)
    placed = np.zeros((n, 2), dtype=np.float64)
    weights = np.full(n, 0.35, dtype=np.float64)
    regions: dict[str, tuple[float, float, float, float]] = {}

    island_keys = sorted({key for key in keys if key}, key=lambda key: (-counts[key], key))
    noise_idx = [idx for idx, value in enumerate(keys) if not value]
    band = MAP_HEIGHT * 0.13 if noise_idx else 0.0
    canvas_w = MAP_WIDTH - 2 * MAP_PAD
    canvas_h = MAP_HEIGHT - band - 2 * MAP_PAD

    def _scatter_noise() -> None:
        step = canvas_w / max(len(noise_idx), 1)
        for order, idx in enumerate(noise_idx):
            placed[idx] = [MAP_PAD + step * (order + 0.5), MAP_HEIGHT - band / 2]
            weights[idx] = 0.3

    if not island_keys:
        _scatter_noise()
        return placed, regions, weights

    # Positions in canvas units, straight from the embedding.
    raw = np.array(coords, dtype=np.float64, copy=True)
    raw[:, 0] *= canvas_w
    raw[:, 1] *= canvas_h

    cluster_centres: dict[str, np.ndarray] = {}
    cluster_offsets: dict[str, np.ndarray] = {}
    for key in island_keys:
        rows = [idx for idx, value in enumerate(keys) if value == key]
        block = raw[rows]
        centre = block.mean(axis=0)
        cluster_centres[key] = centre
        cluster_offsets[key] = block - centre

    # Fit the whole cloud once, uniformly, so relative spacing is untouched.
    # Bounds come from the actual projected points on each axis (a per-axis
    # measure, not one scalar), otherwise a wide cloud leaves empty margins.
    all_points = np.concatenate([cluster_centres[key] + cluster_offsets[key] for key in island_keys], axis=0)
    min_xy = all_points.min(axis=0) - 1.0
    max_xy = all_points.max(axis=0) + 1.0
    span_x = max(float(max_xy[0] - min_xy[0]), 1e-6)
    span_y = max(float(max_xy[1] - min_xy[1]), 1e-6)
    fit = min(canvas_w / span_x, canvas_h / span_y)
    shift_x = MAP_PAD + (canvas_w - span_x * fit) / 2 - float(min_xy[0]) * fit
    shift_y = MAP_PAD + (canvas_h - span_y * fit) / 2 - float(min_xy[1]) * fit

    for key in island_keys:
        rows = [idx for idx, value in enumerate(keys) if value == key]
        off = cluster_offsets[key] * fit
        centre = cluster_centres[key] * fit + np.array([shift_x, shift_y])
        placed[rows] = off + centre
        radius = np.hypot(off[:, 0], off[:, 1])
        peak = float(radius.max()) if radius.size else 0.0
        weights[rows] = 1.0 - (radius / peak) * 0.72 if peak > 1e-6 else 1.0
        regions[key] = (
            float(centre[0]),
            float(centre[1]),
            float(np.abs(off[:, 0]).max()) + REGION_PAD_X,
            float(np.abs(off[:, 1]).max()) + REGION_PAD_Y,
        )

    _scatter_noise()
    return placed, regions, weights


def _build_tag_map(
    vocabulary: list[str],
    matrix: np.ndarray,
    corpus_counts: Counter[str],
    tag_cluster: dict[str, str],
    cluster_labels: dict[str, str],
) -> ThemeClusterMap | None:
    """Project tags and place clusters: the client does no layout work."""
    if not vocabulary:
        return None

    ranked = sorted(vocabulary, key=lambda tag: (-corpus_counts[tag], tag))[:TAG_MAP_LIMIT]
    if not ranked:
        return None

    full_index = {tag: pos for pos, tag in enumerate(vocabulary)}
    columns = [full_index[tag] for tag in ranked]
    coords = _embed_tags(matrix, columns)

    keys = [tag_cluster.get(tag) for tag in ranked]
    counts: Counter[str] = Counter(key for key in keys if key)
    placed, regions, weights = _place_clusters(coords, keys, counts)

    order = {key: index for index, key in enumerate(
        sorted({key for key in keys if key}, key=lambda key: (-counts[key], key))
    )}

    points = [
        ThemeClusterTagPoint(
            tag=tag,
            support=corpus_counts[tag],
            cluster_key=keys[pos],
            cluster_index=order.get(keys[pos]) if keys[pos] else None,
            x=_round(float(placed[pos, 0])),
            y=_round(float(placed[pos, 1])),
            weight=_round(float(weights[pos])),
            assigned=keys[pos] is not None,
        )
        for pos, tag in enumerate(ranked)
    ]
    region_rows = [
        ThemeClusterMapRegion(
            cluster_key=key,
            index=order[key],
            label=cluster_labels.get(key, ""),
            cx=_round(geometry[0]),
            cy=_round(geometry[1]),
            rx=_round(geometry[2]),
            ry=_round(geometry[3]),
            count=counts[key],
        )
        for key, geometry in regions.items()
    ]
    region_rows.sort(key=lambda row: row.index)

    return ThemeClusterMap(
        width=MAP_WIDTH,
        height=MAP_HEIGHT,
        aspect=_round(MAP_WIDTH / MAP_HEIGHT),
        points=points,
        regions=region_rows,
    )


def _proposal_label(proposal: ThemeClusterProposal) -> str:
    """Short human label for a cluster on the map (shared tags, else top tags)."""
    if proposal.shared_tags:
        return " · ".join(proposal.shared_tags[:3])
    return " · ".join(item.tag for item in proposal.tag_distribution[:3])


def _member(record: TagSignal) -> ClusterMemberOut:
    return ClusterMemberOut(
        signal_id=record.id,
        title=record.title,
        tags=list(record.tags),
        value_chain_stage_code=record.stage,
        updated_at=record.updated_at,
        source_host=record.source_host,
        assigned=record.assigned,
        url=record.url,
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
        url=record.url,
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

    tag_cluster: dict[str, str] = {}
    for proposal in proposals:
        for item in proposal.tag_distribution:
            tag_cluster.setdefault(item.tag, proposal.key)

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

    cluster_labels = {proposal.key: _proposal_label(proposal) for proposal in proposals}
    tag_map = _build_tag_map(vocabulary, matrix, corpus_counts, tag_cluster, cluster_labels)

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
        tag_map=tag_map,
    )


async def build_theme_cluster_report(db: AsyncSession) -> ThemeClusterReport:
    """Cluster live tech tags, web and document-derived signals alike.

    A corpus built from uploaded reports is all `eea://document/...` signals;
    excluding them left the report empty exactly when evidence existed. They
    join as proposal candidates only - writing a theme stays a separate human
    confirm, and the automatic theme-aggregate preview still skips them
    (BE-05: document signals keep manual assignment until re-extraction is
    accepted). Families may already belong to a theme.
    """
    rows = (
        (
            await db.execute(
                select(Signal)
                .options(selectinload(Signal.tags).selectinload(SignalTag.vocab))
                .where(Signal.evidence_status_code == "retained")
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
        url = (signal.url_normalized or signal.url or "").strip()
        url_key = (url or str(signal.id)).strip().lower()
        record = TagSignal(
            id=signal.id,
            title=signal.title,
            tags=tags,
            stage=signal.value_chain_stage_code,
            updated_at=signal.updated_at,
            source_host=cluster_source_host(
                url, signal.publisher, signal.source_label, signal.channel_code
            ),
            url_key=url_key,
            assigned=signal.tech_theme_id is not None,
            url=url,
        )
        current = by_url.get(url_key)
        if current is None or record.updated_at >= current.updated_at:
            by_url[url_key] = record
    ordered = sorted(by_url.values(), key=lambda record: (record.updated_at, str(record.id)), reverse=True)
    truncated = len(ordered) > POOL_LIMIT
    return cluster_tag_signals(ordered[:POOL_LIMIT], truncated=truncated)
