"""Validation for the persisted vehicle-function mapping traces."""

from collections.abc import Mapping
import re
from typing import Any

FORWARD_STEP_KEYS = (
    "core_needs",
    "capability_gaps",
    "vehicle_flow",
    "system_behavior",
    "function",
)
FUNCTION_CARD_FIELDS = (
    "recommendation_level",
    "automation_levels",
    "target_domain",
    "recommendation_reason",
    "l2_l4_difference",
)
def _has_content(value: Any) -> bool:
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, list):
        return bool(value) and all(_has_content(item) for item in value)
    if isinstance(value, Mapping):
        return bool(value) and all(_has_content(item) for item in value.values())
    return value is not None


def validate_forward_trace(trace: Any) -> str | None:
    """Require the five ordered derivation steps, accepting the legacy list."""
    if not isinstance(trace, Mapping):
        return "正向推导必须包含五步内容（REQ-MAP-02）"
    steps = trace.get("steps")
    if isinstance(steps, list):
        if len(steps) != 5 or not all(_has_content(step) for step in steps):
            return "正向推导须完整填写五步：核心诉求、能力缺口、车端关键流、系统行为、车辆功能（REQ-MAP-02）"
        return None
    if any(not _has_content(trace.get(key)) for key in FORWARD_STEP_KEYS):
        return "正向推导须完整填写五步：核心诉求、能力缺口、车端关键流、系统行为、车辆功能（REQ-MAP-02）"
    return None


def _core_need_items(trace: Mapping[str, Any]) -> list[str]:
    steps = trace.get("steps")
    value = steps[0] if isinstance(steps, list) and len(steps) == 5 else trace.get("core_needs")
    if isinstance(value, list):
        raw_items = value
    elif isinstance(value, str):
        raw_items = value.splitlines()
    else:
        return []

    items: list[str] = []
    for raw in raw_items:
        if not isinstance(raw, str):
            continue
        item = raw.strip()
        if not item:
            continue
        if not items and "：" in item:
            _label, _separator, tail = item.partition("：")
            if "诉求" in _label:
                item = tail.strip()
                if not item:
                    continue
        item = re.sub(r"^(?:[-*•‧]|\d+[.)、])\s*", "", item).strip()
        if item:
            items.append(" ".join(item.split()).casefold())
    return items


def validate_reverse_trace(trace: Any, forward_trace: Any) -> str | None:
    """Require recorded reverse checks and an explicit human convergence decision.

    The API deliberately validates structured declarations; it does not infer
    semantic consistency by comparing prose or trusting a model-generated claim.
    """
    if not isinstance(trace, Mapping):
        return "反向验证资料不完整（REQ-MAP-03..05）"
    if not _has_content(trace.get("necessity")):
        return "反向验证须说明功能必要性（REQ-MAP-03）"
    coverage = trace.get("coverage")
    if (
        not isinstance(coverage, list)
        or not coverage
        or not all(
            isinstance(item, Mapping)
            and _has_content(item.get("need"))
            and _has_content(item.get("coverage"))
            for item in coverage
        )
    ):
        return "反向验证须逐项记录核心诉求及覆盖说明（REQ-MAP-04）"
    expected = _core_need_items(forward_trace) if isinstance(forward_trace, Mapping) else []
    actual = [" ".join(str(item["need"]).split()).casefold() for item in coverage]
    if not expected or len(actual) != len(set(actual)) or set(actual) != set(expected):
        return "反向验证必须逐项覆盖正向推导中的全部核心诉求，不得遗漏、重复或新增（REQ-MAP-04）"
    if trace.get("full_coverage") is not True:
        return "反向验证未确认覆盖全部核心诉求（REQ-MAP-04）"
    contradictions = trace.get("unresolved_contradictions")
    if not isinstance(contradictions, list):
        return "反向验证须记录未解决矛盾项（REQ-MAP-05）"
    if contradictions:
        return "仍有未解决的正反向矛盾，不能发布（REQ-MAP-05）"
    if trace.get("conclusion") != "consistent":
        return "正反向结论尚未确认一致（REQ-MAP-05）"
    if trace.get("human_confirmed") is not True:
        return "正反向一致性须经人工确认后才能发布（REQ-MAP-05）"
    return None


def validate_function_card(card: Mapping[str, Any]) -> str | None:
    """Require the published recommendation and L2/L4 differentiation fields."""
    for field in FUNCTION_CARD_FIELDS:
        value = card.get(field)
        if field == "automation_levels":
            complete = isinstance(value, list) and bool(value) and all(
                isinstance(level, str) and level.strip() for level in value
            )
        else:
            complete = isinstance(value, str) and bool(value.strip())
        if not complete:
            return f"功能卡片字段 {field} 必须填写后才能发布（REQ-MAP-07）"
    return None
