"""Offline theme clustering report (BE-05). Default dry-run; --apply not implemented."""
from __future__ import annotations

import argparse
import asyncio
import json
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.base import SessionLocal
from app.models.models import Signal, TechTheme
from app.domains.evidence.theme_match import theme_display_tags
from app.services.judgment import rank_theme_overlaps, select_best_theme


async def build_report() -> dict:
    from app.models.models import SignalTag

    async with SessionLocal() as db:
        signals = (
            await db.execute(
                select(Signal).options(selectinload(Signal.tags).selectinload(SignalTag.vocab))
            )
        ).scalars().all()
        theme_tags = await theme_display_tags(db)
        themes = (await db.execute(select(TechTheme))).scalars().all()
        theme_names = {t.id: t.working_name for t in themes}
        clusters: list[dict] = []
        for signal in signals:
            if signal.evidence_status_code == "archived" or signal.tech_theme_id is not None:
                continue
            tag_names = {st.vocab.name for st in signal.tags}
            ranked = rank_theme_overlaps(theme_tags, tag_names)
            best_id, reason = select_best_theme(theme_tags, tag_names)
            clusters.append(
                {
                    "signal_id": str(signal.id),
                    "title": signal.title,
                    "tags": sorted(tag_names),
                    "recommended_theme_id": str(best_id) if best_id else None,
                    "recommended_theme_name": theme_names.get(best_id) if best_id else None,
                    "reason": reason,
                    "candidates": [
                        {"theme_id": str(tid), "overlap": ov, "name": theme_names.get(tid)}
                        for tid, ov in ranked[:5]
                    ],
                }
            )
        return {"unassigned_signals": len(clusters), "items": clusters}


async def _main(apply: bool) -> int:
    report = await build_report()
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if apply:
        print("apply flag ignored: theme clustering remains report-only in wave 1", flush=True)
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Theme clustering dry-run report (BE-05)")
    parser.add_argument("--apply", action="store_true", help="Explicit apply (not enabled)")
    args = parser.parse_args()
    raise SystemExit(asyncio.run(_main(args.apply)))


if __name__ == "__main__":
    main()
