"""iFlytek MaaS Embedding & Rerank HTTP client (BE-04).

Chat completions use ``llm_base_url``; vectors and rerank use ``maas_api_base_url``
and ``maas_api_key`` so the Spark/MaaS host is independent of the OpenAI-style
LLM proxy.
"""
from __future__ import annotations

import math
from typing import Any

import httpx

from app.core.config import get_settings
from app.platform.http import open_async_http_client

DEFAULT_TIMEOUT_SECONDS = 30.0
MAX_BATCH = 16


def semantic_configured() -> bool:
    settings = get_settings()
    return bool(settings.embedding_url and settings.semantic_api_key)


class SemanticNotConfiguredError(RuntimeError):
    """MAAS base URL or API key is unset."""


class SemanticUpstreamError(RuntimeError):
    def __init__(self, status: int, detail: str) -> None:
        super().__init__(detail)
        self.status = status
        self.detail = detail


def _headers() -> dict[str, str]:
    settings = get_settings()
    headers = {"Content-Type": "application/json"}
    key = settings.semantic_api_key
    if key:
        headers["Authorization"] = f"Bearer {key}"
    return headers


def _validate_embeddings_payload(data: Any) -> list[list[float]]:
    if not isinstance(data, dict):
        raise SemanticUpstreamError(502, "embedding response is not a JSON object")
    rows = data.get("data")
    if not isinstance(rows, list) or not rows:
        raise SemanticUpstreamError(502, "embedding response missing data[]")
    vectors: list[list[float]] = []
    for row in rows:
        if not isinstance(row, dict):
            raise SemanticUpstreamError(502, "embedding row is not an object")
        vec = row.get("embedding")
        if not isinstance(vec, list) or not vec:
            raise SemanticUpstreamError(502, "embedding vector missing or empty")
        if not all(isinstance(x, (int, float)) and math.isfinite(float(x)) for x in vec):
            raise SemanticUpstreamError(502, "embedding vector has non-finite values")
        vectors.append([float(x) for x in vec])
    return vectors


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
    """Embed up to ``MAX_BATCH`` non-empty strings via MaaS ``/embeddings``."""
    from app.services.embedding_cache import (
        content_sha256,
        load_cached_vectors,
        store_cached_vectors,
        vocab_fingerprint,
    )

    settings = get_settings()
    url = settings.embedding_url
    if not url or not settings.semantic_api_key:
        raise SemanticNotConfiguredError("MAAS_API_BASE_URL and MAAS_API_KEY must be set")
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
        resp = await client.post(url, headers=_headers(), json=payload)
    if resp.status_code >= 400:
        raise SemanticUpstreamError(resp.status_code, resp.text[:400] or resp.reason_phrase)
    vectors = _validate_embeddings_payload(resp.json())
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
    resp = await client.post(url, headers=_headers(), json=payload)
    if resp.status_code >= 400:
        raise SemanticUpstreamError(resp.status_code, resp.text[:400] or resp.reason_phrase)
    return _validate_rerank_payload(resp.json())


async def rerank(
    query: str,
    documents: list[str],
    *,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
) -> list[tuple[int, float]]:
    """Score document relevance for ``query`` via MaaS ``/rerank``."""
    settings = get_settings()
    url = settings.rerank_url
    if not url or not settings.semantic_api_key:
        raise SemanticNotConfiguredError("MAAS_API_BASE_URL and MAAS_API_KEY must be set")
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
