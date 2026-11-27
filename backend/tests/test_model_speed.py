"""Runtime TPS book: EWMA, TTL, ranking and demotion (no DB, no gateway)."""

from __future__ import annotations

import asyncio
import types

import pytest

from app.platform import model_speed

pytestmark = [pytest.mark.anyio, pytest.mark.no_db]


def _settings(ttl: float = 1200.0):
    return types.SimpleNamespace(chat_model_speed_ttl_seconds=ttl)


@pytest.fixture(autouse=True)
def _fresh_book(monkeypatch):
    model_speed.reset_speed_book()
    monkeypatch.setattr(model_speed, "get_settings", lambda: _settings())
    yield
    model_speed.reset_speed_book()


async def test_tps_uses_an_ewma_after_the_first_sample():
    assert await model_speed.record_success("m", output_tokens=10, seconds=1.0) == 10.0
    assert await model_speed.record_success("m", output_tokens=20, seconds=1.0) == 20.0
    record = model_speed.BOOK._records[("chat", "m")]
    assert record.samples == 2
    assert record.tps == pytest.approx(0.4 * 20 + 0.6 * 10)


async def test_zero_token_samples_are_not_measurements():
    assert await model_speed.record_success("m", output_tokens=0, seconds=1.0) is None
    assert await model_speed.record_success("m", output_tokens=5, seconds=0.0) is None
    assert await model_speed.snapshot() == []


async def test_rank_is_fastest_then_unmeasured_then_suspects():
    await model_speed.record_success("slow", output_tokens=5, seconds=1.0)
    await model_speed.record_success("fast", output_tokens=50, seconds=1.0)
    for _ in range(model_speed.SUSPECT_AFTER_FAILURES):
        await model_speed.record_failure("flaky", error="502")

    ranked = await model_speed.rank_models(["slow", "unknown", "fast", "flaky"])
    assert ranked == ["fast", "slow", "unknown", "flaky"]


async def test_unavailable_models_are_tried_last():
    model_speed.BOOK.mark_unavailable("gone", reason="model_not_found")
    await model_speed.record_success("alive", output_tokens=10, seconds=1.0)
    assert await model_speed.rank_models(["gone", "alive"]) == ["alive", "gone"]


async def test_stale_samples_fall_back_to_the_given_order(monkeypatch):
    monkeypatch.setattr(model_speed, "get_settings", lambda: _settings(ttl=0.01))
    await model_speed.record_success("fast", output_tokens=50, seconds=1.0)
    await asyncio.sleep(0.05)
    assert await model_speed.rank_models(["slow", "fast"]) == ["slow", "fast"]


async def test_a_success_clears_a_failure_streak():
    for _ in range(model_speed.SUSPECT_AFTER_FAILURES):
        await model_speed.record_failure("recovering", error="timeout")
    await model_speed.record_success("recovering", output_tokens=10, seconds=1.0)
    record = model_speed.BOOK._records[("chat", "recovering")]
    assert record.consecutive_failures == 0
    assert (await model_speed.rank_models(["recovering", "unknown"]))[0] == "recovering"


async def test_snapshot_reports_operator_visible_fields():
    await model_speed.record_success("a", output_tokens=20, seconds=1.0)
    await model_speed.record_failure("b", error="502", kind="error")
    entries = await model_speed.snapshot()
    assert [entry.model for entry in entries][0] == "a"
    assert entries[0].samples == 1 and entries[0].failures == 0
    assert entries[1].failures == 1
    assert entries[0].age_s is not None


def test_usage_output_tokens_reads_both_provider_keys():
    assert model_speed.usage_output_tokens({"completion_tokens": 7}) == 7
    assert model_speed.usage_output_tokens({"output_tokens": 9}) == 9
    assert model_speed.usage_output_tokens({"prompt_tokens": 3}) == 0
    assert model_speed.usage_output_tokens(None) == 0
