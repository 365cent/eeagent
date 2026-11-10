"""Document embedding and keyword rerank (BE-04 probe).

Default tests mock MaaS HTTP. With ``MAAS_API_BASE_URL`` and ``MAAS_API_KEY`` in
``backend/.env``, ``test_live_document_embedding_and_keyword_rerank`` hits the real gateway.

Run:
  uv run pytest tests/test_semantic_document_keywords.py -q
  uv run pytest tests/test_semantic_document_keywords.py -q -k live
"""

from __future__ import annotations

import httpx
import pytest

from pathlib import Path

from app.core.config import get_settings
from app.services import semantic_api
from app.services.tagging import suggest_tags

pytestmark = pytest.mark.anyio

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "semantic_sample.md"
SAMPLE_DOCUMENT = FIXTURE.read_text(encoding="utf-8")


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


async def test_document_chunks_embedding_parsed(monkeypatch):
    seen: list[dict] = []

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def post(self, url, headers=None, json=None):
            seen.append({"url": url, "json": json})
            if url.endswith("/embeddings"):
                n = len(json["input"]) if isinstance(json["input"], list) else 1
                return httpx.Response(
                    200,
                    json={"data": [{"index": i, "embedding": [0.1, 0.2]} for i in range(n)]},
                )
            raise AssertionError(url)

    monkeypatch.setenv("MAAS_API_BASE_URL", "https://maas.example.com/v2")
    monkeypatch.setenv("MAAS_API_KEY", "test-key")
    get_settings.cache_clear()
    monkeypatch.setattr(semantic_api.httpx, "AsyncClient", FakeClient)

    chunks = [SAMPLE_DOCUMENT[i : i + 200] for i in range(0, len(SAMPLE_DOCUMENT), 200)]
    vectors = await semantic_api.create_embeddings(chunks)
    assert len(vectors) == len(chunks)
    assert all(len(v) == 2 for v in vectors)
    assert seen[0]["json"]["model"] == get_settings().embedding_model


async def test_rerank_batches_more_than_sixteen_candidates(monkeypatch):
    calls: list[int] = []

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def post(self, url, headers=None, json=None):
            if url.endswith("/rerank"):
                docs = json["documents"]
                calls.append(len(docs))
                return httpx.Response(
                    200,
                    json={
                        "results": [
                            {"index": i, "relevance_score": 1.0 - i * 0.01}
                            for i in range(len(docs))
                        ]
                    },
                )
            raise AssertionError(url)

    monkeypatch.setenv("MAAS_API_BASE_URL", "https://maas.example.com/v2")
    monkeypatch.setenv("MAAS_API_KEY", "test-key")
    get_settings.cache_clear()
    monkeypatch.setattr(semantic_api.httpx, "AsyncClient", FakeClient)

    docs = [f"tag-{i}" for i in range(20)]
    scores = await semantic_api.rerank("query", docs)
    assert calls == [16, 4]
    assert len(scores) == 20


async def test_keyword_rerank_orders_jieba_candidates(monkeypatch):
    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def post(self, url, headers=None, json=None):
            if url.endswith("/rerank"):
                docs = json["documents"]
                return httpx.Response(
                    200,
                    json={
                        "results": [
                            {"index": len(docs) - 1 - i, "relevance_score": 1.0 - i * 0.1}
                            for i in range(len(docs))
                        ]
                    },
                )
            raise AssertionError(url)

    monkeypatch.setenv("MAAS_API_BASE_URL", "https://maas.example.com/v2")
    monkeypatch.setenv("MAAS_API_KEY", "test-key")
    get_settings.cache_clear()
    monkeypatch.setattr(semantic_api.httpx, "AsyncClient", FakeClient)

    candidates = suggest_tags(SAMPLE_DOCUMENT, limit=8)
    assert candidates
    scores = await semantic_api.rerank(SAMPLE_DOCUMENT[:400], candidates)
    top_idx, top_score = max(scores, key=lambda row: row[1])
    assert candidates[top_idx] == candidates[-1]
    assert top_score == pytest.approx(1.0)


@pytest.mark.live_maas
async def test_live_document_embedding_and_keyword_rerank():
    settings = get_settings()
    if not settings.embedding_url or not settings.semantic_api_key:
        pytest.skip("MAAS_API_BASE_URL and MAAS_API_KEY required for live test")

    vectors = await semantic_api.create_embeddings([SAMPLE_DOCUMENT[:800]])
    assert len(vectors) == 1
    assert len(vectors[0]) >= 64

    candidates = suggest_tags(SAMPLE_DOCUMENT, limit=16)
    scores = await semantic_api.rerank(SAMPLE_DOCUMENT[:1200], candidates)
    assert len(scores) == len(candidates)
    ranked = sorted(((candidates[i], s) for i, s in scores), key=lambda row: -row[1])
    assert ranked[0][1] >= ranked[-1][1] or len(ranked) == 1
