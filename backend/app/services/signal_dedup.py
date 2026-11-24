"""Find redundant signals and describe exactly how duplicates differ.

Two copies are redundant when they describe the same evidence:

* the same article URL (the same page captured again - the capture path
  already marks those with a ``(重复采集 #n)`` title suffix), or
* different URLs but the same ``body_sha256`` (the same document uploaded twice).

A group is *identical* when every compared field matches, so the extra copies
can be deleted without losing information. Otherwise the caller gets a
field-by-field comparison and picks the survivor: this module never decides
which of two genuinely different records the library should keep.

The suggested survivor follows one fixed order (documented in
:func:`keep_priority`): HTML archive, then extracted body, then the most
complete classification (tags + theme + excerpt), then the oldest capture - the
original record keeps its audit trail and citations.
"""

from __future__ import annotations

import uuid
from collections import defaultdict
from urllib.parse import parse_qsl, urlencode, urlsplit
from dataclasses import dataclass, field
from typing import Iterable, Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import Signal, SignalTag
from app.services.signal_duplicate import strip_duplicate_title_suffix

#: Fields compared to decide whether two copies are interchangeable.
COMPARED_FIELDS = (
    "title",
    "url",
    "publisher",
    "published_at",
    "channel_code",
    "value_chain_stage_code",
    "signal_type_code",
    "evidence_status_code",
    "tech_theme_id",
    "excerpt",
    "body_sha256",
    "snapshot_html_object_key",
    "tags",
)

#: Human labels for the comparison table in the workspace.
FIELD_LABELS = {
    "title": "标题",
    "url": "来源链接",
    "publisher": "发布主体",
    "published_at": "发布时间",
    "channel_code": "渠道",
    "value_chain_stage_code": "价值链环节",
    "signal_type_code": "信号类型",
    "evidence_status_code": "证据状态",
    "tech_theme_id": "技术主题",
    "excerpt": "摘要",
    "body_sha256": "正文哈希",
    "snapshot_html_object_key": "HTML 归档",
    "tags": "技术标签",
}


def _tag_names(signal: Signal) -> list[str]:
    return sorted(st.vocab.name for st in signal.tags if getattr(st, "vocab", None))


def fingerprint(signal: Signal) -> dict[str, object]:
    """Comparable view of one signal (ids/timestamps excluded on purpose)."""
    return {
        "title": strip_duplicate_title_suffix(signal.title),
        "url": signal.url_normalized,
        "publisher": (signal.publisher or "").strip(),
        "published_at": signal.published_at.isoformat() if signal.published_at else None,
        "channel_code": signal.channel_code,
        "value_chain_stage_code": signal.value_chain_stage_code,
        "signal_type_code": signal.signal_type_code,
        "evidence_status_code": signal.evidence_status_code,
        "tech_theme_id": str(signal.tech_theme_id) if signal.tech_theme_id else None,
        "excerpt": (signal.excerpt or "").strip(),
        "body_sha256": signal.body_sha256,
        "snapshot_html_object_key": bool(signal.snapshot_html_object_key),
        "tags": _tag_names(signal),
    }


def keep_priority(signal: Signal) -> tuple:
    """Sort key for the copy worth keeping (smaller sorts first)."""
    tags = _tag_names(signal)
    completeness = len(tags) + (1 if signal.tech_theme_id else 0) + (1 if signal.excerpt else 0)
    return (
        0 if signal.snapshot_html_object_key else 1,  # HTML archive first
        0 if signal.body_sha256 else 1,  # then extracted body
        -completeness,  # then the more complete classification
        0 if signal.evidence_status_code != "archived" else 1,  # active over archived
        signal.created_at or signal.updated_at,  # then the original capture
    )


@dataclass
class DuplicateMember:
    signal: Signal
    keep: bool
    identical_to_keep: bool

    @property
    def id(self) -> uuid.UUID:
        return self.signal.id


@dataclass
class DuplicateGroup:
    key: str
    kind: str  # "url" | "body"
    members: list[DuplicateMember]
    different_fields: list[str] = field(default_factory=list)
    values: dict[str, dict[str, object]] = field(default_factory=dict)

    @property
    def identical(self) -> bool:
        return not self.different_fields

    @property
    def survivor(self) -> Signal:
        return next(member.signal for member in self.members if member.keep)

    @property
    def redundant(self) -> list[Signal]:
        """Copies that may be deleted right away (everything but the survivor)."""
        return [member.signal for member in self.members if not member.keep]


