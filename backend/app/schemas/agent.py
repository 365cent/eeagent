"""HTTP schemas for /api/v1/agent."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class AgentSessionCreate(BaseModel):
    title: str | None = None
    project_key: str | None = None
    page_context: dict[str, Any] | None = None


class AgentSessionOut(BaseModel):
    id: uuid.UUID
    title: str | None
    project_key: str | None
    status: str
    created_at: datetime
    updated_at: datetime


class AgentMessageIn(BaseModel):
    message: str = Field(min_length=1, max_length=12000)


class AgentMessageOut(BaseModel):
    session_id: uuid.UUID
    run_id: uuid.UUID
    status: Literal["completed", "approval_required", "failed", "cancelled"]
    output: dict[str, Any] | None = None
    error: str | None = None


class AgentPatchActionOut(BaseModel):
    patch_id: uuid.UUID
    status: str
    message: str


class AgentMemoryIn(BaseModel):
    scope: Literal["user", "project"]
    project_key: str | None = None
    key: str = Field(min_length=1, max_length=120)
    content: str = Field(min_length=1, max_length=8000)


class AgentMemoryOut(BaseModel):
    id: uuid.UUID
    scope: str
    project_key: str | None
    key: str
    content: str
    created_at: datetime
