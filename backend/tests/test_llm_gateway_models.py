"""Dynamic model selection: chat probe + Qwen 3.8/3.6 vision preference."""

import types

import httpx
import pytest

import app.services.llm_gateway as gw
from app.core.config import get_settings
from app.services import semantic_api

pytestmark = [pytest.mark.anyio, pytest.mark.no_db]

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
        llm_base_url_normalized="http://gateway.invalid/v1",
        llm_api_key="",
        llm_model="",
        vision_model="",
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


async def test_resolve_chat_model_probes_until_one_answers(monkeypatch):
    monkeypatch.setattr(gw, "get_settings", lambda: _settings())
    monkeypatch.setattr(gw, "_cached", lambda _kind: None)

    async def fake_list():
        return MODELS

    probed: list[str] = []

    async def fake_probe(model, timeout=20.0):
        probed.append(model)
        return model == "Qwen3.8-27B"

    monkeypatch.setattr(gw, "list_models", fake_list)
    monkeypatch.setattr(gw, "_probe_chat", fake_probe)

    model = await gw.resolve_chat_model(force=True)
    assert model == "Qwen3.8-27B"
    assert probed == ["deepseek-v4-flash-hw", "Qwen3.6-35B", "Qwen3.8-27B"]


async def test_resolve_chat_model_fails_when_no_candidate_answers(monkeypatch):
    monkeypatch.setattr(gw, "get_settings", lambda: _settings())
    monkeypatch.setattr(gw, "_cached", lambda _kind: None)

    async def fake_list():
        return MODELS

    async def fake_probe(model, timeout=20.0):
        return False

    monkeypatch.setattr(gw, "list_models", fake_list)
    monkeypatch.setattr(gw, "_probe_chat", fake_probe)

    with pytest.raises(gw.LLMNoModelError):
        await gw.resolve_chat_model(force=True)


def test_configured_chat_model_passes_through_env_id():
    assert gw.configured_chat_model(_settings(llm_model="auto")) == "auto"
    assert gw.configured_chat_model(_settings(llm_model="fixed-model")) == "fixed-model"


async def test_configured_model_short_circuits_probe(monkeypatch):
    monkeypatch.setattr(gw, "get_settings", lambda: _settings(llm_model="fixed-model"))

    async def explode():
        raise AssertionError("list_models must not be called when LLM_MODEL is set")

    monkeypatch.setattr(gw, "list_models", explode)
    assert await gw.resolve_chat_model() == "fixed-model"


async def test_resolve_vision_model_uses_gateway_list(monkeypatch):
    monkeypatch.setattr(gw, "get_settings", lambda: _settings())
    monkeypatch.setattr(gw, "_cached", lambda _kind: None)

    async def fake_list():
        return ["glm-5.3-o", "Qwen3.6-35B"]

    monkeypatch.setattr(gw, "list_models", fake_list)
    assert await gw.resolve_vision_model(force=True) == "Qwen3.6-35B"


async def test_maas_embedding_and_rerank(monkeypatch):
    from contextlib import asynccontextmanager

    monkeypatch.setenv("MAAS_API_BASE_URL", "https://maas.example.com/v2")
    monkeypatch.setenv("MAAS_API_KEY", "test-key")
    get_settings.cache_clear()

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def post(self, url, headers=None, json=None):
            assert headers and headers["Authorization"] == "Bearer test-key"
            if url.endswith("/embeddings"):
                return httpx.Response(200, json={"data": [{"index": 0, "embedding": [0.1, 0.2]}]})
            if url.endswith("/rerank"):
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
