"""Declarative skill pack loader (YAML/JSON, no code execution)."""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path

import yaml

from app.core.config import get_settings


@dataclass(frozen=True)
class SkillPack:
    name: str
    version: str
    checksum: str
    rules: list[dict]


def load_skill_packs() -> list[SkillPack]:
    settings = get_settings()
    root = settings.skills_dir.strip()
    if not root:
        return []
    path = Path(root)
    if not path.is_dir():
        return []
    packs: list[SkillPack] = []
    for file in sorted(path.glob("*.yaml")) + sorted(path.glob("*.json")):
        raw = file.read_text(encoding="utf-8")
        checksum = hashlib.sha256(raw.encode("utf-8")).hexdigest()
        if file.suffix == ".json":
            data = json.loads(raw)
        else:
            data = yaml.safe_load(raw)
        packs.append(
            SkillPack(
                name=str(data.get("name") or file.stem),
                version=str(data.get("version") or "0"),
                checksum=checksum,
                rules=list(data.get("rules") or []),
            )
        )
    return packs


def baseline_mode() -> bool:
    return not load_skill_packs()
