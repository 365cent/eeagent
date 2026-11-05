"""Closed vocabularies (eea_ref_code domains): canonical codes, labels, aliases.

Single source of truth shared by the seed, Pydantic validation and query
normalization (CONV-CLOSED-VOCAB). Codes are the canonical stored form; labels
and fixture aliases are accepted as input and normalized to codes, but new
values can never be created through the API (docs/platform-implementation-plan.md:584).
"""

from __future__ import annotations

# domain -> [(code, label[, fixture_alias]), ...]
REF_CODES: dict[str, list[tuple[str, ...]]] = {
    "value_chain_stage": [
        ("creation_supply", "创造端（供应链）", "供应链（创造端）"),
        ("delivery_oem", "传递端（主机厂）"),
        ("realization_consumer", "兑现端（消费者）"),
        ("regulation_standard", "规制端（行业标准/规定）"),
    ],
    "signal_type": [
        ("strategy", "战略"),
        ("technology", "技术"),
        ("talent", "人才"),
        ("capital", "资本"),
        ("standard", "标准"),
    ],
    "evolution_node": [
        ("release", "发布"),
        ("nomination_validation", "定点/验证"),
    ],
    "evidence_status": [
        ("fetching", "抓取中"),
        ("fetch_failed", "抓取失败"),
        ("retained", "已留存"),
        ("pending_review", "待人工复核"),
        ("archived", "已归档/停用"),
    ],
    "channel": [
        ("web", "网页"),
        ("wechat_mp", "微信公众号"),
    ],
}


def _build_lookup() -> dict[str, dict[str, str]]:
    """value → code per domain; code, label and fixture_alias all map to the code."""
    lookup: dict[str, dict[str, str]] = {}
    for domain, items in REF_CODES.items():
        values: dict[str, str] = {}
        for item in items:
            code = item[0]
            for value in item:
                values.setdefault(value, code)
        lookup[domain] = values
    return lookup


_LOOKUP = _build_lookup()


def domains() -> tuple[str, ...]:
    return tuple(REF_CODES)


def codes(domain: str) -> tuple[str, ...]:
    """Canonical codes of a closed domain, in registry order."""
    return tuple(item[0] for item in REF_CODES[domain])


def labels(domain: str) -> tuple[str, ...]:
    """Display labels of a closed domain, in code order."""
    return tuple(item[1] for item in REF_CODES[domain])


def code_to_label(domain: str) -> dict[str, str]:
    """code → label map for a closed domain."""
    return {item[0]: item[1] for item in REF_CODES[domain]}


def label_to_code(domain: str) -> dict[str, str]:
    """label → code map for a closed domain."""
    return {item[1]: item[0] for item in REF_CODES[domain]}


def alias_to_code(domain: str) -> dict[str, str]:
    """fixture_alias → code map for a closed domain."""
    return {item[2]: item[0] for item in REF_CODES[domain] if len(item) > 2}


def normalize(domain: str, value: str) -> str | None:
    """Map a code, label or fixture_alias to its canonical code; None if unknown."""
    return _LOOKUP.get(domain, {}).get(value)
