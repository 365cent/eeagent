"""Seed closed reference vocabularies and the five confirmed technical domains.

Business examples and acceptance records belong in the isolated test database;
this repeat-safe bootstrap does not create synthetic signals or decisions.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.models as m
from app.core.config import get_settings
from app.services.refcodes import REF_CODES
from app.services.tagging import get_or_create_vocab

SEED_DOMAINS = ["软件", "硬件", "通信", "电源与能源管理", "工具"]


async def seed(db) -> None:
    for domain, codes in REF_CODES.items():
        for item in codes:
            code, label = item[0], item[1]
            alias = item[2] if len(item) > 2 else None
            existing = (
                await db.execute(
                    select(m.RefCode).where(m.RefCode.domain == domain, m.RefCode.code == code)
                )
            ).scalar_one_or_none()
            if existing is None:
                db.add(m.RefCode(domain=domain, code=code, label=label, fixture_alias=alias))

    for name in SEED_DOMAINS:
        await get_or_create_vocab(db, "domain", name)
    await db.commit()


async def main() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.database_url)
    async with async_sessionmaker(engine, expire_on_commit=False)() as db:
        await seed(db)
    await engine.dispose()
    print("reference vocabularies seeded")


if __name__ == "__main__":
    import asyncio
    import sys

    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
