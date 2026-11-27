"""The capture client is published uncompressed: an exe and a dmg.

The page must only offer what the server actually has (a dead macOS link is
worse than an honest "not published yet"), and the download itself must be the
binary - not a zip wrapper that 7-Zip refuses.
"""
from __future__ import annotations

import hashlib
import os

import pytest

from app.api.v1 import capture as capture_api

pytestmark = [pytest.mark.anyio, pytest.mark.db]

WINDOWS_BYTES = b"MZ\x90\x00capture-windows"
MAC_BYTES = b"koly\x00\x00\x00\x02capture-mac"


def _stage(tmp_path, name: str, payload: bytes):
    path = tmp_path / name
    path.write_bytes(payload)
    return path


async def test_releases_lists_only_what_is_published(client, tmp_path, monkeypatch):
    _stage(tmp_path, "capture-v0.1.2-windows-amd64.exe", WINDOWS_BYTES)
    monkeypatch.setattr(capture_api, "_client_dist_dir", lambda: tmp_path)

    response = await client.get("/api/v1/capture/client-releases")

    assert response.status_code == 200, response.text
    releases = response.json()
    assert [(item["platform"], item["filename"]) for item in releases] == [
        ("windows", "capture-v0.1.2-windows-amd64.exe")
    ]
    assert releases[0]["size_bytes"] == len(WINDOWS_BYTES)
    assert releases[0]["sha256"] == hashlib.sha256(WINDOWS_BYTES).hexdigest()
    assert releases[0]["download_url"].endswith("platform=windows")


async def test_macos_appears_once_a_dmg_is_published(client, tmp_path, monkeypatch):
    _stage(tmp_path, "capture-v0.1.2-windows-amd64.exe", WINDOWS_BYTES)
    _stage(tmp_path, "EEA-Capture-v0.1.2-macOS.dmg", MAC_BYTES)
    monkeypatch.setattr(capture_api, "_client_dist_dir", lambda: tmp_path)

    releases = (await client.get("/api/v1/capture/client-releases")).json()

    assert {item["platform"] for item in releases} == {"windows", "macos"}


async def test_windows_download_is_the_executable_itself(client, tmp_path, monkeypatch):
    _stage(tmp_path, "capture-v0.1.2-windows-amd64.exe", WINDOWS_BYTES)
    monkeypatch.setattr(capture_api, "_client_dist_dir", lambda: tmp_path)

    response = await client.get("/api/v1/capture/client-download?platform=windows")

    assert response.status_code == 200, response.text
    assert response.content == WINDOWS_BYTES
    assert response.headers["content-type"] == "application/vnd.microsoft.portable-executable"
    assert "capture-v0.1.2-windows-amd64.exe" in response.headers["content-disposition"]


async def test_newest_build_wins(client, tmp_path, monkeypatch):
    old = _stage(tmp_path, "capture-v0.1.1-windows-amd64.exe", b"old")
    new = _stage(tmp_path, "capture-v0.1.2-windows-amd64.exe", b"new")
    old.touch()
    os.utime(old, (1_000_000, 1_000_000))
    monkeypatch.setattr(capture_api, "_client_dist_dir", lambda: tmp_path)

    response = await client.get("/api/v1/capture/client-download?platform=windows")

    assert response.content == b"new"
    assert new.name in response.headers["content-disposition"]


async def test_unpublished_platform_is_a_404(client, tmp_path, monkeypatch):
    _stage(tmp_path, "capture-v0.1.2-windows-amd64.exe", WINDOWS_BYTES)
    monkeypatch.setattr(capture_api, "_client_dist_dir", lambda: tmp_path)

    mac = await client.get("/api/v1/capture/client-download?platform=macos")
    unknown = await client.get("/api/v1/capture/client-download?platform=beos")

    assert mac.status_code == 404
    assert unknown.status_code == 404
