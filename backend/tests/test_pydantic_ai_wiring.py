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


@pytest.mark.no_db
async def test_agent_allowlist_and_output_types():
    agent = await build_eea_agent(model=TestModel())
    names = registered_tool_names(agent)
    assert names == ALLOWED_AGENT_TOOLS
    assert agent._output_toolset is not None  # noqa: SLF001


@pytest.mark.no_db
async def test_message_history_round_trip():
    agent = Agent(TestModel(), output_type=str)
    result = await agent.run("hello")
    blob = dumps_message_history(result.all_messages())
    restored = loads_message_history(blob)
    assert len(restored) >= 2


@pytest.mark.no_db
async def test_propose_patch_rejects_forged_citations():
    from app.services.agent_citations import assert_citations_usable
    from app.services.agent_contract import CitationLedger

    ledger = CitationLedger()
    with pytest.raises(ValueError, match="无效"):
        assert_citations_usable(ledger, ["sig:00000000-0000-0000-0000-000000000001"])


@pytest.mark.no_db
async def test_figure_citation_carries_index():
    import uuid

    from app.services.agent_citations import figure_ref_id, make_figure_citation

    doc_id = uuid.uuid4()
    citation = make_figure_citation(
        document_id=doc_id,
        figure_index=3,
        title="doc",
        summary="fig",
        review_status="ready",
    )
    assert citation.figure_index == 3
    assert citation.ref_id == figure_ref_id(doc_id, 3)


async def test_dynamic_instructions_include_project_and_memory():
    from app.core.identity import OperatorIdentity
    from app.db.base import SessionLocal
    from app.models.agent_models import AgentMemory, AgentSession
    from app.services.agent_instructions import build_instruction_addon
    from app.services.agent_workflow import deps_for_session

    async with SessionLocal() as db:
        session = AgentSession(operator_subject="dev-user", project_key="proj-a", title="t")
        db.add(session)
        db.add(
            AgentMemory(
                operator_subject="dev-user",
                scope="user",
                mem_key="focus",
                content="智能配电",
            )
        )
        await db.commit()
        await db.refresh(session)
        deps = deps_for_session(
            db,
            OperatorIdentity("dev-user", "researcher"),
            session.id,
            "proj-a",
            {"page": "evidence"},
            run_id=uuid.uuid4(),
        )
        text = await build_instruction_addon(db, deps)
        assert "proj-a" in text
        assert "智能配电" in text


@pytest.mark.no_db
async def test_run_agent_turn_wires_event_stream_handler():
    """When event_sink is set, run_agent_turn must stream through run_stream."""
    from contextlib import asynccontextmanager
    from types import SimpleNamespace
    from unittest.mock import MagicMock

    from app.core.identity import OperatorIdentity
    from app.services.agent_workflow import build_eea_agent, run_agent_turn

    agent = await build_eea_agent(model=TestModel())
    captured: dict = {}

    class FakeStreamed:
        async def stream_output(self, debounce_by=0.05):
            del debounce_by
            yield SimpleNamespace(answer="ok")

        async def get_output(self):
            return AgentTurn(answer="ok", citation_refs=[], patch_ids=[])

        def all_messages(self):
            return []

        usage = None

    @asynccontextmanager
    async def recording_run_stream(*_args, **kwargs):
        captured["handler"] = kwargs.get("event_stream_handler")
        yield FakeStreamed()

    agent.run_stream = recording_run_stream  # type: ignore[method-assign]

    deps = AgentDeps(
        db=MagicMock(),
        actor=OperatorIdentity("dev-user", "researcher"),
        session_id=uuid.uuid4(),
        project_key=None,
        page_context=None,
    )

    async def sink(_kind: str, _payload: dict) -> None:
        pass

    await run_agent_turn(agent, user_message="hi", deps=deps, event_sink=sink)
    assert captured.get("handler") is not None


@pytest.mark.no_db
async def test_run_agent_turn_without_sink_uses_non_stream_run():
    """The fallback path must call agent.run, not run_stream."""
    from types import SimpleNamespace
    from unittest.mock import MagicMock

    from app.core.identity import OperatorIdentity
    from app.services.agent_workflow import build_eea_agent, run_agent_turn

    agent = await build_eea_agent(model=TestModel())
    captured: dict = {}

    async def recording_run(*_args, **kwargs):
        captured["called"] = "run"
        return SimpleNamespace(
            output=AgentTurn(answer="ok", citation_refs=[], patch_ids=[]),
            all_messages=lambda: [],
            usage=lambda: None,
        )

    async def forbidden_stream(*_args, **_kwargs):
        raise AssertionError("run_stream must not be used without an event sink")

    agent.run = recording_run  # type: ignore[method-assign]
    agent.run_stream = forbidden_stream  # type: ignore[method-assign]

    deps = AgentDeps(
        db=MagicMock(),
        actor=OperatorIdentity("dev-user", "researcher"),
        session_id=uuid.uuid4(),
        project_key=None,
        page_context=None,
    )

    await run_agent_turn(agent, user_message="hi", deps=deps)
    assert captured.get("called") == "run"


@pytest.mark.no_db
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
