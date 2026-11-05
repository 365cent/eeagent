"""证据工作室生成: POST /signals/{id}/studio (backend/TODO.md 八).

LLM is always stubbed (`app.api.v1.signals.chat_completion`); no network.
Contract shapes mirror frontend types (lib/api/types.ts).
"""

import json

import pytest

from tests.support import create_signal

pytestmark = pytest.mark.anyio

BODY = (
    "48V低压供电网络研究：多家功率半导体厂商布局eFuse与SSCB等智能配电器件，"
    "将优先落地线控底盘等高功率场景。智能配电与区域控制是低压系统的核心，"
    "区域控制器承担配电策略执行。"
)

GOOD_QUOTES = [
    "多家功率半导体厂商布局eFuse与SSCB等智能配电器件",
    "将优先落地线控底盘等高功率场景",
    "智能配电与区域控制是低压系统的核心",
    "区域控制器承担配电策略执行",
    "48V低压供电网络研究",
]


async def _signal(client) -> dict:
    return await create_signal(client, title="48V 低压供电网络研究", body_text=BODY)


def _stub(monkeypatch, replies: list[str]):
    """chat_completion stub cycling through replies; records each call."""
    calls: list[list[dict]] = []

    async def fake(messages, **_kw):
        calls.append(messages)
        return replies[min(len(calls) - 1, len(replies) - 1)], "test-model"

    monkeypatch.setattr("app.api.v1.signals.chat_completion", fake)
    return calls


async def test_report_returns_markdown(client, monkeypatch):
    sig = await _signal(client)
    _stub(monkeypatch, ["## 一句话结论\n\n48V 配电正在成为主流。\n"])
    r = await client.post(f"/api/v1/signals/{sig['id']}/studio", json={"kind": "report"})
    assert r.status_code == 200, r.text
    assert r.headers["content-type"].startswith("text/markdown")
    assert "一句话结论" in r.text


async def test_audio_drops_segments_whose_quote_is_not_in_body(client, monkeypatch):
    """quote 必须是快照正文的子串：编造的摘录被丢弃，其余保留。"""
    sig = await _signal(client)
    payload = {
        "segments": [
            *({"text": f"第{i}句", "quote": q} for i, q in enumerate(GOOD_QUOTES)),
            {"text": "编造的一句", "quote": "这段话在正文里根本不存在"},
        ]
    }
    _stub(monkeypatch, [json.dumps(payload, ensure_ascii=False)])
    r = await client.post(f"/api/v1/signals/{sig['id']}/studio", json={"kind": "audio"})
    assert r.status_code == 200, r.text
    segments = r.json()["segments"]
    assert len(segments) == len(GOOD_QUOTES)
    assert all("编造" not in s["text"] for s in segments)


async def test_audio_retries_once_then_422(client, monkeypatch):
    """全部摘录都编造 → 重试一次 → 仍不合法 → 422（两次调用）。"""
    sig = await _signal(client)
    bad = {"segments": [{"text": f"第{i}句", "quote": "正文没有这句话"} for i in range(6)]}
    calls = _stub(monkeypatch, [json.dumps(bad, ensure_ascii=False)])
    r = await client.post(f"/api/v1/signals/{sig['id']}/studio", json={"kind": "audio"})
    assert r.status_code == 422
    assert "解析失败" in r.json()["detail"]
    assert len(calls) == 2  # first attempt + one retry


async def test_invalid_json_then_valid_retry_succeeds(client, monkeypatch):
    sig = await _signal(client)
    good = {
        "headline": "48V 配电加速",
        "stats": [{"label": "电压", "value": "48V"}],
        "points": [{"title": "器件", "body": "eFuse 与 SSCB 成为焦点"}],
    }
    calls = _stub(monkeypatch, ["这不是 JSON", json.dumps(good, ensure_ascii=False)])
    r = await client.post(f"/api/v1/signals/{sig['id']}/studio", json={"kind": "infographic"})
    assert r.status_code == 200, r.text
    assert r.json()["headline"] == "48V 配电加速"
    assert len(calls) == 2
    # retry prompt must tell the model to emit bare JSON
    assert "只输出符合约定的 JSON 对象本身" in calls[1][-1]["content"]


async def test_mindmap_depth_is_trimmed_to_three(client, monkeypatch):
    sig = await _signal(client)
    deep = {
        "title": "48V 低压供电",
        "children": [
            {
                "label": "器件",
                "children": [
                    {"label": "eFuse", "children": [{"label": "过流保护", "children": [{"label": "太深了"}]}]}
                ],
            }
        ],
    }
    _stub(monkeypatch, [json.dumps(deep, ensure_ascii=False)])
    r = await client.post(f"/api/v1/signals/{sig['id']}/studio", json={"kind": "mindmap"})
    assert r.status_code == 200, r.text

    def depth(node: dict, level: int = 1) -> int:
        return max([level, *(depth(c, level + 1) for c in node.get("children", []))])

    payload = r.json()
    assert payload["title"] == "48V 低压供电"
    # root(title)=1 → 一级=2 → 二级=3; nothing deeper survives
    assert depth(payload) == 3
    assert depth(payload["children"][0]) == 2


async def test_studio_requires_llm_config(client, monkeypatch):
    sig = await _signal(client)

    async def boom(*_a, **_k):
        from app.services.llm_gateway import LLMNotConfiguredError

        raise LLMNotConfiguredError()

    monkeypatch.setattr("app.api.v1.signals.chat_completion", boom)
    r = await client.post(f"/api/v1/signals/{sig['id']}/studio", json={"kind": "report"})
    assert r.status_code == 503
    assert "LLM" in r.text


async def test_unknown_kind_is_422(client):
    sig = await _signal(client)
    r = await client.post(f"/api/v1/signals/{sig['id']}/studio", json={"kind": "podcast"})
    assert r.status_code == 422
