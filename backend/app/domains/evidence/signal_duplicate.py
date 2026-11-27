"""When the same canonical URL is captured again, keep the row but suffix the title."""
from __future__ import annotations

import re

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Signal

DUPLICATE_TITLE_SUFFIX_RE = re.compile(r" \(重复采集 #\d+\)$")


def strip_duplicate_title_suffix(title: str) -> str:
    return DUPLICATE_TITLE_SUFFIX_RE.sub("", title.strip()).strip()


def title_indicates_duplicate_url(title: str) -> bool:
    return bool(DUPLICATE_TITLE_SUFFIX_RE.search(title.strip()))


async def disambiguate_title_for_url(
    db: AsyncSession, title: str, url_normalized: str
) -> tuple[str, bool]:
    count = (
        await db.execute(
            select(func.count()).select_from(Signal).where(Signal.url_normalized == url_normalized)
        )
    ).scalar_one()
    if count == 0:
        return title, False
    base = strip_duplicate_title_suffix(title) or title.strip()
    n = int(count) + 1
    suffix = f" (重复采集 #{n})"
    max_len = 500
    if len(base) + len(suffix) > max_len:
        base = base[: max_len - len(suffix)].rstrip()
    return base + suffix, True
