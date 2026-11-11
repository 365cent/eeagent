from __future__ import annotations

import uuid

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.judgment import select_best_theme


async def theme_display_tags(db: AsyncSession) -> dict[uuid.UUID, set[str]]:
    rows = (await db.execute(text("SELECT tech_theme_id, tag_name FROM eea_v_tech_theme_display_tags"))).all()
    theme_tags: dict[uuid.UUID, set[str]] = {}
    for theme_id, tag_name in rows:
        theme_tags.setdefault(theme_id, set()).add(tag_name)
    return theme_tags


async def match_theme(db: AsyncSession, tag_names: set[str]) -> tuple[uuid.UUID | None, str]:
    """REQ-SIG-08: match the signal's tags against every theme's display tags."""
    return select_best_theme(await theme_display_tags(db), tag_names)
