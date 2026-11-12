"""Exercise the importer review gate with persistent, retained evidence."""
from __future__ import annotations

import json
from uuid import uuid4

import pytest
from sqlalchemy import select

from app.core.identity import OperatorIdentity, get_operator_identity
from app.db.base import SessionLocal
from app.main import app
from app.models.models import DemandPoint, PanoramaImportBatch, PanoramaImportUrl, Signal, TechTheme, VehicleFunction
from app.services.panorama_import_graph import run_panorama_structure
from app.services.panorama_workbook import parse_panorama_workbook
from tests.test_panorama_import import _minimal_workbook_bytes

pytestmark = pytest.mark.anyio


async def test_imported_demand_cannot_bypass_human_review(client):
    workbook = parse_panorama_workbook(_minimal_workbook_bytes())
    row = workbook.chain_rows[0]
    async with SessionLocal() as db:
        batch = PanoramaImportBatch(
            sha256=uuid4().hex * 2,
            filename="fixture.xlsx",
            workbook_object_key="fixture.xlsx",
            snapshot_json=json.loads(workbook.model_dump_json()),
            status="capturing",
        )
        theme = TechTheme(working_name=row.value_chain_stage_label, value_chain_stage_code=row.value_chain_stage_code)
        db.add_all([batch, theme])
        await db.flush()
        for index in range(2):
            url = f"https://example.test/{uuid4()}"
            signal = Signal(
                title=f"Evidence {index}", url=url, url_normalized=url,
                channel_code="web", evidence_status_code="retained", tech_theme_id=theme.id,
            )
            db.add(signal)
            await db.flush()
            db.add(PanoramaImportUrl(
                batch_id=batch.id, url=url, url_normalized=url, signal_id=signal.id,
                contexts=[{"value_chain_stage_code": row.value_chain_stage_code}],
            ))
        await db.commit()
        batch_id = batch.id
        await run_panorama_structure(db, batch_id)
        await db.refresh(batch)
        assert batch.status == "completed"
        assert batch.demands_created == 1
        assert batch.functions_published == 0
        demand = (await db.execute(select(DemandPoint).where(DemandPoint.source_tech_theme_id == theme.id))).scalar_one()
        demand_id = demand.id
        assert demand.review_status == "pending"
        assert demand.cross_validation is None
        assert (await db.execute(select(VehicleFunction).where(VehicleFunction.demand_point_id == demand_id))).scalars().all() == []

    app.dependency_overrides[get_operator_identity] = lambda: OperatorIdentity("researcher-1", "researcher")
    try:
        response = await client.patch(f"/api/v1/demands/{demand_id}", json={"review_status": "confirmed"})
        assert response.status_code == 403
        response = await client.post("/api/v1/functions", json={"demand_point_id": str(demand_id), "name": "Function"})
        assert response.status_code == 422
    finally:
        app.dependency_overrides.pop(get_operator_identity, None)
