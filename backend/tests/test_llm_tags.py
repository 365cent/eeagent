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
from app.services.llm import LLMExcerpt, LLMTagSuggestion, suggest_excerpt_with_llm, suggest_tags_with_llm

pytestmark = pytest.mark.anyio


def _settings(**overrides):
    base = dict(
        llm_base_url_normalized="http://gateway.invalid/v1",
        llm_api_key="test-key",
        llm_model="deepseek-v4-flash-hw",
    )
    base.update(overrides)
    return types.SimpleNamespace(**base)


async def test_llm_excerpt_from_function_model(monkeypatch):
    def fake(messages, info: AgentInfo) -> ModelResponse:
        tool_name = info.output_tools[0].name
        return ModelResponse(
            parts=[
                ToolCallPart(
                    tool_name,
                    {"excerpt": "蔚来 ET9 强调中央计算与区域供电架构。"},
                )
            ]
        )

    async def agent_factory():
        return Agent(FunctionModel(fake), output_type=LLMExcerpt)

    monkeypatch.setattr(llm, "_build_excerpt_agent", agent_factory)
    monkeypatch.setattr(llm, "get_settings", lambda: _settings())

    out = await suggest_excerpt_with_llm("蔚来", "正文很长……")
    assert out == "蔚来 ET9 强调中央计算与区域供电架构。"


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

    async def build_agent():
        return Agent(FunctionModel(fake), output_type=LLMTagSuggestion)

    monkeypatch.setattr(llm, "get_settings", lambda: _settings())
    monkeypatch.setattr(llm, "_build_agent", build_agent)
    result = await suggest_tags_with_llm("eFuse 配电趋势", "某主机厂发布 eFuse 方案")
    assert result == LLMTagSuggestion(
        value_chain_stage_code="creation_supply",
        signal_type_code="technology",
        tech_tags=["eFuse", "固态电池"],
    )


async def test_test_model_custom_output_args_roundtrip(monkeypatch):
    monkeypatch.setattr(llm, "get_settings", lambda: _settings())
    async def build_agent():
        return Agent(
            TestModel(custom_output_args={"value_chain_stage_code": "delivery_oem", "tech_tags": ["域控制器"]}),
            output_type=LLMTagSuggestion,
        )

    monkeypatch.setattr(llm, "_build_agent", build_agent)
    result = await suggest_tags_with_llm("主机厂电子架构", "中央计算")
    assert result is not None
    assert result.value_chain_stage_code == "delivery_oem"
    assert result.tech_tags == ["域控制器"]


async def test_empty_llm_model_returns_none_then_jieba_fallback(monkeypatch):
    """No resolvable chat model → None; jieba path still works."""
    from app.services.tagging import suggest_tags

    async def no_chat_model():
        return None

    monkeypatch.setattr(llm, "get_settings", lambda: _settings(llm_model=""))
    monkeypatch.setattr(llm, "_chat_model_id", no_chat_model)
    assert await suggest_tags_with_llm("eFuse", "eFuse eFuse 智能配电") is None
    # the caller's jieba fallback still produces tags
    assert "eFuse" in suggest_tags("eFuse 配电 智能配电 eFuse")


async def test_unreachable_or_failing_model_returns_none(monkeypatch):
    """A model/transport failure surfaces as None, never as an exception."""

    def failing(messages, info: AgentInfo) -> ModelResponse:
        raise RuntimeError("gateway unreachable")

    async def build_agent():
        return Agent(FunctionModel(failing), output_type=LLMTagSuggestion)

    monkeypatch.setattr(llm, "get_settings", lambda: _settings())
    monkeypatch.setattr(llm, "_build_agent", build_agent)
    assert await suggest_tags_with_llm("标题", "正文") is None


async def test_invalid_structured_output_returns_none(monkeypatch):
    """A value outside the closed vocabulary fails validation → the agent run
    raises and the service must swallow it (CONV-CLOSED-VOCAB)."""

    def bogus(messages, info: AgentInfo) -> ModelResponse:
        tool_name = info.output_tools[0].name
        return ModelResponse(
            parts=[ToolCallPart(tool_name, {"value_chain_stage_code": "not_a_stage", "tech_tags": ["x"]})]
        )

    async def build_agent():
        return Agent(FunctionModel(bogus), output_type=LLMTagSuggestion)

    monkeypatch.setattr(llm, "get_settings", lambda: _settings())
    monkeypatch.setattr(llm, "_build_agent", build_agent)
    assert await suggest_tags_with_llm("标题", "正文") is None


async def test_endpoint_falls_back_to_jieba_when_llm_unavailable(client, monkeypatch):
    """GET /signals/{id}/tag-suggestions keeps its TagSuggestion shape and
    falls back to jieba when the LLM path yields None."""
    import app.api.v1.signals as signals_api
    from app.domains.evidence import signal_record

    async def none_suggestion(title, body):
        return None

    async def jieba_only(*_a, **_k):
        return ["eFuse", "配电"], "jieba-frequency", None

    monkeypatch.setattr(signals_api, "suggest_tags_with_llm", none_suggestion)
    monkeypatch.setattr(signals_api, "suggest_tech_tags", jieba_only)
    monkeypatch.setattr(signal_record, "suggest_tags_with_llm", none_suggestion)
    monkeypatch.setattr(signal_record, "suggest_tech_tags", jieba_only)
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
    assert body["source"] in ("jieba-frequency", "embedding-rerank")
    assert body["suggested_tags"]  # non-empty jieba/rerank tags
    assert body["signal_type_code"] == "technology"  # rule fallback from eFuse / 配电正文
    assert body["protected_fields"] == []
    if body["source"] == "embedding-rerank":
        assert body["degraded_reason"]  # LLM pick unavailable while rerank may still run
    else:
        assert body["degraded_reason"]
    assert {"suggested_tags", "value_chain_stage_code", "signal_type_code", "source", "protected_fields", "degraded_reason"} <= set(body)


async def test_endpoint_uses_llm_when_available(client, monkeypatch):
    import app.api.v1.signals as signals_api
    from app.domains.evidence import signal_record

    async def good(title, body):
        return LLMTagSuggestion(
            value_chain_stage_code="delivery_oem", signal_type_code="technology", tech_tags=[]
        )

    async def good_tags(*_a, **_k):
        return ["eFuse", "域控制器"], "llm-rerank-refine", 0.85

    monkeypatch.setattr(signals_api, "suggest_tags_with_llm", good)
    monkeypatch.setattr(signals_api, "suggest_tech_tags", good_tags)
    monkeypatch.setattr(signal_record, "suggest_tags_with_llm", good)
    monkeypatch.setattr(signal_record, "suggest_tech_tags", good_tags)
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
    assert resp.json()["signal_type_code"] == "technology"
    sid = resp.json()["id"]
    got = await client.get(f"/api/v1/signals/{sid}/tag-suggestions")
    assert got.status_code == 200, got.text
    payload = got.json()
    assert payload["suggested_tags"] == ["eFuse", "域控制器"]
    assert payload["value_chain_stage_code"] == "delivery_oem"
    assert payload["signal_type_code"] == "technology"
    assert payload["source"] == "llm-rerank-refine"
    assert payload["protected_fields"] == []
    assert payload["degraded_reason"] is None
