"""Server-issued capture tokens: hashing, admin issue, and revocation."""

from datetime import datetime, timedelta, timezone

import pytest

from app.services.capture_tokens import generate_capture_token, hash_capture_token

pytestmark = pytest.mark.anyio


@pytest.mark.no_db
def test_generate_capture_token_hash():
    raw, digest = generate_capture_token()
    assert raw.startswith("eea_")
    assert len(digest) == 64
    assert hash_capture_token(raw) == digest


async def test_issue_use_and_revoke_capture_token(client):
    issued = await client.post(
        "/api/v1/capture/tokens",
        json={"subject": "alice", "label": "windows-laptop"},
    )
    assert issued.status_code == 201, issued.text
    body = issued.json()
    assert body["subject"] == "alice"
    assert body["role"] == "researcher"
    assert body["token"].startswith("eea_")

    who = await client.get(
        "/api/v1/capture/whoami",
        headers={"Authorization": f"Bearer {body['token']}"},
    )
    assert who.status_code == 200, who.text
    assert who.json() == {"subject": "alice", "role": "researcher"}

    rows = await client.get("/api/v1/capture/tokens")
    assert rows.status_code == 200
    assert any(row["id"] == body["id"] for row in rows.json())

    revoked = await client.post(f"/api/v1/capture/tokens/{body['id']}/revoke")
    assert revoked.status_code == 200, revoked.text
    assert revoked.json()["revoked_at"] is not None

    rejected = await client.get(
        "/api/v1/capture/whoami",
        headers={"Authorization": f"Bearer {body['token']}"},
    )
    assert rejected.status_code == 401


async def test_expired_capture_token_is_rejected(client):
    issued = await client.post(
        "/api/v1/capture/tokens",
        json={
            "subject": "bob",
            "expires_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
        },
    )
    assert issued.status_code == 201, issued.text
    token = issued.json()["token"]
    rejected = await client.get(
        "/api/v1/capture/whoami",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert rejected.status_code == 401
