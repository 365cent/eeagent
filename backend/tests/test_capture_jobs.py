"""Durable capture jobs: async HTML/document ingest, idempotency, retry, cancel."""

from __future__ import annotations

import uuid

import pytest

from app.services.capture_jobs import claim_next_job, make_worker_id, run_claimed_job
from tests.test_capture import ARCHIVE_HTML

pytestmark = pytest.mark.anyio


async def _count_signals(client) -> int:
    return len((await client.get("/api/v1/signals")).json())


async def _run_next_job() -> uuid.UUID | None:
    worker_id = make_worker_id()
    job_id = await claim_next_job(worker_id)
    if job_id is None:
        return None
    await run_claimed_job(job_id, worker_id)
    return job_id


async def _create_job(client, *, submission_id: uuid.UUID, files, data=None):
    form = {"submission_id": str(submission_id)}
    if data:
        form.update(data)
    return await client.post("/api/v1/capture/jobs", data=form, files=files)


@pytest.fixture
def fake_ingest(monkeypatch):
    async def _ingest(data, filename, mime):
        from app.services.doc_ingest import IngestResult

        return IngestResult(
            canonical_md="# Test doc\n\nBody for durable job.",
            markitdown_version="test-jobs",
            figures=[],
        )

    monkeypatch.setattr("app.api.v1.documents.ingest_document", _ingest)
    return _ingest


async def test_document_job_creates_one_derived_signal(client, fake_ingest):
    submission_id = uuid.uuid4()
    before = await _count_signals(client)
    created = await _create_job(
        client,
        submission_id=submission_id,
        files={
            "file": (
                "report.docx",
                b"fake-docx-bytes",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    assert created.status_code == 202, created.text
    job_id = created.json()["id"]
    assert created.json()["status"] == "queued"

    ran = await _run_next_job()
    assert ran == uuid.UUID(job_id)

    job = (await client.get(f"/api/v1/capture/jobs/{job_id}")).json()
    assert job["status"] == "succeeded"
    assert job["result"]["source"] == "document"
    assert job["result"]["document"]["ingest_status"] == "parsed"
    assert job["result"]["signal"]["document_id"] == job["result"]["document"]["id"]
    assert await _count_signals(client) == before + 1


async def test_html_job_creates_snapshot_signal(client):
    submission_id = uuid.uuid4()
    before = await _count_signals(client)
    created = await _create_job(
        client,
        submission_id=submission_id,
        files={"file": ("page.html", ARCHIVE_HTML.encode("utf-8"), "text/html")},
        data={"url": "https://mp.weixin.qq.com/s/efuse-job-test"},
    )
    assert created.status_code == 202, created.text
    job_id = created.json()["id"]

    await _run_next_job()

    job = (await client.get(f"/api/v1/capture/jobs/{job_id}")).json()
    assert job["status"] == "succeeded"
    assert job["result"]["source"] == "html-snapshot"
    assert job["result"]["document"] is None
    assert job["result"]["signal"]["snapshot_html_object_key"]
    assert await _count_signals(client) == before + 1


async def test_same_submission_id_replays_job_without_duplicate_signal(client, fake_ingest):
    submission_id = uuid.uuid4()
    files = {
        "file": (
            "deck.pptx",
            b"same-pptx",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        )
    }
    first = await _create_job(client, submission_id=submission_id, files=files)
    assert first.status_code == 202
    job_id = first.json()["id"]

    await _run_next_job()
    before = await _count_signals(client)
    signal_id = (await client.get(f"/api/v1/capture/jobs/{job_id}")).json()["result"]["signal"]["id"]

    replay = await _create_job(client, submission_id=submission_id, files=files)
    assert replay.status_code == 202
    assert replay.json()["id"] == job_id
    assert replay.json()["status"] == "succeeded"
    assert replay.json()["result"]["signal"]["id"] == signal_id
    assert await _count_signals(client) == before


async def test_submission_id_conflict_on_different_payload(client):
    submission_id = uuid.uuid4()
    first = await _create_job(
        client,
        submission_id=submission_id,
        files={"file": ("a.docx", b"bytes-a", "application/octet-stream")},
    )
    assert first.status_code == 202

    conflict = await _create_job(
        client,
        submission_id=submission_id,
        files={"file": ("b.docx", b"bytes-b", "application/octet-stream")},
    )
    assert conflict.status_code == 409


async def test_failed_job_retries_then_succeeds(client, fake_ingest):
    from sqlalchemy import update

    from app.db.base import SessionLocal
    from app.models.models import CaptureJob

    submission_id = uuid.uuid4()
    created = await _create_job(
        client,
        submission_id=submission_id,
        files={"file": ("x.docx", b"x", "application/octet-stream")},
    )
    job_id = uuid.UUID(created.json()["id"])
    before = await _count_signals(client)

    async with SessionLocal() as db:
        await db.execute(
            update(CaptureJob)
            .where(CaptureJob.id == job_id)
            .values(status="failed", stage="failed", error="worker exhausted in test")
        )
        await db.commit()

    retried = await client.post(f"/api/v1/capture/jobs/{job_id}/retry")
    assert retried.status_code == 202
    await _run_next_job()

    job = (await client.get(f"/api/v1/capture/jobs/{job_id}")).json()
    assert job["status"] == "succeeded"
    assert await _count_signals(client) == before + 1


async def test_cancel_queued_job_creates_no_signal(client, fake_ingest):
    submission_id = uuid.uuid4()
    created = await _create_job(
        client,
        submission_id=submission_id,
        files={"file": ("wait.docx", b"w", "application/octet-stream")},
    )
    job_id = created.json()["id"]
    before = await _count_signals(client)

    cancelled = await client.post(f"/api/v1/capture/jobs/{job_id}/cancel")
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"

    claimed = await claim_next_job(make_worker_id())
    assert claimed is None
    assert await _count_signals(client) == before


async def test_reclaim_after_success_does_not_duplicate_signal(client, fake_ingest):
    submission_id = uuid.uuid4()
    created = await _create_job(
        client,
        submission_id=submission_id,
        files={"file": ("once.docx", b"once", "application/octet-stream")},
    )
    job_id = created.json()["id"]
    await _run_next_job()
    before = await _count_signals(client)

    # Second claim should find nothing queued; job already succeeded.
    again = await claim_next_job(make_worker_id())
    assert again is None
    assert await _count_signals(client) == before

    replay = await client.get(f"/api/v1/capture/jobs/{job_id}")
    assert replay.json()["status"] == "succeeded"
