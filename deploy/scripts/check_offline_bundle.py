#!/usr/bin/env python3
"""Check an EEA offline bundle before shipping or installing it (OPS-02).

Single implementation shared by the Linux build/verify/install scripts, so it
also runs on a bare host that only has Python.

Verifies: manifest, every checksum, required layout, that the shipped Linux
site-packages tree already contains each pinned import, and that a CJK font
travels with the bundle.

Usage: python3 deploy/scripts/check_offline_bundle.py <bundle-dir> [--no-fonts]
"""
from __future__ import annotations

import hashlib
import importlib.metadata as md
import re
import sys
from pathlib import Path

REQUIRED_FILES = (
    "MANIFEST.txt",
    "SHA256SUMS",
    "backend/requirements.txt",
    "web/server.js",
    "deploy/eea-api.service",
    "deploy/eea-worker.service",
)
REQUIRED_DIRS = ("backend/site-packages", "web/.next/static", "web/public")
# Import names worth probing when their distribution is part of the bundle.
SMOKE_IMPORTS = {
    "fastapi": "fastapi",
    "sqlalchemy": "sqlalchemy",
    "alembic": "alembic",
    "numpy": "numpy",
    "reportlab": "reportlab",
    "jieba": "jieba",
    "pydantic-ai-slim": "pydantic_ai",
}
_REQ = re.compile(r"^([A-Za-z0-9_.\-]+)")


def _norm(name: str) -> str:
    return re.sub(r"[-_.]+", "-", name).lower()


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _installed_distributions(site: Path) -> set[str]:
    names: set[str] = set()
    for dist in md.distributions(path=[str(site)]):
        try:
            names.add(_norm(dist.metadata["Name"] or ""))
        except Exception:  # noqa: BLE001 - metadata is optional per distribution
            continue
    return {name for name in names if name}


def check(bundle: Path, *, require_fonts: bool = True) -> list[str]:
    problems: list[str] = []
    for rel in REQUIRED_FILES:
        if not (bundle / rel).is_file():
            problems.append(f"missing file: {rel}")
    for rel in REQUIRED_DIRS:
        if not (bundle / rel).is_dir():
            problems.append(f"missing directory: {rel}")
    if problems:
        return problems

    for line in (bundle / "SHA256SUMS").read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        expected, _, rel = line.partition("  ")
        path = bundle / rel.lstrip("./")
        if not path.is_file():
            problems.append(f"listed but absent: {rel}")
            continue
        if _sha256(path) != expected:
            problems.append(f"checksum mismatch: {rel}")

    site = bundle / "backend/site-packages"
    installed = _installed_distributions(site)
    for raw in (bundle / "backend/requirements.txt").read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        # uv export adds hash continuations and backslash breaks; only names count.
        if not line or line.startswith("#") or line.startswith("-"):
            continue
        line = line.rstrip("\\").strip()
        match = _REQ.match(line)
        if not match:
            continue
        name = _norm(match.group(1))
        if name not in installed:
            problems.append(f"site-packages lacks: {match.group(1)}")

    for dist, module in SMOKE_IMPORTS.items():
        if dist not in installed:
            continue
        if not ((site / module).is_dir() or list(site.glob(f"{module}*.py"))):
            problems.append(f"missing import: {module} ({dist})")

    fonts_dir = bundle / "runtime/fonts"
    fonts = list(fonts_dir.glob("*.tt[cf]")) if fonts_dir.is_dir() else []
    if not fonts and require_fonts:
        problems.append("no CJK font in runtime/fonts (PDF reports need one)")
    return problems


def main(argv: list[str]) -> int:
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 2
    bundle = Path(argv[0]).resolve()
    if not bundle.is_dir():
        print(f"FAIL: {bundle} is not a directory")
        return 1
    problems = check(bundle, require_fonts="--no-fonts" not in argv)
    for problem in problems:
        print(f"FAIL: {problem}")
    if problems:
        return 1
    print(f"OK {bundle.name}: {(bundle / 'MANIFEST.txt').read_text(encoding='utf-8').strip()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
