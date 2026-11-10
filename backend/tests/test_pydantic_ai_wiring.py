"""BE-14 agent construction and serialization checks."""

from __future__ import annotations

import uuid

import pytest
from pydantic_ai import Agent, DeferredToolRequests
from pydantic_ai.models.test import TestModel

from app.services.agent_contract import (
    ALLOWED_AGENT_TOOLS,
    AgentDeps,
    AgentTurn,
    CitationLedger,
)
from app.services.agent_workflow import (
    build_eea_agent,
    dumps_message_history,
    loads_message_history,
    registered_tool_names,
)

pytestmark = pytest.mark.anyio


@pytest.fixture
def ledger() -> CitationLedger:
    return CitationLedger()


async def test_agent_allowlist_and_output_types():
    agent = await build_eea_agent(model=TestModel())
    names = registered_tool_names(agent)
    assert names == ALLOWED_AGENT_TOOLS
    assert agent._output_toolset is not None  # noqa: SLF001


async def test_message_history_round_trip():
    agent = Agent(TestModel(), output_type=str)
    result = await agent.run("hello")
    blob = dumps_message_history(result.all_messages())
    restored = loads_message_history(blob)
    assert len(restored) >= 2


async def test_ledger_rejects_unknown_and_needs_review_citations():
    from app.services.agent_citations import make_figure_citation

    ledger = CitationLedger()
    fig = make_figure_citation(
        document_id=uuid.uuid4(),
        figure_index=1,
        title="doc",
        summary="fig",
        review_status="needs_review",
    )
    ledger.register(fig)
    assert ledger.validate_refs(["missing-ref"]) == ["missing-ref"]
    assert ledger.validate_refs([fig.ref_id]) == [fig.ref_id]
