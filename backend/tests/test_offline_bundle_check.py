"""Offline bundle checker (OPS-02): guards the artifact contract.

The bundle itself is built on a connected Linux machine; here we only prove the
checker rejects an incomplete bundle and accepts a complete one, so a broken
build cannot be carried to the intranet.
"""

import hashlib
import importlib.util
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parents[2] / "deploy" / "scripts" / "check_offline_bundle.py"


def _load():
    spec = importlib.util.spec_from_file_location("check_offline_bundle", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


def _write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def _bundle(root: Path, *, with_dist: bool = True, with_font: bool = True) -> Path:
    bundle = root / "eea-offline-v9"
    _write(bundle / "backend/requirements.txt", "fastapi==0.121.0\n")
    _write(bundle / "web/server.js", "// server\n")
    for unit in ("eea-api.service", "eea-worker.service"):
        _write(bundle / f"deploy/{unit}", "[Service]\n")
    (bundle / "web/.next/static").mkdir(parents=True)
    (bundle / "web/public").mkdir(parents=True)
    site = bundle / "backend/site-packages"
    site.mkdir(parents=True)
    if with_dist:
        _write(site / "fastapi-0.121.0.dist-info/METADATA", "Name: fastapi\nVersion: 0.121.0\n")
        (site / "fastapi").mkdir()
    if with_font:
        (bundle / "runtime/fonts").mkdir(parents=True)
        (bundle / "runtime/fonts/NotoSansCJK.ttc").write_bytes(b"font")
    _write(bundle / "MANIFEST.txt", "version=v9\n")
    lines = []
    for path in sorted(bundle.rglob("*")):
        if path.is_file() and path.name != "SHA256SUMS":
            rel = "./" + path.relative_to(bundle).as_posix()
            lines.append(f"{hashlib.sha256(path.read_bytes()).hexdigest()}  {rel}")
    _write(bundle / "SHA256SUMS", "\n".join(lines) + "\n")
    return bundle


def test_complete_bundle_passes(tmp_path):
    checker = _load()
    assert checker.check(_bundle(tmp_path)) == []


def test_missing_site_packages_is_reported(tmp_path):
    checker = _load()
    problems = checker.check(_bundle(tmp_path, with_dist=False))
    assert any("lacks: fastapi" in p for p in problems)
    assert any("fastapi" in p for p in problems)


def test_missing_font_is_reported_unless_waived(tmp_path):
    checker = _load()
    bundle = _bundle(tmp_path, with_font=False)
    assert any("CJK font" in p for p in checker.check(bundle))
    assert checker.check(bundle, require_fonts=False) == []


def test_tampered_file_is_reported(tmp_path):
    checker = _load()
    bundle = _bundle(tmp_path)
    (bundle / "web/server.js").write_text("// changed\n", encoding="utf-8")
    assert any("checksum mismatch: ./web/server.js" in p for p in checker.check(bundle))


def test_missing_manifest_is_reported(tmp_path):
    checker = _load()
    bundle = _bundle(tmp_path)
    (bundle / "MANIFEST.txt").unlink()
    assert any("MANIFEST.txt" in p for p in checker.check(bundle))
