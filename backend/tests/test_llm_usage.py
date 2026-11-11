"""Usage parsing and chat-completion logging. No live gateway calls."""

from contextlib import asynccontextmanager

import httpx
import pytest

import app.services.llm_gateway as gw
from app.services.llm_usage import usage_from_agent_result, usage_from_chat_payload
from tests.test_llm_gateway_models import _settings

pytestmark = [pytest.mark.anyio, pytest.mark.no_db]


def test_chat_usage_keeps_omitted_cache_fields_absent():
    record = usage_from_chat_payload(
        {"prompt_tokens": 20, "completion_tokens": 3, "total_tokens": 23, "note": "secret prompt"},
        task="evidence_assistant",
        requested_model="configured",
        served_model="served-model",
        model_attempt=1,
    )
    assert record.input_tokens == 20
    assert record.output_tokens == 3
    assert record.cache_read_tokens is None
    assert record.cache_write_tokens is None
    assert record.details == {}
    assert "secret prompt" not in record.log_line()
    assert "secret prompt" not in str(record.as_dict())


def test_explicit_zero_cache_read_is_kept():
    record = usage_from_chat_payload(
        {
            "prompt_tokens": 20,
            "completion_tokens": 3,
            "total_tokens": 23,
            "prompt_tokens_details": {"cached_tokens": 0},
        },
        task="vision_caption",
        requested_model="vision",
        served_model="vision",
        model_attempt=1,
    )
    assert record.cache_read_tokens == 0
    assert record.cache_write_tokens is None


def test_cache_write_breakdown_is_not_added_into_the_total():
    record = usage_from_chat_payload(
        {
            "input_tokens": 15,
            "output_tokens": 2,
            "total_tokens": 17,
            "prompt_tokens_details": {
                "cached_tokens": 4,
                "cache_write_tokens": 9,
                "cache_write_tokens_details": {"30m": 3, "12h": 6},
            },
        },
        task="studio.report",
        requested_model="configured",
        served_model="served",
        model_attempt=2,
        caller_attempt=1,
        fallback=True,
    )
    assert record.input_tokens == 15
    assert record.cache_read_tokens == 4
    assert record.cache_write_tokens == 9
    assert record.details == {
        "cache_write_tokens_details.30m": 3,
        "cache_write_tokens_details.12h": 6,
    }
    assert record.fallback is True


def test_pydantic_ai_zero_cache_stays_marked_as_library_default():
    class Usage:
        input_tokens = 10
        output_tokens = 2
        cache_read_tokens = 0
        cache_write_tokens = 0
        requests = 2
        tool_calls = 1
        details = {"reasoning_tokens": 5}

    class Response:
        model_name = "gateway-model"

    class Result:
        usage = Usage()
        response = Response()

        def new_messages(self):
            return [Response()]

    record = usage_from_agent_result(
        Result(),
        task="demand_coordinator",
        requested_model="auto",
    )
    assert record.usage_source == "pydantic_ai"
    assert record.served_model == "gateway-model"
    assert record.cache_read_tokens == 0
    assert record.cache_write_tokens == 0
    assert record.model_requests == 2
    assert record.details == {"reasoning_tokens": 5}


def test_local_model_does_not_record_synthetic_tokens():
    class Usage:
        input_tokens = 51
        output_tokens = 1
        cache_read_tokens = 0
        cache_write_tokens = 0
        requests = 1
        tool_calls = 0
        details = {}

    class Response:
        model_name = "function:stub:"

    class Result:
        usage = Usage()
        response = Response()

        def new_messages(self):
            return [Response()]

    record = usage_from_agent_result(Result(), task="durable_agent", requested_model="function:stub:")
    assert record.usage_source == "local_model"
    assert record.input_tokens is None
    assert record.cache_read_tokens is None
    assert record.model_requests is None


async def test_chat_completion_logs_each_attempt_without_prompt_or_cache_fields(monkeypatch):
    monkeypatch.setattr(gw, "get_settings", lambda: _settings(llm_model="configured"))

    async def chain(max_models=1):
        return ["configured", "fallback-model"][:max_models]

    monkeypatch.setattr(gw, "build_chat_model_chain", chain)
    seen: list[dict] = []

    class FakeClient:
        def __init__(self, *args, **kwargs):
            del args, kwargs

        async def post(self, url, headers=None, json=None):
            del url, headers
            seen.append(json)
            if len(seen) == 1:
                return httpx.Response(429, text="slow down")
            return httpx.Response(
                200,
                json={
                    "model": "served-model",
                    "choices": [{"message": {"content": "ok"}}],
                    "usage": {
                        "prompt_tokens": 20,
                        "completion_tokens": 3,
                        "total_tokens": 23,
                        "prompt_tokens_details": {"cached_tokens": 16},
                    },
                },
            )

    @asynccontextmanager
    async def fake_open(**kwargs):
        del kwargs
        yield FakeClient()

    monkeypatch.setattr(gw, "open_async_http_client", fake_open)
    logged = []
    monkeypatch.setattr(gw, "log_llm_call", logged.append)

    text, model = await gw.chat_completion(
        [{"role": "user", "content": "secret prompt"}],
        max_model_attempts=2,
        task="evidence_assistant",
    )
    assert text == "ok"
    assert model == "served-model"
    assert seen[0].keys() == {"model", "messages", "temperature", "max_tokens"}
    assert len(logged) == 2
    assert logged[0].http_status == 429
    assert logged[0].input_tokens is None
    assert logged[0].fallback is False
    assert logged[1].served_model == "served-model"
    assert logged[1].requested_model == "fallback-model"
    assert logged[1].cache_read_tokens == 16
    assert logged[1].cache_write_tokens is None
    assert logged[1].fallback is True
    assert "secret prompt" not in logged[1].log_line()
