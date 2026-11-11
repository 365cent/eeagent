"""Stub evaluation harness for classification skills (fixture-only)."""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

from app.services.skills import baseline_mode, load_skill_packs


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Evaluate declarative skill packs against a JSON fixture.")
    parser.add_argument("fixture", type=Path, help="JSON list of {input, expected} records")
    args = parser.parse_args(argv)
    cases = json.loads(args.fixture.read_text(encoding="utf-8"))
    packs = load_skill_packs()
    start = time.perf_counter()
    passed = 0
    for case in cases:
        expected = case.get("expected")
        if baseline_mode():
            actual = "baseline"
        else:
            actual = packs[0].name if packs else "baseline"
        if actual == expected:
            passed += 1
    elapsed = time.perf_counter() - start
    total = len(cases) or 1
    print(json.dumps({"passed": passed, "total": total, "accuracy_pct": round(100 * passed / total, 2), "seconds": elapsed}))
    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
