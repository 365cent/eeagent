"""Server-side dynamic instruction blocks (computed before each agent run)."""

from __future__ import annotations

import json

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent_models import AgentMemory
from app.services.agent_contract import AgentDeps


async def build_instruction_addon(db: AsyncSession, deps: AgentDeps) -> str:
    lines: list[str] = []
    if deps.run_id:
        lines.append(f"当前运行 run_id={deps.run_id}")
    if deps.project_key:
        lines.append(f"项目 scope：{deps.project_key}")
    if deps.page_context:
        lines.append(
            "页面上下文（只读）："
            + json.dumps(deps.page_context, ensure_ascii=False)[:1200]
        )
    mem_q = select(AgentMemory).where(AgentMemory.operator_subject == deps.actor.subject)
    if deps.project_key:
        mem_q = mem_q.where(
            or_(
                AgentMemory.scope == "user",
                (AgentMemory.scope == "project") & (AgentMemory.project_key == deps.project_key),
            )
        )
    else:
        mem_q = mem_q.where(AgentMemory.scope == "user")
    memories = (
        await db.execute(mem_q.order_by(AgentMemory.created_at.desc()).limit(8))
    ).scalars().all()
    if memories:
        lines.append("操作者记忆（只读偏好，不是业务事实）：")
        for row in memories:
            lines.append(f"- {row.mem_key}: {row.content[:300]}")
    return "\n".join(lines)
