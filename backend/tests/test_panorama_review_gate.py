"""The workbook importer cannot make human review or publication decisions."""
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.models.models import DemandPoint
from app.services import panorama_import_graph as graph
from app.services import panorama_import_signals as signals

pytestmark = [pytest.mark.anyio, pytest.mark.no_db]


def _row(name="Demand"):
    return SimpleNamespace(
        demand_name=name,
        function_name="Function",
        value_chain_stage_code="creation",
        value_chain_stage_label="Creation",
    )


def _database(batch):
    db = SimpleNamespace(
        get=AsyncMock(return_value=batch),
        commit=AsyncMock(),
        rollback=AsyncMock(),
        add=AsyncMock(),
    )
    # SQLAlchemy add is synchronous.
    from unittest.mock import Mock
    db.add = Mock()
    return db


async def test_import_creates_only_pending_drafts(monkeypatch):
    batch = SimpleNamespace(status="capturing")
    db = _database(batch)
    theme = SimpleNamespace(id=uuid4(), value_chain_stage_code="creation")
    monkeypatch.setattr(graph, "load_workbook_model", AsyncMock(return_value=SimpleNamespace(chain_rows=[_row(), _row()])))
    monkeypatch.setattr(graph, "signal_ids_for_stage", AsyncMock(return_value=[uuid4(), uuid4()]))
    monkeypatch.setattr(graph, "_theme_for_row", AsyncMock(return_value=theme))
    monkeypatch.setattr(graph, "validate_demand_trace", AsyncMock(return_value=None))

    await graph.run_panorama_structure(db, uuid4())

    db.add.assert_called_once()
    draft = db.add.call_args.args[0]
    assert isinstance(draft, DemandPoint)
    assert draft.review_status == "pending"
    assert draft.cross_validation is None
    assert batch.status == "completed"
    assert batch.demands_created == 1
    assert batch.functions_published == 0
    db.rollback.assert_not_awaited()


async def test_import_rolls_back_partial_work_on_failure(monkeypatch):
    batch = SimpleNamespace(status="capturing")
    db = _database(batch)
    monkeypatch.setattr(graph, "load_workbook_model", AsyncMock(side_effect=ValueError("invalid workbook")))

    await graph.run_panorama_structure(db, uuid4())

    db.rollback.assert_awaited_once()
    assert db.commit.await_count == 2
    assert batch.status == "failed"
    assert batch.error == "invalid workbook"


async def test_import_respects_human_signal_corrections(monkeypatch):
    signal_id = uuid4()
    row = SimpleNamespace(
        signal_id=None,
        contexts=[{"value_chain_stage_code": "creation", "signal_type_code": "technology", "value_chain_stage_label": "Creation"}],
        channel_code="web",
    )
    signal = SimpleNamespace(
        value_chain_stage_code="existing-stage",
        signal_type_code="existing-type",
        channel_code="existing-channel",
        tech_theme_id=uuid4(),
    )
    original_theme_id = signal.tech_theme_id
    result = SimpleNamespace(scalar_one_or_none=lambda: row)
    db = SimpleNamespace(execute=AsyncMock(return_value=result), get=AsyncMock(return_value=signal), commit=AsyncMock())
    monkeypatch.setattr(signals, "human_corrected_fields", AsyncMock(return_value={"value_chain_stage_code", "signal_type_code", "tech_theme_id"}))
    create_theme = AsyncMock()
    monkeypatch.setattr(signals, "_get_or_create_stage_theme", create_theme)

    await signals.sync_import_url_signal(db, batch_id=uuid4(), job_id=uuid4(), signal_id=signal_id)

    assert row.signal_id == signal_id
    assert signal.value_chain_stage_code == "existing-stage"
    assert signal.signal_type_code == "existing-type"
    assert signal.channel_code == "existing-channel"
    assert signal.tech_theme_id == original_theme_id
    create_theme.assert_not_awaited()
    db.commit.assert_awaited_once()
