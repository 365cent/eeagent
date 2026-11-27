"""Measure the duplicate-scan cost on a synthetic 10k library (BE-02 scale check).

Usage (from backend/):  uv run python scripts/probe_dedup_scan_cost.py

Creates a scratch database ``eea_bench`` on the configured local PostgreSQL,
fills it with a known duplicate structure, times ``scan_duplicates()`` and
drops the database again. It never touches ``eea`` or ``eea_test`` and refuses
to run against a non-local host.

Recorded run (Windows dev box, PostgreSQL 16 local, 2026-11-24):
10,400 signals / 10,400 tags -> _load_candidates 0.15s, scan_duplicates 0.32s,
700 groups (500 url + 200 body). Before the candidate prefilter the same
library took 1.06s to load and 1.66s to scan.
"""
from __future__ import annotations

import asyncio
import hashlib
import time
import uuid
from urllib.parse import urlsplit, urlunsplit

import psycopg
from sqlalchemy import insert, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.uvicorn_loop import eea_event_loop
from app.models.models import Base, Signal, SignalTag, Vocab
from app.domains.evidence.signal_dedup import _load_candidates, scan_duplicates

BENCH_DB = "eea_bench"
LOCAL_HOSTS = {"127.0.0.1", "localhost", "::1"}


def _sha(i: int) -> str:
    return hashlib.sha256(str(i).encode()).hexdigest()


def _url_for(settings, dbname: str) -> str:
    parts = urlsplit(settings.database_url)
    return urlunsplit((parts.scheme, parts.netloc, f"/{dbname}", parts.query, parts.fragment))


async def main() -> None:
    settings = get_settings()
    if settings.db_host not in LOCAL_HOSTS:
        raise SystemExit(
            f"refusing to create a scratch database on non-local host {settings.db_host!r}"
        )
    admin = psycopg.connect(
        host=settings.db_host,
        port=settings.db_port,
        user=settings.db_user,
        password=settings.db_password,
        dbname="postgres",
        autocommit=True,
    )
    admin.execute(f'DROP DATABASE IF EXISTS "{BENCH_DB}"')
    admin.execute(f'CREATE DATABASE "{BENCH_DB}"')
    admin.close()

    engine = create_async_engine(_url_for(settings, BENCH_DB))
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            await conn.execute(
                insert(Vocab),
                [{"id": uuid.uuid4(), "kind": "tech_tag", "name": f"标签{i}"} for i in range(3)],
            )
            tag_ids = (await conn.execute(text("SELECT id FROM eea_vocab"))).scalars().all()

        rows: list[dict] = []
        # 9,000 unique articles
        for i in range(9_000):
            url = f"https://example.com/article/{i}"
            rows.append({
                "id": uuid.uuid4(), "title": f"文章 {i}", "url": url, "url_normalized": url,
                "channel_code": "web", "evidence_status_code": "retained", "body_sha256": _sha(i),
            })
        # 500 same-URL duplicate pairs (identical bodies)
        for p in range(500):
            url = f"https://example.com/dup/{p}"
            sha = _sha(100_000 + p)
            rows.append({
                "id": uuid.uuid4(), "title": f"重复文章 {p}", "url": url, "url_normalized": url,
                "channel_code": "web", "evidence_status_code": "retained", "body_sha256": sha,
            })
            rows.append({
                "id": uuid.uuid4(), "title": f"重复文章 {p} (重复采集 #2)", "url": url,
                "url_normalized": url, "channel_code": "web", "evidence_status_code": "retained",
                "body_sha256": sha,
            })
        # 200 same-body pairs behind different URLs (upload next to a capture)
        for p in range(200):
            sha = _sha(200_000 + p)
            for host in ("example.com", "mirror.example.com"):
                url = f"https://{host}/other/{p}"
                rows.append({
                    "id": uuid.uuid4(), "title": f"转载 {p}", "url": url, "url_normalized": url,
                    "channel_code": "web", "evidence_status_code": "retained", "body_sha256": sha,
                })

        tag_rows = [
            {"signal_id": r["id"], "vocab_id": tag_ids[i % len(tag_ids)]}
            for i, r in enumerate(rows)
        ]
        async with engine.begin() as conn:
            await conn.execute(insert(Signal), rows)
            await conn.execute(insert(SignalTag), tag_rows)
        print(f"library: {len(rows)} signals, {len(tag_rows)} tags")

        maker = async_sessionmaker(engine, expire_on_commit=False)
        async with maker() as session:
            t0 = time.perf_counter()
            loaded = await _load_candidates(session)
            t_load = time.perf_counter() - t0
            print(f"_load_candidates: {t_load:.2f}s ({len(loaded)} rows with tags)")

        async with maker() as session:
            t0 = time.perf_counter()
            groups = await scan_duplicates(session)
            t_scan = time.perf_counter() - t0
            kinds: dict[str, int] = {}
            identical = 0
            for g in groups:
                kinds[g.kind] = kinds.get(g.kind, 0) + 1
                identical += 1 if g.identical else 0
            print(f"scan_duplicates: {t_scan:.2f}s -> {len(groups)} groups {kinds}, identical={identical}")
            print("expected: url=500, body=200, url_suspect=0")
    finally:
        await engine.dispose()
        admin = psycopg.connect(
            host=settings.db_host, port=settings.db_port, user=settings.db_user,
            password=settings.db_password, dbname="postgres", autocommit=True,
        )
        admin.execute(f'DROP DATABASE IF EXISTS "{BENCH_DB}"')
        admin.close()
        print("bench database dropped")


asyncio.run(main(), loop_factory=eea_event_loop)
