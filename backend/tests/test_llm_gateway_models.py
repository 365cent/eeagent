"""Dynamic model selection: chat probe + Qwen 3.8/3.6 vision preference."""

import asyncio
import logging
import types

import httpx
import pytest

import app.services.llm_gateway as gw
from app.core.config import get_settings
from app.services import semantic_api

pytestmark = [pytest.mark.anyio, pytest.mark.no_db]


@pytest.fixture(autouse=True)
def _reset_gateway_caches():
    """`/models` and the winner cache are process state; start every test cold."""
    gw.reset_model_list_cache()
    gw._cache.clear()
    yield
    gw.reset_model_list_cache()
    gw._cache.clear()

MODELS = [
    "Qwen3-Embedding-8B",
    "Qwen3-Reranker-8B",
    "glm-ocr",
    "mineru2.5-pro-2605-1.2b",
    "qwen-image-2512",
    "deepseek-v4-flash-hw",
    "Qwen3.6-35B",
    "Qwen3.8-27B",
]


def _settings(**overrides):
    base = dict(
        chat_base_url_normalized="http://gateway.invalid/v1",
        chat_api_key_value="",
        chat_model_value="",
        vision_model="",
        chat_attempt_budget_floor=30,
        chat_model_speed_ttl_seconds=1200.0,
    )
    base.update(overrides)
    return types.SimpleNamespace(**base)


def test_chat_candidates_skip_non_chat_models():
    assert gw.chat_candidates(MODELS) == [
        "deepseek-v4-flash-hw",
        "Qwen3.6-35B",
        "Qwen3.8-27B",
    ]
    assert "auto" in gw.chat_candidates(["auto", "deepseek-v4-flash-hw"])


def test_vision_prefers_qwen38_then_qwen36():
    assert gw.pick_vision_model(MODELS) == "Qwen3.8-27B"
    assert gw.pick_vision_model(["Qwen3.6-35B", "glm-5.3-o"]) == "Qwen3.6-35B"
    assert gw.pick_vision_model(["glm-5.3-o"]) == ""
    assert gw.pick_vision_model(MODELS, explicit="custom-vl") == "custom-vl"


async def test_resolve_chat_model_returns_top_ranked_candidate(monkeypatch):
    """No serial probe sweep: the fastest ranked id is returned at once."""
    monkeypatch.setattr(gw, "get_settings", lambda: _settings())
    monkeypatch.setattr(gw, "_cached", lambda _kind: None)

    async def fake_list():
        return MODELS

    async def no_probe(*args, **kwargs):
        raise AssertionError("resolve_chat_model must not probe serially")

    monkeypatch.setattr(gw, "list_models", fake_list)
    monkeypatch.setattr(gw, "_probe_chat", no_probe)

    assert await gw.resolve_chat_model(force=True) == "deepseek-v4-flash-hw"


async def test_resolve_chat_model_fails_when_the_gateway_lists_no_chat_model(monkeypatch):
    monkeypatch.setattr(gw, "get_settings", lambda: _settings())
    monkeypatch.setattr(gw, "_cached", lambda _kind: None)

    async def fake_list():
        return ["Qwen3-Embedding-8B", "Qwen3-Reranker-8B", "glm-ocr"]

    monkeypatch.setattr(gw, "list_models", fake_list)

    with pytest.raises(gw.LLMNoModelError):
        await gw.resolve_chat_model(force=True)


def test_configured_chat_model_passes_through_env_id():
    assert gw.configured_chat_model(_settings(chat_model_value="auto")) == "auto"
    assert gw.configured_chat_model(_settings(chat_model_value="fixed-model")) == "fixed-model"


def test_model_chain_splits_comma_list_and_drops_duplicates():
    assert gw.model_chain("Qwen3.8-27B, Qwen3.6-35B") == ["Qwen3.8-27B", "Qwen3.6-35B"]
    assert gw.model_chain("a,,a , b") == ["a", "b"]
    assert gw.model_chain("") == []
    assert gw.model_chain(None) == []


def test_configured_chat_models_keep_configured_order():
    settings = _settings(chat_model_value="first,second")
    assert gw.configured_chat_models(settings) == ["first", "second"]
    assert gw.configured_chat_model(settings) == "first"


