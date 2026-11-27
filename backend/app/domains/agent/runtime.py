"""Session runs, cancellation, and message persistence."""

from __future__ import annotations

import asyncio
import time
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from pydantic_ai import DeferredToolRequests
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.identity import OperatorIdentity
from app.models.agent_models import AgentMessage, AgentRun, AgentSession
from app.domains.agent.events import append_event
from app.domains.agent.instructions import build_instruction_addon
from app.schemas.agent_stream import stream_event_payload
from app.domains.agent.workflow import (
    build_eea_agent,
    deps_for_session,
    dumps_message_history,
    loads_message_history,
    run_agent_turn,
    EventSink,
)
from app.platform.llm_gateway import LLMNotConfiguredError, LLMNoModelError, LLMUpstreamError


# Replay on reconnect only needs durable events; see `execute_user_message`.
PERSISTED_STREAM_EVENTS = frozenset(
    {"tool.call", "tool.result", "citation", "approval.required"}
)


async def get_owned_session(
    db: AsyncSession, session_id: uuid.UUID, actor: OperatorIdentity
) -> AgentSession:
    session = await db.get(AgentSession, session_id)
    if session is None:
        raise HTTPException(404, "session not found")
    if session.operator_subject != actor.subject:
        raise HTTPException(403, "无权访问该会话")
    return session


