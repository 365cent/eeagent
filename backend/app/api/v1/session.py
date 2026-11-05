"""IP-identity session helpers (no login system yet).

The internal address is the identity: every visit is recorded with a simplified
browser/OS pair, and the profile page reads the history for the caller's IP.
No cookies, tokens or raw fingerprints are stored beyond the UA string itself.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.models.models import AccessLog
from app.schemas.schemas import AccessLogOut, AccessVisitIn, SessionOut
from app.services.useragent import simplify_ua

router = APIRouter(prefix="/session", tags=["session"])

DEDUPE_WINDOW = timedelta(minutes=10)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _user_agent(request: Request) -> str:
    return request.headers.get("user-agent", "")


@router.post("/visit", response_model=AccessLogOut)
async def record_visit(
    payload: AccessVisitIn, request: Request, db: AsyncSession = Depends(get_db)
):
    """Record one page visit; identical visits within 10 minutes collapse."""
    ip = _client_ip(request)
    raw = _user_agent(request)
    browser, os_name = simplify_ua(raw)
    since = datetime.now(timezone.utc) - DEDUPE_WINDOW
    query = select(AccessLog).where(
        AccessLog.ip == ip,
        AccessLog.ua_browser == browser,
        AccessLog.ua_os == os_name,
        AccessLog.created_at >= since,
    )
    if payload.page:
        query = query.where(AccessLog.page == payload.page)
    existing = (
        await db.execute(query.order_by(AccessLog.created_at.desc()).limit(1))
    ).scalar_one_or_none()
    if existing is not None:
        return existing
    row = AccessLog(
        ip=ip,
        ua_browser=browser,
        ua_os=os_name,
        ua_raw=raw[:500] or None,
        page=payload.page,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.get("/history", response_model=list[AccessLogOut])
async def access_history(
    request: Request,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Recent visits for the caller's IP (auto identity)."""
    ip = _client_ip(request)
    rows = (
        await db.execute(
            select(AccessLog)
            .where(AccessLog.ip == ip)
            .order_by(AccessLog.created_at.desc())
            .limit(limit)
        )
    ).scalars()
    return list(rows)


@router.get("/me", response_model=SessionOut)
async def session_me(request: Request, db: AsyncSession = Depends(get_db)):
    ip = _client_ip(request)
    browser, os_name = simplify_ua(_user_agent(request))
    row = (
        await db.execute(
            select(
                func.count(AccessLog.id),
                func.min(AccessLog.created_at),
                func.max(AccessLog.created_at),
            ).where(AccessLog.ip == ip)
        )
    ).one()
    return SessionOut(
        ip=ip,
        ua_browser=browser,
        ua_os=os_name,
        visits=int(row[0] or 0),
        first_seen=row[1],
        last_seen=row[2],
    )
