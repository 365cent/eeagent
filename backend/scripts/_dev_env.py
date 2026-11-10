"""Shared dev environment: load backend/.env and default OBJECT_DIR."""
from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_dotenv_file(path: Path | None = None) -> None:
    path = path or (ROOT / ".env")
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].strip()
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        if key:
            os.environ.setdefault(key, value)


def ensure_object_dir() -> None:
    default = ROOT / ".pg" / "objects"
    if not os.environ.get("OBJECT_DIR"):
        os.environ["OBJECT_DIR"] = str(default)
    Path(os.environ["OBJECT_DIR"]).mkdir(parents=True, exist_ok=True)


def api_only() -> bool:
    return os.environ.get("EEA_DEV_API_ONLY", "").lower() in ("1", "true", "yes")
