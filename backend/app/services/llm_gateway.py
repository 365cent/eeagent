"""OpenAI-compatible chat completions gateway (REQ-AGT-05 preview).

Keys stay server-side; callers pass message lists only.

`CHAT_MODEL` may stay empty: the gateway is then asked for its model list and
each chat-capable candidate is verified with one minimal completion (single
"ping" turn, `max_tokens=1`) before it is used. The pick is cached briefly so
one request does not re-probe every candidate.

Vision uses the same `CHAT_BASE_URL` and `CHAT_API_KEY` as chat
(`…/chat/completions` with image parts). `VISION_MODEL` wins when set; otherwise
the gateway list is searched for Qwen 3.8 then 3.6 (ids change over time).
"""
from __future__ import annotations

import asyncio
import logging
import re
import time
from collections.abc import Sequence
from contextlib import asynccontextmanager

import httpx

logger = logging.getLogger(__name__)

from app.core.config import get_settings, model_chain
from app.platform.http import open_async_http_client
from app.platform import model_speed
from app.platform.hedged_model import race_first
from app.services.llm_usage import log_llm_call, usage_from_chat_payload

_CACHE_TTL_SECONDS = 600.0


class LLMNotConfiguredError(RuntimeError):
    """CHAT_BASE_URL is unset."""


class LLMNoModelError(RuntimeError):
    """The gateway offers no model that answers a minimal chat probe."""


class LLMUpstreamError(RuntimeError):
    def __init__(
        self,
        status: int,
        detail: str,
        *,
        usage: dict | None = None,
        served_model: str | None = None,
    ) -> None:
        super().__init__(detail)
        self.status = status
        self.detail = detail
        self.usage = usage if isinstance(usage, dict) else None
        self.served_model = served_model if isinstance(served_model, str) and served_model else None


# Non-chat endpoints the gateway also lists: embeddings, rerankers, OCR, image
# models, speech, and the document parser we no longer use.
_NON_CHAT = re.compile(
    r"(embed|rerank|reranker|ocr|image|audio|speech|whisper|tts|mineru|moderation|guard)",
    re.IGNORECASE,
)
_VISION_PREFERENCE = (
    re.compile(r"qwen[\s._-]?3\.8", re.IGNORECASE),
    re.compile(r"qwen[\s._-]?3\.6", re.IGNORECASE),
)

_cache: dict[str, tuple[str, float]] = {}
_resolve_lock = asyncio.Lock()
_chat_sem = asyncio.Semaphore(6)
_studio_sem = asyncio.Semaphore(1)
#: Attempts used by the most recent chain build (GET /llm/status).
_last_budget: int | None = None
#: Chat-capable ids from the last `/models` call, with its monotonic timestamp.
_models_cache: tuple[list[str], float] | None = None
#: Last ranked candidate order, so one log line explains every reordering.
_last_ranked: tuple[str, ...] | None = None
MODELS_CACHE_TTL_SECONDS = 60.0

#: Floor for first-token attempts when CHAT_MODEL is unset: the gateway's chat
#: candidate list may raise it, never lower it (max(floor, len(candidates))).
DEFAULT_CHAT_MODEL_ATTEMPTS = 30


def attempt_budget_floor(settings=None) -> int:
    settings = settings or get_settings()
    return max(
        1, int(getattr(settings, "chat_attempt_budget_floor", DEFAULT_CHAT_MODEL_ATTEMPTS))
    )


def attempt_budget(candidate_count: int, settings=None) -> int:
    """Total first-token attempts for one request: max(floor, candidate count)."""
    return max(attempt_budget_floor(settings), max(0, candidate_count))


