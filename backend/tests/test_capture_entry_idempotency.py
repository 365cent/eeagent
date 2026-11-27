"""Submission-id idempotency across the capture entry points.

The sync POST /capture and the durable POST /capture/jobs must agree on what
"the same submission" means: same id + same payload replays the existing
result, same id + different payload conflicts, and one submission never
creates two signals.
"""

from __future__ import annotations

import asyncio
import uuid

import pytest
from sqlalchemy import func, select

from app.db.base import SessionLocal
from app.models.models import Signal
from app.services.capture_jobs import claim_next_job, make_worker_id, run_claimed_job
from tests.test_capture import ARCHIVE_HTML

pytestmark = pytest.mark.anyio

PAGE_URL = "https://mp.weixin.qq.com/s/efuse-entry-idempotency"


@pytest.fixture
def fake_doc_ingest(monkeypatch):
    async def _ingest(data, filename, mime, **kwargs):
        from app.domains.evidence.doc_ingest import IngestResult

        return IngestResult(
            canonical_md="# Entry idempotency\n\nBody for the cross-entry test.",
            markitdown_version="test-entry",
            figures=[],
        )

    monkeypatch.setattr("app.domains.evidence.document_pipeline.ingest_document", _ingest)
    return _ingest


def _html_files() -> dict:
    return {"file": ("page.html", ARCHIVE_HTML.encode("utf-8"), "text/html")}


def _pptx_files() -> dict:
    return {
        "file": (
            "deck.pptx",
            b"pptx-entry-bytes",
            "application/octet-stream",
        )
    }


def _form(submission_id: uuid.UUID, url: str | None = None) -> dict:
    form = {"submission_id": str(submission_id)}
    if url is not None:
        form["url"] = url
    return form


async def _sync_capture(client, submission_id, files, url=None):
    return await client.post(
        "/api/v1/capture", data=_form(submission_id, url), files=files
    )


async def _async_job(client, submission_id, files, url=None):
    return await client.post(
        "/api/v1/capture/jobs", data=_form(submission_id, url), files=files
    )


async def _submission_signal_count(submission_id: uuid.UUID) -> int:
    async with SessionLocal() as db:
        return (
            await db.execute(
                select(func.count())
                .select_from(Signal)
                .where(Signal.capture_submission_id == submission_id)
            )
        ).scalar_one()


async def test_sync_entry_replays_the_same_submission(client):
    submission_id = uuid.uuid4()
    first = await _sync_capture(client, submission_id, _html_files(), PAGE_URL)
    assert first.status_code == 201, first.text
    signal_id = first.json()["signal"]["id"]

    second = await _sync_capture(client, submission_id, _html_files(), PAGE_URL)
    assert second.status_code == 201, second.text
    assert second.json()["signal"]["id"] == signal_id
    assert await _submission_signal_count(submission_id) == 1


async def test_sync_entry_conflicts_on_different_bytes(client):
    submission_id = uuid.uuid4()
    first = await _sync_capture(client, submission_id, _html_files(), PAGE_URL)
    assert first.status_code == 201, first.text

    changed = {"file": ("page.html", ARCHIVE_HTML.encode("utf-8") + b"<!-- x -->", "text/html")}
    conflict = await _sync_capture(client, submission_id, changed, PAGE_URL)
    assert conflict.status_code == 409, conflict.text
    assert await _submission_signal_count(submission_id) == 1


async def test_sync_then_async_job_reuses_the_signal(client):
    submission_id = uuid.uuid4()
    synced = await _sync_capture(client, submission_id, _html_files(), PAGE_URL)
    assert synced.status_code == 201, synced.text
    signal_id = synced.json()["signal"]["id"]

    job = await _async_job(client, submission_id, _html_files(), PAGE_URL)
    assert job.status_code == 202, job.text
    body = job.json()
    assert body["status"] == "succeeded"
    assert body["result"]["signal"]["id"] == signal_id
    assert await claim_next_job(make_worker_id()) is None
    assert await _submission_signal_count(submission_id) == 1


async def test_async_job_then_sync_returns_the_same_signal(client):
    submission_id = uuid.uuid4()
    created = await _async_job(client, submission_id, _html_files(), PAGE_URL)
    assert created.status_code == 202, created.text
    job_id = uuid.UUID(created.json()["id"])

    worker = make_worker_id()
    assert await claim_next_job(worker) == job_id
    await run_claimed_job(job_id, worker)
    job = await client.get(f"/api/v1/capture/jobs/{job_id}")
    assert job.json()["status"] == "succeeded"
    signal_id = job.json()["result"]["signal"]["id"]

    synced = await _sync_capture(client, submission_id, _html_files(), PAGE_URL)
    assert synced.status_code == 201, synced.text
    assert synced.json()["signal"]["id"] == signal_id
    assert await _submission_signal_count(submission_id) == 1


async def test_sync_while_job_is_queued_returns_409_without_a_signal(client):
    submission_id = uuid.uuid4()
    created = await _async_job(client, submission_id, _html_files(), PAGE_URL)
    assert created.status_code == 202, created.text
    assert created.json()["status"] == "queued"

    blocked = await _sync_capture(client, submission_id, _html_files(), PAGE_URL)
    assert blocked.status_code == 409, blocked.text
    assert "queued" in blocked.json()["detail"]
    assert await _submission_signal_count(submission_id) == 0

    worker = make_worker_id()
    job_id = uuid.UUID(created.json()["id"])
    assert await claim_next_job(worker) == job_id
    await run_claimed_job(job_id, worker)
    assert await _submission_signal_count(submission_id) == 1


async def test_sync_then_async_document_with_ambiguous_mime_reuses_the_signal(
    client, fake_doc_ingest
):
    """A .pptx sent as application/octet-stream is one request, not two."""
    submission_id = uuid.uuid4()
    synced = await _sync_capture(client, submission_id, _pptx_files())
    assert synced.status_code == 201, synced.text
    signal_id = synced.json()["signal"]["id"]

    job = await _async_job(client, submission_id, _pptx_files())
    assert job.status_code == 202, job.text
    body = job.json()
    assert body["status"] == "succeeded"
    assert body["result"]["signal"]["id"] == signal_id
    assert await _submission_signal_count(submission_id) == 1


async def test_async_document_then_sync_with_ambiguous_mime_returns_the_same_signal(
    client, fake_doc_ingest
):
    """The durable job also stores the normalized MIME, so sync can replay it."""
    submission_id = uuid.uuid4()
    created = await _async_job(client, submission_id, _pptx_files())
    assert created.status_code == 202, created.text
    job_id = uuid.UUID(created.json()["id"])

    worker = make_worker_id()
    assert await claim_next_job(worker) == job_id
    await run_claimed_job(job_id, worker)
    job = await client.get(f"/api/v1/capture/jobs/{job_id}")
    assert job.json()["status"] == "succeeded"
    signal_id = job.json()["result"]["signal"]["id"]

    synced = await _sync_capture(client, submission_id, _pptx_files())
    assert synced.status_code == 201, synced.text
    assert synced.json()["signal"]["id"] == signal_id
    assert await _submission_signal_count(submission_id) == 1


async def test_concurrent_sync_captures_create_one_signal(client):
    submission_id = uuid.uuid4()

    async def send():
        return await _sync_capture(client, submission_id, _html_files(), PAGE_URL)

    first, second = await asyncio.gather(send(), send())
    assert first.status_code == 201, first.text
    assert second.status_code == 201, second.text
    assert first.json()["signal"]["id"] == second.json()["signal"]["id"]
    assert await _submission_signal_count(submission_id) == 1