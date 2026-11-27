"""Typed payloads for the agent SSE stream.

Every event that leaves `execute_user_message` is validated through one of these
models, so the browser contract cannot drift silently: a producer that forgets
`delta`, `ref_id` or the failure text fails in a test instead of rendering an
empty bubble. Unknown event types pass through untouched so an older client and
a newer server stay compatible.

`turn.failed` is the interesting one: a turn that dies midway still owns the
tokens it already produced, so the failure carries `partial_text` and a
`retryable` flag. The UI keeps that text and offers a retry instead of blanking
the answer.
"""

from __future__ import annotations

from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter


class _Event(BaseModel):
    """Base for every stream event; unknown extras are tolerated on purpose."""

    model_config = ConfigDict(extra="allow")

    type: str
    run_id: str | None = None


class TurnStarted(_Event):
    type: Literal["turn.started"] = "turn.started"


class TextDelta(_Event):
    type: Literal["text.delta"] = "text.delta"
    delta: str


class TextReplace(_Event):
    type: Literal["text.replace"] = "text.replace"
    text: str


class ThinkingDelta(_Event):
    type: Literal["thinking.delta"] = "thinking.delta"
    delta: str


class ToolCall(_Event):
    type: Literal["tool.call"] = "tool.call"
    tool: str


class ToolResult(_Event):
    type: Literal["tool.result"] = "tool.result"
    tool: str | None = None
    ok: bool | None = None


class CitationEvent(_Event):
    type: Literal["citation"] = "citation"
    ref_id: str
    kind: str = "unknown"


class TurnProgress(_Event):
    type: Literal["turn.progress"] = "turn.progress"
    elapsed_s: int | None = None


class TurnCompleted(_Event):
    type: Literal["turn.completed"] = "turn.completed"
    status: str = "completed"
    served_model: str | None = None


class TurnFailed(_Event):
    type: Literal["turn.failed"] = "turn.failed"
    error: str
    partial_text: str = ""
    retryable: bool = True


class TurnCancelled(_Event):
    type: Literal["turn.cancelled"] = "turn.cancelled"


class ApprovalRequired(_Event):
    """Emitted twice with different shapes: one per approval, then a summary."""

    type: Literal["approval.required"] = "approval.required"
    tool: str | None = None
    tool_call_id: str | None = None
    approvals: list[dict[str, Any]] | None = None
    status: str | None = None
    served_model: str | None = None


class MessageCompleted(_Event):
    type: Literal["message.completed"] = "message.completed"
    session_id: str | None = None
    status: str | None = None
    output: dict[str, Any] | None = None
    error: str | None = None
    served_model: str | None = None


class MessageFailed(_Event):
    type: Literal["message.failed"] = "message.failed"
    error: str


AgentStreamEvent = Annotated[
    TurnStarted
    | TextDelta
    | TextReplace
    | ThinkingDelta
    | ToolCall
    | ToolResult
    | CitationEvent
    | TurnProgress
    | TurnCompleted
    | TurnFailed
    | TurnCancelled
    | ApprovalRequired
    | MessageCompleted
    | MessageFailed,
    Field(discriminator="type"),
]

_STREAM_EVENTS: dict[str, type[_Event]] = {
    "turn.started": TurnStarted,
    "text.delta": TextDelta,
    "text.replace": TextReplace,
    "thinking.delta": ThinkingDelta,
    "tool.call": ToolCall,
    "tool.result": ToolResult,
    "citation": CitationEvent,
    "turn.progress": TurnProgress,
    "turn.completed": TurnCompleted,
    "turn.failed": TurnFailed,
    "turn.cancelled": TurnCancelled,
    "approval.required": ApprovalRequired,
    "message.completed": MessageCompleted,
    "message.failed": MessageFailed,
}

_EVENT_ADAPTER: TypeAdapter[AgentStreamEvent] = TypeAdapter(AgentStreamEvent)


def stream_event_payload(event_type: str, payload: dict[str, Any]) -> dict[str, Any]:
    """Validate one event and return the JSON-ready payload to send/persist.

    Unknown types are returned unchanged; a known type with a broken shape raises
    `pydantic.ValidationError` at the producer, not in the browser.
    """
    model = _STREAM_EVENTS.get(event_type)
    body = {"type": event_type, **payload}
    if model is None:
        return body
    return model.model_validate(body).model_dump(mode="json", exclude_none=True)


def parse_stream_event(raw: str | dict[str, Any]) -> AgentStreamEvent:
    """Parse a payload back into its concrete event (used by tests and replay)."""
    return _EVENT_ADAPTER.validate_json(raw) if isinstance(raw, str) else _EVENT_ADAPTER.validate_python(raw)