def expand_attempt_sequence(models: Sequence[str], total: int) -> list[str]:
    """Round-robin the ranked ids into ``total`` attempts.

    Round-robin keeps the fastest model in every cycle while never spending
    three consecutive attempts on the same id, so one dead model cannot eat the
    whole budget.
    """
    unique = list(dict.fromkeys(models))
    if not unique or total <= 0:
        return []
    if len(unique) == 1:
        return [unique[0]] * total
    sequence: list[str] = []
    index = 0
    while len(sequence) < total:
        model = unique[index % len(unique)]
        if len(sequence) >= 2 and sequence[-1] == model and sequence[-2] == model:
            model = unique[(index + 1) % len(unique)]
            index += 1
        sequence.append(model)
        index += 1
    return sequence


async def build_chat_attempt_sequence(*, limit: int | None = None) -> list[str]:
    """Ordered first-token attempts for the current settings.

    ``CHAT_MODEL`` set: the operator's order, verbatim (no discovery, no
    reordering, one attempt per entry). Empty: gateway ``/models`` chat
    candidates, ranked by measured TPS, expanded to max(30, candidate count).
    """
    global _last_budget, _last_ranked
    settings = get_settings()
    explicit = configured_chat_models(settings)
    if explicit:
        sequence = explicit[:limit] if limit else list(explicit)
        _last_budget = len(sequence)
        return sequence
    candidates = await cached_chat_candidates()
    if not candidates:
        raise LLMNoModelError("gateway lists no chat-capable models")
    ranked = await model_speed.rank_models(candidates)
    order = tuple(ranked)
    if _last_ranked is not None and order != _last_ranked:
        logger.info(
            "chat model ranking changed (first=%s): %s",
            order[0],
            " > ".join(order),
        )
    _last_ranked = order
    total = attempt_budget(len(ranked), settings)
    if limit is not None:
        total = min(total, max(1, limit))
    sequence = expand_attempt_sequence(ranked, total)
    _last_budget = len(sequence)
    return sequence


def configured_chat_models(settings=None) -> list[str]:
    """``CHAT_MODEL`` as an ordered list (comma-separated values allowed)."""
    settings = settings or get_settings()
    return model_chain(settings.chat_model_value)


def configured_chat_model(settings=None) -> str:
    """First configured chat model, or "" when the gateway should be probed."""
    chain = configured_chat_models(settings)
    return chain[0] if chain else ""


def _cached(kind: str) -> str | None:
    hit = _cache.get(kind)
    if hit and time.monotonic() - hit[1] < _CACHE_TTL_SECONDS:
        return hit[0]
    return None


def _remember(kind: str, model: str) -> str:
    _cache[kind] = (model, time.monotonic())
    return model


def remember_chat_model(model: str) -> str:
    """Cache the model that just answered so later requests start with it."""
    return _remember("chat", model)


def last_attempt_budget() -> int | None:
    """Attempts used by the most recent chain build, for ``GET /llm/status``."""
    return _last_budget


_PLACEHOLDER_GATEWAY_MARKERS = ("example.com", "your-gateway")


def is_placeholder_gateway_url(url: str) -> bool:
    low = url.strip().lower()
    return not low or any(marker in low for marker in _PLACEHOLDER_GATEWAY_MARKERS)


def llm_configured() -> bool:
    base = get_settings().chat_base_url_normalized
    return bool(base) and not is_placeholder_gateway_url(base)


def chat_gateway_credentials_ready() -> bool:
    """URL is usable and an API key is present (OpenAI-compatible gateways)."""
    settings = get_settings()
    return llm_configured() and bool(settings.chat_api_key_value)


def _headers() -> dict[str, str]:
    settings = get_settings()
    headers = {"Content-Type": "application/json"}
    if settings.chat_api_key_value:
        headers["Authorization"] = f"Bearer {settings.chat_api_key_value}"
    return headers