async def test_build_chain_uses_configured_list_without_model_discovery(monkeypatch):
    monkeypatch.setattr(gw, "get_settings", lambda: _settings(chat_model_value="a,b,c"))

    async def explode():
        raise AssertionError("list_models must not be called when CHAT_MODEL fills the budget")

    monkeypatch.setattr(gw, "list_models", explode)
    assert await gw.build_chat_model_chain(max_models=3) == ["a", "b", "c"]


async def test_build_chain_keeps_configured_list_verbatim(monkeypatch):
    monkeypatch.setattr(gw, "get_settings", lambda: _settings(chat_model_value="glm-5.3-o"))

    async def explode():
        raise AssertionError("CHAT_MODEL is the operator's order: no discovery")

    monkeypatch.setattr(gw, "list_models", explode)
    assert await gw.build_chat_model_chain() == ["glm-5.3-o"]
    assert await gw.build_chat_model_chain(max_models=3) == ["glm-5.3-o"]


async def test_configured_model_short_circuits_probe(monkeypatch):
    monkeypatch.setattr(gw, "get_settings", lambda: _settings(chat_model_value="fixed-model"))

    async def explode():
        raise AssertionError("list_models must not be called when CHAT_MODEL is set")

    monkeypatch.setattr(gw, "list_models", explode)
    assert await gw.resolve_chat_model() == "fixed-model"


def test_attempt_budget_is_the_larger_of_floor_and_candidates():
    settings = _settings(chat_attempt_budget_floor=30)
    assert gw.attempt_budget(3, settings) == 30
    assert gw.attempt_budget(40, settings) == 40
    assert gw.attempt_budget(0, settings) == 30
    assert gw.attempt_budget_floor(settings) == 30


def test_expand_attempt_sequence_round_robins_and_never_triples_a_model():
    assert gw.expand_attempt_sequence(["a", "b", "c"], 7) == [
        "a",
        "b",
        "c",
        "a",
        "b",
        "c",
        "a",
    ]
    assert gw.expand_attempt_sequence(["solo"], 4) == ["solo"] * 4
    assert gw.expand_attempt_sequence([], 5) == []


async def test_attempt_sequence_ranks_measured_tps_first(monkeypatch):
    from app.services import model_speed

    model_speed.reset_speed_book()
    monkeypatch.setattr(
        gw, "get_settings", lambda: _settings(chat_attempt_budget_floor=4)
    )

    async def fake_list():
        return ["slow-model", "fast-model"]

    monkeypatch.setattr(gw, "list_models", fake_list)
    await model_speed.record_success("fast-model", output_tokens=40, seconds=1.0)
    await model_speed.record_success("slow-model", output_tokens=4, seconds=1.0)

    sequence = await gw.build_chat_model_chain()
    assert sequence == ["fast-model", "slow-model"] * 2
    assert gw.last_attempt_budget() == 4
    model_speed.reset_speed_book()


async def test_resolve_vision_model_uses_gateway_list(monkeypatch):
    monkeypatch.setattr(gw, "get_settings", lambda: _settings())
    monkeypatch.setattr(gw, "_cached", lambda _kind: None)

    async def fake_list():
        return ["glm-5.3-o", "Qwen3.6-35B"]

    monkeypatch.setattr(gw, "list_models", fake_list)
    assert await gw.resolve_vision_model(force=True) == "Qwen3.6-35B"


