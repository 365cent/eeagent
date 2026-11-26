"""Audit responses expose the stored reason and model/rule/skill versions."""

from __future__ import annotations

import uuid

import pytest

from app.db.base import SessionLocal
from app.models.models import CorrectionAudit

pytestmark = pytest.mark.anyio


async def test_audit_out_exposes_reason_and_version_fields(client):
    entity_id = uuid.uuid4()
    async with SessionLocal() as db:
        db.add(
            CorrectionAudit(
                entity_type="signal",
                entity_id=entity_id,
                field_name="value_chain_stage_code",
                old_value="creation_supply",
                new_value="delivery_oem",
                operator_subject="auditor",
                operator_role="taxonomy_admin",
                reason="人工复核纠正",
                model_version="model-2026.11",
                rule_version="rules-3",
                skill_version="skills-7",
                score_source="llm",
            )
        )
        await db.commit()

    rows = (
        await client.get("/api/v1/audit", params={"entity_id": str(entity_id)})
    ).json()
    assert len(rows) == 1
    row = rows[0]
    assert row["reason"] == "人工复核纠正"
    assert row["model_version"] == "model-2026.11"
    assert row["rule_version"] == "rules-3"
    assert row["skill_version"] == "skills-7"
    assert row["score_source"] == "llm"
