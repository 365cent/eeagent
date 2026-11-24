"""Drop tech tags that a single signal carries (dry run by default).

Auto-tagging leaves a long tail of one-off tokens ("The", "Facebook", image words,
numbers). They never help a theme and they crowd the tag list and the topic map.
A tag kept by two or more signals is real vocabulary and stays.

Usage:
    python scripts/purge_singleton_tags.py            # list what would go
    python scripts/purge_singleton_tags.py --apply    # delete them
"""
from __future__ import annotations

import argparse
import asyncio
import json
import re
import sys
import time


from pathlib import Path

from sqlalchemy import delete, func, select

from app.core.bootstrap_env import bootstrap_environment

bootstrap_environment()

if sys.platform == 'win32':
    # psycopg async needs a selector loop, not the Windows default proactor.
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.base import SessionLocal  # noqa: E402
from app.models.models import SignalTag, Vocab  # noqa: E402
from app.services.tagging import is_low_quality_tag  # noqa: E402


NOISE_WORDS = {
    'the', 'and', 'all', 'when', 'full', 'format', 'close', 'share',
    'image', 'store', 'topic', 'test', 'end', 'action', 'papers',
    'publications', 'reporting', 'companies', 'incident',
    'freshness', 'seamless', 'challenges', 'advanced',
}

NUMERIC = re.compile(r'^[0-9., ]+$')


def is_noise(name: str) -> bool:
    lowered = name.strip().lower()
    return (
        is_low_quality_tag(name)
        or lowered in NOISE_WORDS
        or bool(NUMERIC.match(name.strip()))
    )


async def singleton_tags(kind: str) -> list[tuple[object, str]]:
    used = func.count(SignalTag.signal_id)
    async with SessionLocal() as db:
        rows = (
            await db.execute(
                select(Vocab.id, Vocab.name)
                .outerjoin(SignalTag, SignalTag.vocab_id == Vocab.id)
                .where(Vocab.kind == kind)
                .group_by(Vocab.id, Vocab.name)
                .having(used == 1)
                .order_by(Vocab.name)
            )
        ).all()
    return [(row[0], row[1]) for row in rows]


async def purge(kind: str, apply: bool, everything: bool) -> int:
    rows = await singleton_tags(kind)
    if not everything:
        # Rare but real terms (SoC, PCIe, Chiplet) stay vocabulary; only
        # tokens that are noise on their own are dropped.
        rows = [(tag_id, name) for tag_id, name in rows if is_noise(name)]
    if not rows:
        print('no single-use ' + kind + ' tags')
        return 0
    print(str(len(rows)) + ' single-use ' + kind + ' tags:')
    print('  ' + ', '.join(name for _, name in rows[:60]))
    if len(rows) > 60:
        print('  ... and ' + str(len(rows) - 60) + ' more')
    if not apply:
        print('dry run: re-run with --apply to delete')
        return len(rows)
    ids = [tag_id for tag_id, _ in rows]
    # Deletion is irreversible and nothing else records which signal carried
    # which tag, so keep a snapshot next to the backup folder.
    snapshot = Path(__file__).resolve().parent.parent / 'data' / f'purged-tags-{int(time.time())}.json'
    snapshot.parent.mkdir(parents=True, exist_ok=True)
    snapshot.write_text(
        json.dumps(
            {'kind': kind, 'tags': [{'id': str(tag_id), 'name': name} for tag_id, name in rows]},
            ensure_ascii=False,
            indent=2,
        ),
        encoding='utf-8',
    )
    print('snapshot: ' + str(snapshot))
    async with SessionLocal() as db:
        await db.execute(delete(SignalTag).where(SignalTag.vocab_id.in_(ids)))
        await db.execute(delete(Vocab).where(Vocab.id.in_(ids)))
        await db.commit()
    print('deleted ' + str(len(ids)) + ' tags and their signal links')
    return len(ids)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Drop tech tags carried by one signal only.')
    parser.add_argument('--kind', default='tech_tag')
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--all', dest='everything', action='store_true', help='also drop rare real terms')
    args = parser.parse_args()
    asyncio.run(purge(args.kind, args.apply, args.everything))
