"""Server-verified actor identity for audited business writes.

Development and tests use server configuration. Production accepts identity
headers only when the direct peer is an explicitly trusted reverse proxy.
"""
from __future__ import annotations

import ipaddress
from dataclasses import dataclass

from fastapi import HTTPException, Request

from app.core.config import get_settings


@dataclass(frozen=True)
class OperatorIdentity:
    subject: str
    role: str


def _trusted_peer(peer: str, configured: str) -> bool:
    try:
        address = ipaddress.ip_address(peer)
    except ValueError:
        return False
    for value in configured.split(","):
        value = value.strip()
        if not value:
            continue
        try:
            if address in ipaddress.ip_network(value, strict=False):
                return True
        except ValueError:
            continue
    return False


def get_operator_identity(request: Request) -> OperatorIdentity:
    settings = get_settings()
    if settings.app_env == "test":
        return OperatorIdentity("eea-test-actor", "platform_admin")
    if settings.app_env == "development":
        return OperatorIdentity(settings.dev_operator_subject, settings.dev_operator_role)

    peer = request.client.host if request.client else ""
    if not _trusted_peer(peer, settings.trusted_proxy_ips):
        raise HTTPException(401, "必须通过受信任的身份代理执行此操作")
    subject = request.headers.get("x-eea-authenticated-user", "").strip()
    role = request.headers.get("x-eea-authenticated-role", "").strip()
    if not subject or len(subject) > 200 or role not in {"researcher", "taxonomy_admin", "platform_admin"}:
        raise HTTPException(401, "身份代理未提供有效的操作者身份")
    return OperatorIdentity(subject, role)
