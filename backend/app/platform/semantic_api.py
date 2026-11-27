"""OpenAI-compatible embedding and rerank HTTP client (BE-04).

Embedding uses ``EMBEDDING_BASE_URL`` / ``EMBEDDING_API_KEY`` and rerank uses
``RERANK_BASE_URL`` / ``RERANK_API_KEY``. No legacy aliases are read.
"""
from __future__ import annotations

import math
from typing import Any

import httpx

from app.core.config import get_settings
from app.platform.http import open_async_http_client

DEFAULT_TIMEOUT_SECONDS = 30.0
MAX_BATCH = 16


def embedding_configured() -> bool:
    settings = get_settings()
    return bool(settings.embedding_url and settings.embedding_api_key_value)


def rerank_configured() -> bool:
    settings = get_settings()
    return bool(settings.rerank_url and settings.rerank_api_key_value)


def semantic_configured() -> bool:
    return embedding_configured() or rerank_configured()


class SemanticNotConfiguredError(RuntimeError):
    """Embedding or rerank gateway URL/key is unset."""


class SemanticUpstreamError(RuntimeError):
    def __init__(self, status: int, detail: str) -> None:
        super().__init__(detail)
        self.status = status
        self.detail = detail


def _headers(api_key: str) -> dict[str, str]:
    headers = {"Content-Type": "application/json"}
    key = api_key.strip()
    if key:
        headers["Authorization"] = f"Bearer {key}"
    return headers


def _validate_embeddings_payload(data: Any) -> list[list[float]]:
    if not isinstance(data, dict):
        raise SemanticUpstreamError(502, "embedding response is not a JSON object")
    rows = data.get("data")
    if not isinstance(rows, list) or not rows:
        raise SemanticUpstreamError(502, "embedding response missing data[]")
    indexed: list[tuple[int, list[float]]] = []
    for row in rows:
        if not isinstance(row, dict):
            raise SemanticUpstreamError(502, "embedding row is not an object")
        idx = row.get("index")
        if not isinstance(idx, int) or idx < 0:
            raise SemanticUpstreamError(502, "embedding row missing index")
        vec = row.get("embedding")
        if not isinstance(vec, list) or not vec:
            raise SemanticUpstreamError(502, "embedding vector missing or empty")
        if not all(isinstance(x, (int, float)) and math.isfinite(float(x)) for x in vec):
            raise SemanticUpstreamError(502, "embedding vector has non-finite values")
        indexed.append((idx, [float(x) for x in vec]))
    indexed.sort(key=lambda item: item[0])
    if [idx for idx, _ in indexed] != list(range(len(indexed))):
        raise SemanticUpstreamError(502, "embedding response indexes are incomplete or duplicated")
    return [vec for _, vec in indexed]


def _validate_rerank_payload(data: Any) -> list[tuple[int, float]]:
    if not isinstance(data, dict):
        raise SemanticUpstreamError(502, "rerank response is not a JSON object")
    rows = data.get("results")
    if not isinstance(rows, list) or not rows:
        raise SemanticUpstreamError(502, "rerank response missing results[]")
    out: list[tuple[int, float]] = []
    for row in rows:
        if not isinstance(row, dict):
            raise SemanticUpstreamError(502, "rerank row is not an object")
        idx = row.get("index")
        score = row.get("relevance_score")
        if not isinstance(idx, int) or not isinstance(score, (int, float)) or not math.isfinite(float(score)):
            raise SemanticUpstreamError(502, "rerank row missing index or relevance_score")
        out.append((idx, float(score)))
    return out


async def create_embeddings(
    texts: list[str],
    *,
    db: "AsyncSession | None" = None,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
) -> list[list[float]]:
    """Embed up to ``MAX_BATCH`` non-empty strings via the configured ``/embeddings`` gateway."""
    from app.platform.embedding_cache import (
        content_sha256,
        load_cached_vectors,
        store_cached_vectors,
        vocab_fingerprint,
    )

    settings = get_settings()
    url = settings.embedding_url
    if not url or not settings.embedding_api_key_value:
        raise SemanticNotConfiguredError("EMBEDDING_BASE_URL and EMBEDDING_API_KEY must be set")
    cleaned = [t.strip() for t in texts if t and t.strip()]
    if not cleaned:
        return []
    if len(cleaned) > MAX_BATCH:
        raise ValueError(f"embedding batch exceeds {MAX_BATCH}")
    digest = content_sha256("\n".join(cleaned))
    model_version = settings.embedding_model
    fp = vocab_fingerprint()
    if db is not None:
        cached = await load_cached_vectors(
            db,
            content_sha256=digest,
            model_version=model_version,
            vocab_fingerprint=fp,
        )
        if cached is not None:
            return cached
    payload = {"model": settings.embedding_model, "input": cleaned if len(cleaned) > 1 else cleaned[0]}
    async with open_async_http_client(timeout=timeout) as client:
        resp = await client.post(url, headers=_headers(settings.embedding_api_key_value), json=payload)
    if resp.status_code >= 400:
        raise SemanticUpstreamError(resp.status_code, resp.text[:400] or resp.reason_phrase)
    vectors = _validate_embeddings_payload(resp.json())
    if len(vectors) != len(cleaned):
        raise SemanticUpstreamError(502, "embedding response count does not match input count")
    if db is not None:
        await store_cached_vectors(
            db,
            content_sha256=digest,
            model_version=model_version,
            vocab_fingerprint=fp,
            vectors=vectors,
        )
        await db.commit()
    return vectors


async def _rerank_batch(
    client: httpx.AsyncClient,
    *,
    url: str,
    query: str,
    documents: list[str],
    timeout: float,
) -> list[tuple[int, float]]:
    settings = get_settings()
    payload = {"model": settings.rerank_model, "query": query, "documents": documents}
    resp = await client.post(url, headers=_headers(settings.rerank_api_key_value), json=payload)
    if resp.status_code >= 400:
        raise SemanticUpstreamError(resp.status_code, resp.text[:400] or resp.reason_phrase)
    return _validate_rerank_payload(resp.json())


async def rerank(
    query: str,
    documents: list[str],
    *,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
) -> list[tuple[int, float]]:
    """Score document relevance for ``query`` via the configured ``/rerank`` gateway."""
    settings = get_settings()
    url = settings.rerank_url
    if not url or not settings.rerank_api_key_value:
        raise SemanticNotConfiguredError("RERANK_BASE_URL and RERANK_API_KEY must be set")
    q = query.strip()
    docs = [d.strip() for d in documents if d and d.strip()]
    if not q or not docs:
        return []
    merged: list[tuple[int, float]] = []
    async with open_async_http_client(timeout=timeout) as client:
        for offset in range(0, len(docs), MAX_BATCH):
            chunk = docs[offset : offset + MAX_BATCH]
            batch = await _rerank_batch(client, url=url, query=q, documents=chunk, timeout=timeout)
            merged.extend((offset + idx, score) for idx, score in batch)
    return merged
