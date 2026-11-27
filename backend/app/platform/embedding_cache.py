"""Persisted embedding vectors keyed by content and model fingerprint (BE-04)."""
from __future__ import annotations

import hashlib

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import EmbeddingCache


def vocab_fingerprint(names: list[str] | None = None) -> str:
    payload = "|".join(sorted({(n or "").strip() for n in (names or []) if (n or "").strip()}))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


async def load_cached_vectors(
    db: AsyncSession,
    *,
    content_sha256: str,
    model_version: str,
    vocab_fingerprint: str,
) -> list[list[float]] | None:
    row = (
        await db.execute(
            select(EmbeddingCache).where(
                EmbeddingCache.content_sha256 == content_sha256,
                EmbeddingCache.model_version == model_version,
                EmbeddingCache.vocab_fingerprint == vocab_fingerprint,
            )
        )
    ).scalar_one_or_none()
    if row is None:
        return None
    data = row.vector_json
    if not isinstance(data, list):
        return None
    return data


async def store_cached_vectors(
    db: AsyncSession,
    *,
    content_sha256: str,
    model_version: str,
    vocab_fingerprint: str,
    vectors: list[list[float]],
) -> None:
    stmt = (
        pg_insert(EmbeddingCache)
        .values(
            content_sha256=content_sha256,
            model_version=model_version,
            vocab_fingerprint=vocab_fingerprint,
            vector_json=vectors,
        )
        .on_conflict_do_update(
            index_elements=["content_sha256", "model_version", "vocab_fingerprint"],
            set_={"vector_json": vectors},
        )
    )
    await db.execute(stmt)


def content_sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()
