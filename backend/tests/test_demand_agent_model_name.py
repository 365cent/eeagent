"""Regression: demand coordinator must log a non-empty requested model."""

from __future__ import annotations

import pytest

from app.services import demand_agent as mod
pytestmark = [pytest.mark.no_db, pytest.mark.anyio]


class _EmptyNameModel:
    model_name = ""


class _StubResult:
    output = "assistant reply"
    response = _EmptyNameModel()

    def usage(self):
        return None

    def new_messages(self):
        return []


class _StubAgent:
    model = _EmptyNameModel()

    async def run(self, *args, **kwargs):
        return _StubResult()


async def test_run_demand_agent_chat_uses_resolved_model_for_logging(monkeypatch):
    logged: list = []
    monkeypatch.setattr(mod, "log_llm_call", logged.append)
    mod._demand_agent = None
    mod._demand_agent_requested_model = "resolved-coordinator-model"

    async def _fake_get():
        return _StubAgent()

    monkeypatch.setattr(mod, "get_demand_agent", _fake_get)
    text, served = await mod.run_demand_agent_chat(
        mod.DemandAgentDeps(theme_name="t", bots=[]),
        "hello",
        [],
    )
    assert text == "assistant reply"
    assert served == "resolved-coordinator-model"
    assert len(logged) == 1
    assert logged[0].requested_model == "resolved-coordinator-model"
    assert logged[0].served_model == "resolved-coordinator-model"
