"""OpenAI-compatible chat completions gateway (REQ-AGT-05 preview).

Keys stay server-side; callers pass message lists only.

`LLM_MODEL` may stay empty: the gateway is then asked for its model list and
each chat-capable candidate is verified with one minimal completion (single
"ping" turn, `max_tokens=1`) before it is used. The pick is cached briefly so
one request does not re-probe every candidate.

Vision stays unset by default as well: `VISION_MODEL` wins when explicitly
configured, otherwise the gateway list is searched for Qwen 3.8 first and
Qwen 3.6 second (ids change over time, so matching is by pattern, not id).
"""
from __future__ import annotations

import re
import time

import httpx

from app.core.config import get_settings

_CACHE_TTL_SECONDS = 600.0


class LLMNotConfiguredError(RuntimeError):
    """LLM_BASE_URL is unset."""


class LLMNoModelError(RuntimeError):
    """The gateway offers no model that answers a minimal chat probe."""


class LLMUpstreamError(RuntimeError):
    def __init__(self, status: int, detail: str) -> None:
        super().__init__(detail)
        self.status = status
        self.detail = detail


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
    async with httpx.AsyncClient(timeout=timeout) as client:
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
    """Chat-capable ids, preserving gateway order."""
    return [m for m in models if not _NON_CHAT.search(m)]


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
        async with httpx.AsyncClient(timeout=timeout) as client:
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
    if settings.llm_model:
        return settings.llm_model
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


async def chat_completion(
    messages: list[dict[str, str]],
    *,
    temperature: float = 0.3,
    max_tokens: int = 1200,
) -> tuple[str, str]:
    """Return (assistant_text, model_name)."""
    settings = get_settings()
    base = settings.llm_base_url_normalized
    if not base:
        raise LLMNotConfiguredError("LLM_BASE_URL must be set in backend/.env")
    model = await resolve_chat_model()

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    async with httpx.AsyncClient(timeout=90.0) as client:
        resp = await client.post(
            f"{base}/chat/completions", headers=_headers(), json=payload
        )
        if resp.status_code >= 400:
            body = resp.text[:500]
            raise LLMUpstreamError(resp.status_code, body or resp.reason_phrase)
        data = resp.json()

    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise LLMUpstreamError(502, f"unexpected LLM response shape: {data!r}") from exc
    if not isinstance(content, str) or not content.strip():
        raise LLMUpstreamError(502, "empty assistant content from LLM")
    return content.strip(), str(data.get("model") or model)
