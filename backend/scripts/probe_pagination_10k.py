"""Measure server-side pagination on a synthetic 10k signal library (FE-12 scale check).

Usage (from backend/):  uv run python scripts/probe_pagination_10k.py [--count 10000] [--keep]

Creates a scratch database 'eea_perf' on the configured local PostgreSQL, fills
it with --count deterministic signals, starts a throwaway API on a spare port
against that database, and times the endpoints the evidence list depends on:
first page, last page, a filtered page with its X-Total-Count, and the detail
fetch (first usable content). The API process is stopped and the database is
dropped again unless --keep is passed.

It never touches 'eea' or 'eea_test' and refuses to run against a non-local
host. Recorded run (Windows dev box, portable PostgreSQL, 2026-11-26):
10,000 signals -> see the printed table; the numbers are dev-host figures, not
Linux-intranet ones.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import statistics
import subprocess
import sys
import time
import uuid
from datetime import datetime, timedelta, timezone
from urllib.error import URLError
from urllib.parse import urlsplit, urlunsplit
from urllib.request import urlopen

import psycopg
from sqlalchemy import insert, text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import get_settings
from app.models.models import Base, Signal

BENCH_DB = "eea_perf"
BENCH_PORT = 8010
LOCAL_HOSTS = {"127.0.0.1", "localhost", "::1"}
STAGES = ("creation_supply", "delivery_oem", "realization_consumer", "regulation_standard")


def _url_for(settings, dbname: str) -> str:
    parts = urlsplit(settings.database_url)
    return urlunsplit((parts.scheme, parts.netloc, f"/{dbname}", parts.query, parts.fragment))


def _rows(count: int):
    base = datetime(2025, 1, 1, tzinfo=timezone.utc)
    for i in range(count):
        url = f"https://perf.eea.local/signal/{i:05d}"
        yield {
            "id": uuid.UUID(int=i + 1),
            "title": f"perf signal {i:05d}",
            "url": url,
            "url_normalized": url,
            "channel_code": "web" if i % 3 else "wechat_mp",
            "publisher": f"publisher-{i % 17:02d}",
            "value_chain_stage_code": STAGES[i % len(STAGES)],
            "evidence_status_code": "retained" if i % 5 else "pending_review",
            "created_at": base + timedelta(minutes=i),
        }


async def _seed(settings, count: int) -> None:
    engine = create_async_engine(_url_for(settings, BENCH_DB))
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            batch = []
            for row in _rows(count):
                batch.append(row)
                if len(batch) >= 2000:
                    await conn.execute(insert(Signal), batch)
                    batch.clear()
            if batch:
                await conn.execute(insert(Signal), batch)
            total = (await conn.execute(text("select count(*) from eea_signal"))).scalar_one()
            print(f"seeded {total} signals into {BENCH_DB}", flush=True)
    finally:
        await engine.dispose()


def _wait_ready(base: str, timeout: float = 60.0) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urlopen(f"{base}/api/v1/signals?limit=1", timeout=5) as resp:
                if resp.status == 200:
                    return
        except (URLError, OSError):
            time.sleep(0.5)
    raise SystemExit("throwaway API did not become ready")


def _json(url: str):
    with urlopen(url, timeout=30) as resp:
        return json.loads(resp.read())


def _ids(base: str, offset: int) -> list[str]:
    return [row["id"] for row in _json(f"{base}/api/v1/signals?limit=50&offset={offset}")]


def _total(base: str, url: str) -> int:
    with urlopen(url, timeout=30) as resp:
        resp.read()
        return int(resp.headers["X-Total-Count"])


def _timed(url: str) -> tuple[float, int, str]:
    started = time.perf_counter()
    with urlopen(url, timeout=30) as resp:
        resp.read()
        elapsed = (time.perf_counter() - started) * 1000
        return elapsed, resp.status, resp.headers.get("X-Total-Count", "-")


def _median_ms(url: str, runs: int = 5) -> tuple[float, str, int]:
    samples = []
    status = 0
    total = "-"
    for _ in range(runs):
        elapsed, status, total = _timed(url)
        samples.append(elapsed)
    return statistics.median(samples), total, status


def _drop_db(settings) -> None:
    admin = psycopg.connect(
        host=settings.db_host,
        port=settings.db_port,
        user=settings.db_user,
        password=settings.db_password,
        dbname="postgres",
        autocommit=True,
    )
    admin.execute(f'DROP DATABASE IF EXISTS "{BENCH_DB}" WITH (FORCE)')
    admin.close()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=10_000)
    parser.add_argument("--keep", action="store_true", help="keep the scratch database and API")
    args = parser.parse_args()

    settings = get_settings()
    if settings.db_host not in LOCAL_HOSTS:
        raise SystemExit(f"refusing to create a scratch database on non-local host {settings.db_host!r}")

    _drop_db(settings)
    admin = psycopg.connect(
        host=settings.db_host,
        port=settings.db_port,
        user=settings.db_user,
        password=settings.db_password,
        dbname="postgres",
        autocommit=True,
    )
    admin.execute(f'CREATE DATABASE "{BENCH_DB}"')
    admin.close()

    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(_seed(settings, args.count))

    env = os.environ.copy()
    env.update(
        {
            "DB_NAME": BENCH_DB,
            "API_PORT": str(BENCH_PORT),
            "EEA_CAPTURE_EMBEDDED": "0",
            "EEA_DEV_API_ONLY": "1",
        }
    )
    loop = "app.core.uvicorn_loop:eea_event_loop" if sys.platform == "win32" else "auto"
    api = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "app.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(BENCH_PORT),
            "--log-level",
            "warning",
            "--loop",
            loop,
        ],
        env=env,
    )
    base = f"http://127.0.0.1:{BENCH_PORT}"
    try:
        _wait_ready(base)
        last_offset = max(0, args.count - 50)

        cases = [
            ("first page", f"{base}/api/v1/signals?limit=50&offset=0"),
            ("last page", f"{base}/api/v1/signals?limit=50&offset={last_offset}"),
            ("keyword filter", f"{base}/api/v1/signals?limit=50&keyword=perf%20signal%20001"),
            ("stage filter", f"{base}/api/v1/signals?limit=50&value_chain_stage=delivery_oem"),
            ("200 rows", f"{base}/api/v1/signals?limit=200&offset=5000"),
        ]
        print(f"{'case':<18}{'median ms':>12}{'X-Total-Count':>16}  status")
        for label, url in cases:
            median_ms, total, status = _median_ms(url)
            print(f"{label:<18}{median_ms:>12.1f}{total:>16}  {status}")

        detail_id = str(uuid.UUID(int=1))
        elapsed, status, _ = _timed(f"{base}/api/v1/signals/{detail_id}")
        print(f"{'detail first load':<18}{elapsed:>12.1f}{'-':>16}  {status}")

        # Boundaries, not just timings: pages must not overlap or lose rows.
        first_keys = _ids(base, 0)
        last_keys = _ids(base, last_offset)
        assert len(first_keys) == 50, f"first page returned {len(first_keys)} rows"
        assert len(last_keys) == 50, f"last page returned {len(last_keys)} rows"
        assert not set(first_keys) & set(last_keys), "first and last page overlap"
        assert len(set(first_keys)) == 50 and len(set(last_keys)) == 50, "a page repeats a row"
        total = _total(base, f"{base}/api/v1/signals?limit=1&offset=0")
        assert total == args.count, f"X-Total-Count {total} != {args.count}"
        print(f"boundaries ok: 50 + 50 rows, no overlap, X-Total-Count {total}")
    finally:
        api.terminate()
        try:
            api.wait(timeout=20)
        except subprocess.TimeoutExpired:
            api.kill()
            api.wait(timeout=10)
        if args.keep:
            print(f"kept {BENCH_DB}; start the API with DB_NAME={BENCH_DB} API_PORT={BENCH_PORT}")
        else:
            _drop_db(settings)
            print(f"dropped {BENCH_DB}")


if __name__ == "__main__":
    main()
