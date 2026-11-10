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
    sig = await create_signal(client, evidence_status_code="retained")
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


async def test_delete_requires_archived_status(client):
    sig = await create_signal(client, evidence_status_code="retained")
    denied = await client.delete(f"/api/v1/signals/{sig['id']}")
    assert denied.status_code == 409

    await client.patch(f"/api/v1/signals/{sig['id']}", json={"evidence_status_code": "archived"})
    deleted = await client.delete(f"/api/v1/signals/{sig['id']}")
    assert deleted.status_code == 204
    assert (await client.get(f"/api/v1/signals/{sig['id']}")).status_code == 404
