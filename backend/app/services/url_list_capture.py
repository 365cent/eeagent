"""Paste URL list → awaiting_client capture jobs (browser/client capture)."""
from __future__ import annotations

import json
import logging
import re
import uuid
from urllib.parse import parse_qs, unquote, urlparse

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.capture.submission import _submission_fingerprint
from app.domains.evidence.channel import _infer_channel_code
from app.models.models import CaptureJob, PanoramaImportBatch, PanoramaImportUrl
from app.services.objectstore import save_bytes, sha256_bytes
from app.services.tagging import normalize_url

logger = logging.getLogger(__name__)

_URL_RE = re.compile(r"https?://[^\s<>'\"]+", re.IGNORECASE)


def canonical_import_url(raw: str) -> str:
    """Stable dedupe key for pasted lists (unwrap short links, normalize host/path)."""
    cleaned = raw.strip()
    try:
        parsed = urlparse(cleaned)
    except ValueError:
        return normalize_url(cleaned)
    host = parsed.netloc.lower()
    if host in {"link.wtturl.cn", "link.wtturl.com"}:
        target = parse_qs(parsed.query).get("target", [None])[0]
        if target:
            cleaned = unquote(target).strip()
    return normalize_url(cleaned)


def _normalize_url(raw: str) -> str | None:
    cleaned = raw.strip().rstrip(".,;)'\"]")
    if not cleaned.lower().startswith(("http://", "https://")):
        return None
    try:
        parsed = urlparse(cleaned)
    except ValueError:
        return None
    if not parsed.scheme or not parsed.netloc:
        return None
    return cleaned


def parse_url_lines(text: str) -> list[str]:
    """Split pasted text on line breaks and extract unique http(s) URLs in order."""
    if not text or not text.strip():
        return []
    seen: set[str] = set()
    ordered: list[str] = []
    for line in text.replace("\r\n", "\n").split("\n"):
        line = line.strip()
        if not line:
            continue
        if _URL_RE.search(line):
            for match in _URL_RE.finditer(line):
                normalized = _normalize_url(match.group(0))
                if not normalized:
                    continue
                key = canonical_import_url(normalized)
                if key in seen:
                    continue
                seen.add(key)
                ordered.append(normalized)
            continue
        normalized = _normalize_url(line)
        if not normalized:
            continue
        key = canonical_import_url(normalized)
        if key in seen:
            continue
        seen.add(key)
        ordered.append(normalized)
    return ordered


def _is_pdf_url(raw: str) -> bool:
    path = urlparse(raw).path.lower()
    return path.endswith(".pdf")


async def create_url_list_capture_batch(db: AsyncSession, text: str) -> PanoramaImportBatch:
    urls = parse_url_lines(text)
    if not urls:
        raise HTTPException(422, "未找到有效的 http(s) 链接；请每行一条或换行粘贴链接列表")

    canonical = json.dumps(urls, ensure_ascii=False, separators=(",", ":"))
    digest = sha256_bytes(canonical.encode("utf-8"))
    existing = (
        await db.execute(select(PanoramaImportBatch).where(PanoramaImportBatch.sha256 == digest))
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    object_key = save_bytes(text.encode("utf-8"), folder="capture-url-lists", ext="txt")
    batch = PanoramaImportBatch(
        sha256=digest,
        filename="链接批量粘贴",
        workbook_object_key=object_key,
        snapshot_json={
            "kind": "url-list",
            "url_count": len(urls),
            "sources": [],
            "chain_rows": [],
        },
        status="capturing",
    )
    db.add(batch)
    await db.flush()

    for raw in urls:
        channel = _infer_channel_code(raw)
        is_pdf = _is_pdf_url(raw)
        fingerprint = _submission_fingerprint(
            url=raw,
            data=b"",
            filename=None,
            mime=None,
            channel_code=channel,
            publisher=None,
            source_label="url-list-import",
        )
        job = CaptureJob(
            id=uuid.uuid4(),
            submission_id=uuid.uuid4(),
            fingerprint=fingerprint,
            source_url=raw,
            channel_code=channel,
            source_label="url-list-import",
            via="client-capture",
            status="awaiting_client",
            stage="awaiting_client",
            import_batch_id=batch.id,
            filename="capture.pdf" if is_pdf else None,
            mime="application/pdf" if is_pdf else None,
        )
        db.add(job)
        await db.flush()
        db.add(
            PanoramaImportUrl(
                batch_id=batch.id,
                url=raw,
                url_normalized=raw,
                contexts=[],
                channel_code=channel,
                is_pdf=is_pdf,
                capture_job_id=job.id,
            )
        )

    await db.commit()
    await db.refresh(batch)
    logger.info("url-list capture batch %s: %s urls", batch.id, len(urls))
    return batch
