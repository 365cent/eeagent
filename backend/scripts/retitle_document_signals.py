"""Retitle document-derived signals that still carry a scanner/file name.

Run from backend/::

    uv run python scripts/retitle_document_signals.py            # dry run
    uv run python scripts/retitle_document_signals.py --apply    # write + audit

Only signals whose file name looks arbitrary (digits, hash, very short) are
touched: a meaningful file name is left alone, and each change writes a
correction-audit row with the old and new title.
"""
from __future__ import annotations

import argparse
import asyncio

from sqlalchemy import select

from app.core.identity import OperatorIdentity
from app.core.uvicorn_loop import eea_event_loop
from app.db.base import SessionLocal
from app.domains.capture.document_path import canonical_markdown
from app.domains.evidence.document_pipeline import (
    _looks_arbitrary,
    extract_title_from_markdown,
)
from app.models.models import Document, Signal
from app.platform.audit import record_correction

ACTOR = OperatorIdentity("maintenance", "platform_admin")


async def run(apply: bool) -> None:
    async with SessionLocal() as db:
        rows = (
            await db.execute(
                select(Signal, Document)
                .join(Document, Document.id == Signal.document_id)
                .order_by(Signal.created_at)
            )
        ).all()

        planned: list[tuple[Signal, str]] = []
        per_document: dict[str, int] = {}
        for signal, document in rows:
            stem = (document.filename or "").rsplit(".", 1)[0]
            if not _looks_arbitrary(stem):
                continue
            canonical = canonical_markdown(document)
            title = extract_title_from_markdown(canonical)
            if not title:
                continue
            count = per_document.get(str(document.id), 0) + 1
            per_document[str(document.id)] = count
            if count > 1:
                title = f"{title} (重复采集 #{count})"
            if signal.title != title:
                planned.append((signal, title))

        if not planned:
            print("nothing to retitle")
            return

        for signal, title in planned:
            print(f"{str(signal.id)[:8]}  {signal.title!r} -> {title!r}")
            if not apply:
                continue
            await record_correction(
                db,
                "signal",
                signal.id,
                "title",
                signal.title,
                title,
                ACTOR,
                reason="文档标题提取（首屏标题/正文标题）",
            )
            signal.title = title
        if apply:
            await db.commit()
            print(f"updated {len(planned)} signal(s)")
        else:
            print(f"dry run: {len(planned)} signal(s) would change; pass --apply")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="write the new titles")
    args = parser.parse_args()
    asyncio.run(run(args.apply), loop_factory=eea_event_loop)


if __name__ == "__main__":
    main()