async def execute_user_message(
    db: AsyncSession,
    *,
    session: AgentSession,
    actor: OperatorIdentity,
    message: str,
    event_sink: EventSink | None = None,
) -> tuple[AgentRun, dict | None, str | None, str | None]:
    run = AgentRun(session_id=session.id, status="running")
    db.add(run)
    db.add(
        AgentMessage(session_id=session.id, run_id=run.id, role="user", content=message.strip())
    )
    await db.flush()
    await append_event(
        db,
        session=session,
        event_type="turn.started",
        payload={"run_id": str(run.id)},
        run_id=run.id,
    )
    if event_sink is not None:
        await event_sink("turn.started", {"run_id": str(run.id)})
    history = loads_message_history(session.model_messages_json)
    deps = deps_for_session(
        db,
        actor,
        session.id,
        session.project_key,
        session.page_context,
        run_id=run.id,
    )
    deps.instruction_addon = await build_instruction_addon(db, deps)

    async def heartbeat() -> None:
        started = time.monotonic()
        while True:
            await asyncio.sleep(5)
            if event_sink is not None:
                await event_sink("turn.progress", {"elapsed_s": int(time.monotonic() - started)})

    stream_buffer: list[tuple[str, dict]] = []
    stream_events_persisted = False
    # Filled by run_agent_turn as tokens arrive, so a failure (including a
    # timeout) can still hand the reader what was already produced.
    partial_holder: list[str] = []

    async def emit(event_type: str, payload: dict | None = None) -> None:
        """Validate one event against the pydantic contract, then sink/persist it."""
        normalized = stream_event_payload(event_type, payload or {})
        if event_type in PERSISTED_STREAM_EVENTS:
            stream_buffer.append((event_type, normalized))
        if event_sink is not None:
            await event_sink(event_type, normalized)

    def partial_text() -> str:
        return partial_holder[0] if partial_holder else ""

    async def fail(exc: BaseException, message: str) -> None:
        """Close a failed turn without throwing away the answer it already wrote."""
        nonlocal error
        error = message
        run.status = "failed"
        run.error_message = message[:1000] or f"{type(exc).__name__}"
        # The partial reply stays in the transcript: the next reload must show
        # the same text the reader already saw, plus the retry affordance.
        db.add(
            AgentMessage(
                session_id=session.id,
                run_id=run.id,
                role="assistant",
                content=partial_text(),
            )
        )
        await flush_events()

    async def flush_events() -> None:
        """Persist buffered tool/citation events before the terminal failure."""
        nonlocal stream_events_persisted
        if stream_events_persisted or not stream_buffer:
            return
        for event_type, payload in stream_buffer:
            await append_event(
                db,
                session=session,
                event_type=event_type,
                payload=payload,
                run_id=run.id,
            )
        stream_events_persisted = True
        stream_buffer.clear()

    async def sink(event_type: str, payload: dict) -> None:
        # Token deltas and progress heartbeats are ephemeral: the final message is
        # stored separately, so replaying them only bloats the event table.
        await emit(event_type, payload)

    status = "completed"
    output_payload: dict | None = None
    error: str | None = None
    served_model: str | None = None

    async def close_turn(event_type: str, payload: dict) -> None:
        normalized = stream_event_payload(event_type, payload)
        await append_event(
            db,
            session=session,
            event_type=event_type,
            payload=normalized,
            run_id=run.id,
        )
        if event_sink is not None:
            await event_sink(event_type, normalized)

    try:
        agent = await build_eea_agent()
        heartbeat_task = asyncio.create_task(heartbeat())
        try:
            async with asyncio.timeout(get_settings().agent_turn_timeout_seconds):
                output, messages, usage = await run_agent_turn(
                    agent,
                    user_message=message,
                    deps=deps,
                    message_history=history,
                    event_sink=sink,
                    partial_holder=partial_holder,
                )
        except TimeoutError as exc:
            raise LLMUpstreamError(
                504,
                f"模型在限定时间内未返回完整结果",
            ) from exc
        finally:
            heartbeat_task.cancel()
            await asyncio.gather(heartbeat_task, return_exceptions=True)
        session.model_messages_json = dumps_message_history(messages)
        if isinstance(output, DeferredToolRequests):
            status = "approval_required"
            output_payload = {
                "approvals": [
                    {"tool": c.tool_name, "tool_call_id": c.tool_call_id} for c in output.approvals
                ]
            }
            assistant_text = "存在待确认的工具调用，请在确认后继续。"
        else:
            output_payload = output.model_dump(mode="json")
            assistant_text = output.answer
        db.add(
            AgentMessage(
                session_id=session.id,
                run_id=run.id,
                role="assistant",
                content=assistant_text,
            )
        )
        run.output_json = output_payload
        run.usage_json = usage
        served_model = str((usage or {}).get("served_model") or "") or None
        run.status = status
        run.finished_at = datetime.now(timezone.utc)
        await flush_events()
        await close_turn(
            "turn.completed" if status == "completed" else "approval.required",
            {"run_id": str(run.id), "status": status, "served_model": served_model},
        )
    except (LLMNotConfiguredError, LLMNoModelError) as exc:
        status = "failed"
        await fail(exc, "LLM 未配置或没有可用模型")
        await close_turn(
            "turn.failed",
            {
                "run_id": str(run.id),
                "error": error,
                "partial_text": partial_text(),
                "retryable": True,
            },
        )
    except LLMUpstreamError as exc:
        status = "failed"
        await fail(exc, f"LLM 上游错误 ({exc.status})：{exc.detail}"[:240])
        await close_turn(
            "turn.failed",
            {
                "run_id": str(run.id),
                "error": error,
                "partial_text": partial_text(),
                "retryable": True,
            },
        )
    except Exception as exc:  # noqa: BLE001
        status = "failed"
        await fail(exc, "Agent 运行失败")
        await close_turn(
            "turn.failed",
            {
                "run_id": str(run.id),
                "error": error,
                "partial_text": partial_text(),
                "retryable": True,
            },
        )
    run.finished_at = run.finished_at or datetime.now(timezone.utc)
    await db.commit()
    return run, output_payload, error if status == "failed" else None, served_model


async def cancel_run(
    db: AsyncSession, session: AgentSession, run_id: uuid.UUID, actor: OperatorIdentity
) -> AgentRun:
    run = (
        await db.execute(
            select(AgentRun).where(AgentRun.id == run_id, AgentRun.session_id == session.id)
        )
    ).scalar_one_or_none()
    if run is None:
        raise HTTPException(404, "run not found")
    if session.operator_subject != actor.subject:
        raise HTTPException(403, "无权取消该运行")
    run.cancel_requested = True
    if run.status == "running":
        run.status = "cancelled"
        run.finished_at = datetime.now(timezone.utc)
        await append_event(
            db,
            session=session,
            event_type="turn.cancelled",
            payload={"run_id": str(run.id)},
            run_id=run.id,
        )
    await db.commit()
    return run
