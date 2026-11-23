"""Remove broken *.dist-info trees (missing RECORD) from the project venv.

Interrupted `uv sync` on Windows can leave a stale package metadata directory next
to the current wheel (e.g. onnxruntime 1.31 next to 1.32). The next `uv run`
then warns and reinstalls on every command until the broken tree is deleted.

Usage: uv run python scripts/repair_venv_metadata.py
       (or called from bootstrap.py before migrations)
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def repair_corrupt_wheel_metadata() -> list[str]:
    if sys.platform == "win32":
        site = ROOT / ".venv" / "Lib" / "site-packages"
    else:
        site = ROOT / ".venv" / "lib" / f"python{sys.version_info.major}.{sys.version_info.minor}" / "site-packages"
    if not site.is_dir():
        return []
    removed: list[str] = []
    for dist_info in site.glob("*.dist-info"):
        if (dist_info / "RECORD").is_file():
            continue
        shutil.rmtree(dist_info, ignore_errors=True)
        if not dist_info.exists():
            removed.append(dist_info.name)
    return removed


def main() -> int:
    removed = repair_corrupt_wheel_metadata()
    if removed:
        print("Removed corrupt wheel metadata:", ", ".join(removed), flush=True)
        print("Run: uv sync --locked", flush=True)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())