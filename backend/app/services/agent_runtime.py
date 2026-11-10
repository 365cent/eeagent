"""Session runs, cancellation, and message persistence."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from pydantic_ai import DeferredToolRequests
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import OperatorIdentity
from app.models.agent_models import AgentMessage, AgentRun, AgentSession
from app.services.agent_events import append_event
from app.services.agent_workflow import (
    build_eea_agent,
    deps_for_session,
    dumps_message_history,
    loads_message_history,
    run_agent_turn,
)
from app.services.llm_gateway import LLMNotConfiguredError, LLMNoModelError, LLMUpstreamError


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
) -> tuple[AgentRun, dict | None, str | None]:
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
    history = loads_message_history(session.model_messages_json)
    deps = deps_for_session(
        db,
        actor,
        session.id,
        session.project_key,
        session.page_context,
        run_id=run.id,
    )

    async def sink(event_type: str, payload: dict) -> None:
        await append_event(db, session=session, event_type=event_type, payload=payload, run_id=run.id)

    status = "completed"
    output_payload: dict | None = None
    error: str | None = None
    try:
        agent = await build_eea_agent()
        output, messages = await run_agent_turn(
            agent,
            user_message=message,
            deps=deps,
            message_history=history,
            event_sink=sink,
        )
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
        run.status = status
        run.finished_at = datetime.now(timezone.utc)
        await append_event(
            db,
            session=session,
            event_type="turn.completed" if status == "completed" else "approval.required",
            payload={"run_id": str(run.id), "status": status},
            run_id=run.id,
        )
    except (LLMNotConfiguredError, LLMNoModelError) as exc:
        status = "failed"
        error = "LLM 未配置或没有可用模型"
        run.status = "failed"
        run.error_message = str(exc)
        await append_event(
            db,
            session=session,
            event_type="turn.failed",
            payload={"run_id": str(run.id), "error": error},
            run_id=run.id,
        )
    except LLMUpstreamError as exc:
        status = "failed"
        error = f"LLM 上游错误 ({exc.status})"
        run.status = "failed"
        run.error_message = error
        await append_event(
            db,
            session=session,
            event_type="turn.failed",
            payload={"run_id": str(run.id), "error": error},
            run_id=run.id,
        )
    except Exception as exc:  # noqa: BLE001
        status = "failed"
        error = "Agent 运行失败"
        run.status = "failed"
        run.error_message = str(exc)
        await append_event(
            db,
            session=session,
            event_type="turn.failed",
            payload={"run_id": str(run.id), "error": error},
            run_id=run.id,
        )
    run.finished_at = run.finished_at or datetime.now(timezone.utc)
    await db.commit()
    return run, output_payload, error if status == "failed" else None


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