async def test_embedding_and_rerank_use_separate_gateways(monkeypatch):
    from contextlib import asynccontextmanager

    monkeypatch.setenv("EMBEDDING_BASE_URL", "https://embed.example.com/v1")
    monkeypatch.setenv("EMBEDDING_API_KEY", "embed-key")
    monkeypatch.setenv("RERANK_BASE_URL", "https://rerank.example.com/v1")
    monkeypatch.setenv("RERANK_API_KEY", "rerank-key")
    get_settings.cache_clear()

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def post(self, url, headers=None, json=None):
            if url.endswith("/embeddings"):
                assert headers["Authorization"] == "Bearer embed-key"
                assert json["model"] == get_settings().embedding_model
                return httpx.Response(200, json={"data": [{"index": 0, "embedding": [0.1, 0.2]}]})
            if url.endswith("/rerank"):
                assert headers["Authorization"] == "Bearer rerank-key"
                assert json["model"] == get_settings().rerank_model
                return httpx.Response(
                    200,
                    json={"results": [{"index": 0, "relevance_score": 0.5}]},
                )
            raise AssertionError(url)

    @asynccontextmanager
    async def fake_open_client(**_kwargs):
        yield FakeClient()

    monkeypatch.setattr(semantic_api, "open_async_http_client", fake_open_client)
    assert await semantic_api.create_embeddings(["hello"]) == [[0.1, 0.2]]
    assert await semantic_api.rerank("q", ["a"]) == [(0, 0.5)]


async def test_separate_chat_embedding_rerank_envs(monkeypatch):
    monkeypatch.setenv("CHAT_BASE_URL", "https://chat.example.com/v1")
    monkeypatch.setenv("CHAT_API_KEY", "chat-key")
    monkeypatch.setenv("CHAT_MODEL", "chat-model")
    monkeypatch.setenv("EMBEDDING_BASE_URL", "https://embed.example.com/v1")
    monkeypatch.setenv("EMBEDDING_API_KEY", "embed-key")
    monkeypatch.setenv("RERANK_BASE_URL", "https://rerank.example.com/v1")
    monkeypatch.setenv("RERANK_API_KEY", "rerank-key")
    get_settings.cache_clear()
    try:
        settings = get_settings()
        assert settings.chat_base_url_normalized == "https://chat.example.com/v1"
        assert settings.chat_api_key_value == "chat-key"
        assert settings.chat_model_value == "chat-model"
        assert settings.embedding_url == "https://embed.example.com/v1/embeddings"
        assert settings.embedding_api_key_value == "embed-key"
        assert settings.rerank_url == "https://rerank.example.com/v1/rerank"
        assert settings.rerank_api_key_value == "rerank-key"
    finally:
        get_settings.cache_clear()


async def test_embedding_vectors_follow_response_index(monkeypatch):
    from contextlib import asynccontextmanager

    monkeypatch.setenv("EMBEDDING_BASE_URL", "https://embed.example.com/v1")
    monkeypatch.setenv("EMBEDDING_API_KEY", "embed-key")
    get_settings.cache_clear()

    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def post(self, url, headers=None, json=None):
            return httpx.Response(
                200,
                json={
                    "data": [
                        {"index": 1, "embedding": [2.0]},
                        {"index": 0, "embedding": [1.0]},
                    ]
                },
            )

    @asynccontextmanager
    async def fake_open(**_kwargs):
        yield FakeClient()

    monkeypatch.setattr(semantic_api, "open_async_http_client", fake_open)
    try:
        assert await semantic_api.create_embeddings(["a", "b"]) == [[1.0], [2.0]]
    finally:
        get_settings.cache_clear()


async def test_probe_chat_requires_non_empty_content(monkeypatch):
    from contextlib import asynccontextmanager

    monkeypatch.setattr(gw, "get_settings", lambda: _settings())

    class FakeClient:
        def __init__(self, content):
            self.content = content

        async def post(self, url, headers=None, json=None):
            return httpx.Response(
                200,
                json={"choices": [{"message": {"content": self.content}}]},
            )

    async def run(content):
        @asynccontextmanager
        async def fake_open(**_kwargs):
            yield FakeClient(content)

        monkeypatch.setattr(gw, "open_async_http_client", fake_open)
        return await gw._probe_chat("probe-model")

    assert await run("OK") is True
    assert await run("") is False
    assert await run("   ") is False


async def test_chat_completion_falls_back_on_empty_content_and_caches(monkeypatch):
    monkeypatch.setattr(gw, "get_settings", lambda: _settings())
    monkeypatch.setattr(gw, "log_llm_call", lambda *args, **kwargs: None)
    gw._cache.clear()

    async def fake_chain(max_models=4):
        return ["empty-model", "good-model"]

    async def fake_post(**kwargs):
        if kwargs["model"] == "empty-model":
            raise gw.LLMUpstreamError(502, "empty assistant content from LLM")
        return "OK", "good-model", None

    monkeypatch.setattr(gw, "build_chat_model_chain", fake_chain)
    monkeypatch.setattr(gw, "_post_chat_completion", fake_post)

    text, served = await gw.chat_completion(
        [{"role": "user", "content": "ping"}], max_model_attempts=2
    )
    assert text == "OK"
    assert served == "good-model"
    assert gw._cached("chat") == "good-model"
    gw._cache.clear()


