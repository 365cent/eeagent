"""W3 LLM tag suggestions: pydantic-ai TestModel/FunctionModel stubs only.

No real LLM endpoint is ever contacted: the agent's model is swapped for
pydantic-ai's in-memory doubles (TestModel / FunctionModel) and the
disabled/failure paths short-circuit before any network call.
"""

import types

import pytest
from pydantic_ai import Agent
from pydantic_ai.messages import ModelResponse, ToolCallPart
from pydantic_ai.models.function import FunctionModel, AgentInfo
from pydantic_ai.models.test import TestModel

import app.services.llm as llm
from app.services.llm import LLMTagSuggestion, suggest_tags_with_llm

pytestmark = pytest.mark.anyio


def _settings(**overrides):
    base = dict(
        llm_base_url_normalized="http://gateway.invalid/v1",
        llm_api_key="test-key",
        llm_model="deepseek-v4-flash-hw",
    )
    base.update(overrides)
    return types.SimpleNamespace(**base)


async def test_structured_suggestion_parsed_from_function_model(monkeypatch):
    """FunctionModel answers via the final_result tool; codes are normalized
    (label → code) and tech_tags deduped/stripped."""

    def fake(messages, info: AgentInfo) -> ModelResponse:
        tool_name = info.output_tools[0].name
        return ModelResponse(
            parts=[
                ToolCallPart(
                    tool_name,
                    {
                        "value_chain_stage_code": "创造端（供应链）",  # label → code
                        "signal_type_code": "technology",
                        "tech_tags": [" eFuse ", "eFuse", "固态电池"],
                    },
                )
            ]
        )

    monkeypatch.setattr(llm, "get_settings", lambda: _settings())
    monkeypatch.setattr(llm, "_build_agent", lambda: Agent(FunctionModel(fake), output_type=LLMTagSuggestion))
    result = await suggest_tags_with_llm("eFuse 配电趋势", "某主机厂发布 eFuse 方案")
    assert result == LLMTagSuggestion(
        value_chain_stage_code="creation_supply",
        signal_type_code="technology",
        tech_tags=["eFuse", "固态电池"],
    )


async def test_test_model_custom_output_args_roundtrip(monkeypatch):
    monkeypatch.setattr(llm, "get_settings", lambda: _settings())
    monkeypatch.setattr(
        llm,
        "_build_agent",
        lambda: Agent(
            TestModel(custom_output_args={"value_chain_stage_code": "delivery_oem", "tech_tags": ["域控制器"]}),
            output_type=LLMTagSuggestion,
        ),
    )
    result = await suggest_tags_with_llm("主机厂电子架构", "中央计算")
    assert result is not None
    assert result.value_chain_stage_code == "delivery_oem"
    assert result.tech_tags == ["域控制器"]


async def test_empty_llm_model_returns_none_then_jieba_fallback(monkeypatch):
    """LLM_MODEL unset → None without any network call; the jieba path in
    signals.py keeps suggesting (verified directly against suggest_tags)."""
    from app.services.tagging import suggest_tags

    def explode():
        raise AssertionError("no agent may be built when LLM_MODEL is empty")

    monkeypatch.setattr(llm, "get_settings", lambda: _settings(llm_model=""))
    monkeypatch.setattr(llm, "_build_agent", explode)
    assert await suggest_tags_with_llm("eFuse", "eFuse eFuse 智能配电") is None
    # the caller's jieba fallback still produces tags
    assert "eFuse" in suggest_tags("eFuse 配电 智能配电 eFuse")


async def test_unreachable_or_failing_model_returns_none(monkeypatch):
    """A model/transport failure surfaces as None, never as an exception."""

    def failing(messages, info: AgentInfo) -> ModelResponse:
        raise RuntimeError("gateway unreachable")

    monkeypatch.setattr(llm, "get_settings", lambda: _settings())
    monkeypatch.setattr(
        llm, "_build_agent", lambda: Agent(FunctionModel(failing), output_type=LLMTagSuggestion)
    )
    assert await suggest_tags_with_llm("标题", "正文") is None


async def test_invalid_structured_output_returns_none(monkeypatch):
    """A value outside the closed vocabulary fails validation → the agent run
    raises and the service must swallow it (CONV-CLOSED-VOCAB)."""

    def bogus(messages, info: AgentInfo) -> ModelResponse:
        tool_name = info.output_tools[0].name
        return ModelResponse(
            parts=[ToolCallPart(tool_name, {"value_chain_stage_code": "not_a_stage", "tech_tags": ["x"]})]
        )

    monkeypatch.setattr(llm, "get_settings", lambda: _settings())
    monkeypatch.setattr(
        llm, "_build_agent", lambda: Agent(FunctionModel(bogus), output_type=LLMTagSuggestion)
    )
    assert await suggest_tags_with_llm("标题", "正文") is None


async def test_endpoint_falls_back_to_jieba_when_llm_unavailable(client, monkeypatch):
    """GET /signals/{id}/tag-suggestions keeps its TagSuggestion shape and
    falls back to jieba when the LLM path yields None."""
    import app.api.v1.signals as signals_api

    async def none_suggestion(title, body):
        return None

    monkeypatch.setattr(signals_api, "suggest_tags_with_llm", none_suggestion)
    resp = await client.post(
        "/api/v1/signals",
        json={
            "title": "eFuse 智能配电信号",
            "url": "https://example.com/efuse",
            "channel_code": "web",
            "body_text": "eFuse 智能配电方案，eFuse 芯片用于域控制器供电。",
        },
    )
    assert resp.status_code == 201, resp.text
    sid = resp.json()["id"]
    got = await client.get(f"/api/v1/signals/{sid}/tag-suggestions")
    assert got.status_code == 200, got.text
    body = got.json()
    assert body["source"] == "jieba-frequency"
    assert body["suggested_tags"]  # non-empty jieba tags
    assert set(body) == {"suggested_tags", "source"}  # TagSuggestion shape unchanged


async def test_endpoint_uses_llm_when_available(client, monkeypatch):
    import app.api.v1.signals as signals_api

    async def good(title, body):
        return LLMTagSuggestion(
            value_chain_stage_code="delivery_oem", signal_type_code="technology", tech_tags=["eFuse", "域控制器"]
        )

    monkeypatch.setattr(signals_api, "suggest_tags_with_llm", good)
    resp = await client.post(
        "/api/v1/signals",
        json={
            "title": "eFuse 智能配电信号",
            "url": "https://example.com/efuse2",
            "channel_code": "web",
            "body_text": "eFuse 智能配电方案。",
        },
    )
    assert resp.status_code == 201, resp.text
    sid = resp.json()["id"]
    got = await client.get(f"/api/v1/signals/{sid}/tag-suggestions")
    assert got.status_code == 200, got.text
    assert got.json() == {"suggested_tags": ["eFuse", "域控制器"], "source": "llm"}
