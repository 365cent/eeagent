"""High-confidence tag suggestions are applied at ingest; weak ones wait.

The researcher can always change them afterwards - the point is that a confident
suggestion should not require a click before it exists.
"""
from __future__ import annotations

import pytest

from app.domains.evidence import signal_record

pytestmark = [pytest.mark.anyio, pytest.mark.db]


async def _no_llm(*_args, **_kwargs):
    return None


def _tag_stub(tags: list[str], source: str, score: float | None):
    async def fake(*_args, **_kwargs):
        return tags, source, score

    return fake


async def _post(client, url: str, title: str):
    response = await client.post(
        "/api/v1/signals",
        json={
            "title": title,
            "url": url,
            "channel_code": "web",
            "evidence_status_code": "retained",
            "body_text": "车用芯粒互联标准化需求研究报告正文，涉及封装、供电与散热设计。",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


async def test_confident_tags_are_applied_without_review(client, monkeypatch):
    monkeypatch.setattr(signal_record, "suggest_tags_with_llm", _no_llm)
    monkeypatch.setattr(
        signal_record, "suggest_tech_tags", _tag_stub(["芯粒", "互联"], "llm-rerank-refine", 0.91)
    )

    signal = await _post(client, "https://example.com/auto-tag-high", "芯粒报告")

    detail = (await client.get(f"/api/v1/signals/{signal['id']}")).json()
    names = sorted(detail["tags"])
    assert "芯粒" in names and "互联" in names
    auto = detail["classification_basis"]["auto_tag"]
    assert auto["applied"] is True
    assert auto["confidence"] == 0.91
    assert auto["reviewed_by_human"] is False


async def test_no_rerank_keeps_the_jieba_pre_tag(client, monkeypatch):
    """REQ-TAG-05: without a rerank service there is no confidence to compare,
    so the jieba pre-tag is applied as before instead of silently dropped."""
    monkeypatch.setattr(signal_record, "suggest_tags_with_llm", _no_llm)
    monkeypatch.setattr(signal_record, "suggest_tech_tags", _tag_stub(["eFuse"], "jieba-frequency", None))

    signal = await _post(client, "https://example.com/auto-tag-no-rerank", "eFuse baseline")

    detail = (await client.get(f"/api/v1/signals/{signal['id']}")).json()
    assert detail["tags"] == ["eFuse"]
    auto = detail["classification_basis"]["auto_tag"]
    assert auto["applied"] is True
    assert auto["confidence"] is None


async def test_slow_gateway_falls_back_to_jieba_within_budget(client, monkeypatch):
    """A hanging model call must not hold the create request: the shared budget
    cancels it and the deterministic jieba pre-tag still lands (REQ-TAG-05)."""
    import asyncio
    import time

    async def hanging(*_args, **_kwargs):
        await asyncio.sleep(30)
        raise AssertionError("the ingest budget must cancel this call")

    monkeypatch.setattr(signal_record, "suggest_tags_with_llm", hanging)
    monkeypatch.setattr(signal_record, "suggest_tech_tags", hanging)
    monkeypatch.setattr(signal_record, "INGEST_TAGGING_BUDGET_SECONDS", 0.3)

    started = time.perf_counter()
    signal = await _post(client, "https://example.com/auto-tag-budget", "eFuse 配电 智能配电")
    elapsed = time.perf_counter() - started
    assert elapsed < 5, f"create must not wait for the model, took {elapsed:.1f}s"
    detail = (await client.get(f"/api/v1/signals/{signal['id']}")).json()
    assert detail["tags"], "the jieba fallback must still produce tags"
    assert detail["classification_basis"]["auto_tag"]["applied"] is True


async def test_weak_tags_stay_candidates(client, monkeypatch):
    monkeypatch.setattr(signal_record, "suggest_tags_with_llm", _no_llm)
    monkeypatch.setattr(
        signal_record, "suggest_tech_tags", _tag_stub(["芯粒", "互联"], "embedding-rerank", 0.55)
    )

    signal = await _post(client, "https://example.com/auto-tag-low", "芯粒报告（低置信）")

    detail = (await client.get(f"/api/v1/signals/{signal['id']}")).json()
    assert detail["tags"] == []
    auto = detail["classification_basis"]["auto_tag"]
    assert auto["applied"] is False
    assert auto["candidates"] == ["芯粒", "互联"]


async def test_threshold_comes_from_settings(client, monkeypatch):
    monkeypatch.setattr(signal_record, "suggest_tags_with_llm", _no_llm)
    monkeypatch.setattr(
        signal_record, "suggest_tech_tags", _tag_stub(["芯粒"], "embedding-rerank", 0.75)
    )
    monkeypatch.setenv("AUTO_TAG_MIN_CONFIDENCE", "0.7")
    from app.core.config import get_settings

    get_settings.cache_clear()
    try:
        signal = await _post(client, "https://example.com/auto-tag-env", "芯粒报告（阈值）")
        detail = (await client.get(f"/api/v1/signals/{signal['id']}")).json()
        assert detail["tags"] == ["芯粒"]
        assert detail["classification_basis"]["auto_tag"]["threshold"] == 0.7
    finally:
        monkeypatch.delenv("AUTO_TAG_MIN_CONFIDENCE", raising=False)
        get_settings.cache_clear()
