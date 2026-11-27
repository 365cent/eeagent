import json
import subprocess
import sys
from pathlib import Path

import pytest

from app.domains.skills.eval import evaluate_gold_set
from app.domains.skills.service import (
    SkillRegistry,
    apply_skill_rules,
    baseline_mode,
    load_skill_packs,
    load_skill_registry,
)

pytestmark = pytest.mark.no_db


def _write_pack(path: Path) -> None:
    path.write_text(
        json.dumps(
            {
                "schema_version": 1,
                "name": "synthetic-business-rules",
                "version": "2026.11.1",
                "applies_to": ["value_chain_stage", "signal_type", "tech_tags"],
                "rules": [
                    {
                        "id": "stage-high",
                        "field": "value_chain_stage",
                        "match": {"any": ["eFuse"]},
                        "value": "creation_supply",
                        "priority": 10,
                        "reason": "eFuse supply-side signal",
                    },
                    {
                        "id": "stage-low",
                        "field": "value_chain_stage",
                        "match": {"any": ["eFuse"]},
                        "value": "delivery_oem",
                        "priority": 1,
                    },
                    {
                        "id": "type",
                        "field": "signal_type",
                        "match": {"any": ["eFuse"]},
                        "value": "technology",
                        "priority": 5,
                    },
                    {
                        "id": "tags",
                        "field": "tech_tags",
                        "match": {"all": ["eFuse", "智能配电"]},
                        "add": ["eFuse", "智能配电"],
                        "priority": 5,
                    },
                ],
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


def test_skill_baseline_mode_without_dir():
    assert baseline_mode() is True
    assert load_skill_packs() == []


def test_skill_registry_loads_valid_pack(tmp_path):
    _write_pack(tmp_path / "pack.json")
    registry = load_skill_registry(tmp_path)
    assert registry.baseline_mode is False
    assert registry.rule_count == 4
    assert registry.errors == ()
    assert registry.packs[0].version == "2026.11.1"


def test_apply_skill_rules_uses_priority_and_records_conflict(tmp_path):
    _write_pack(tmp_path / "pack.json")
    decision = apply_skill_rules(
        "eFuse 智能配电",
        "器件厂商发布参考设计",
        registry=load_skill_registry(tmp_path),
    )
    assert decision.value_chain_stage == "creation_supply"
    assert decision.signal_type == "technology"
    assert decision.tech_tags == ("eFuse", "智能配电")
    assert decision.baseline_mode is False
    assert len(decision.conflicts) == 1
    conflict = decision.conflicts[0]
    assert conflict["kept"] == "creation_supply"
    assert conflict["ignored"] == "delivery_oem"
    assert conflict["kept_rule"]["rule"] == "stage-high"


def test_skill_registry_rejects_invalid_and_duplicate_packs(tmp_path):
    bad = {
        "name": "bad",
        "version": "1",
        "rules": [
            {
                "id": "bad-stage",
                "field": "value_chain_stage",
                "match": {"any": ["x"]},
                "value": "not-a-stage",
            }
        ],
    }
    (tmp_path / "bad.json").write_text(json.dumps(bad), encoding="utf-8")
    _write_pack(tmp_path / "one.json")
    _write_pack(tmp_path / "two.json")
    registry = load_skill_registry(tmp_path)
    assert len(registry.packs) == 1
    assert len(registry.errors) == 2
    assert any("unknown value_chain_stage" in row["error"] for row in registry.errors)
    assert any("duplicate pack name/version" in row["error"] for row in registry.errors)


def test_evaluate_gold_set_reports_dimensions_and_thresholds(tmp_path):
    _write_pack(tmp_path / "pack.json")
    registry = load_skill_registry(tmp_path)
    gold_set = {
        "name": "synthetic-two",
        "synthetic": True,
        "samples": [
            {
                "id": "one",
                "title": "eFuse 智能配电",
                "text": "器件厂商发布参考设计",
                "expected": {
                    "value_chain_stage": "creation_supply",
                    "signal_type": "technology",
                    "tech_tags": ["eFuse"],
                },
            },
            {
                "id": "two",
                "title": "eFuse 控制器",
                "text": "智能配电方案进入验证",
                "expected": {
                    "value_chain_stage": "creation_supply",
                    "signal_type": "technology",
                    "tech_tags": ["智能配电"],
                },
            },
        ],
    }
    report = evaluate_gold_set(gold_set, registry=registry)
    assert report["fixture_count"] == 2
    assert report["overall_percent"] == 100.0
    assert report["stage"]["percent"] == 100.0
    assert report["signal_type"]["percent"] == 100.0
    assert report["tech_tags"]["percent"] == 100.0
    assert report["thresholds_met"] is True
    assert report["baseline_mode"] is False
    assert report["samples"][0]["predicted"]["value_chain_stage"] == "creation_supply"


def test_evaluate_gold_set_baseline_is_explicit():
    gold_set = {
        "name": "synthetic-baseline",
        "synthetic": True,
        "samples": [
            {
                "id": "one",
                "title": "供应链发布方案",
                "text": "器件厂商",
                "expected": {"value_chain_stage": "creation_supply"},
            }
        ],
    }
    report = evaluate_gold_set(gold_set, registry=SkillRegistry((), ()))
    assert report["baseline_mode"] is True
    assert report["fixture_count"] == 1


def test_skill_eval_cli_json():
    backend = Path(__file__).resolve().parents[1]
    proc = subprocess.run(
        [sys.executable, "-m", "app.domains.skills.eval", "--json"],
        cwd=backend,
        capture_output=True,
        text=True,
        check=False,
    )
    assert proc.returncode == 0, proc.stderr
    report = json.loads(proc.stdout)
    assert report["fixture_count"] == 20
    assert report["synthetic"] is True
    assert "overall_percent" in report
