"""Local object storage for signal snapshot bodies (BOUND-OBJECT-STORAGE).

During development bodies are written to a local directory (OBJECT_DIR,
default backend/.pg/objects); the DB keeps only the object reference
(SCHEMA-SIGNAL-SNAPSHOT). Production S3 stays deployment scope
(docs/platform-implementation-plan.md:420).
"""
from __future__ import annotations

import hashlib
import os
import tempfile
from pathlib import Path

from app.core.config import get_settings


def _object_path(key: str) -> Path:
    root = Path(get_settings().object_dir).resolve()
    path = (root / key).resolve()
    if not path.is_relative_to(root):
        raise ValueError("object key must stay inside OBJECT_DIR")
    return path


def _atomic_write(path: Path, data: bytes) -> None:
    """Write a complete object before publishing its content-addressed path."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        try:
            os.unlink(temporary)
        except FileNotFoundError:
            pass


def sha256_bytes(data: bytes) -> str:
    """Content hash for raw byte objects (single source for save_bytes)."""
    return hashlib.sha256(data).hexdigest()


def save_bytes(data: bytes, *, folder: str, ext: str) -> str:
    """Persist raw bytes (B1) and return the content-addressed object key,
    e.g. save_bytes(html, folder='signals', ext='html') -> 'signals/{sha}.html'.
    Idempotent: identical bytes always map to the same key and rewrite the
    same file, so concurrent duplicate writes cannot diverge."""
    key = f"{folder}/{sha256_bytes(data)}.{ext}"
    path = _object_path(key)
    _atomic_write(path, data)
    return key


def load_bytes(key: str) -> bytes | None:
    """Read a raw byte object back verbatim (archive replay); None when missing."""
    path = _object_path(key)
    if not path.is_file():
        return None
    return path.read_bytes()


def save_body(text: str) -> str:
    """Persist a snapshot body and return its content-addressed object key."""
    return save_bytes(text.encode("utf-8"), folder="signals", ext="txt")


def load_body(key: str) -> str | None:
    """Read a snapshot body back; None when the object is missing."""
    path = _object_path(key)
    if not path.is_file():
        return None
    return path.read_text(encoding="utf-8")
