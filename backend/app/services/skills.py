"""Declarative business skill packs and deterministic rule application.

Packs are read-only YAML/JSON files under SKILLS_DIR. No code from a pack is
executed. Approved business rules take precedence over model suggestions and
frequency heuristics; conflicts are returned for the caller to persist.
"""
from __future__ import annotations

from dataclasses import dataclass
import hashlib
import json
import logging
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, ValidationError, model_validator
import yaml

from app.core.config import get_settings
from app.services.refcodes import codes

logger = logging.getLogger(__name__)

VALID_FIELDS = ("value_chain_stage", "signal_type", "tech_tags")
MATCH_KEYS = {"any", "all", "none"}


class SkillRule(BaseModel):
    id: str = Field(min_length=1, max_length=120)
    field: Literal["value_chain_stage", "signal_type", "tech_tags"]
    match: dict[str, list[str]] = Field(default_factory=dict)
    value: str | None = None
    add: list[str] = Field(default_factory=list)
    reason: str | None = None
    priority: int = 0

    @model_validator(mode="after")
    def _validate_rule(self):
        if not self.match or any(key not in MATCH_KEYS for key in self.match):
            raise ValueError("match must contain only any/all/none")
        for key, values in self.match.items():
            if not values or any(not isinstance(value, str) or not value.strip() for value in values):
                raise ValueError("match terms must be non-empty strings")
        if self.field in {"value_chain_stage", "signal_type"}:
            if not self.value:
                raise ValueError(self.field + " requires value")
            if self.add:
                raise ValueError(self.field + " cannot use add")
            if self.value not in codes(self.field):
                raise ValueError("unknown " + self.field + " code: " + self.value)
        else:
            if self.value is not None:
                raise ValueError("tech_tags rules cannot use value; use add")
            if not self.add or any(not tag.strip() for tag in self.add):
                raise ValueError("tech_tags rules require non-empty add terms")
        return self


class SkillPackFile(BaseModel):
    schema_version: int = Field(default=1, ge=1, le=1)
    name: str = Field(min_length=1, max_length=120)
    version: str = Field(min_length=1, max_length=80)
    applies_to: list[str] = Field(default_factory=list)
    rules: list[SkillRule] = Field(default_factory=list)

    @model_validator(mode="after")
    def _validate_pack(self):
        if any(field not in VALID_FIELDS for field in self.applies_to):
            raise ValueError("applies_to contains an unknown field")
        if not self.rules:
            raise ValueError("pack must contain at least one rule")
        return self


@dataclass(frozen=True)
class SkillPack:
    name: str
    version: str
    checksum: str
    source: str
    applies_to: tuple[str, ...]
    rules: tuple[SkillRule, ...]


@dataclass(frozen=True)
class SkillRegistry:
    packs: tuple[SkillPack, ...]
    errors: tuple[dict[str, str], ...]

    @property
    def baseline_mode(self) -> bool:
        return not self.packs

    @property
    def rule_count(self) -> int:
        return sum(len(pack.rules) for pack in self.packs)


@dataclass(frozen=True)
class SkillDecision:
    value_chain_stage: str | None
    signal_type: str | None
    tech_tags: tuple[str, ...]
    rules_applied: tuple[dict, ...]
    conflicts: tuple[dict, ...]
    pack_versions: tuple[str, ...]
    baseline_mode: bool

    def basis(self) -> dict:
        return {
            "baseline_mode": self.baseline_mode,
            "packs": list(self.pack_versions),
            "value_chain_stage": self.value_chain_stage,
            "signal_type": self.signal_type,
            "tech_tags": list(self.tech_tags),
            "rules_applied": list(self.rules_applied),
            "conflicts": list(self.conflicts),
        }


def _read_pack(path: Path) -> SkillPack:
    raw = path.read_text(encoding="utf-8")
    checksum = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    if path.suffix.lower() == ".json":
        data = json.loads(raw)
    else:
        data = yaml.safe_load(raw)
    if not isinstance(data, dict):
        raise ValueError("top-level document must be an object")
    model = SkillPackFile.model_validate(data)
    return SkillPack(
        name=model.name,
        version=model.version,
        checksum=checksum,
        source=path.name,
        applies_to=tuple(model.applies_to),
        rules=tuple(model.rules),
    )


