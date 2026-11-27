"""Admin endpoints for server-issued capture upload tokens (CC-03)."""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import OperatorIdentity, get_operator_identity
from app.db.base import get_db
from app.models.models import CaptureToken
from app.platform.audit import record_correction
from app.platform.capture_tokens import (
    issue_capture_token,
    list_capture_tokens,
    revoke_capture_token,
)

router = APIRouter(prefix="/capture/tokens", tags=["capture"])


class CaptureTokenCreate(BaseModel):
    subject: str = Field(min_length=1, max_length=200)
    label: str | None = Field(default=None, max_length=200)
    expires_at: datetime | None = None


class CaptureTokenCreated(BaseModel):
    id: uuid.UUID
    subject: str
    role: str
    label: str | None
    created_at: datetime
    expires_at: datetime | None
    token: str


class CaptureTokenOut(BaseModel):
    id: uuid.UUID
    subject: str
    role: str
    label: str | None
    created_at: datetime
    created_by: str
    expires_at: datetime | None
    revoked_at: datetime | None
    revoked_by: str | None


def require_platform_admin(
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    if actor.role != "platform_admin":
        raise HTTPException(403, "仅平台管理员可管理采集凭据")
    return actor


def _out(row: CaptureToken) -> CaptureTokenOut:
    return CaptureTokenOut(
        id=row.id,
        subject=row.subject,
        role=row.role,
        label=row.label,
        created_at=row.created_at,
        created_by=row.created_by,
        expires_at=row.expires_at,
        revoked_at=row.revoked_at,
        revoked_by=row.revoked_by,
    )


@router.post("", response_model=CaptureTokenCreated, status_code=201)
async def create_capture_token(
    payload: CaptureTokenCreate,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(require_platform_admin),
):
    subject = payload.subject.strip()
    if not subject:
        raise HTTPException(422, "subject must not be empty")
    raw, row = await issue_capture_token(
        db,
        actor,
        subject=subject,
        label=payload.label.strip() if payload.label else None,
        expires_at=payload.expires_at,
    )
    await record_correction(
        db,
        "capture_token",
        row.id,
        "issued",
        None,
        {"subject": row.subject, "label": row.label},
        actor,
        reason="签发采集凭据",
    )
    await db.commit()
    await db.refresh(row)
    return CaptureTokenCreated(
        id=row.id,
        subject=row.subject,
        role=row.role,
        label=row.label,
        created_at=row.created_at,
        expires_at=row.expires_at,
        token=raw,
    )


@router.get("", response_model=list[CaptureTokenOut])
async def capture_tokens(
    db: AsyncSession = Depends(get_db),
    _actor: OperatorIdentity = Depends(require_platform_admin),
):
    return [_out(row) for row in await list_capture_tokens(db)]


@router.post("/{token_id}/revoke", response_model=CaptureTokenOut)
async def revoke_token(
    token_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(require_platform_admin),
):
    row = await db.get(CaptureToken, token_id)
    if row is None:
        raise HTTPException(404, "capture token not found")
    was_revoked = row.revoked_at is not None
    row = await revoke_capture_token(db, actor, token_id)
    if not was_revoked:
        await record_correction(
            db,
            "capture_token",
            row.id,
            "revoked",
            {"revoked_at": None},
            {"revoked_at": row.revoked_at.isoformat() if row.revoked_at else None},
            actor,
            reason="撤销采集凭据",
        )
        await db.commit()
        await db.refresh(row)
    return _out(row)
