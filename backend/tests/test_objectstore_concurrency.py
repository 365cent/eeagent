"""Content-addressed object writes survive concurrent identical publishes."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pytest

from app.services.objectstore import _object_path, load_bytes, save_bytes

pytestmark = pytest.mark.no_db

DATA = b"<html><body>" + b"concurrent-object-" * 512 + b"</body></html>"


def _save(_):
    return save_bytes(DATA, folder="signals", ext="html")


def test_concurrent_identical_saves_publish_one_file():
    with ThreadPoolExecutor(max_workers=8) as pool:
        keys = list(pool.map(_save, range(32)))
    assert len(set(keys)) == 1
    assert load_bytes(keys[0]) == DATA


def test_publish_accepts_a_concurrent_identical_winner(monkeypatch):
    import app.services.objectstore as store

    existing = save_bytes(DATA, folder="signals", ext="html")

    def sharing_violation(src, dst):
        # Another writer already published these exact bytes.
        assert Path(dst).stat().st_size == len(DATA)
        raise PermissionError(13, "sharing violation")

    monkeypatch.setattr(store.os, "replace", sharing_violation)
    key = save_bytes(DATA, folder="signals", ext="html")
    assert key == existing
    assert load_bytes(key) == DATA


def test_publish_retries_transient_permission_error(monkeypatch):
    import app.services.objectstore as store

    data = DATA + b"retry"
    calls = {"count": 0}
    real_replace = store.os.replace

    def flaky_replace(src, dst):
        calls["count"] += 1
        if calls["count"] == 1:
            raise PermissionError(13, "sharing violation")
        return real_replace(src, dst)

    monkeypatch.setattr(store.os, "replace", flaky_replace)
    key = save_bytes(data, folder="signals", ext="html")
    assert calls["count"] >= 2
    assert load_bytes(key) == data


def test_object_key_traversal_is_rejected():
    absolute = str(Path.cwd() / "outside.bin")
    for key in ("../outside.bin", "signals/../../outside.bin", absolute):
        with pytest.raises(ValueError, match="OBJECT_DIR"):
            _object_path(key)
