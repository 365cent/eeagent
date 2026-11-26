"""Archive lifecycle: list filter, PATCH archived, restore, delete."""

import pytest

from tests.support import create_signal

pytestmark = pytest.mark.anyio


async def test_list_hides_archived_by_default(client):
    retained = await create_signal(client, url="https://example.com/retained", evidence_status_code="retained")
    archived = await create_signal(client, url="https://example.com/archived", evidence_status_code="archived")
    default_list = (await client.get("/api/v1/signals", params={"limit": 200})).json()
    ids = {row["id"] for row in default_list}
    assert retained["id"] in ids
    assert archived["id"] not in ids

    archived_list = (await client.get("/api/v1/signals", params={"evidence_status": "archived", "limit": 200})).json()
    assert {row["id"] for row in archived_list} >= {archived["id"]}


async def test_patch_archive_and_restore(client):
    sig = await create_signal(
        client,
        evidence_status_code="retained",
        body_text="Archived body evidence",
    )
    patched = await client.patch(
        f"/api/v1/signals/{sig['id']}",
        json={"evidence_status_code": "archived"},
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["evidence_status_code"] == "archived"

    audit = (await client.get("/api/v1/audit", params={"entity_id": sig["id"]})).json()
    assert any(row["field_name"] == "evidence_status_code" for row in audit)

    restored = await client.patch(
        f"/api/v1/signals/{sig['id']}",
        json={"evidence_status_code": "retained"},
    )
    assert restored.status_code == 200
    assert restored.json()["evidence_status_code"] == "retained"


async def test_cannot_mark_retained_without_body_text(client):
    sig = await create_signal(client)
    response = await client.patch(
        f"/api/v1/signals/{sig['id']}", json={"evidence_status_code": "retained"}
    )
    assert response.status_code == 422
    assert "require stored body text" in response.json()["detail"]


async def test_delete_requires_archived_status(client):
    sig = await create_signal(client, evidence_status_code="retained")
    denied = await client.delete(f"/api/v1/signals/{sig['id']}")
    assert denied.status_code == 409

    await client.patch(f"/api/v1/signals/{sig['id']}", json={"evidence_status_code": "archived"})
    deleted = await client.delete(f"/api/v1/signals/{sig['id']}")
    assert deleted.status_code == 204
    assert (await client.get(f"/api/v1/signals/{sig['id']}")).status_code == 404

async def test_all_five_states_are_reachable_and_each_transition_is_audited(client):
    sig = await create_signal(
        client,
        evidence_status_code="fetching",
        body_text="Stored body for the status-transition test.",
    )
    transitions = ("fetch_failed", "pending_review", "retained", "archived", "retained")
    for status in transitions:
        response = await client.patch(
            f"/api/v1/signals/{sig['id']}", json={"evidence_status_code": status}
        )
        assert response.status_code == 200, response.text
        assert response.json()["evidence_status_code"] == status

    audit = (await client.get("/api/v1/audit", params={"entity_id": sig["id"]})).json()
    rows = [row for row in audit if row["field_name"] == "evidence_status_code"]
    assert len(rows) == len(transitions)
    pairs = {(row["old_value"], row["new_value"]) for row in rows}
    assert pairs == {
        ("fetching", "fetch_failed"),
        ("fetch_failed", "pending_review"),
        ("pending_review", "retained"),
        ("retained", "archived"),
        ("archived", "retained"),
    }


async def test_rejected_retained_transition_keeps_state_and_writes_no_audit(client):
    sig = await create_signal(client, evidence_status_code="fetching")
    response = await client.patch(
        f"/api/v1/signals/{sig['id']}", json={"evidence_status_code": "retained"}
    )
    assert response.status_code == 422, response.text
    detail = (await client.get(f"/api/v1/signals/{sig['id']}")).json()
    assert detail["evidence_status_code"] == "fetching"

    audit = (await client.get("/api/v1/audit", params={"entity_id": sig["id"]})).json()
    assert [row for row in audit if row["field_name"] == "evidence_status_code"] == []


async def test_repeating_the_same_status_does_not_duplicate_audit(client):
    sig = await create_signal(
        client, evidence_status_code="fetching", body_text="Stored body."
    )
    for _ in range(2):
        response = await client.patch(
            f"/api/v1/signals/{sig['id']}",
            json={"evidence_status_code": "pending_review"},
        )
        assert response.status_code == 200, response.text
    audit = (await client.get("/api/v1/audit", params={"entity_id": sig["id"]})).json()
    rows = [row for row in audit if row["field_name"] == "evidence_status_code"]
    assert len(rows) == 1
    assert (rows[0]["old_value"], rows[0]["new_value"]) == ("fetching", "pending_review")