async def _load_candidates(db: AsyncSession) -> list[Signal]:
    rows = (
        await db.execute(
            select(Signal).options(
                selectinload(Signal.tags).selectinload(SignalTag.vocab)
            )
        )
    ).scalars().unique().all()
    return list(rows)


#: Query keys a share/link wrapper adds; they do not identify an article.
TRACKING_QUERY_KEYS = {
    "from", "wfr", "spm", "share", "share_token", "share_from", "scene",
    "srcid", "chksm", "clicktime", "enterid", "sessionid", "utm_source",
    "utm_medium", "utm_campaign", "utm_term", "utm_content",
}


def article_url_key(url: str | None) -> str:
    """Article identity from a URL, keeping content-bearing query parameters.

    ``Signal.url_normalized`` drops the whole query string, so every
    ``site/s?id=1`` article collapses onto ``site/s`` and unrelated pages look
    like duplicates. Deletion is irreversible, so only a tracking-free URL is
    allowed to join a group: two genuinely different articles must never be
    offered as copies of each other.
    """
    raw = (url or "").strip()
    if not raw:
        return ""
    try:
        parts = urlsplit(raw if "://" in raw else f"https://{raw}")
    except ValueError:
        return raw
    query = sorted(
        (key, value)
        for key, value in parse_qsl(parts.query, keep_blank_values=False)
        if key.lower() not in TRACKING_QUERY_KEYS
    )
    base = f"{parts.scheme.lower()}://{(parts.netloc or '').lower()}{parts.path.rstrip('/')}"
    return f"{base}?{urlencode(query)}" if query else base


def group_signals(signals: Sequence[Signal]) -> list[DuplicateGroup]:
    """Pure grouping/diffing, so the rules are testable without a database."""
    by_url: dict[str, list[Signal]] = defaultdict(list)
    by_body: dict[str, list[Signal]] = defaultdict(list)
    for signal in signals:
        url_key = article_url_key(signal.url)
        if url_key:
            by_url[url_key].append(signal)
        if signal.body_sha256:
            by_body[signal.body_sha256].append(signal)

    groups: list[DuplicateGroup] = []
    claimed: set[uuid.UUID] = set()

    for url_key, members in by_url.items():
        if len(members) < 2:
            continue
        groups.append(_build_group(f"url:{url_key}", "url", members))
        claimed.update(signal.id for signal in members)

    # Same content behind different URLs (an upload next to a captured page).
    for body_sha, members in by_body.items():
        if len(members) < 2:
            continue
        unclaimed = [signal for signal in members if signal.id not in claimed]
        if len(unclaimed) < 2:
            continue
        distinct_urls = {signal.url_normalized for signal in unclaimed}
        if len(distinct_urls) < 2:
            continue
        groups.append(_build_group(f"body:{body_sha}", "body", unclaimed))

    groups.sort(key=lambda group: (group.identical, group.key))
    return groups


def _build_group(key: str, kind: str, signals: Iterable[Signal]) -> DuplicateGroup:
    ordered = sorted(signals, key=keep_priority)
    survivor = ordered[0]
    survivor_prints = fingerprint(survivor)
    members = [
        DuplicateMember(
            signal=signal,
            keep=signal is survivor,
            identical_to_keep=fingerprint(signal) == survivor_prints,
        )
        for signal in ordered
    ]

    different: list[str] = []
    values: dict[str, dict[str, object]] = {}
    for name in COMPARED_FIELDS:
        seen = {_comparable(fingerprint(signal)[name]) for signal in ordered}
        if len(seen) > 1:
            different.append(name)
            values[name] = {str(signal.id): fingerprint(signal)[name] for signal in ordered}
    return DuplicateGroup(key=key, kind=kind, members=members, different_fields=different, values=values)


def _comparable(value: object) -> object:
    """Lists become tuples so they can go in a set; None stays None."""
    if isinstance(value, list):
        return tuple(value)
    return value


async def scan_duplicates(db: AsyncSession) -> list[DuplicateGroup]:
    """Every redundant group in the library, identical ones first."""
    return group_signals(await _load_candidates(db))
