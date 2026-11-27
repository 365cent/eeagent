"""Drop tech tags that a single signal carries (dry run by default).

Auto-tagging leaves a long tail of one-off tokens ("The", "Facebook", image words,
numbers). They never help a theme and they crowd the tag list and the topic map.
A tag kept by two or more signals is real vocabulary and stays. So does a tag
that a confirmed demand cites as evidence: removing it can make that demand
unable to validate or derive functions.

Usage:
    python scripts/purge_singleton_tags.py            # list what would go
    python scripts/purge_singleton_tags.py --apply    # delete them
    python scripts/purge_singleton_tags.py --all      # also drop rare real terms

A --apply run writes data/purged-tags-<ts>.json first, so it can be undone.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import re
import sys
import time

from pathlib import Path

from sqlalchemy import Text, cast, delete, func, select

from app.core.bootstrap_env import bootstrap_environment

bootstrap_environment()

if sys.platform == 'win32':
    # psycopg async needs a selector loop, not the Windows default proactor.
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.db.base import SessionLocal  # noqa: E402
from app.models.models import DemandPoint, SignalTag, Vocab  # noqa: E402
from app.domains.tagging.service import is_low_quality_tag  # noqa: E402

NOISE_WORDS = {
    'the', 'and', 'all', 'when', 'full', 'format', 'close', 'share',
    'image', 'store', 'topic', 'test', 'end', 'action', 'papers',
    'publications', 'reporting', 'companies', 'incident',
    'freshness', 'seamless', 'challenges', 'advanced',
}
NUMERIC = re.compile(r'^[0-9., ]+$')


def is_noise(name: str) -> bool:
    lowered = name.strip().lower()
    return is_low_quality_tag(name) or lowered in NOISE_WORDS or bool(NUMERIC.match(name.strip()))


async def cited_signal_ids() -> set[str]:
    """Signals a confirmed demand cites: their tags are evidence, not noise."""
    async with SessionLocal() as db:
        demands = (
            await db.execute(select(DemandPoint).where(DemandPoint.review_status == 'confirmed'))
        ).scalars()
        cited: set[str] = set()
        for demand in demands:
            for step in (demand.derivation_trace or {}).get('steps') or []:
                cited.update(str(item) for item in (step.get('evidence_signal_ids') or []))
            cited.update(
                str(item)
                for item in ((demand.cross_validation or {}).get('evidence_signal_ids') or [])
            )
        return cited


async def singleton_tags(kind: str) -> list[tuple[list[object], str, str]]:
    """( vocab ids, name, only signal id ) for tag names carried by one signal.

    Counted per name, not per row: the vocabulary table can hold several rows for
    the same name, and deleting one of them would leave a half-removed tag.
    """
    async with SessionLocal() as db:
        rows = (
            await db.execute(
                select(
                    Vocab.name,
                    func.min(cast(SignalTag.signal_id, Text)),
                    func.array_agg(Vocab.id),
                )
                .join(SignalTag, SignalTag.vocab_id == Vocab.id)
                .where(Vocab.kind == kind)
                .group_by(Vocab.name)
                .having(func.count(func.distinct(SignalTag.signal_id)) == 1)
            )
        ).all()
    out = []
    for name, signal_id, ids in rows:
        out.append((list(ids), name, str(signal_id)))
    out.sort(key=lambda item: item[1])
    return out


async def purge(kind: str, apply: bool, everything: bool) -> int:
    rows = await singleton_tags(kind)
    if not rows:
        print('no single-use ' + kind + ' tags')
        return 0
    cited = await cited_signal_ids()
    protected = [r for r in rows if r[2] in cited]
    rows = [r for r in rows if r[2] not in cited]
    if protected:
        print(f'kept {len(protected)} tags that a confirmed demand cites: ' + ', '.join(r[1] for r in protected))
    if not everything:
        rows = [r for r in rows if is_noise(r[1])]
    if not rows:
        print('nothing to purge')
        return 0
    print(f'{len(rows)} single-use {kind} tags:')
    print('  ' + ', '.join(name for _, name, _ in rows[:60]))
    if len(rows) > 60:
        print(f'  ... and {len(rows) - 60} more')
    if not apply:
        print('dry run: re-run with --apply to delete')
        return len(rows)
    ids = [tag_id for tag_ids, _, _ in rows for tag_id in tag_ids]
    snapshot = Path(__file__).resolve().parent.parent / 'data' / f'purged-tags-{int(time.time())}.json'
    snapshot.parent.mkdir(parents=True, exist_ok=True)
    snapshot.write_text(
        json.dumps(
            {'kind': kind, 'tags': [{'ids': [str(t) for t in tag_ids], 'name': name, 'signal_id': signal_id}
                                    for tag_ids, name, signal_id in rows]},
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
    print(f'deleted {len(ids)} tags and their signal links')
    return len(ids)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Drop tech tags carried by one signal only.')
    parser.add_argument('--kind', default='tech_tag')
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--all', dest='everything', action='store_true', help='also drop rare real terms')
    args = parser.parse_args()
    asyncio.run(purge(args.kind, args.apply, args.everything))
