"""Raw document upload (W2 B4, WBS 1.2.4): POST /documents/raw stores the
multipart blob verbatim (documents/{sha}.bin) and returns a content-addressed
handle — no parsing artifacts; MarkItDown/MinerU stay W4 eea-doc-ingest
(backend/TODO.md B4, docs/platform-implementation-plan.md §7.1)."""

import hashlib
from pathlib import Path

import psycopg
import pytest

from app.core.config import get_settings
from app.services.objectstore import load_bytes

pytestmark = pytest.mark.anyio

DOC_BYTES = "48V 供电网络白皮书：eFuse 与区域控制器架构综述。".encode("utf-8")


async def _upload(client, content: bytes, filename="report.txt", mime="text/plain"):
    return await client.post(
        "/api/v1/documents/raw",
        files={"file": (filename, content, mime)},
    )


async def test_upload_returns_content_addressed_handle(client):
    r = await _upload(client, DOC_BYTES)
    assert r.status_code == 201, r.text
    body = r.json()
    # exactly the promised handle — no parsing artifacts (W2 stores bytes only)
    # W4 adds ingest fields; the content-addressed handle keys must still be there.
    assert {"id", "sha256", "mime", "size", "ingest_status", "figure_count"} <= set(body)
    assert body["sha256"] == hashlib.sha256(DOC_BYTES).hexdigest()
    assert body["size"] == len(DOC_BYTES)
    assert body["mime"] == "text/plain"


async def test_blob_is_readable_back(client):
    """The stored object reads back byte-identical (content-addressed key)."""
    sig = (await _upload(client, DOC_BYTES)).json()
    blob = load_bytes(f"documents/{sig['sha256']}.bin")
    assert blob == DOC_BYTES
    path = Path(get_settings().object_dir) / "documents" / f"{sig['sha256']}.bin"
    assert path.read_bytes() == DOC_BYTES


async def test_reupload_same_bytes_returns_same_id(client):
    """Idempotent by content: re-uploading identical bytes never creates a
    second row — the same sha always resolves to the same document id."""
    first = (await _upload(client, DOC_BYTES, filename="a.txt")).json()
    second = (await _upload(client, DOC_BYTES, filename="b.txt")).json()
    assert first["id"] == second["id"]
    assert first["sha256"] == second["sha256"]


async def test_different_bytes_get_different_ids(client):
    a = (await _upload(client, DOC_BYTES)).json()
    b = (await _upload(client, "另一份完全不同的文档内容。".encode("utf-8"))).json()
    assert a["id"] != b["id"]
    assert a["sha256"] != b["sha256"]


async def test_empty_file_is_rejected(client):
    """A zero-byte upload is refused (422) — no eea_document row is stored."""
    r = await _upload(client, b"")
    assert r.status_code == 422
    assert "file" in r.text


async def test_concurrent_duplicate_upload_returns_existing_row(client, monkeypatch):
    """Idempotency holds even when a racing request with the same bytes commits
    between this request's SELECT and its INSERT: the loser's ON CONFLICT DO
    NOTHING yields no row and it re-selects the winner's committed row — never
    a 500 on uq_document_sha256 (docstring promise: same bytes -> same row).

    The race is forced deterministically: the patched save_bytes commits a
    competing row with the same digest from a SECOND connection at the exact
    point where the endpoint sits between SELECT and INSERT.
    """
    import app.domains.evidence.document_pipeline as documents_api

    original_save_bytes = documents_api.save_bytes
    raced = {"done": False}

    def racing_save_bytes(data, *, folder, ext):
        # first (and only) call: commit the winner's row from another connection
        if not raced["done"]:
            raced["done"] = True
            digest = hashlib.sha256(data).hexdigest()
            dsn = (
                f"host={get_settings().db_host} port={get_settings().db_port} "
                f"user={get_settings().db_user} password={get_settings().db_password} "
                f"dbname={get_settings().db_name}"
            )
            with psycopg.connect(dsn, autocommit=True) as conn:
                conn.execute(
                    "INSERT INTO eea_document (id, sha256, mime, size, filename, object_key, uploaded_by) "
                    "VALUES (gen_random_uuid(), %s, 'application/pdf', 1, 'racer.bin', 'documents/racer.bin', 'local-admin')",
                    (digest,),
                )
        return original_save_bytes(data, folder=folder, ext=ext)

    monkeypatch.setattr(documents_api, "save_bytes", racing_save_bytes)
    r = await _upload(client, DOC_BYTES)
    assert r.status_code == 201, r.text
    body = r.json()
    # the loser must return the racing winner's row, not crash with 500
    # W4 adds ingest fields; the content-addressed handle keys must still be there.
    assert {"id", "sha256", "mime", "size", "ingest_status", "figure_count"} <= set(body)
    assert body["sha256"] == hashlib.sha256(DOC_BYTES).hexdigest()
    assert body["mime"] == "application/pdf"  # the racer's row, proving re-select
    # still exactly one row for these bytes
    dsn = (
        f"host={get_settings().db_host} port={get_settings().db_port} "
        f"user={get_settings().db_user} password={get_settings().db_password} "
        f"dbname={get_settings().db_name}"
    )
    with psycopg.connect(dsn) as conn:
        count = conn.execute(
            "SELECT count(*) FROM eea_document WHERE sha256 = %s",
            (body["sha256"],),
        ).fetchone()[0]
    assert count == 1