async def test_chat_completion_does_not_cache_fallback_for_explicit_model(monkeypatch):
    monkeypatch.setattr(
        gw, "get_settings", lambda: _settings(chat_model_value="fixed-model")
    )
    monkeypatch.setattr(gw, "log_llm_call", lambda *args, **kwargs: None)
    gw._cache.clear()

    async def fake_chain(max_models=4):
        return ["fixed-model", "good-model"]

    async def fake_post(**kwargs):
        if kwargs["model"] == "fixed-model":
            raise gw.LLMUpstreamError(404, "model_not_found")
        return "OK", "good-model", None

    monkeypatch.setattr(gw, "build_chat_model_chain", fake_chain)
    monkeypatch.setattr(gw, "_post_chat_completion", fake_post)

    text, served = await gw.chat_completion(
        [{"role": "user", "content": "ping"}], max_model_attempts=2
    )
    assert text == "OK"
    assert served == "good-model"
    assert gw._cached("chat") is None
    gw._cache.clear()


async def test_resolve_chat_model_returns_cached_model_without_probing(monkeypatch):
    monkeypatch.setattr(gw, "_cached", lambda _kind: "cached-model")

    async def explode():
        raise AssertionError("model list must not be read when cache is warm")

    monkeypatch.setattr(gw, "list_models", explode)
    assert await gw.resolve_chat_model() == "cached-model"


async def test_ranking_change_is_logged(monkeypatch, caplog):
    """Operators get one line explaining why the retry order changed."""
    from app.services import model_speed

    model_speed.reset_speed_book()
    monkeypatch.setattr(gw, "get_settings", lambda: _settings(chat_attempt_budget_floor=2))

    async def fake_list():
        return ["alpha-model", "beta-model"]

    monkeypatch.setattr(gw, "list_models", fake_list)
    await gw.build_chat_model_chain()
    await model_speed.record_success("beta-model", output_tokens=50, seconds=1.0)

    with caplog.at_level(logging.INFO, logger="app.services.llm_gateway"):
        sequence = await gw.build_chat_model_chain()

    assert sequence[0] == "beta-model"
    assert "chat model ranking changed" in caplog.text
    assert "beta-model" in caplog.text
    model_speed.reset_speed_book()


async def test_chat_completion_race_records_tps_and_ranks_the_winner_first(monkeypatch):
    """Slow first candidate, fast second: the fast one wins and leads the book."""
    from app.services import model_speed

    model_speed.reset_speed_book()
    monkeypatch.setattr(
        gw,
        "get_settings",
        lambda: _settings(
            chat_hedge_delay_seconds=0.05,
            chat_hedge_max_models=2,
            chat_request_total_timeout_seconds=5.0,
        ),
    )
    monkeypatch.setattr(gw, "log_llm_call", lambda *args, **kwargs: None)

    async def fake_chain(max_models=None):
        return ["slow-model", "fast-model"]

    async def fake_post(**kwargs):
        if kwargs["model"] == "slow-model":
            await asyncio.sleep(0.5)
            raise gw.LLMUpstreamError(503, "overloaded")
        await asyncio.sleep(0.05)
        return "OK", "fast-model", {"completion_tokens": 40}

    monkeypatch.setattr(gw, "build_chat_model_chain", fake_chain)
    monkeypatch.setattr(gw, "_post_chat_completion", fake_post)

    text, served = await gw.chat_completion(
        [{"role": "user", "content": "ping"}], max_model_attempts=2
    )
    assert text == "OK"
    assert served == "fast-model"
    ranked = await model_speed.rank_models(["slow-model", "fast-model"])
    assert ranked[0] == "fast-model"
    assert gw._cached("chat") == "fast-model"
    model_speed.reset_speed_book()
