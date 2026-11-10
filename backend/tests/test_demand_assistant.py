"""Demand coordinator assistant: POST /demands/assistant/messages."""

import uuid

import pytest

from app.services.demand_agent import SignalBotBrief, signal_to_bot
from tests.support import assign_signal_theme, create_signal, create_theme

pytestmark = pytest.mark.anyio


def test_signal_to_bot_uses_excerpt_not_summary():
    """ORM Signal exposes excerpt (body lead), not summary."""
    from app.models.models import Signal

    signal = Signal(
        id=uuid.uuid4(),
        title="芯粒 SoC 架构",
        url="https://example.com/chiplet",
        url_normalized="https://example.com/chiplet",
        channel_code="web",
        evidence_status_code="retained",
        excerpt="车用中央计算平台采用异构芯粒封装。",
    )
    bot = signal_to_bot(signal)
    assert isinstance(bot, SignalBotBrief)
    assert "异构芯粒" in bot.excerpt
    assert bot.title == "芯粒 SoC 架构"


async def test_demand_assistant_messages_survives_bot_mapping(client, monkeypatch):
    theme = await create_theme(client)
    sig_a = await create_signal(
        client,
        title="信号甲",
        body_text="区域控制器配电拓扑变化。",
        evidence_status_code="retained",
        url="https://example.com/demand-a",
    )
    sig_b = await create_signal(
        client,
        title="信号乙",
        body_text="eFuse 智能配电量产推进。",
        evidence_status_code="retained",
        url="https://other.example/demand-b",
        publisher="测试媒体乙",
    )
    await assign_signal_theme(client, sig_a["id"], theme["id"])
    await assign_signal_theme(client, sig_b["id"], theme["id"])

    async def _fake_chat(deps, message, history):
        assert len(deps.bots) == 2
        assert all(bot.excerpt for bot in deps.bots)
        return "编组内两条信号已综合。", "test-model"

    monkeypatch.setattr("app.services.demand_draft.run_demand_agent_chat", _fake_chat)

    r = await client.post(
        "/api/v1/demands/assistant/messages",
        json={
            "source_tech_theme_id": theme["id"],
            "message": "这个主题适合归纳成什么需求点？",
            "history": [],
            "selected_signal_ids": [sig_a["id"], sig_b["id"]],
        },
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["reply"] == "编组内两条信号已综合。"
    assert body["model"] == "test-model"


def test_upstream_from_pydantic_ai_maps_554():
    from pydantic_ai.exceptions import ModelHTTPError, ModelServerError

    from app.services.llm_gateway import upstream_from_pydantic_ai

    err = ModelHTTPError.for_category(ModelServerError, status_code=554, model_name="auto", body="edge busy")
    mapped = upstream_from_pydantic_ai(err)
    assert mapped.status == 554
    assert "auto" in mapped.detail


async def test_demand_assistant_returns_502_on_llm_upstream(client, monkeypatch):
    from app.services.llm_gateway import LLMUpstreamError

    theme = await create_theme(client)
    sig_a = await create_signal(
        client,
        title="信号甲",
        body_text="正文甲",
        evidence_status_code="retained",
        url="https://example.com/a",
    )
    sig_b = await create_signal(
        client,
        title="信号乙",
        body_text="正文乙",
        evidence_status_code="retained",
        url="https://example.com/b",
    )
    await assign_signal_theme(client, sig_a["id"], theme["id"])
    await assign_signal_theme(client, sig_b["id"], theme["id"])

    async def _raise_upstream(*_a, **_k):
        raise LLMUpstreamError(554, "auto: edge busy")

    monkeypatch.setattr("app.services.demand_draft.run_demand_agent_chat", _raise_upstream)

    r = await client.post(
        "/api/v1/demands/assistant/messages",
        json={
            "source_tech_theme_id": theme["id"],
            "message": "五步推导各自要关注什么？",
            "history": [],
            "selected_signal_ids": [sig_a["id"], sig_b["id"]],
        },
    )
    assert r.status_code == 502, r.text
    assert "554" in r.text
    assert "上游" in r.text