async def list_models(*, timeout: float = 15.0) -> list[str]:
    """Gateway model ids, in the order the gateway returns them."""
    settings = get_settings()
    base = settings.chat_base_url_normalized
    if not base:
        raise LLMNotConfiguredError("CHAT_BASE_URL must be set in backend/.env")
    async with open_async_http_client(timeout=timeout) as client:
        resp = await client.get(f"{base}/models", headers=_headers())
    if resp.status_code >= 400:
        raise LLMUpstreamError(resp.status_code, resp.text[:300] or resp.reason_phrase)
    try:
        data = resp.json()
        models = [str(item["id"]) for item in data["data"] if item.get("id")]
    except (KeyError, TypeError, ValueError) as exc:
        raise LLMUpstreamError(502, f"unexpected /models payload: {data!r}") from exc
    return models


def chat_candidates(models: list[str]) -> list[str]:
    """Chat-capable ids in gateway order (embeddings/rerank/vision-only names excluded)."""
    return [m for m in models if not _NON_CHAT.search(m)]


def reset_model_list_cache() -> None:
    """Forget the cached `/models` answer (tests, and explicit operator resets)."""
    global _models_cache, _last_ranked
    _models_cache = None
    _last_ranked = None


async def cached_chat_candidates() -> list[str]:
    """Chat ids from `/models`, cached briefly so one request is one round trip."""
    global _models_cache
    now = time.monotonic()
    if _models_cache is not None and now - _models_cache[1] < MODELS_CACHE_TTL_SECONDS:
        return list(_models_cache[0])
    candidates = chat_candidates(await list_models())
    if candidates:
        _models_cache = (candidates, now)
    return candidates


def upstream_retryable(exc: LLMUpstreamError) -> bool:
    if exc.status in (404, 408, 429, 500, 502, 503, 504, 554):
        return True
    detail = exc.detail.lower()
    return "timeout" in detail or "edgeone" in detail


#: Gateway errors that say the model id itself is unusable, not just busy.
_PERMANENT_MODEL_MARKERS = (
    "model_not_found",
    "model not found",
    "does not exist",
    "unknown model",
    "invalid model",
    "unsupported model",
)


def permanent_model_error(exc: LLMUpstreamError) -> bool:
    """True when the id should be skipped for a while instead of retried."""
    if exc.status in (404, 422):
        return True
    detail = (exc.detail or "").lower()
    return any(marker in detail for marker in _PERMANENT_MODEL_MARKERS)


_upstream_retryable = upstream_retryable  # backward compat for existing imports


def upstream_from_pydantic_ai(exc: BaseException) -> LLMUpstreamError:
    """Map pydantic-ai provider failures to ``LLMUpstreamError`` for API handlers."""
    from pydantic_ai.exceptions import ModelAPIError, ModelHTTPError

    if isinstance(exc, ModelHTTPError):
        body = exc.body
        text = body.strip() if isinstance(body, str) else (str(body) if body is not None else "")
        detail = text or f"LLM 上游 HTTP {exc.status_code}"
        return LLMUpstreamError(int(exc.status_code), f"{exc.model_name}: {detail}"[:500])
    if isinstance(exc, ModelAPIError):
        return LLMUpstreamError(502, f"{exc.model_name}: {exc}"[:500])
    return LLMUpstreamError(502, str(exc)[:500])


async def build_chat_model_chain(max_models: int | None = None) -> list[str]:
    """Attempt sequence, optionally truncated to ``max_models``.

    Kept as the public name used by callers and tests; the budget/ranking logic
    lives in :func:`build_chat_attempt_sequence`.
    """
    return await build_chat_attempt_sequence(limit=max_models)


@asynccontextmanager
async def studio_generation_slot():
    """One studio LLM completion at a time (avoids EdgeOne timeouts under burst)."""
    async with _studio_sem:
        yield


async def _probe_chat(model: str, *, timeout: float = 20.0) -> bool:
    """Probe for usable content, not just HTTP 200.

    Reasoning-only models can return 200 with empty assistant content and
    finish_reason=length. They are not safe defaults for business calls.
    """
    settings = get_settings()
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "Reply with the single word OK."}],
        "temperature": 0,
        "max_tokens": 64,
    }
    try:
        async with open_async_http_client(timeout=timeout) as client:
            resp = await client.post(
                f"{settings.chat_base_url_normalized}/chat/completions",
                headers=_headers(),
                json=payload,
            )
    except httpx.HTTPError:
        return False
    if resp.status_code >= 400:
        return False
    try:
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError, ValueError):
        return False
    return isinstance(content, str) and bool(content.strip())


