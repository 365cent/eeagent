"""BE-05 multi-URL provenance: primary source, supplementary URLs, theme counts."""

from __future__ import annotations

import pytest

from app.core.identity import OperatorIdentity, get_operator_identity
from tests.support import assign_signal_theme, create_signal, create_theme

pytestmark = pytest.mark.anyio


async def _sources(client, signal_id) -> list[dict]:
    response = await client.get(f"/api/v1/signals/{signal_id}/sources")
    assert response.status_code == 200, response.text
    return response.json()


async def test_new_signal_gets_one_primary_source(client):
    signal = await create_signal(client)
    sources = await _sources(client, signal["id"])
    assert len(sources) == 1
    primary = sources[0]
    assert primary["is_primary"] is True
    assert primary["url"] == signal["url"]
    assert primary["url_normalized"] == signal["url"].rstrip("/")
    assert primary["provenance"] == "primary"


async def test_supplementary_urls_dedupe_on_normalized_url(client):
    signal = await create_signal(client)
    created = await client.post(
        f"/api/v1/signals/{signal['id']}/sources",
        json={"url": "https://Mirror.Example.com/copy/?utm_source=feed", "provenance": "转载"},
    )
    assert created.status_code == 201, created.text
    row = created.json()
    assert row["is_primary"] is False
    assert row["url_normalized"] == "https://mirror.example.com/copy"
    assert row["provenance"] == "转载"

    again = await client.post(
        f"/api/v1/signals/{signal['id']}/sources",
        json={"url": "https://mirror.example.com/copy/"},
    )
    assert again.status_code == 201, again.text
    assert again.json()["id"] == row["id"]

    primary_again = await client.post(
        f"/api/v1/signals/{signal['id']}/sources",
        json={"url": signal["url"]},
    )
    assert primary_again.status_code == 201, primary_again.text
    assert primary_again.json()["is_primary"] is True

    sources = await _sources(client, signal["id"])
    assert [source["is_primary"] for source in sources] == [True, False]


async def test_archived_signal_rejects_new_source(client):
    signal = await create_signal(client, evidence_status_code="archived")
    response = await client.post(
        f"/api/v1/signals/{signal['id']}/sources",
        json={"url": "https://mirror.example.com/archived-copy"},
    )
    assert response.status_code == 409, response.text
    sources = await _sources(client, signal["id"])
    assert [source["is_primary"] for source in sources] == [True]


async def test_role_without_source_permission_is_rejected(client):
    from app.main import app

    signal = await create_signal(client)
    app.dependency_overrides[get_operator_identity] = lambda: OperatorIdentity(
        "viewer", "viewer"
    )
    try:
        response = await client.post(
            f"/api/v1/signals/{signal['id']}/sources",
            json={"url": "https://mirror.example.com/forbidden"},
        )
    finally:
        app.dependency_overrides.pop(get_operator_identity, None)
    assert response.status_code == 403, response.text


async def test_theme_source_count_counts_supplementary_and_dedupes_shared_urls(client):
    theme = await create_theme(client, working_name="多来源计数-验收")
    shared = "https://shared.example.com/article"

    active = await create_signal(client, url=shared, title="活跃成员")
    await assign_signal_theme(client, active["id"], theme["id"])
    added = await client.post(
        f"/api/v1/signals/{active['id']}/sources",
        json={"url": "https://mirror.example.com/copy", "provenance": "转载"},
    )
    assert added.status_code == 201, added.text

    archived = await create_signal(client, url=shared, title="归档成员")
    await assign_signal_theme(client, archived["id"], theme["id"])
    archived_patch = await client.patch(
        f"/api/v1/signals/{archived['id']}",
        json={"evidence_status_code": "archived"},
    )
    assert archived_patch.status_code == 200, archived_patch.text

    detail = (await client.get(f"/api/v1/themes/{theme['id']}")).json()
    assert detail["metrics"]["signal_frequency"] == 1
    assert detail["metrics"]["source_count"] == 2