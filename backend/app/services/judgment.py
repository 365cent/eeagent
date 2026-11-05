"""Machine first-pass judgment: value chain stage (REQ-TAG-04) and theme
aggregation (REQ-SIG-08).

Stage rules run over the article title + evidence snapshot text (plan harness
reasoning, docs/platform-implementation-plan.md:1126: the title names the 48V
supply chain and the snapshot names suppliers → 创造端（供应链）). Theme matching
runs the signal's suggested tags against every theme's display tags. Both are
machine initial passes — human review can always correct them, and the manual
PUT /signals/{id}/theme path audits the correction (REQ-RULE-02).
"""
from __future__ import annotations

import uuid

from app.services.refcodes import codes

# REQ-TAG-04: keyword rules over the ref-code labels/aliases per stage.
_STAGE_KEYWORDS: dict[str, tuple[str, ...]] = {
    "creation_supply": ("供应链", "创造端", "器件厂商", "供应商", "半导体厂商"),
    "delivery_oem": ("主机厂", "传递端", "oem"),
    "realization_consumer": ("消费者", "兑现端"),
    "regulation_standard": ("标准", "法规", "规制"),
}


def judge_stage(title: str, snapshot_text: str) -> str | None:
    """Initial-judge the value chain stage from title + snapshot (REQ-TAG-04).

    Returns the stage code with the most keyword hits — ties broken by registry
    order — or None when no rule matches (the stage column stays nullable).
    """
    text = f"{title}\n{snapshot_text}".lower()
    best: str | None = None
    best_score = 0
    for stage in codes("value_chain_stage"):
        score = sum(text.count(kw) for kw in _STAGE_KEYWORDS.get(stage, ()))
        if score > best_score:
            best, best_score = stage, score
    return best


def _tags_match(suggested: str, theme_tag: str) -> bool:
    """Exact or containment match. jieba splits compound tags (智能配电 →
    智能/配电), so a suggested token matches the theme's compound tag — and
    vice versa — by containment."""
    return suggested == theme_tag or suggested in theme_tag or theme_tag in suggested


def select_best_theme(
    theme_tags: dict[uuid.UUID, set[str]], suggested_tags: set[str]
) -> tuple[uuid.UUID | None, str]:
    """REQ-SIG-08: the unique theme sharing ≥2 of the signal's suggested tags.

    Returns (theme_id, reason). theme_id is None when no unique match exists:
    no theme reaches a ≥2-tag overlap, or several themes tie at the top.
    """
    if not suggested_tags:
        return None, "信号没有任何技术方向标签，无法按标签归集"
    overlaps: dict[uuid.UUID, int] = {}
    for theme_id, tags in theme_tags.items():
        matched = sum(1 for s in suggested_tags if any(_tags_match(s, t) for t in tags))
        if matched:
            overlaps[theme_id] = matched
    if not overlaps:
        return None, "没有任何主题与该信号的技术方向标签存在重合"
    top = max(overlaps.values())
    if top < 2:
        return None, f"与最佳主题仅重合 {top} 个标签（需 ≥2），不自动归集"
    winners = [tid for tid, n in overlaps.items() if n == top]
    if len(winners) > 1:
        return None, f"{len(winners)} 个主题以 {top} 个标签并列最高，无唯一匹配"
    return winners[0], f"以 {top} 个标签重合唯一匹配"