async def resolve_chat_model(*, force: bool = False) -> str:
    """Configured model, else the fastest known candidate (no probe sweep).

    A serial probe of every candidate costs up to N × 20 s on the enterprise
    gateway and returns nothing when it is flapping. Instead this returns the
    top-ranked id at once; the first real call races the full attempt sequence
    and caches the model that actually answered.
    """
    settings = get_settings()
    explicit = configured_chat_model(settings)
    if explicit:
        return explicit
    if not force:
        hit = _cached("chat")
        if hit:
            return hit
    async with _resolve_lock:
        if not force:
            hit = _cached("chat")
            if hit:
                return hit
        else:
            _cache.pop("chat", None)
        candidates = await cached_chat_candidates()
        if not candidates:
            raise LLMNoModelError("gateway lists no chat-capable models")
        ranked = await model_speed.rank_models(candidates)
        return _remember("chat", ranked[0])


def pick_vision_chain(models: list[str], explicit: str = "") -> list[str]:
    """Ordered vision ids: explicit list, else all Qwen 3.8 matches then 3.6.

    ``VISION_MODEL`` is the retry order, so it is never re-sorted by measured
    speed and no TPS ranking applies here.
    """
    if explicit:
        return model_chain(explicit)
    chain: list[str] = []
    for pattern in _VISION_PREFERENCE:
        for model in models:
            if pattern.search(model) and model not in chain:
                chain.append(model)
    return chain


def pick_vision_model(models: list[str], explicit: str = "") -> str:
    """Explicit id when present, else the first Qwen 3.8 / 3.6 match."""
    chain = pick_vision_chain(models, explicit)
    return chain[0] if chain else ""


async def resolve_vision_model(*, force: bool = False) -> str:
    """Vision chain for figure semantics; dynamic unless VISION_MODEL is set.

    Returns the ordered candidates joined with commas: ``VISION_MODEL`` when
    set, else every Qwen 3.8 match followed by the 3.6 ones, so figure captions
    keep falling back in order without further discovery.
    """
    settings = get_settings()
    if settings.vision_model:
        return settings.vision_model
    if not force:
        hit = _cached("vision")
        if hit:
            return hit
    models = await list_models()
    chain = pick_vision_chain(models)
    if not chain:
        raise LLMNoModelError("no Qwen 3.8 / 3.6 vision model listed by the gateway")
    return _remember("vision", ",".join(chain))


def _usage_dict(data: object) -> dict | None:
    if isinstance(data, dict) and isinstance(data.get("usage"), dict):
        return data["usage"]
    return None


def _served_model(data: object, requested: str) -> str:
    if isinstance(data, dict):
        reported = data.get("model")
        if isinstance(reported, str) and reported.strip():
            return reported
    return requested


async def _post_chat_completion(
    *,
    base: str,
    model: str,
    messages: list[dict[str, str]],
    temperature: float,
    max_tokens: int,
    timeout: float,
) -> tuple[str, str, dict | None]:
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    async with open_async_http_client(timeout=timeout) as client:
        resp = await client.post(
            f"{base}/chat/completions", headers=_headers(), json=payload
        )
        if resp.status_code >= 400:
            body = resp.text[:500]
            logger.warning(
                "chat completion failed model=%s status=%s detail=%s",
                model,
                resp.status_code,
                body[:200] if body else resp.reason_phrase,
            )
            parsed: object = None
            try:
                parsed = resp.json()
            except ValueError:
                parsed = None
            raise LLMUpstreamError(
                resp.status_code,
                body or resp.reason_phrase,
                usage=_usage_dict(parsed),
                served_model=_served_model(parsed, "") or None,
            )
        try:
            data = resp.json()
        except ValueError as exc:
            raise LLMUpstreamError(502, "LLM response was not JSON") from exc

    usage = _usage_dict(data)
    served = _served_model(data, model)
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise LLMUpstreamError(
            502, "unexpected LLM response shape", usage=usage, served_model=served
        ) from exc
    if not isinstance(content, str) or not content.strip():
        raise LLMUpstreamError(
            502, "empty assistant content from LLM", usage=usage, served_model=served
        )
    return content.strip(), served, usage


