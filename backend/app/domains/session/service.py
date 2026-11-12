from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import AccessLog
from app.schemas.schemas import SessionOut
from app.services.useragent import simplify_ua

DEDUPE_WINDOW = timedelta(minutes=10)


async def record_visit(
    db: AsyncSession,
    *,
    ip: str,
    raw_ua: str,
    page: str | None,
) -> AccessLog:
    """Record one page visit; identical visits within 10 minutes collapse."""
    browser, os_name = simplify_ua(raw_ua)
    since = datetime.now(timezone.utc) - DEDUPE_WINDOW
    query = select(AccessLog).where(
        AccessLog.ip == ip,
        AccessLog.ua_browser == browser,
        AccessLog.ua_os == os_name,
        AccessLog.created_at >= since,
    )
    if page:
        query = query.where(AccessLog.page == page)
    existing = (
        await db.execute(query.order_by(AccessLog.created_at.desc()).limit(1))
    ).scalar_one_or_none()
    if existing is not None:
        return existing
    row = AccessLog(
        ip=ip,
        ua_browser=browser,
        ua_os=os_name,
        ua_raw=raw_ua[:500] or None,
        page=page,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def list_access_history(
    db: AsyncSession,
    *,
    ip: str,
    limit: int,
) -> list[AccessLog]:
    rows = (
        await db.execute(
            select(AccessLog)
            .where(AccessLog.ip == ip)
            .order_by(AccessLog.created_at.desc())
            .limit(limit)
        )
    ).scalars()
    return list(rows)


async def session_summary(
    db: AsyncSession,
    *,
    ip: str,
    raw_ua: str,
) -> SessionOut:
    browser, os_name = simplify_ua(raw_ua)
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
