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
import time
from pathlib import Path

from app.core.config import get_settings


def _object_path(key: str) -> Path:
    # Lexical containment only: Path.resolve() races with concurrent directory
    # creation on Windows and can return a short-name form that is not
    # is_relative_to() the long-name root. Keys are server-generated
    # (content-addressed), so traversal rejection is the security boundary.
    root = os.path.abspath(get_settings().object_dir)
    candidate = Path(key)
    if candidate.is_absolute():
        raise ValueError("object key must stay inside OBJECT_DIR")
    try:
        path = os.path.abspath(os.path.join(root, key))
        if os.path.commonpath([root, path]) != root:
            raise ValueError("object key must stay inside OBJECT_DIR")
    except ValueError as exc:
        if "must stay inside" in str(exc):
            raise
        raise ValueError("object key must stay inside OBJECT_DIR") from exc
    return Path(path)


def _publish(temporary: str, path: Path, data: bytes) -> None:
    """Publish a temp file at a content-addressed path.

    On Windows two writers of identical bytes can race on os.replace and one
    gets a sharing violation. The destination is content-addressed, so a
    same-size file already published by the other writer is success.
    """
    for attempt in range(5):
        try:
            os.replace(temporary, path)
            return
        except PermissionError:
            try:
                if path.stat().st_size == len(data):
                    os.unlink(temporary)
                    return
            except FileNotFoundError:
                pass
            if attempt == 4:
                raise
            time.sleep(0.01 * (attempt + 1))


def _atomic_write(path: Path, data: bytes) -> None:
    """Write a complete object before publishing its content-addressed path."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        _publish(temporary, path, data)
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


def object_mtime(key: str) -> float | None:
    """Epoch seconds for one stored object, or None when it is absent."""
    if not key:
        return None
    path = _object_path(key)
    try:
        return path.stat().st_mtime
    except FileNotFoundError:
        return None


def delete_object(key: str) -> bool:
    """Remove one stored object; False when it was already absent."""
    if not key:
        return False
    path = _object_path(key)
    try:
        path.unlink()
        return True
    except FileNotFoundError:
        return False


def load_bytes(key: str) -> bytes | None:
    """Read a raw byte object back verbatim (archive replay); None when missing."""
    path = _object_path(key)
    if not path.is_file():
        return None
    return path.read_bytes()


def put_object(key: str, data: bytes) -> str:
    """Write bytes at a stable logical key (deck preview assets, manifests)."""
    path = _object_path(key)
    _atomic_write(path, data)
    return key


def save_body(text: str) -> str:
    """Persist a snapshot body and return its content-addressed object key."""
    return save_bytes(text.encode("utf-8"), folder="signals", ext="txt")


def load_body(key: str) -> str | None:
    """Read a snapshot body back; None when the object is missing."""
    path = _object_path(key)
    if not path.is_file():
        return None
    return path.read_text(encoding="utf-8")
