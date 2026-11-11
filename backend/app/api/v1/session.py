"""IP-identity session helpers (no login system yet).

The internal address is the identity: every visit is recorded with a simplified
browser/OS pair, and the profile page reads the history for the caller's IP.
No cookies, tokens or raw fingerprints are stored beyond the UA string itself.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.domains.session.service import list_access_history, record_visit, session_summary
from app.schemas.schemas import AccessLogOut, AccessVisitIn, SessionOut

router = APIRouter(prefix="/session", tags=["session"])


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _user_agent(request: Request) -> str:
    return request.headers.get("user-agent", "")


@router.post("/visit", response_model=AccessLogOut)
async def record_visit_endpoint(
    payload: AccessVisitIn, request: Request, db: AsyncSession = Depends(get_db)
):
    """Record one page visit; identical visits within 10 minutes collapse."""
    return await record_visit(
        db,
        ip=_client_ip(request),
        raw_ua=_user_agent(request),
        page=payload.page,
    )


@router.get("/history", response_model=list[AccessLogOut])
async def access_history(
    request: Request,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Recent visits for the caller's IP (auto identity)."""
    return await list_access_history(db, ip=_client_ip(request), limit=limit)


@router.get("/me", response_model=SessionOut)
async def session_me(request: Request, db: AsyncSession = Depends(get_db)):
    return await session_summary(
        db, ip=_client_ip(request), raw_ua=_user_agent(request)
    )
