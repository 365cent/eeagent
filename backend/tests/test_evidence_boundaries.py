"""The ingestion layer must remain usable without HTTP router imports."""
import ast
from pathlib import Path
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.domains.evidence import signal_queries

pytestmark = pytest.mark.no_db
APP_DIR = Path(__file__).resolve().parents[1] / "app"


def test_capture_and_ingestion_do_not_import_api_routes():
    paths = [APP_DIR / "api/v1/capture.py"]
    paths.extend((APP_DIR / "domains/evidence").glob("*.py"))
    paths.extend((APP_DIR / "domains/capture").glob("*.py"))
    paths.extend((APP_DIR / "services").glob("*.py"))
    violations = []
    for path in paths:
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        for node in ast.walk(tree):
            names = []
            if isinstance(node, ast.Import):
                names = [alias.name for alias in node.names]
            elif isinstance(node, ast.ImportFrom) and node.module:
                names = [node.module]
            for name in names:
                if name == "app.api" or name.startswith("app.api."):
                    violations.append(f"{path.relative_to(APP_DIR)}:{node.lineno}: {name}")
    assert not violations, "\n".join(violations)


@pytest.mark.anyio
async def test_missing_signal_detail_returns_none(monkeypatch):
    find_signal = AsyncMock(return_value=None)
    monkeypatch.setattr(signal_queries, "find_signal", find_signal)
    db = object()
    signal_id = uuid4()

    assert await signal_queries.get_signal_detail(db, signal_id) is None
    find_signal.assert_awaited_once_with(db, signal_id)
