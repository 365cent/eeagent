"""Capture upload identity: Bearer upload token or trusted reverse-proxy headers."""
from __future__ import annotations

from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.core.config import get_settings
from app.core.identity import OperatorIdentity, get_operator_identity
from app.platform.capture_tokens import resolve_capture_token


def resolve_capture_bearer(token: str) -> OperatorIdentity | None:
    settings = get_settings()
    token = token.strip()
    if not token:
        return None
    for part in settings.capture_bearer_tokens.split(","):
        part = part.strip()
        if not part or ":" not in part:
            continue
        subject, expected = part.split(":", 1)
        if expected == token:
            return OperatorIdentity(subject.strip(), "researcher")
    return None


async def get_capture_identity(
    request: Request, db: AsyncSession = Depends(get_db)
) -> OperatorIdentity:
    auth = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        token = auth[7:].strip()
        resolved = resolve_capture_bearer(token)
        if resolved is None and token.startswith("eea_"):
            resolved = await resolve_capture_token(db, token)
        if resolved is None:
            raise HTTPException(401, "capture upload token 无效或已撤销")
        return resolved
    return get_operator_identity(request)


def assert_capture_job_access(job_owner: str | None, actor: OperatorIdentity) -> None:
    if actor.role == "platform_admin":
        return
    if job_owner and job_owner != actor.subject:
        raise HTTPException(403, "无权访问该采集任务")
