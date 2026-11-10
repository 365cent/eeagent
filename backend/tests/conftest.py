"""Interface-test suite configuration.

The suite runs against a DEDICATED ``eea_test`` database on the project's
PostgreSQL (127.0.0.1:54329) — never the live ``eea`` database, which holds
the acceptance seed data.

``DB_NAME`` / ``OBJECT_DIR`` are set BEFORE the first ``app`` import:
the settings object is lru_cached (app/core/config.py:42) and the async engine
is created at import time (app/db/base.py:12), so the override must land first.
Importing ``app.main`` also sets WindowsSelectorEventLoopPolicy
(app/main.py:3-6), which psycopg's async connections require on Windows — it
must happen before any test event loop is created (anyio creates a fresh loop
per test).
"""

import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

try:  # POSIX file lock; Windows uses msvcrt below
    import fcntl
except ImportError:  # pragma: no cover - Windows
    import msvcrt

BACKEND_ROOT = Path(__file__).resolve().parent.parent

TEST_DB_NAME = "eea_test"
os.environ["APP_ENV"] = "test"
os.environ["CAPTURE_SERVER_FETCH_ENABLED"] = "true"
os.environ["DB_NAME"] = TEST_DB_NAME
# keep test bodies out of backend/.pg/objects (the dev object store)
_OBJECT_DIR = tempfile.mkdtemp(prefix="eea-test-objects-")
os.environ["OBJECT_DIR"] = _OBJECT_DIR

import psycopg  # noqa: E402
import pytest  # noqa: E402
from alembic import command  # noqa: E402
from alembic.config import Config as AlembicConfig  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.main import app  # noqa: E402  (also fixes the Windows event-loop policy)
from app.services.refcodes import REF_CODES  # noqa: E402

SETTINGS = get_settings()  # cached with DB_NAME=eea_test

_ADMIN_DSN = (
    f"host={SETTINGS.db_host} port={SETTINGS.db_port} "
    f"user={SETTINGS.db_user} password={SETTINGS.db_password} dbname=postgres"
)

_TRUNCATE_SQL = text(
    "TRUNCATE TABLE eea_agent_event, eea_agent_message, eea_agent_patch, eea_agent_run, eea_agent_memory, "
    "eea_agent_session, eea_document_chunk, eea_document_figure, "
    "eea_access_log, eea_capture_job, eea_document, eea_signal_tag, eea_signal, eea_correction_audit, "
    "eea_strategic_assessment, eea_strategic_funnel, eea_deployment_standard, eea_tech_landing_point, "
    "eea_vehicle_function, eea_demand_point, eea_tech_theme, eea_vocab, "
    "eea_ref_code CASCADE"
)

# loop-independent cleanup connection (sync psycopg) — see scripts/bootstrap.py
# for how the live stack creates databases; the test DB is created the same way
_SYNC_ENGINE = create_engine(SETTINGS.database_url)

# Session-level mutual exclusion for the shared eea_test database. The
# autouse _clean_database fixture TRUNCATEs every table per test: a second
# concurrent pytest session against the same database deadlocks on those
# TRUNCATE locks (psycopg DeadlockDetected at setup) and every suite reports
# spurious failures. TODO.md B6 documents the gate must run exclusively; this
# lock makes that constraint explicit — a second session blocks until the
# first finishes (pytest-xdist workers within ONE session are unaffected:
# the lock is taken once per session in the parent, before workers fork).
_TEST_LOCK_PATH = BACKEND_ROOT / ".pg" / "eea_test_suite.lock"
_TEST_LOCK_FILE = None


def _acquire_suite_lock() -> None:
    global _TEST_LOCK_FILE
    _TEST_LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
    _TEST_LOCK_FILE = open(_TEST_LOCK_PATH, "a+")
    try:
        if "msvcrt" in sys.modules:
            msvcrt.locking(_TEST_LOCK_FILE.fileno(), msvcrt.LK_LOCK, 1)
        else:  # POSIX
            fcntl.flock(_TEST_LOCK_FILE.fileno(), fcntl.LOCK_EX)
    except OSError as exc:  # pragma: no cover - platform edge cases
        _TEST_LOCK_FILE.close()
        _TEST_LOCK_FILE = None
        pytest.exit(
            f"eea_test 会话互斥锁获取失败 ({_TEST_LOCK_PATH}): {exc}\n"
            "B6 门禁要求独占执行：先关掉其它正在跑的 pytest 会话再试。",
            returncode=1,
        )


@pytest.fixture(scope="session", autouse=True)
def _prepared_test_db():
    """Create eea_test if absent, migrate it to head (repeat-safe), and hold
    the cross-process session lock for the whole run (B6 独占执行)."""
    global _TEST_LOCK_FILE
    _acquire_suite_lock()
    if not _pg_is_up():
        # documented, repeat-safe stack starter (ensures PostgreSQL, starts API)
        subprocess.run(
            [sys.executable, str(BACKEND_ROOT / "scripts" / "start_api.py")],
            check=True,
            cwd=str(BACKEND_ROOT),
            timeout=180,
        )
    _create_test_db()
    _run_migrations()
    yield
    shutil.rmtree(_OBJECT_DIR, ignore_errors=True)
    # the OS releases the lock when the session process exits; close the
    # handle explicitly anyway so a session-2 re-run inside the same
    # interpreter (pytest.main twice) also works
    if _TEST_LOCK_FILE is not None:
        _TEST_LOCK_FILE.close()
        _TEST_LOCK_FILE = None


def _pg_is_up() -> bool:
    try:
        with psycopg.connect(_ADMIN_DSN, connect_timeout=3):
            return True
    except psycopg.OperationalError:
        return False


def _create_test_db() -> None:
    with psycopg.connect(_ADMIN_DSN, autocommit=True) as conn:
        exists = conn.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s", (TEST_DB_NAME,)
        ).fetchone()
        if not exists:
            conn.execute(f'CREATE DATABASE "{TEST_DB_NAME}"')


def _run_migrations() -> None:
    cfg = AlembicConfig()
    cfg.set_main_option("script_location", str(BACKEND_ROOT / "migrations"))
    command.upgrade(cfg, "head")


@pytest.fixture(autouse=True)
def _clean_database():
    """Deterministic isolation: every test starts from empty tables plus the
    closed reference vocabularies — the only fixture data each test needs."""
    with _SYNC_ENGINE.begin() as conn:
        conn.execute(_TRUNCATE_SQL)
        for domain, items in REF_CODES.items():
            for item in items:
                conn.execute(
                    text(
                        "INSERT INTO eea_ref_code (domain, code, label, fixture_alias) "
                        "VALUES (:domain, :code, :label, :alias)"
                    ),
                    {
                        "domain": domain,
                        "code": item[0],
                        "label": item[1],
                        "alias": item[2] if len(item) > 2 else None,
                    },
                )
        for domain_name in ("软件", "硬件", "通信", "电源与能源管理", "工具"):
            conn.execute(
                text(
                    "INSERT INTO eea_vocab (id, kind, name) "
                    "VALUES (gen_random_uuid(), 'domain', :name)"
                ),
                {"name": domain_name},
            )
    yield


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    """FastAPI's documented async test pattern: httpx AsyncClient over
    ASGITransport (fastapi.tiangolo.com/advanced/async-tests/)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