def load_skill_registry(root: str | Path | None = None) -> SkillRegistry:
    settings = get_settings()
    raw_root = str(root) if root is not None else settings.skills_dir.strip()
    if not raw_root:
        return SkillRegistry((), ())
    path = Path(raw_root)
    if not path.is_dir():
        return SkillRegistry((), ())
    packs: list[SkillPack] = []
    errors: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()
    files = sorted(path.glob("*.yaml")) + sorted(path.glob("*.yml")) + sorted(path.glob("*.json"))
    for file in files:
        try:
            pack = _read_pack(file)
            key = (pack.name, pack.version)
            if key in seen:
                raise ValueError("duplicate pack name/version")
            seen.add(key)
            packs.append(pack)
        except (OSError, ValueError, ValidationError, yaml.YAMLError, json.JSONDecodeError) as exc:
            errors.append({"file": file.name, "error": str(exc)[:500]})
    return SkillRegistry(tuple(packs), tuple(errors))


def load_skill_packs() -> list[SkillPack]:
    return list(load_skill_registry().packs)


def baseline_mode() -> bool:
    return load_skill_registry().baseline_mode


def _matches(rule: SkillRule, haystack: str) -> bool:
    any_terms = [term.casefold() for term in rule.match.get("any", [])]
    if any_terms and not any(term in haystack for term in any_terms):
        return False
    all_terms = [term.casefold() for term in rule.match.get("all", [])]
    if all_terms and not all(term in haystack for term in all_terms):
        return False
    none_terms = [term.casefold() for term in rule.match.get("none", [])]
    if none_terms and any(term in haystack for term in none_terms):
        return False
    return True


def apply_skill_rules(
    title: str | None,
    text: str | None,
    *,
    registry: SkillRegistry | None = None,
) -> SkillDecision:
    active = registry or load_skill_registry()
    haystack = (str(title or "") + "\n" + str(text or "")).casefold()
    ordered: list[tuple[int, int, SkillPack, SkillRule]] = []
    for pack_index, pack in enumerate(active.packs):
        for rule_index, rule in enumerate(pack.rules):
            ordered.append((pack_index, rule_index, pack, rule))
    ordered.sort(key=lambda item: (-item[3].priority, item[0], item[1]))

    stage: str | None = None
    signal_type: str | None = None
    tags: list[str] = []
    applied: list[dict] = []
    conflicts: list[dict] = []
    stage_rule: dict | None = None
    type_rule: dict | None = None

    for _, _, pack, rule in ordered:
        if not _matches(rule, haystack):
            continue
        packed_rule = {
            "pack": pack.name,
            "version": pack.version,
            "rule": rule.id,
            "field": rule.field,
            "value": rule.value,
            "add": list(rule.add),
            "reason": rule.reason,
            "priority": rule.priority,
        }
        applied.append(packed_rule)
        if rule.field == "value_chain_stage":
            if stage is None:
                stage = rule.value
                stage_rule = packed_rule
            elif stage != rule.value:
                conflicts.append(
                    {
                        "field": rule.field,
                        "kept": stage,
                        "ignored": rule.value,
                        "kept_rule": stage_rule,
                        "ignored_rule": packed_rule,
                        "reason": rule.reason or "higher-priority business rule wins",
                    }
                )
        elif rule.field == "signal_type":
            if signal_type is None:
                signal_type = rule.value
                type_rule = packed_rule
            elif signal_type != rule.value:
                conflicts.append(
                    {
                        "field": rule.field,
                        "kept": signal_type,
                        "ignored": rule.value,
                        "kept_rule": type_rule,
                        "ignored_rule": packed_rule,
                        "reason": rule.reason or "higher-priority business rule wins",
                    }
                )
        else:
            for tag in rule.add:
                if tag not in tags:
                    tags.append(tag)

    versions = tuple(
        pack.name + "@" + pack.version + ":" + pack.checksum[:12] for pack in active.packs
    )
    return SkillDecision(
        value_chain_stage=stage,
        signal_type=signal_type,
        tech_tags=tuple(tags),
        rules_applied=tuple(applied),
        conflicts=tuple(conflicts),
        pack_versions=versions,
        baseline_mode=active.baseline_mode,
    )
