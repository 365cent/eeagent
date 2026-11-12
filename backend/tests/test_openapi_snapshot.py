"""Committed OpenAPI path inventory — catches accidental route surface drift."""

from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

pytestmark = pytest.mark.no_db

BACKEND_ROOT = Path(__file__).resolve().parent.parent
SNAPSHOT_PATH = Path(__file__).resolve().parent / "snapshots" / "openapi_paths.json"


def _openapi_path_keys() -> list[str]:
    from app.main import app

    return sorted(app.openapi()["paths"].keys())


def _update_snapshot_enabled() -> bool:
    return os.environ.get("OPENAPI_UPDATE_SNAPSHOT", "").strip().lower() in (
        "1",
        "true",
        "yes",
    )


def test_openapi_paths_match_snapshot() -> None:
    current = _openapi_path_keys()
    SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)

    if not SNAPSHOT_PATH.is_file():
        SNAPSHOT_PATH.write_text(
            json.dumps(current, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        pytest.fail(
            f"Created missing snapshot at {SNAPSHOT_PATH.relative_to(BACKEND_ROOT)}; "
            "review and commit it, or set OPENAPI_UPDATE_SNAPSHOT=1 to refresh deliberately."
        )

    expected = json.loads(SNAPSHOT_PATH.read_text(encoding="utf-8"))
    if current != expected:
        if _update_snapshot_enabled():
            SNAPSHOT_PATH.write_text(
                json.dumps(current, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            pytest.fail(
                f"Updated {SNAPSHOT_PATH.relative_to(BACKEND_ROOT)} "
                "(OPENAPI_UPDATE_SNAPSHOT=1); review diff and commit."
            )
        added = sorted(set(current) - set(expected))
        removed = sorted(set(expected) - set(current))
        details: list[str] = []
        if added:
            details.append("added:\n  " + "\n  ".join(added))
        if removed:
            details.append("removed:\n  " + "\n  ".join(removed))
        pytest.fail(
            "OpenAPI path keys differ from snapshot.\n"
            + "\n".join(details)
            + f"\n\nTo refresh: OPENAPI_UPDATE_SNAPSHOT=1 uv run pytest {Path(__file__).name}"
        )
