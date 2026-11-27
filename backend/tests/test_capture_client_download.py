"""The capture client is published uncompressed: an exe and a dmg.

The page must only offer what the server actually has (a dead macOS link is
worse than an honest "not published yet"), and the download itself must be the
binary - not a zip wrapper that 7-Zip refuses.

The Windows build is published as plain `capture.exe`; a versioned
`capture-vX-windows-amd64.exe` from an older publish may still sit beside it and
must never win.
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


def _publish_windows(tmp_path, payload: bytes = WINDOWS_BYTES, name: str = "capture.exe"):
    return _stage(tmp_path, name, payload)


async def test_releases_lists_the_plain_exe(client, tmp_path, monkeypatch):
    _publish_windows(tmp_path)
    monkeypatch.setattr(capture_api, "_client_dist_dir", lambda: tmp_path)
    response = await client.get("/api/v1/capture/client-releases")

    assert response.status_code == 200, response.text
    releases = response.json()
    assert [(item["platform"], item["filename"]) for item in releases] == [
        ("windows", "capture.exe")
    ]
    assert releases[0]["size_bytes"] == len(WINDOWS_BYTES)
    assert releases[0]["sha256"] == hashlib.sha256(WINDOWS_BYTES).hexdigest()
    assert releases[0]["download_url"].endswith("platform=windows")


async def test_macos_appears_once_a_dmg_is_published(client, tmp_path, monkeypatch):
    _publish_windows(tmp_path)
    _stage(tmp_path, "EEA-Capture-v0.1.2-macOS.dmg", MAC_BYTES)
    monkeypatch.setattr(capture_api, "_client_dist_dir", lambda: tmp_path)

    releases = (await client.get("/api/v1/capture/client-releases")).json()

    assert {item["platform"] for item in releases} == {"windows", "macos"}


async def test_windows_download_is_the_executable_itself(client, tmp_path, monkeypatch):
    _publish_windows(tmp_path)
    monkeypatch.setattr(capture_api, "_client_dist_dir", lambda: tmp_path)

    response = await client.get("/api/v1/capture/client-download?platform=windows")

    assert response.status_code == 200, response.text
    assert response.content == WINDOWS_BYTES
    assert response.headers["content-type"] == "application/vnd.microsoft.portable-executable"
    assert 'filename="capture.exe"' in response.headers["content-disposition"]


async def test_plain_capture_exe_beats_a_leftover_versioned_build(client, tmp_path, monkeypatch):
    versioned = _publish_windows(tmp_path, b"old", "capture-v0.1.1-windows-amd64.exe")
    plain = _publish_windows(tmp_path, b"new")
    # Even when the leftover is newer, the published name wins.
    os.utime(plain, (1_000_000, 1_000_000))
    monkeypatch.setattr(capture_api, "_client_dist_dir", lambda: tmp_path)

    response = await client.get("/api/v1/capture/client-download?platform=windows")

    assert response.content == b"new"
    assert 'filename="capture.exe"' in response.headers["content-disposition"]
    assert versioned.is_file()


async def test_a_versioned_build_still_works_when_it_is_all_there_is(client, tmp_path, monkeypatch):
    _publish_windows(tmp_path, b"only", "capture-v0.1.2-windows-amd64.exe")
    monkeypatch.setattr(capture_api, "_client_dist_dir", lambda: tmp_path)

    response = await client.get("/api/v1/capture/client-download?platform=windows")

    assert response.status_code == 200
    assert response.content == b"only"


async def test_unpublished_platform_is_a_404(client, tmp_path, monkeypatch):
    _publish_windows(tmp_path)
    monkeypatch.setattr(capture_api, "_client_dist_dir", lambda: tmp_path)

    mac = await client.get("/api/v1/capture/client-download?platform=macos")
    unknown = await client.get("/api/v1/capture/client-download?platform=beos")

    assert mac.status_code == 404
    assert unknown.status_code == 404


async def test_version_comes_from_the_release_sidecar(client, tmp_path, monkeypatch):
    _publish_windows(tmp_path)
    (tmp_path / "capture.exe.json").write_text('{"version": "v0.1.3"}', encoding="utf-8")
    monkeypatch.setattr(capture_api, "_client_dist_dir", lambda: tmp_path)

    releases = (await client.get("/api/v1/capture/client-releases")).json()

    assert releases[0]["version"] == "v0.1.3"


async def test_broken_sidecar_falls_back_to_the_filename(client, tmp_path, monkeypatch):
    _publish_windows(tmp_path, name="capture-v0.1.2-windows-amd64.exe")
    (tmp_path / "capture-v0.1.2-windows-amd64.exe.json").write_text("not json", encoding="utf-8")
    monkeypatch.setattr(capture_api, "_client_dist_dir", lambda: tmp_path)

    releases = (await client.get("/api/v1/capture/client-releases")).json()

    assert releases[0]["version"] == "v0.1.2"


async def test_no_sidecar_and_plain_name_reports_no_version(client, tmp_path, monkeypatch):
    _publish_windows(tmp_path)
    monkeypatch.setattr(capture_api, "_client_dist_dir", lambda: tmp_path)

    releases = (await client.get("/api/v1/capture/client-releases")).json()

    assert releases[0]["version"] is None


async def test_sidecar_digest_matching_the_bytes_keeps_the_version(client, tmp_path, monkeypatch):
    payload = b"new build"
    _publish_windows(tmp_path, payload)
    (tmp_path / "capture.exe.json").write_text(
        '{"version": "v0.1.5", "sha256": "' + hashlib.sha256(payload).hexdigest() + '"}',
        encoding="utf-8",
    )
    monkeypatch.setattr(capture_api, "_client_dist_dir", lambda: tmp_path)

    releases = (await client.get("/api/v1/capture/client-releases")).json()

    assert releases[0]["version"] == "v0.1.5"


async def test_sidecar_from_another_build_is_not_shown_as_the_version(client, tmp_path, monkeypatch):
    # A publish that copied only the exe leaves the previous sidecar behind.
    _publish_windows(tmp_path, b"new build")
    (tmp_path / "capture.exe.json").write_text(
        '{"version": "v0.1.2", "sha256": "' + hashlib.sha256(b"old build").hexdigest() + '"}',
        encoding="utf-8",
    )
    monkeypatch.setattr(capture_api, "_client_dist_dir", lambda: tmp_path)

    releases = (await client.get("/api/v1/capture/client-releases")).json()

    assert releases[0]["sha256"] == hashlib.sha256(b"new build").hexdigest()
    assert releases[0]["version"] is None
