"""Re-run parse_html_snapshot on stored SingleFile HTML and refresh body + excerpt.

Does not retag or change themes. Safe to run after switching html2text → MarkItDown.
"""
from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.db.base import SessionLocal
from app.models.models import Signal
from app.services.html_snapshot import enrich_snapshot_figures, parse_html_snapshot
from app.services.objectstore import load_bytes, save_body
from app.services.tagging import sha256_text


async def reparse_all() -> int:
    updated = 0
    async with SessionLocal() as db:
        rows = (
            await db.execute(
                select(Signal).where(Signal.snapshot_html_object_key.is_not(None))
            )
        ).scalars().all()
        for sig in rows:
            key = sig.snapshot_html_object_key
            if not key:
                continue
            data = load_bytes(key)
            if not data:
                print(f"skip {sig.id}: missing object {key!r}")
                continue
            snap = parse_html_snapshot(data)
            snap = await enrich_snapshot_figures(snap)
            if not snap.body_md:
                print(f"skip {sig.id}: empty body after parse")
                continue
            sig.body_object_key = save_body(snap.body_md)
            sig.body_sha256 = sha256_text(snap.body_md)
            sig.excerpt = snap.body_md[:200]
            updated += 1
        await db.commit()
    return updated


def main() -> None:
    import sys

    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    n = asyncio.run(reparse_all())
    print(f"reparse done: {n} signal(s) updated")


if __name__ == "__main__":
    main()
