import json
import subprocess
import sys

import pytest

from app.services.skills import baseline_mode, load_skill_packs


def test_skill_baseline_mode_without_dir():
    assert baseline_mode() is True
    assert load_skill_packs() == []


def test_skill_eval_cli_json():
    from pathlib import Path

    backend = Path(__file__).resolve().parents[1]
    proc = subprocess.run(
        [sys.executable, "-m", "app.services.skill_eval", "--json"],
        cwd=backend,
        capture_output=True,
        text=True,
        check=False,
    )
    assert proc.returncode == 0, proc.stderr
    report = json.loads(proc.stdout)
    assert report["fixture_count"] >= 1
    assert "overall_percent" in report
