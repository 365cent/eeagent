"""BE-14 durable agent sessions, SSE, patches, and memory."""

from __future__ import annotations

import asyncio
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import case, delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import OperatorIdentity, get_operator_identity
from app.db.base import get_db
from app.models.agent_models import AgentMemory, AgentMessage, AgentPatch, AgentRun, AgentSession
from app.schemas.agent import (
    AgentMemoryIn,
    AgentMemoryOut,
    AgentMessageIn,
    AgentMessageOut,
    AgentMessageRecord,
    AgentPatchActionOut,
    AgentPatchOut,
    AgentSessionCreate,
    AgentSessionOut,
    AgentSkillsStatusOut,
)
from app.domains.skills.service import load_skill_registry
from app.domains.agent.events import format_sse, format_sse_payload, list_events_after
from app.domains.agent.patches import apply_confirmed_patch, get_owned_patch, reject_patch
from app.domains.agent.runtime import cancel_run, execute_user_message, get_owned_session

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/sessions", response_model=AgentSessionOut)
async def create_session(
    payload: AgentSessionCreate,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    session = AgentSession(
        operator_subject=actor.subject,
        project_key=payload.project_key,
        title=payload.title,
        page_context=payload.page_context,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return AgentSessionOut(
        id=session.id,
        title=session.title,
        project_key=session.project_key,
        page_context=session.page_context,
        status=session.status,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@router.get("/sessions", response_model=list[AgentSessionOut])
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
    limit: int = Query(50, ge=1, le=200),
    signal_id: uuid.UUID | None = Query(None),
):
    conditions = [AgentSession.operator_subject == actor.subject]
    if signal_id is not None:
        conditions.append(AgentSession.page_context['signal_id'].astext == str(signal_id))
    rows = (
        await db.execute(
            select(AgentSession)
            .where(*conditions)
            .order_by(AgentSession.updated_at.desc())
            .limit(limit)
        )
    ).scalars()
    return [
        AgentSessionOut(
            id=s.id,
            title=s.title,
            project_key=s.project_key,
            page_context=s.page_context,
            status=s.status,
            created_at=s.created_at,
            updated_at=s.updated_at,
        )
        for s in rows
    ]


@router.get("/skills/status", response_model=AgentSkillsStatusOut)
async def get_agent_skills_status():
    registry = load_skill_registry()
    return AgentSkillsStatusOut(
        baseline_mode=registry.baseline_mode,
        packs=[
            {"name": p.name, "version": p.version, "checksum": p.checksum}
            for p in registry.packs
        ],
        errors=list(registry.errors),
        rule_count=registry.rule_count,
    )


@router.get("/sessions/{session_id}/messages", response_model=list[AgentMessageRecord])
async def list_session_messages(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
    limit: int = Query(200, ge=1, le=500),
):
    await get_owned_session(db, session_id, actor)
    rows = (
        await db.execute(
            select(AgentMessage, AgentRun)
            .outerjoin(AgentRun, AgentRun.id == AgentMessage.run_id)
            .where(AgentMessage.session_id == session_id)
            .order_by(
                AgentMessage.created_at.asc(),
                case((AgentMessage.role == "user", 0), else_=1),
                AgentMessage.id.asc(),
            )
            .limit(limit)
        )
    ).all()
    records: list[AgentMessageRecord] = []
    for message, run in rows:
        usage = run.usage_json if run is not None and isinstance(run.usage_json, dict) else {}
        served = usage.get("served_model") if usage else None
        records.append(
            AgentMessageRecord(
                id=message.id,
                session_id=message.session_id,
                run_id=message.run_id,
                role=message.role,
                content=message.content,
                created_at=message.created_at,
                served_model=served if isinstance(served, str) and served else None,
                finished_at=run.finished_at if run is not None else None,
            )
        )
    return records


@router.get("/sessions/{session_id}/patches", response_model=list[AgentPatchOut])
async def list_session_patches(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    await get_owned_session(db, session_id, actor)
    rows = (
        await db.execute(
            select(AgentPatch)
            .where(AgentPatch.session_id == session_id)
            .order_by(AgentPatch.created_at.desc())
        )
    ).scalars()
    return [
        AgentPatchOut(
            id=row.id,
            signal_id=row.signal_id,
            status=row.status,
            baseline_snapshot=row.baseline_snapshot,
            diff=row.diff,
            reason=row.reason,
            citation_refs=list(row.citation_refs or []),
            expires_at=row.expires_at,
            created_at=row.created_at,
            conflict_reason=row.conflict_reason,
        )
        for row in rows
    ]


@router.get("/sessions/{session_id}", response_model=AgentSessionOut)
async def get_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    session = await get_owned_session(db, session_id, actor)
    return AgentSessionOut(
        id=session.id,
        title=session.title,
        project_key=session.project_key,
        page_context=session.page_context,
        status=session.status,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@router.post("/sessions/{session_id}/messages", response_model=AgentMessageOut)
async def post_message(
    session_id: uuid.UUID,
    payload: AgentMessageIn,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    session = await get_owned_session(db, session_id, actor)
    run, output, error, served_model = await execute_user_message(
        db, session=session, actor=actor, message=payload.message
    )
    return AgentMessageOut(
        session_id=session.id,
        run_id=run.id,
        status=run.status,  # type: ignore[arg-type]
        output=output,
        error=error,
        served_model=served_model,
    )


@router.post("/sessions/{session_id}/messages/stream")
async def stream_message(
    session_id: uuid.UUID,
    payload: AgentMessageIn,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    session = await get_owned_session(db, session_id, actor)
    queue: asyncio.Queue[tuple[str, dict] | None] = asyncio.Queue()

    async def sink(event_type: str, event_payload: dict) -> None:
        await queue.put((event_type, event_payload))

    async def runner() -> None:
        try:
            run, output, error, served_model = await execute_user_message(
                db,
                session=session,
                actor=actor,
                message=payload.message,
                event_sink=sink,
            )
            await queue.put(
                (
                    "message.completed",
                    {
                        "session_id": str(session.id),
                        "run_id": str(run.id),
                        "status": run.status,
                        "output": output,
                        "error": error,
                        "served_model": served_model,
                    },
                )
            )
        except Exception as exc:  # noqa: BLE001 - stream must end with an error event
            await queue.put(("message.failed", {"error": str(exc)[:500]}))
        finally:
            await queue.put(None)

    task = asyncio.create_task(runner())

    async def generator():
        try:
            while True:
                item = await queue.get()
                if item is None:
                    break
                event_type, event_payload = item
                yield format_sse_payload(event_type, event_payload)
        finally:
            if not task.done():
                task.cancel()
                await asyncio.gather(task, return_exceptions=True)
                await db.rollback()

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/sessions/{session_id}/events")
async def stream_events(
    session_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
    last_event_id: str | None = Header(default=None, alias="Last-Event-ID"),
):
    session = await get_owned_session(db, session_id, actor)
    after = int(last_event_id) if last_event_id and last_event_id.isdigit() else 0

    async def generator():
        events = await list_events_after(db, session.id, after_seq=after)
        for event in events:
            yield format_sse(event)

    return StreamingResponse(generator(), media_type="text/event-stream")


@router.post("/sessions/{session_id}/runs/{run_id}/cancel")
async def post_cancel_run(
    session_id: uuid.UUID,
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    session = await get_owned_session(db, session_id, actor)
    run = await cancel_run(db, session, run_id, actor)
    return {"run_id": str(run.id), "status": run.status}


@router.post("/sessions/{session_id}/patches/{patch_id}/confirm", response_model=AgentPatchActionOut)
async def confirm_patch(
    session_id: uuid.UUID,
    patch_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    patch = await get_owned_patch(db, session_id, patch_id, actor)
    patch = await apply_confirmed_patch(db, patch=patch, actor=actor)
    await db.commit()
    return AgentPatchActionOut(patch_id=patch.id, status=patch.status, message="变更已应用")


@router.post("/sessions/{session_id}/patches/{patch_id}/reject", response_model=AgentPatchActionOut)
async def reject_patch_route(
    session_id: uuid.UUID,
    patch_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    patch = await get_owned_patch(db, session_id, patch_id, actor)
    patch = await reject_patch(db, patch, actor)
    await db.commit()
    return AgentPatchActionOut(patch_id=patch.id, status=patch.status, message="已拒绝")


@router.get("/memories", response_model=list[AgentMemoryOut])
async def list_memories(
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
    project_key: str | None = None,
):
    q = select(AgentMemory).where(AgentMemory.operator_subject == actor.subject)
    if project_key:
        q = q.where(AgentMemory.project_key == project_key)
    rows = (await db.execute(q.order_by(AgentMemory.created_at.desc()))).scalars()
    return [
        AgentMemoryOut(
            id=m.id,
            scope=m.scope,
            project_key=m.project_key,
            key=m.mem_key,
            content=m.content,
            created_at=m.created_at,
        )
        for m in rows
    ]


@router.post("/memories", response_model=AgentMemoryOut)
async def create_memory(
    payload: AgentMemoryIn,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    if payload.scope == "project" and not payload.project_key:
        raise HTTPException(422, "project 记忆需要 project_key")
    row = AgentMemory(
        operator_subject=actor.subject,
        project_key=payload.project_key if payload.scope == "project" else None,
        scope=payload.scope,
        mem_key=payload.key,
        content=payload.content,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return AgentMemoryOut(
        id=row.id,
        scope=row.scope,
        project_key=row.project_key,
        key=row.mem_key,
        content=row.content,
        created_at=row.created_at,
    )


@router.delete("/memories/{memory_id}", status_code=204)
async def delete_memory(
    memory_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
):
    row = await db.get(AgentMemory, memory_id)
    if row is None or row.operator_subject != actor.subject:
        raise HTTPException(404, "memory not found")
    await db.execute(delete(AgentMemory).where(AgentMemory.id == memory_id))
    await db.commit()
