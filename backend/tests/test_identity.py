from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from starlette.requests import Request

import app.core.identity as identity


def _request(peer: str, headers: dict[str, str] | None = None) -> Request:
    encoded_headers = [(key.lower().encode(), value.encode()) for key, value in (headers or {}).items()]
    return Request(
        {
            "type": "http",
            "http_version": "1.1",
            "method": "GET",
            "scheme": "http",
            "path": "/",
            "raw_path": b"/",
            "query_string": b"",
            "headers": encoded_headers,
            "client": (peer, 12345),
            "server": ("localhost", 8000),
        }
    )


def test_development_identity_comes_from_server_settings(monkeypatch):
    monkeypatch.setattr(
        identity,
        "get_settings",
        lambda: SimpleNamespace(
            app_env="development",
            dev_operator_subject="dev-researcher",
            dev_operator_role="researcher",
        ),
    )
    actor = identity.get_operator_identity(
        _request("127.0.0.1", {"x-eea-authenticated-user": "spoof", "x-eea-authenticated-role": "platform_admin"})
    )
    assert (actor.subject, actor.role) == ("dev-researcher", "researcher")


def test_production_rejects_identity_headers_from_untrusted_peer(monkeypatch):
    monkeypatch.setattr(
        identity,
        "get_settings",
        lambda: SimpleNamespace(app_env="production", trusted_proxy_ips="10.0.0.8/32"),
    )
    with pytest.raises(HTTPException) as exc:
        identity.get_operator_identity(
            _request("10.0.0.9", {"x-eea-authenticated-user": "alice", "x-eea-authenticated-role": "researcher"})
        )
    assert exc.value.status_code == 401


def test_production_accepts_valid_identity_only_from_trusted_peer(monkeypatch):
    monkeypatch.setattr(
        identity,
        "get_settings",
        lambda: SimpleNamespace(app_env="production", trusted_proxy_ips="10.0.0.8/32"),
    )
    actor = identity.get_operator_identity(
        _request("10.0.0.8", {"x-eea-authenticated-user": "alice", "x-eea-authenticated-role": "taxonomy_admin"})
    )
    assert (actor.subject, actor.role) == ("alice", "taxonomy_admin")


def test_production_rejects_unmapped_role(monkeypatch):
    monkeypatch.setattr(
        identity,
        "get_settings",
        lambda: SimpleNamespace(app_env="production", trusted_proxy_ips="10.0.0.8/32"),
    )
    with pytest.raises(HTTPException) as exc:
        identity.get_operator_identity(
            _request("10.0.0.8", {"x-eea-authenticated-user": "alice", "x-eea-authenticated-role": "root"})
        )
    assert exc.value.status_code == 401
