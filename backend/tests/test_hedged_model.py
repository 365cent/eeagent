"""Hedged model race: first responder wins, the next candidate starts early."""

import asyncio
import time
from types import SimpleNamespace

import pytest
from pydantic_ai.messages import ModelResponse, TextPart
from pydantic_ai.models import ModelRequestParameters
from pydantic_ai.models.function import FunctionModel

from app.services import model_speed
from app.services.hedged_model import HedgedChatModel, race_first

pytestmark = [pytest.mark.anyio, pytest.mark.no_db]


def _text_model(text: str, delay: float) -> FunctionModel:
    async def fn(messages, info):
        del messages, info
        await asyncio.sleep(delay)
        return ModelResponse(parts=[TextPart(text)])

    return FunctionModel(fn)


async def test_race_returns_first_responder_not_the_first_started():
    started = time.perf_counter()

    result = await race_first(
        [
            lambda: _slow("slow", 2.0),
            lambda: _fast("fast", 0.05),
        ],
        hedge_delay=0.2,
        total_timeout=5.0,
        max_parallel=2,
    )
    assert result == "fast"
    assert time.perf_counter() - started < 1.5


async def _slow(value: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return value


async def _fast(value: str, delay: float) -> str:
    await asyncio.sleep(delay)
    return value


async def test_race_starts_next_candidate_before_hedge_delay_when_one_fails():
    calls: list[int] = []

    async def failing() -> str:
        calls.append(1)
        raise RuntimeError("upstream down")

    async def ok() -> str:
        calls.append(2)
        return "ok"

    result = await race_first(
        [failing, ok],
        hedge_delay=10.0,
        total_timeout=5.0,
        max_parallel=2,
    )
    assert result == "ok"
    assert calls == [1, 2]


async def test_race_times_out_instead_of_hanging():
    with pytest.raises(TimeoutError):
        await race_first(
            [lambda: _slow("slow", 3.0)],
            hedge_delay=10.0,
            total_timeout=0.2,
            max_parallel=1,
        )


async def test_race_does_not_retry_a_non_transient_error():
    calls: list[int] = []

    async def broken() -> str:
        calls.append(1)
        raise ValueError("request body rejected")

    with pytest.raises(ValueError):
        await race_first(
            [broken],
            hedge_delay=1.0,
            total_timeout=5.0,
            max_parallel=1,
            retries=2,
        )
    assert calls == [1]


async def test_race_retries_a_transient_candidate_in_place():
    calls: list[int] = []

    async def flaky() -> str:
        calls.append(1)
        if len(calls) == 1:
            raise TimeoutError("gateway did not answer")
        return "recovered"

    result = await race_first(
        [flaky],
        hedge_delay=1.0,
        total_timeout=5.0,
        max_parallel=1,
        retries=1,
    )
    assert result == "recovered"
    assert calls == [1, 1]


async def test_hedged_model_returns_the_faster_model_response():
    model = HedgedChatModel(
        [_text_model("slow", 2.0), _text_model("fast", 0.05)],
        hedge_delay=0.2,
        total_timeout=5.0,
        max_parallel=2,
    )
    started = time.perf_counter()
    response = await model.request([], None, ModelRequestParameters())
    assert response.parts[0].content == "fast"  # type: ignore[union-attr]
    assert time.perf_counter() - started < 1.5


async def test_hedged_stream_uses_first_token_winner_and_closes_losers():
    closed: list[str] = []

    async def slow_stream(messages, info):
        del messages, info
        try:
            await asyncio.sleep(2.0)
            yield "slow"
        finally:
            closed.append("slow")

    async def fast_stream(messages, info):
        del messages, info
        try:
            await asyncio.sleep(0.05)
            yield "fast"
        finally:
            closed.append("fast")

    model = HedgedChatModel(
        [FunctionModel(stream_function=slow_stream), FunctionModel(stream_function=fast_stream)],
        hedge_delay=0.2,
        total_timeout=5.0,
        max_parallel=2,
    )
    started = time.perf_counter()
    async with model.request_stream([], None, ModelRequestParameters()) as stream:
        events = []
        async for event in stream:
            events.append(event)
            break
    assert events
    assert "fast_stream" in stream.model_name
    assert time.perf_counter() - started < 1.5
    assert closed == ["slow", "fast"]


async def test_hedged_defaults_follow_the_gateway_tuning():
    model = HedgedChatModel([_text_model("only", 0.01)])
    assert model.hedge_delay == 2.0
    assert model.total_timeout == 15.0
    assert model.max_parallel == 4


async def test_stream_winner_notifies_the_resolver():
    winners: list[str] = []

    async def on_winner(model_name: str) -> None:
        winners.append(model_name)

    async def fast_stream(messages, info):
        del messages, info
        yield "fast"

    model = HedgedChatModel(
        [FunctionModel(stream_function=fast_stream)],
        hedge_delay=0.2,
        total_timeout=5.0,
        on_winner=on_winner,
    )
    async with model.request_stream([], None, ModelRequestParameters()) as stream:
        async for _event in stream:
            pass
    assert winners and winners[0].endswith("fast_stream")


async def test_empty_stream_loses_the_race_and_is_demoted():
    """A reasoning-only id must not win: it frees its slot and is demoted."""
    model_speed.reset_speed_book()

    async def empty_stream(messages, info):
        if False:  # pragma: no cover - empty by construction
            yield ""

    async def good_stream(messages, info):
        yield "good"

    model = HedgedChatModel(
        [
            FunctionModel(stream_function=empty_stream),
            FunctionModel(stream_function=good_stream),
        ],
        hedge_delay=0.2,
        total_timeout=5.0,
        max_parallel=2,
    )
    async with model.request_stream([], None, ModelRequestParameters()) as stream:
        async for _event in stream:
            pass
    assert "good" in str(stream.get().parts)
    entries = await model_speed.snapshot()
    assert entries and entries[-1].failures >= 1
    model_speed.reset_speed_book()


async def test_record_generation_feeds_the_speed_book():
    model_speed.reset_speed_book()
    model = HedgedChatModel([_text_model("only", 0.01)])
    stream = SimpleNamespace(usage=lambda: SimpleNamespace(output_tokens=40))
    await model._record_generation(0, stream, time.monotonic() - 2.0, None)  # type: ignore[arg-type]
    entries = await model_speed.snapshot()
    assert entries and entries[0].samples == 1
    assert entries[0].tps > 0
    model_speed.reset_speed_book()


async def test_record_generation_demotes_a_reasoning_only_answer():
    """Tokens burned without an answer must not rank as a fast model."""
    model_speed.reset_speed_book()
    model = HedgedChatModel([_text_model("only", 0.01)])
    stream = SimpleNamespace(
        usage=lambda: SimpleNamespace(output_tokens=64),
        state=SimpleNamespace(value="complete"),
        get=lambda: ModelResponse(parts=[]),
    )
    await model._record_generation(0, stream, time.monotonic() - 2.0, None)  # type: ignore[arg-type]
    entries = await model_speed.snapshot()
    assert entries and entries[0].samples == 0
    assert entries[0].failures == 1
    model_speed.reset_speed_book()