async def chat_completion(
    messages: list[dict[str, str]],
    *,
    temperature: float = 0.3,
    max_tokens: int = 1200,
    max_model_attempts: int | None = None,
    task: str = "chat",
    caller_attempt: int = 1,
) -> tuple[str, str]:
    """Return (assistant_text, served_model) via ``CHAT_BASE_URL`` OpenAI chat API.

    Each model attempt logs provider usage and feeds the runtime TPS book. The
    request body stays model, messages, temperature, and max_tokens.
    """
    settings = get_settings()
    base = settings.chat_base_url_normalized
    if not base:
        raise LLMNotConfiguredError("CHAT_BASE_URL must be set in backend/.env")
    timeout = 120.0 if max_tokens <= 1200 else 180.0
    chain = await build_chat_model_chain(max_models=max_model_attempts)
    if not chain:
        raise LLMNoModelError("no chat model candidates")
    max_parallel = max(1, int(getattr(settings, "chat_hedge_max_models", 4)))

    async def attempt(index: int) -> tuple[str, str]:
        model = chain[index]
        started = time.perf_counter()
        try:
            async with _chat_sem:
                text, served, raw_usage = await _post_chat_completion(
                    base=base,
                    model=model,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    timeout=timeout,
                )
        except LLMUpstreamError as exc:
            latency_ms = int((time.perf_counter() - started) * 1000)
            empty = "empty assistant content" in (exc.detail or "").lower()
            await model_speed.record_failure(
                model,
                task=task,
                error=exc.detail,
                kind="empty" if empty else "error",
                permanent=permanent_model_error(exc),
            )
            log_llm_call(
                usage_from_chat_payload(
                    exc.usage,
                    task=task,
                    requested_model=model,
                    served_model=exc.served_model or model,
                    model_attempt=index + 1,
                    caller_attempt=caller_attempt,
                    fallback=index > 0,
                    latency_ms=latency_ms,
                    http_status=exc.status,
                    model_requests=1 if exc.usage else None,
                )
            )
            raise
        latency_ms = int((time.perf_counter() - started) * 1000)
        await model_speed.record_success(
            served or model,
            output_tokens=model_speed.usage_output_tokens(raw_usage),
            seconds=latency_ms / 1000,
            task=task,
        )
        log_llm_call(
            usage_from_chat_payload(
                raw_usage,
                task=task,
                requested_model=model,
                served_model=served,
                model_attempt=index + 1,
                caller_attempt=caller_attempt,
                fallback=index > 0,
                latency_ms=latency_ms,
            )
        )
        if not configured_chat_model(settings):
            remember_chat_model(served or model)
        return text, served

    try:
        return await race_first(
            [lambda index=index: attempt(index) for index in range(len(chain))],
            hedge_delay=float(getattr(settings, "chat_hedge_delay_seconds", 2.0)),
            total_timeout=float(
                getattr(settings, "chat_request_total_timeout_seconds", 180.0)
            ),
            max_parallel=min(max_parallel, max(1, len(chain))),
            retries=max(0, int(getattr(settings, "chat_model_retries", 0))),
        )
    except LLMUpstreamError as exc:
        if not configured_chat_model(settings) and upstream_retryable(exc):
            _cache.pop("chat", None)
        raise
    except TimeoutError as exc:
        if not configured_chat_model(settings):
            _cache.pop("chat", None)
        raise LLMUpstreamError(504, str(exc)) from exc
