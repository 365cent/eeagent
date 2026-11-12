"""Jieba → rerank → LLM refine tag pipeline."""

import types

import pytest
from pydantic_ai import Agent
from pydantic_ai.messages import ModelResponse, ToolCallPart
from pydantic_ai.models.function import AgentInfo, FunctionModel

import app.services.llm as llm
import app.services.tagging as tagging
from app.services.llm import LLMCandidateTagPick, pick_tech_tags_from_candidates
from app.services.tagging import suggest_tags, suggest_tech_tags, text_for_tagging

pytestmark = [pytest.mark.anyio, pytest.mark.no_db]

EDN_BODY = text_for_tagging(
    "蔚来 ET9 架构",
    """# 蔚来 ET9

模拟/混合信号 + 嵌入式 + 通信

蔚来 ET9 采用中央计算与区域控制器架构，域控制器与 eFuse 配电方案成为标配。
供应链上的半导体与系统集成商持续投入。
""",
)


def test_jieba_recall_drops_url_tokens():
    tags = suggest_tags(EDN_BODY, limit=20)
    assert "https" not in tags
    assert "com" not in tags
    assert any("架构" in t or "控制器" in t or "域" in t for t in tags)


async def test_pipeline_falls_back_without_llm(monkeypatch):
    async def no_pick(*_a, **_k):
        return None

    monkeypatch.setattr(llm, "pick_tech_tags_from_candidates", no_pick)

    async def fake_rerank(text, *, limit=6, recall_limit=28):
        base = suggest_tags(text, limit=recall_limit)
        return base[:limit], "jieba-frequency", None

    monkeypatch.setattr(tagging, "suggest_tags_with_rerank", fake_rerank)
    tags, source, _ = await suggest_tech_tags("蔚来", EDN_BODY)
    assert source == "jieba-frequency"
    assert tags
    assert "com" not in tags


async def test_llm_picks_from_candidates(monkeypatch):
    def fake(messages, info: AgentInfo) -> ModelResponse:
        tool = info.output_tools[0].name
        return ModelResponse(
            parts=[ToolCallPart(tool, {"tech_tags": ["中央计算", "域控制器", "eFuse"]})]
        )

    monkeypatch.setattr(llm, "get_settings", lambda: types.SimpleNamespace(
        llm_base_url_normalized="http://gw/v1", llm_api_key="k", llm_model="m"
    ))
    async def build_pick_agent():
        return Agent(FunctionModel(fake), output_type=LLMCandidateTagPick)

    monkeypatch.setattr(llm, "_build_candidate_pick_agent", build_pick_agent)
    pool = ["架构", "中央计算", "域控制器", "eFuse", "供应链", "ednchina"]
    picked = await pick_tech_tags_from_candidates("蔚来", EDN_BODY, pool, max_tags=6)
    assert picked == ["中央计算", "域控制器", "eFuse"]
