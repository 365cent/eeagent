"""Repeatable business skill and classification evaluation (BE-13).

This runner is deterministic: it applies declarative skill rules, then local
keyword/frequency fallbacks. It never calls the chat, embedding or rerank
gateway. A synthetic fixture is clearly marked; real accuracy requires DOC-02.
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import yaml

from app.services.judgment import judge_signal_type, judge_stage
from app.services.skills import (
    SkillRegistry,
    apply_skill_rules,
    load_skill_registry,
)
from app.services.tagging import suggest_tags, text_for_tagging

THRESHOLDS = {"overall": 70.0, "stage": 90.0, "other": 80.0}


def _synthetic_samples() -> list[dict]:
    rows = [
        ("供应链发布 48V 智能配电方案", "器件厂商推出 eFuse 与智能配电控制器，面向主机厂供货", "creation_supply", "technology", ["eFuse", "智能配电"]),
        ("主机厂域控制器架构升级", "主机厂发布区域控制器与中央计算平台，推动架构升级", "delivery_oem", "technology", ["域控制器", "中央计算"]),
        ("消费者关注智能驾驶体验", "消费者对智能驾驶与座舱体验提出新需求", "realization_consumer", "strategy", ["智能驾驶", "座舱"]),
        ("行业标准发布功能安全规范", "行业标准组织发布功能安全认证规范", "regulation_standard", "standard", ["功能安全", "认证"]),
        ("芯片企业完成新一轮融资", "半导体厂商完成融资并扩建研发团队", "creation_supply", "capital", ["融资", "半导体"]),
        ("供应商发布电子熔断参考设计", "器件厂商发布 eFuse 参考设计与热管理方案", "creation_supply", "technology", ["eFuse", "热管理"]),
        ("主机厂推进 800V 高压平台", "主机厂宣布 800V 高压平台定点验证", "delivery_oem", "technology", ["高压平台", "定点"]),
        ("消费者调研显示充电焦虑", "消费者调研显示充电速度与续航仍是主要顾虑", "realization_consumer", "strategy", ["充电", "续航"]),
        ("法规要求电池安全监测", "监管机构发布电池安全监测法规要求", "regulation_standard", "standard", ["电池安全", "法规"]),
        ("芯片厂商招聘功能安全团队", "半导体厂商招聘功能安全与验证工程师", "creation_supply", "talent", ["功能安全", "招聘"]),
        ("区域控制器进入量产", "主机厂区域控制器完成验证并进入量产", "delivery_oem", "technology", ["区域控制器", "量产"]),
        ("用户体验成为差异化重点", "车企将座舱体验作为消费者差异化重点", "realization_consumer", "strategy", ["座舱", "用户体验"]),
        ("行业联盟发布通信规范", "行业联盟发布车载以太网通信规范", "regulation_standard", "standard", ["车载以太网", "通信"]),
        ("电源管理芯片需求增长", "供应链企业看到电源管理芯片需求持续增长", "creation_supply", "strategy", ["电源管理", "需求"]),
        ("主机厂投资智能配电生态", "主机厂通过生态合作布局智能配电", "delivery_oem", "strategy", ["智能配电", "生态合作"]),
        ("消费者对 OTA 升级提出要求", "消费者希望车辆通过 OTA 持续升级功能", "realization_consumer", "technology", ["OTA", "升级"]),
        ("认证机构新增网络安全要求", "认证机构新增整车网络安全准入要求", "regulation_standard", "standard", ["网络安全", "认证"]),
        ("工具链厂商发布仿真平台", "工具链厂商发布区域控制器仿真与测试平台", "creation_supply", "technology", ["工具链", "仿真"]),
        ("主机厂调整电子电气架构", "主机厂调整电子电气架构并合并控制器", "delivery_oem", "strategy", ["电子电气架构", "控制器"]),
        ("消费者反馈维修成本", "消费者反馈智能部件维修成本上升", "realization_consumer", "strategy", ["维修成本", "智能部件"]),
    ]
    return [
        {
            "id": "synthetic-" + str(index + 1).zfill(2),
            "title": title,
            "text": text,
            "expected": {
                "value_chain_stage": stage,
                "signal_type": signal_type,
                "tech_tags": tags,
            },
        }
        for index, (title, text, stage, signal_type, tags) in enumerate(rows)
    ]


def _load_gold_set(path: str | Path | None) -> dict:
    if path is None:
        return {
            "name": "synthetic-20",
            "synthetic": True,
            "samples": _synthetic_samples(),
        }
    raw = Path(path).read_text(encoding="utf-8")
    data = json.loads(raw) if Path(path).suffix.lower() == ".json" else yaml.safe_load(raw)
    if not isinstance(data, dict) or not isinstance(data.get("samples"), list):
        raise ValueError("gold set must be an object with a samples list")
    return data


def _tag_match(expected: str, predicted: str) -> bool:
    return expected == predicted or expected in predicted or predicted in expected


def _sample_result(sample: dict, registry: SkillRegistry) -> dict:
    title = str(sample.get("title") or "")
    text = str(sample.get("text") or "")
    expected = sample.get("expected") or {}
    decision = apply_skill_rules(title, text, registry=registry)
    predicted_stage = decision.value_chain_stage or judge_stage(title, text_for_tagging(title, text))
    predicted_type = decision.signal_type or judge_signal_type(title, text_for_tagging(title, text))
    auto_tags = suggest_tags(text_for_tagging(title, text), limit=9)
    predicted_tags = list(decision.tech_tags)
    for tag in auto_tags:
        if tag not in predicted_tags:
            predicted_tags.append(tag)

    checks: dict[str, bool | None] = {}
    if expected.get("value_chain_stage"):
        checks["value_chain_stage"] = predicted_stage == expected["value_chain_stage"]
    if expected.get("signal_type"):
        checks["signal_type"] = predicted_type == expected["signal_type"]
    expected_tags = [str(tag) for tag in (expected.get("tech_tags") or [])]
    if expected_tags:
        checks["tech_tags"] = any(
            _tag_match(term, predicted)
            for term in expected_tags
            for predicted in predicted_tags
        )
    return {
        "id": sample.get("id"),
        "expected": expected,
        "predicted": {
            "value_chain_stage": predicted_stage,
            "signal_type": predicted_type,
            "tech_tags": predicted_tags,
            "skill_rules": list(decision.rules_applied),
            "conflicts": list(decision.conflicts),
        },
        "checks": checks,
        "pass": all(value for value in checks.values() if value is not None),
    }


def _accuracy(rows: list[dict], field: str) -> tuple[int, int, float]:
    applicable = [row for row in rows if row["checks"].get(field) is not None]
    correct = sum(1 for row in applicable if row["checks"][field])
    percent = round(correct / len(applicable) * 100, 2) if applicable else 0.0
    return correct, len(applicable), percent


def evaluate_gold_set(gold_set: dict, *, registry: SkillRegistry | None = None) -> dict:
    active = registry or load_skill_registry()
    samples = list(gold_set.get("samples") or [])
    started = time.perf_counter()
    rows = [_sample_result(sample, active) for sample in samples]
    elapsed_ms = round((time.perf_counter() - started) * 1000, 2)

    stage_correct, stage_total, stage_accuracy = _accuracy(rows, "value_chain_stage")
    type_correct, type_total, type_accuracy = _accuracy(rows, "signal_type")
    tag_correct, tag_total, tag_accuracy = _accuracy(rows, "tech_tags")
    total_checks = stage_total + type_total + tag_total
    total_correct = stage_correct + type_correct + tag_correct
    overall = round(total_correct / total_checks * 100, 2) if total_checks else 0.0
    thresholds_met = (
        overall >= THRESHOLDS["overall"]
        and stage_accuracy >= THRESHOLDS["stage"]
        and type_accuracy >= THRESHOLDS["other"]
        and tag_accuracy >= THRESHOLDS["other"]
    )
    failures = [
        row
        for row in rows
        if any(value is False for value in row["checks"].values())
    ]
    return {
        "gold_set": gold_set.get("name") or "unnamed",
        "synthetic": bool(gold_set.get("synthetic", False)),
        "baseline_mode": active.baseline_mode,
        "skill_packs": [
            {
                "name": pack.name,
                "version": pack.version,
                "checksum": pack.checksum[:12],
                "rules": len(pack.rules),
            }
            for pack in active.packs
        ],
        "skill_errors": list(active.errors),
        "fixture_count": len(rows),
        "overall_percent": overall,
        "stage": {"correct": stage_correct, "total": stage_total, "percent": stage_accuracy},
        "signal_type": {"correct": type_correct, "total": type_total, "percent": type_accuracy},
        "tech_tags": {"correct": tag_correct, "total": tag_total, "percent": tag_accuracy},
        "thresholds": THRESHOLDS,
        "thresholds_met": thresholds_met,
        "latency_ms": elapsed_ms,
        "failures": failures,
        "samples": rows,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate business skill packs against a gold set")
    parser.add_argument("--gold-set", type=Path, help="YAML/JSON gold set path")
    parser.add_argument("--json", action="store_true", help="Print machine-readable report")
    parser.add_argument("--strict", action="store_true", help="Exit 1 when thresholds fail")
    args = parser.parse_args()

    gold_set = _load_gold_set(args.gold_set)
    report = evaluate_gold_set(gold_set)
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(
            "overall=" + str(report["overall_percent"]) + "% "
            + "stage=" + str(report["stage"]["percent"]) + "% "
            + "type=" + str(report["signal_type"]["percent"]) + "% "
            + "tags=" + str(report["tech_tags"]["percent"]) + "% "
            + "fixtures=" + str(report["fixture_count"])
            + " baseline=" + str(report["baseline_mode"]).lower()
        )
    if report["baseline_mode"]:
        return
    if args.strict:
        if not report["thresholds_met"]:
            raise SystemExit(1)
    elif report["overall_percent"] < THRESHOLDS["overall"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
