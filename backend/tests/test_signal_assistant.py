"""Evidence assistant chat: POST /signals/{id}/assistant/messages."""

import pytest

from tests.support import create_signal

pytestmark = pytest.mark.anyio


async def test_assistant_requires_llm_config(client, monkeypatch):
    sig = await create_signal(client, body_text="48V 区域控制器与 eFuse 配电架构。")

    async def _boom(*_a, **_k):
        from app.services.llm_gateway import LLMNotConfiguredError

        raise LLMNotConfiguredError()

    monkeypatch.setattr("app.api.v1.signals.chat_completion", _boom)

    r = await client.post(
        f"/api/v1/signals/{sig['id']}/assistant/messages",
        json={"message": "这条证据与区域控制器的关系？", "history": []},
    )
    assert r.status_code == 503
    assert "LLM" in r.text


async def test_assistant_returns_model_reply(client, monkeypatch):
    sig = await create_signal(client, body_text="智能配电与区域控制协同。")

    async def _fake(messages, **_kwargs):
        assert messages[0]["role"] == "system"
        assert "<signal_context>" in messages[0]["content"]
        assert messages[-1]["content"] == "简要总结"
        return "这是基于上下文的测试回复。", "test-model"

    monkeypatch.setattr("app.api.v1.signals.chat_completion", _fake)

    r = await client.post(
        f"/api/v1/signals/{sig['id']}/assistant/messages",
        json={
            "message": "简要总结",
            "history": [{"role": "user", "content": "上一轮问题"}],
        },
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["reply"] == "这是基于上下文的测试回复。"
    assert body["model"] == "test-model"
    assert body["signal_id"] == sig["id"]
