"""OpenAI-compatible chat completions gateway (REQ-AGT-05 preview).

Keys stay server-side; callers pass message lists only.

`LLM_MODEL` may stay empty: the gateway is then asked for its model list and
each chat-capable candidate is verified with one minimal completion (single
"ping" turn, `max_tokens=1`) before it is used. The pick is cached briefly so
one request does not re-probe every candidate.

Vision uses the same `LLM_BASE_URL` and `LLM_API_KEY` as chat
(`…/chat/completions` with image parts). `VISION_MODEL` wins when set; otherwise
the gateway list is searched for Qwen 3.8 then 3.6 (ids change over time).
"""
from __future__ import annotations

import asyncio
import logging
import re
import time
from contextlib import asynccontextmanager

import httpx

logger = logging.getLogger(__name__)

from app.core.config import get_settings
from app.platform.http import open_async_http_client
from app.services.llm_usage import log_llm_call, usage_from_chat_payload

_CACHE_TTL_SECONDS = 600.0


class LLMNotConfiguredError(RuntimeError):
    """LLM_BASE_URL is unset."""


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
_chat_sem = asyncio.Semaphore(2)
_studio_sem = asyncio.Semaphore(1)

DEFAULT_CHAT_MODEL_ATTEMPTS = 3


def configured_chat_model(settings=None) -> str:
    """``LLM_MODEL`` from settings when set (including gateway ids such as ``auto``)."""
    settings = settings or get_settings()
    return (settings.llm_model or "").strip()


def _cached(kind: str) -> str | None:
    hit = _cache.get(kind)
    if hit and time.monotonic() - hit[1] < _CACHE_TTL_SECONDS:
        return hit[0]
    return None


def _remember(kind: str, model: str) -> str:
    _cache[kind] = (model, time.monotonic())
    return model


def llm_configured() -> bool:
    return bool(get_settings().llm_base_url_normalized)


def _headers() -> dict[str, str]:
    settings = get_settings()
    headers = {"Content-Type": "application/json"}
    if settings.llm_api_key:
        headers["Authorization"] = f"Bearer {settings.llm_api_key}"
    return headers


async def list_models(*, timeout: float = 15.0) -> list[str]:
    """Gateway model ids, in the order the gateway returns them."""
    settings = get_settings()
    base = settings.llm_base_url_normalized
    if not base:
        raise LLMNotConfiguredError("LLM_BASE_URL must be set in backend/.env")
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


def upstream_retryable(exc: LLMUpstreamError) -> bool:
    if exc.status in (408, 429, 500, 502, 503, 504, 554):
        return True
    detail = exc.detail.lower()
    return "timeout" in detail or "edgeone" in detail


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


async def build_chat_model_chain(max_models: int = DEFAULT_CHAT_MODEL_ATTEMPTS) -> list[str]:
    """Models to try: ``LLM_MODEL`` first when set, else probed default, then `/models` list."""
    settings = get_settings()
    models = await list_models()
    candidates = chat_candidates(models)
    if not candidates:
        raise LLMNoModelError("gateway lists no chat-capable models")
    explicit = configured_chat_model(settings)
    primary = explicit if explicit else await resolve_chat_model()
    chain: list[str] = [primary]
    for model in candidates:
        if model not in chain:
            chain.append(model)
    return chain[:max(1, max_models)]


@asynccontextmanager
async def studio_generation_slot():
    """One studio LLM completion at a time (avoids EdgeOne timeouts under burst)."""
    async with _studio_sem:
        yield


async def _probe_chat(model: str, *, timeout: float = 20.0) -> bool:
    """One-turn probe: a single user message, one token of output."""
    settings = get_settings()
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "ping"}],
        "temperature": 0,
        "max_tokens": 1,
    }
    try:
        async with open_async_http_client(timeout=timeout) as client:
            resp = await client.post(
                f"{settings.llm_base_url_normalized}/chat/completions",
                headers=_headers(),
                json=payload,
            )
    except httpx.HTTPError:
        return False
    return resp.status_code < 400


async def resolve_chat_model(*, force: bool = False) -> str:
    """Configured model, else the first gateway candidate that answers a probe."""
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
        models = await list_models()
        candidates = chat_candidates(models)
        for candidate in candidates:
            if await _probe_chat(candidate):
                return _remember("chat", candidate)
        raise LLMNoModelError(f"no chat model answered a probe; candidates={candidates}")


def pick_vision_model(models: list[str], explicit: str = "") -> str:
    """Explicit id when present, else the first Qwen 3.8 / 3.6 match."""
    if explicit:
        return explicit
    for pattern in _VISION_PREFERENCE:
        for model in models:
            if pattern.search(model):
                return model
    return ""


async def resolve_vision_model(*, force: bool = False) -> str:
    """Vision model for figure semantics; dynamic unless VISION_MODEL is set."""
    settings = get_settings()
    if settings.vision_model:
        return settings.vision_model
    if not force:
        hit = _cached("vision")
        if hit:
            return hit
    models = await list_models()
    model = pick_vision_model(models)
    if not model:
        raise LLMNoModelError("no Qwen 3.8 / 3.6 vision model listed by the gateway")
    return _remember("vision", model)


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
    max_model_attempts: int = 1,
    task: str = "chat",
    caller_attempt: int = 1,
) -> tuple[str, str]:
    """Return (assistant_text, served_model) via ``LLM_BASE_URL`` OpenAI chat API.

    Each model attempt logs provider usage when the response includes it.
    The request body stays model, messages, temperature, and max_tokens.
    """
    settings = get_settings()
    base = settings.llm_base_url_normalized
    if not base:
        raise LLMNotConfiguredError("LLM_BASE_URL must be set in backend/.env")
    timeout = 120.0 if max_tokens <= 1200 else 180.0
    attempts = max(1, max_model_attempts)
    chain = await build_chat_model_chain(max_models=attempts)

    last: LLMUpstreamError | None = None
    for idx, model in enumerate(chain):
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
            log_llm_call(
                usage_from_chat_payload(
                    exc.usage,
                    task=task,
                    requested_model=model,
                    served_model=exc.served_model or model,
                    model_attempt=idx + 1,
                    caller_attempt=caller_attempt,
                    fallback=idx > 0,
                    latency_ms=latency_ms,
                    http_status=exc.status,
                    model_requests=1 if exc.usage else None,
                )
            )
            last = exc
            if idx + 1 >= len(chain) or not _upstream_retryable(exc):
                raise
            logger.info(
                "chat completion retry next_model=%s after model=%s status=%s",
                chain[idx + 1],
                model,
                exc.status,
            )
            continue
        latency_ms = int((time.perf_counter() - started) * 1000)
        log_llm_call(
            usage_from_chat_payload(
                raw_usage,
                task=task,
                requested_model=model,
                served_model=served,
                model_attempt=idx + 1,
                caller_attempt=caller_attempt,
                fallback=idx > 0,
                latency_ms=latency_ms,
            )
        )
        return text, served
    if last is not None:
        raise last
    raise LLMNoModelError("no chat model attempts remain")
