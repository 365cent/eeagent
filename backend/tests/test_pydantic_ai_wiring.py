"""Pydantic AI is wired to the enterprise OpenAI-compatible gateway."""

import types

import pytest

import app.services.pydantic_agent as pa
from app.services.llm_gateway import LLMNotConfiguredError

pytestmark = pytest.mark.anyio


def _settings(**overrides):
    base = dict(
        llm_base_url_normalized="http://gateway.invalid/v1",
        llm_api_key="test-key",
        llm_model="",
        vision_model="",
    )
    base.update(overrides)
    return types.SimpleNamespace(**base)


async def test_build_agent_uses_explicit_model_without_resolving(monkeypatch):
    monkeypatch.setattr(pa, "get_settings", lambda: _settings())

    async def explode():
        raise AssertionError("resolve_chat_model must not run for an explicit model")

    monkeypatch.setattr(pa, "resolve_chat_model", explode)
    agent = await pa.build_agent("针对这段证据给出结论", model_name="deepseek-v4-flash-hw")
    assert agent.model.model_name == "deepseek-v4-flash-hw"


async def test_build_agent_auto_resolves_gateway_model(monkeypatch):
    monkeypatch.setattr(pa, "get_settings", lambda: _settings())

    async def fake_resolve():
        return "Qwen3.8-27B"

    monkeypatch.setattr(pa, "resolve_chat_model", fake_resolve)
    agent = await pa.build_agent()
    assert agent.model.model_name == "Qwen3.8-27B"


async def test_build_agent_requires_base_url(monkeypatch):
    monkeypatch.setattr(pa, "get_settings", lambda: _settings(llm_base_url_normalized=""))
    with pytest.raises(LLMNotConfiguredError):
        await pa.build_agent(model_name="anything")


@pytest.mark.skipif(
    __import__("os").environ.get("EEA_LLM_INTEGRATION") != "1",
    reason="live gateway smoke; set EEA_LLM_INTEGRATION=1 to run",
)
async def test_live_agent_call():
    agent = await pa.build_agent()
    result = await agent.run("回答一个字：好")
    assert result.output.strip()
    assert result.usage.requests == 1
