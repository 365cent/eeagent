"""Provider-reported token usage for chat, vision, and Pydantic AI calls.

Records stay numeric. Prompt and image bytes are never copied into the log
or the JSON persisted on an agent run. Cache read/write fields stay absent
when the raw chat payload omits them; a missing field is not stored as zero.

Pydantic AI fills omitted cache counters with 0. Those zeros are kept only
for provider-backed models and are tagged ``usage_source=pydantic_ai`` so
they are not treated as a measured cache miss. Local test models
(``function:`` / ``test:``) do not contribute token counts.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from typing import Any

from app.services.llm_prompts import PROMPT_REVISION

logger = logging.getLogger("app.llm.usage")

_TASK_SAFE = re.compile(r"[^a-z0-9._-]")
_INPUT_KEYS = ("prompt_tokens", "input_tokens")
_OUTPUT_KEYS = ("completion_tokens", "output_tokens")
_LIFTED_DETAIL_KEYS = frozenset({"cached_tokens", "cache_write_tokens"})


def _task_name(task: str) -> str:
    cleaned = _TASK_SAFE.sub("", (task or "").strip().lower())[:64]
    return cleaned or "chat"


def _optional_int(mapping: dict[str, Any], key: str) -> int | None:
    if key not in mapping:
        return None
    value = mapping[key]
    if isinstance(value, bool) or not isinstance(value, int):
        return None
    return value


def _first_int(mapping: dict[str, Any], keys: tuple[str, ...]) -> int | None:
    for key in keys:
        if key not in mapping:
            continue
        found = _optional_int(mapping, key)
        if found is not None:
            return found
    return None


def _detail_block(usage: dict[str, Any]) -> dict[str, Any]:
    for key in ("prompt_tokens_details", "input_tokens_details"):
        block = usage.get(key)
        if isinstance(block, dict):
            return block
    return {}


def _flatten_ints(source: dict[str, Any], *, prefix: str = "", skip: frozenset[str] = frozenset()) -> dict[str, int]:
    """Keep provider integer breakdowns. Do not sum them into cache totals."""
    found: dict[str, int] = {}
    for key, value in source.items():
        if prefix == "" and key in skip:
            continue
        name = f"{prefix}.{key}" if prefix else str(key)
        if isinstance(value, bool):
            continue
        if isinstance(value, int):
            found[name] = value
        elif isinstance(value, dict):
            found.update(_flatten_ints(value, prefix=name))
    return found


@dataclass(frozen=True)
class LlmCallUsage:
    task: str
    template_version: str
    requested_model: str
    served_model: str
    model_attempt: int
    caller_attempt: int
    fallback: bool
    latency_ms: int
    input_tokens: int | None
    output_tokens: int | None
    total_tokens: int | None
    cache_read_tokens: int | None
    cache_write_tokens: int | None
    model_requests: int | None
    tool_calls: int | None
    usage_source: str
    details: dict[str, int] = field(default_factory=dict)
    http_status: int | None = None
    served_models: tuple[str, ...] = ()

    def as_dict(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "task": self.task,
            "template_version": self.template_version,
            "requested_model": self.requested_model,
            "served_model": self.served_model,
            "model_attempt": self.model_attempt,
            "caller_attempt": self.caller_attempt,
            "fallback": self.fallback,
            "latency_ms": self.latency_ms,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "total_tokens": self.total_tokens,
            "cache_read_tokens": self.cache_read_tokens,
            "cache_write_tokens": self.cache_write_tokens,
            "model_requests": self.model_requests,
            "tool_calls": self.tool_calls,
            "usage_source": self.usage_source,
            "details": dict(self.details),
        }
        if self.http_status is not None:
            payload["http_status"] = self.http_status
        if len(self.served_models) > 1:
            payload["served_models"] = list(self.served_models)
        return payload

    def log_line(self) -> str:
        def num(value: int | None) -> str:
            return "-" if value is None else str(value)

        parts = [
            f"task={self.task}",
            f"template={self.template_version}",
            f"requested_model={self.requested_model or '-'}",
            f"served_model={self.served_model or '-'}",
            f"model_attempt={self.model_attempt}",
            f"caller_attempt={self.caller_attempt}",
            f"fallback={int(self.fallback)}",
            f"latency_ms={self.latency_ms}",
            f"input_tokens={num(self.input_tokens)}",
            f"output_tokens={num(self.output_tokens)}",
            f"total_tokens={num(self.total_tokens)}",
            f"cache_read_tokens={num(self.cache_read_tokens)}",
            f"cache_write_tokens={num(self.cache_write_tokens)}",
            f"model_requests={num(self.model_requests)}",
            f"tool_calls={num(self.tool_calls)}",
            f"usage_source={self.usage_source}",
        ]
        if self.http_status is not None:
            parts.append(f"http_status={self.http_status}")
        if self.details:
            detail = ",".join(f"{key}:{value}" for key, value in sorted(self.details.items()))
            parts.append(f"details={detail}")
        if len(self.served_models) > 1:
            parts.append("served_models=" + ",".join(self.served_models))
        return " ".join(parts)


def log_llm_call(record: LlmCallUsage) -> None:
    try:
        logger.info("llm_usage %s", record.log_line())
    except Exception:
        logger.warning("llm_usage log failed task=%s", record.task)


def usage_from_chat_payload(
    payload: dict[str, Any] | None,
    *,
    task: str,
    requested_model: str,
    served_model: str,
    model_attempt: int,
    caller_attempt: int = 1,
    fallback: bool = False,
    latency_ms: int = 0,
    http_status: int | None = None,
    model_requests: int | None = 1,
) -> LlmCallUsage:
    """Map an OpenAI-compatible ``usage`` object. Omitted cache keys stay None."""
    usage = payload if isinstance(payload, dict) else {}
    details_block = _detail_block(usage)
    cache_read = _optional_int(details_block, "cached_tokens")
    if cache_read is None:
        cache_read = _optional_int(usage, "cached_tokens")
    cache_write = _optional_int(details_block, "cache_write_tokens")
    if cache_write is None:
        cache_write = _optional_int(usage, "cache_write_tokens")

    details: dict[str, int] = {}
    if details_block:
        details.update(_flatten_ints(details_block, skip=_LIFTED_DETAIL_KEYS))
    for key in ("completion_tokens_details", "output_tokens_details"):
        block = usage.get(key)
        if isinstance(block, dict):
            details.update(_flatten_ints(block, prefix=key))

    reported = isinstance(payload, dict)
    return LlmCallUsage(
        task=_task_name(task),
        template_version=PROMPT_REVISION,
        requested_model=requested_model,
        served_model=served_model,
        model_attempt=model_attempt,
        caller_attempt=caller_attempt,
        fallback=fallback,
        latency_ms=max(0, latency_ms),
        input_tokens=_first_int(usage, _INPUT_KEYS) if reported else None,
        output_tokens=_first_int(usage, _OUTPUT_KEYS) if reported else None,
        total_tokens=_optional_int(usage, "total_tokens") if reported else None,
        cache_read_tokens=cache_read if reported else None,
        cache_write_tokens=cache_write if reported else None,
        model_requests=model_requests,
        tool_calls=None,
        usage_source="chat_completions",
        details=details,
        http_status=http_status,
    )


def _local_model(model_name: str) -> bool:
    return model_name.startswith(("function:", "test:"))


def http_status_of(exc: BaseException) -> int | None:
    for name in ("status_code", "status"):
        value = getattr(exc, name, None)
        if isinstance(value, int) and not isinstance(value, bool):
            return value
    return None


def usage_without_result(
    *,
    task: str,
    requested_model: str,
    latency_ms: int,
    model_attempt: int = 1,
    caller_attempt: int = 1,
    fallback: bool = False,
    usage_source: str = "pydantic_ai",
    http_status: int | None = None,
) -> LlmCallUsage:
    """An attempt that raised before a provider usage object was available."""
    return LlmCallUsage(
        task=_task_name(task),
        template_version=PROMPT_REVISION,
        requested_model=requested_model,
        served_model="",
        model_attempt=model_attempt,
        caller_attempt=caller_attempt,
        fallback=fallback,
        latency_ms=max(0, latency_ms),
        input_tokens=None,
        output_tokens=None,
        total_tokens=None,
        cache_read_tokens=None,
        cache_write_tokens=None,
        model_requests=None,
        tool_calls=None,
        usage_source=usage_source,
        http_status=http_status,
    )


def usage_from_agent_result(
    result: Any,
    *,
    task: str,
    requested_model: str,
    model_attempt: int = 1,
    caller_attempt: int = 1,
    fallback: bool = False,
    latency_ms: int = 0,
) -> LlmCallUsage:
    """Read ``result.usage`` without copying message text."""
    usage = getattr(result, "usage", None)
    if callable(usage):
        usage = usage()
    response = getattr(result, "response", None)
    served = str(getattr(response, "model_name", None) or "")
    names: list[str] = []
    new_messages = getattr(result, "new_messages", None)
    messages = new_messages() if callable(new_messages) else []
    for message in messages:
        name = getattr(message, "model_name", None)
        if isinstance(name, str) and name and name not in names:
            names.append(name)
    if not served and names:
        served = names[-1]

    provider_backed = not _local_model(served or requested_model)
    details: dict[str, int] = {}
    raw_details = getattr(usage, "details", None)
    if provider_backed and isinstance(raw_details, dict):
        for key, value in raw_details.items():
            if isinstance(value, int) and not isinstance(value, bool):
                details[str(key)] = value

    def metric(name: str) -> int | None:
        if not provider_backed or usage is None:
            return None
        value = getattr(usage, name, None)
        if isinstance(value, bool) or not isinstance(value, int):
            return None
        return value

    return LlmCallUsage(
        task=_task_name(task),
        template_version=PROMPT_REVISION,
        requested_model=requested_model,
        served_model=served or requested_model,
        model_attempt=model_attempt,
        caller_attempt=caller_attempt,
        fallback=fallback,
        latency_ms=max(0, latency_ms),
        input_tokens=metric("input_tokens"),
        output_tokens=metric("output_tokens"),
        total_tokens=None,
        cache_read_tokens=metric("cache_read_tokens"),
        cache_write_tokens=metric("cache_write_tokens"),
        model_requests=metric("requests"),
        tool_calls=metric("tool_calls"),
        usage_source="pydantic_ai" if provider_backed else "local_model",
        details=details,
        served_models=tuple(names),
    )
