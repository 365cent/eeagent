"""Application resources close on normal shutdown and startup failure."""
from unittest.mock import AsyncMock, Mock
from types import SimpleNamespace

import pytest

from app.db import base
from app import main, worker

pytestmark = [pytest.mark.anyio, pytest.mark.no_db]


async def test_api_disposes_engine_when_lifespan_exits(monkeypatch):
    monkeypatch.setenv("EEA_DEV_API_ONLY", "1")
    dispose = AsyncMock()
    stop = Mock()
    monkeypatch.setattr(base, "engine", SimpleNamespace(dispose=dispose))
    monkeypatch.setattr(main, "start_launchdarkly", Mock())
    monkeypatch.setattr(main, "shutdown_launchdarkly", stop)
    app = main.create_app()

    async with app.router.lifespan_context(app):
        dispose.assert_not_awaited()
    dispose.assert_awaited_once()
    stop.assert_called_once()


async def test_api_disposes_engine_if_startup_fails(monkeypatch):
    dispose = AsyncMock()
    stop = Mock()
    monkeypatch.setattr(base, "engine", SimpleNamespace(dispose=dispose))
    monkeypatch.setattr(main, "start_launchdarkly", Mock(side_effect=RuntimeError("startup failed")))
    monkeypatch.setattr(main, "shutdown_launchdarkly", stop)
    app = main.create_app()

    with pytest.raises(RuntimeError, match="startup failed"):
        async with app.router.lifespan_context(app):
            pass
    dispose.assert_awaited_once()
    stop.assert_called_once()


async def test_worker_disposes_engine_on_failure(monkeypatch):
    dispose = AsyncMock()
    monkeypatch.setattr(worker, "engine", SimpleNamespace(dispose=dispose))
    monkeypatch.setattr(worker, "worker_loop", AsyncMock(side_effect=RuntimeError("worker failed")))
    with pytest.raises(RuntimeError, match="worker failed"):
        await worker._run()
    dispose.assert_awaited_once()
