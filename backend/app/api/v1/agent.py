"""BE-14 durable agent sessions, SSE, patches, and memory."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import OperatorIdentity, get_operator_identity
from app.db.base import get_db
from app.models.agent_models import AgentMemory, AgentSession
from app.schemas.agent import (
    AgentMemoryIn,
    AgentMemoryOut,
    AgentMessageIn,
    AgentMessageOut,
    AgentPatchActionOut,
    AgentSessionCreate,
    AgentSessionOut,
)
from app.services.agent_events import format_sse, list_events_after
from app.services.agent_patches import apply_confirmed_patch, get_owned_patch, reject_patch
from app.services.agent_runtime import cancel_run, execute_user_message, get_owned_session

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
        status=session.status,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@router.get("/sessions", response_model=list[AgentSessionOut])
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    actor: OperatorIdentity = Depends(get_operator_identity),
    limit: int = Query(50, le=200),
):
    rows = (
        await db.execute(
            select(AgentSession)
            .where(AgentSession.operator_subject == actor.subject)
            .order_by(AgentSession.updated_at.desc())
            .limit(limit)
        )
    ).scalars()
    return [
        AgentSessionOut(
            id=s.id,
            title=s.title,
            project_key=s.project_key,
            status=s.status,
            created_at=s.created_at,
            updated_at=s.updated_at,
        )
        for s in rows
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
    run, output, error = await execute_user_message(db, session=session, actor=actor, message=payload.message)
    return AgentMessageOut(
        session_id=session.id,
        run_id=run.id,
        status=run.status,  # type: ignore[arg-type]
        output=output,
        error=error,
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
