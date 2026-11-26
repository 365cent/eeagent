"""Check the Alembic chain: fresh upgrade, downgrade/upgrade, and an old schema with data.

Usage (from backend/):  uv run python scripts/probe_migrations.py

Creates a scratch database 'eea_migrate' on the configured local PostgreSQL and
runs the migration commands in subprocesses (DB_NAME override, same settings as
the app):

1. upgrade head on an empty database -> the fresh-install gate BE-16 asks for.
2. insert one signal row, downgrade three revisions, upgrade head again -> the
   row must survive and alembic_version must be back at head.
3. downgrade to an older revision, insert a row there, upgrade head -> the
   pre-existing row must survive the forward migration.

The database is dropped afterwards unless --keep is passed. It never touches
'eea' or 'eea_test' and refuses a non-local host.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import uuid
from urllib.parse import urlsplit

import psycopg

from app.core.config import get_settings

BENCH_DB = "eea_migrate"
LOCAL_HOSTS = {"127.0.0.1", "localhost", "::1"}
OLD_REVISION = "0022_demand_review_baseline"


def _psycopg_kwargs(settings, dbname: str) -> dict:
    return dict(
        host=settings.db_host,
        port=settings.db_port,
        user=settings.db_user,
        password=settings.db_password,
        dbname=dbname,
    )


def _recreate_db(settings) -> None:
    with psycopg.connect(**_psycopg_kwargs(settings, "postgres"), autocommit=True) as admin:
        admin.execute(f'DROP DATABASE IF EXISTS "{BENCH_DB}" WITH (FORCE)')
        admin.execute(f'CREATE DATABASE "{BENCH_DB}"')


def _drop_db(settings) -> None:
    with psycopg.connect(**_psycopg_kwargs(settings, "postgres"), autocommit=True) as admin:
        admin.execute(f'DROP DATABASE IF EXISTS "{BENCH_DB}" WITH (FORCE)')


def _alembic(settings, *args: str) -> None:
    env = os.environ.copy()
    env["DB_NAME"] = BENCH_DB
    print("alembic", " ".join(args), flush=True)
    proc = subprocess.run(
        [sys.executable, "-m", "alembic", *args],
        env=env,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if proc.returncode != 0:
        print(proc.stdout[-2000:])
        print(proc.stderr[-4000:])
        raise SystemExit(f"alembic {' '.join(args)} failed")


def _revision(settings) -> str:
    with psycopg.connect(**_psycopg_kwargs(settings, BENCH_DB)) as conn:
        return conn.execute("select version_num from alembic_version").fetchone()[0]


def _insert_signal(settings) -> uuid.UUID:
    signal_id = uuid.uuid4()
    with psycopg.connect(**_psycopg_kwargs(settings, BENCH_DB)) as conn:
        conn.execute(
            """
            insert into eea_signal (id, title, url, url_normalized, channel_code, evidence_status_code)
            values (%s, %s, %s, %s, 'web', 'pending_review')
            """,
            (signal_id, "migration probe", f"https://migrate.invalid/{signal_id}", f"https://migrate.invalid/{signal_id}"),
        )
        conn.commit()
    return signal_id


def _signal_exists(settings, signal_id: uuid.UUID) -> bool:
    with psycopg.connect(**_psycopg_kwargs(settings, BENCH_DB)) as conn:
        return conn.execute("select 1 from eea_signal where id = %s", (signal_id,)).fetchone() is not None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--keep", action="store_true", help="keep the scratch database")
    args = parser.parse_args()

    settings = get_settings()
    if settings.db_host not in LOCAL_HOSTS:
        raise SystemExit(f"refusing to create a scratch database on non-local host {settings.db_host!r}")

    _recreate_db(settings)
    try:
        _alembic(settings, "upgrade", "head")
        head = _revision(settings)
        print(f"fresh upgrade ok, head={head}")

        kept = _insert_signal(settings)
        _alembic(settings, "downgrade", "-3")
        _alembic(settings, "upgrade", "head")
        assert _revision(settings) == head, "head must be reached again"
        assert _signal_exists(settings, kept), "the row must survive downgrade/upgrade"
        print("downgrade -3 / upgrade head ok, row survived")

        _alembic(settings, "downgrade", OLD_REVISION)
        old_row = _insert_signal(settings)
        _alembic(settings, "upgrade", "head")
        assert _signal_exists(settings, old_row), "a row written on the old schema must survive the upgrade"
        print(f"upgrade from {OLD_REVISION} with data ok, row survived")
    finally:
        if args.keep:
            print(f"kept {BENCH_DB}")
        else:
            _drop_db(settings)
            print(f"dropped {BENCH_DB}")


if __name__ == "__main__":
    main()
