"""Server-issued capture upload tokens (CC-03)."""
from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import OperatorIdentity
from app.models.models import CaptureToken


def hash_capture_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def generate_capture_token() -> tuple[str, str]:
    raw = "eea_" + secrets.token_urlsafe(32)
    return raw, hash_capture_token(raw)


async def issue_capture_token(
    db: AsyncSession,
    actor: OperatorIdentity,
    subject: str,
    label: str | None = None,
    expires_at: datetime | None = None,
):
    raw, digest = generate_capture_token()
    if expires_at is not None and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    row = CaptureToken(
        subject=subject,
        role="researcher",
        label=label,
        token_sha256=digest,
        created_by=actor.subject,
        expires_at=expires_at,
    )
    db.add(row)
    await db.flush()
    return raw, row


async def resolve_capture_token(db: AsyncSession, raw: str) -> OperatorIdentity | None:
    digest = hash_capture_token(raw.strip())
    row = (
        await db.execute(select(CaptureToken).where(CaptureToken.token_sha256 == digest))
    ).scalar_one_or_none()
    if row is None or row.revoked_at is not None:
        return None
    if row.expires_at is not None and row.expires_at <= datetime.now(timezone.utc):
        return None
    return OperatorIdentity(row.subject, row.role)


async def list_capture_tokens(db: AsyncSession) -> list[CaptureToken]:
    return list(
        (
            await db.execute(select(CaptureToken).order_by(CaptureToken.created_at.desc()))
        ).scalars()
    )


async def revoke_capture_token(
    db: AsyncSession,
    actor: OperatorIdentity,
    token_id: uuid.UUID,
) -> CaptureToken | None:
    row = await db.get(CaptureToken, token_id)
    if row is None:
        return None
    if row.revoked_at is None:
        row.revoked_at = datetime.now(timezone.utc)
        row.revoked_by = actor.subject
        await db.flush()
    return row
