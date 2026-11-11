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
from app.services.refcodes import REF_CODES  # noqa: E402

SETTINGS = get_settings()  # cached with DB_NAME=eea_test

_APP_IMPORTED = False


def _ensure_app_imported() -> None:
    """Import app.main once (Windows event-loop policy + FastAPI app wiring)."""
    global _APP_IMPORTED
    if not _APP_IMPORTED:
        import app.main  # noqa: F401

        _APP_IMPORTED = True

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
#
# ``no_db`` tests skip the lock entirely so quick checks can run beside a
# long integration session (see ``scripts/pytest_slices.sh unit``).
_TEST_LOCK_PATH = BACKEND_ROOT / ".pg" / "eea_test_suite.lock"
_TEST_LOCK_FILE = None


def _lock_mode() -> str:
    raw = os.environ.get("EEA_PYTEST_LOCK", "fail").strip().lower()
    if raw in ("block", "wait"):
        return "block"
    if raw in ("skip", "none", "0"):
        return "skip"
    return "fail"


def _acquire_suite_lock() -> None:
    global _TEST_LOCK_FILE
    mode = _lock_mode()
    if mode == "skip":
        return
    _TEST_LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
    _TEST_LOCK_FILE = open(_TEST_LOCK_PATH, "a+")
    try:
        if "msvcrt" in sys.modules:
            msvcrt.locking(_TEST_LOCK_FILE.fileno(), msvcrt.LK_LOCK, 1)
        else:  # POSIX
            flags = fcntl.LOCK_EX
            if mode == "fail":
                flags |= fcntl.LOCK_NB
            fcntl.flock(_TEST_LOCK_FILE.fileno(), flags)
    except BlockingIOError:
        _TEST_LOCK_FILE.close()
        _TEST_LOCK_FILE = None
        pytest.exit(
            f"eea_test 已被其它 pytest 会话占用 ({_TEST_LOCK_PATH})。\n"
            "  快检（无 PostgreSQL、无互斥锁）: uv run pytest -m no_db -q\n"
            "  指定切片: ./scripts/pytest_slices.sh capture\n"
            "  等待占用结束，或设置 EEA_PYTEST_LOCK=block 在本进程阻塞等锁。",
            returncode=2,
        )
    except OSError as exc:  # pragma: no cover - platform edge cases
        _TEST_LOCK_FILE.close()
        _TEST_LOCK_FILE = None
        pytest.exit(
            f"eea_test 会话互斥锁获取失败 ({_TEST_LOCK_PATH}): {exc}\n"
            "B6 门禁要求独占执行：先关掉其它正在跑的 pytest 会话再试。",
            returncode=1,
        )


def _item_needs_db(item: pytest.Item) -> bool:
    return item.get_closest_marker("no_db") is None


def _session_needs_db(session: pytest.Session) -> bool:
    return any(_item_needs_db(item) for item in session.items)


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line(
        "markers",
        "no_db: pure unit test — no eea_test lock, migrate, or per-test TRUNCATE",
    )
    config.addinivalue_line(
        "markers",
        "db: integration test using eea_test (default when no_db is absent)",
    )


def pytest_collection_modifyitems(session: pytest.Session, config: pytest.Config, items: list) -> None:
    del config
    for item in items:
        if item.get_closest_marker("no_db") is None:
            item.add_marker(pytest.mark.db)


@pytest.fixture(scope="session", autouse=True)
def _prepared_test_db(request: pytest.FixtureRequest):
    """Create eea_test if absent, migrate it to head (repeat-safe), and hold
    the cross-process session lock for the whole run (B6 独占执行)."""
    global _TEST_LOCK_FILE
    if not _session_needs_db(request.session):
        yield
        shutil.rmtree(_OBJECT_DIR, ignore_errors=True)
        return
    _ensure_app_imported()
    _acquire_suite_lock()
    if not _pg_is_up():
        external_marker = BACKEND_ROOT / ".pg" / "use-external-db"
        portable_data = BACKEND_ROOT / ".pg" / "data"
        if external_marker.is_file() and not portable_data.is_dir():
            raise RuntimeError(
                "PostgreSQL is not reachable for eea_test. On macOS/Linux, start your "
                "local PostgreSQL service, confirm DB_HOST/DB_PORT/DB_USER in backend/.env, "
                "then re-run pytest. See README.md at repo root."
            )
        # Portable Windows dev: start bundled PostgreSQL (if needed) and background API
        subprocess.run(
            [sys.executable, str(BACKEND_ROOT / "scripts" / "start_api.py")],
            check=True,
            cwd=str(BACKEND_ROOT),
            timeout=180,
        )
        if not _pg_is_up():
            raise RuntimeError(
                "PostgreSQL still unreachable after scripts/start_api.py; "
                "check backend/.pg/api.log and DB_* settings."
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
def _clean_database(request: pytest.FixtureRequest):
    """Deterministic isolation: every test starts from empty tables plus the
    closed reference vocabularies — the only fixture data each test needs."""
    if not _item_needs_db(request.node):
        yield
        return
    _ensure_app_imported()
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
    _ensure_app_imported()
    from app.main import app

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
