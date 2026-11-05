import hashlib
import re
from urllib.parse import urlparse, urlunparse

import jieba
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Vocab

STOP = {"的", "了", "在", "是", "和", "与", "将", "及", "对", "等", "中", "为", "从", "到", "a", "the"}


def normalize_url(url: str) -> str:
    p = urlparse(url.strip())
    return urlunparse((p.scheme.lower(), p.netloc.lower(), p.path.rstrip("/"), "", "", ""))


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def suggest_tags(text: str, limit: int = 6) -> list[str]:
    """REQ-TAG-05: 高频汇总生成技术方向标签（初判，条数随内容调整）。"""
    if not text:
        return []
    words = [w.strip() for w in jieba.cut_for_search(text) if len(w.strip()) >= 2 and w.strip() not in STOP]
    freq: dict[str, int] = {}
    for w in words:
        freq[w] = freq.get(w, 0) + 1
    ranked = sorted(freq.items(), key=lambda kv: (-kv[1], kv[0]))
    return [w for w, _ in ranked[:limit]]


async def get_or_create_vocab(db: AsyncSession, kind: str, name: str) -> Vocab:
    name = name.strip()
    obj = (await db.execute(select(Vocab).where(Vocab.kind == kind, Vocab.name == name))).scalar_one_or_none()
    if obj is None:
        # UNIQUE (kind, name) is the arbiter under concurrency: a racing create
        # that slipped past the select loses the INSERT ... ON CONFLICT DO
        # NOTHING and re-selects the winner's committed row instead of raising
        # IntegrityError (models.py UniqueConstraint("kind", "name")).
        stmt = (
            pg_insert(Vocab)
            .values(kind=kind, name=name)
            .on_conflict_do_nothing(index_elements=["kind", "name"])
            .returning(Vocab)
        )
        obj = (await db.execute(stmt)).scalar_one_or_none()
        if obj is None:
            obj = (
                (await db.execute(select(Vocab).where(Vocab.kind == kind, Vocab.name == name))).scalar_one()
            )
    return obj
