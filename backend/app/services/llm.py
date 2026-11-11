"""LLM tag suggestions via Pydantic AI (WBS 1.3.1 / TODO.md W3).

LLM-first with silent jieba fallback (TODO.md W3: "jieba 保留作 fallback"):
every failure mode — `LLM_MODEL` unset, gateway unreachable, timeout, invalid
structured output — returns None so no exception ever reaches the request
path; callers keep the jieba result (app/api/v1/signals.py integration).

The model points at the enterprise OpenAI-compatible gateway from
`app/core/config.py` (`llm_base_url_normalized` + `llm_api_key` + `llm_model`).
Chat, tag pick, and excerpt use ``LLM_BASE_URL`` + ``LLM_API_KEY``. ``LLM_MODEL``
may be empty: ``llm_gateway.resolve_chat_model`` picks a working chat model from
``GET /models``. Vision figure captions use the **same** gateway via
``VISION_MODEL`` (or auto Qwen 3.8/3.6 on that host). Embedding/rerank stay on
``MAAS_API_*``.

Tests stub the model with pydantic-ai's TestModel/FunctionModel
(tests/test_llm_tags.py) — no real endpoint is ever contacted.
"""
from __future__ import annotations

import logging
import re
import time

from pydantic import BaseModel, field_validator

from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel

from app.core.config import get_settings
from app.platform.llm import gateway_openai_provider
from app.services.llm_gateway import configured_chat_model, resolve_chat_model
from app.services.llm_prompts import (
    CANDIDATE_TAG_RULES,
    EXCERPT_RULES,
    TAG_SUGGESTION_RULES,
)
from app.services.llm_usage import (
    http_status_of,
    log_llm_call,
    usage_from_agent_result,
    usage_without_result,
)
from app.services.refcodes import codes, labels, normalize
from app.services.tagging import is_low_quality_tag

logger = logging.getLogger(__name__)

#: Seconds-level budget: the suggestion path must degrade to jieba quickly
#: rather than stall ingest or the tag-suggestions endpoint on a slow gateway.
REQUEST_TIMEOUT_SECONDS = 8


class LLMTagSuggestion(BaseModel):
    """Structured suggestion aligned with the closed vocabularies (codes).

    Field values are normalized label/alias → code by the validators; a value
    outside the closed vocabulary raises ValidationError, which
    `suggest_tags_with_llm` turns into None (jieba fallback) instead of
    letting an invalid LLM answer create a new vocabulary entry
    (CONV-CLOSED-VOCAB, app/services/refcodes.py).
    """

    value_chain_stage_code: str | None = None
    signal_type_code: str | None = None
    tech_tags: list[str] = []

    @field_validator("value_chain_stage_code", mode="before")
    @classmethod
    def _norm_stage(cls, v: str | None) -> str | None:
        return _closed_code("value_chain_stage", v)

    @field_validator("signal_type_code", mode="before")
    @classmethod
    def _norm_signal_type(cls, v: str | None) -> str | None:
        return _closed_code("signal_type", v)

    @field_validator("tech_tags", mode="after")
    @classmethod
    def _clean_tags(cls, v: list[str]) -> list[str]:
        cleaned: list[str] = []
        for name in v:
            name = name.strip()
            if name and not is_low_quality_tag(name) and name not in cleaned:
                cleaned.append(name)
        return cleaned


def _closed_code(domain: str, value: str | None) -> str | None:
    """Normalize a label/alias/code to its code; unknown values are invalid."""
    if value is None or value == "":
        return None
    code = normalize(domain, value)
    if code is None or code not in codes(domain):
        raise ValueError(f"{value!r} 不在封闭词表 '{domain}' 内")
    return code


def _tag_suggestion_system_prompt() -> str:
    return (
        TAG_SUGGESTION_RULES
        + "\n价值链环节（code: label）: "
        + "; ".join(f"{c}: {l}" for c, l in zip(codes("value_chain_stage"), labels("value_chain_stage")))
        + "\n信号类型（code: label）: "
        + "; ".join(f"{c}: {l}" for c, l in zip(codes("signal_type"), labels("signal_type")))
    )


async def _run_logged(agent: Agent, text: str, task: str):
    requested = str(getattr(getattr(agent, "model", None), "model_name", None) or "")
    started = time.perf_counter()
    try:
        result = await agent.run(text)
    except Exception as exc:
        log_llm_call(
            usage_without_result(
                task=task,
                requested_model=requested,
                latency_ms=int((time.perf_counter() - started) * 1000),
                http_status=http_status_of(exc),
            )
        )
        raise
    log_llm_call(
        usage_from_agent_result(
            result,
            task=task,
            requested_model=requested,
            latency_ms=int((time.perf_counter() - started) * 1000),
        )
    )
    return result


async def _chat_model_id() -> str | None:
    settings = get_settings()
    if not settings.llm_base_url_normalized:
        return None
    explicit = configured_chat_model(settings)
    if explicit:
        return explicit
    try:
        return await resolve_chat_model()
    except Exception as exc:  # noqa: BLE001
        logger.warning("无法从网关解析对话模型: %s: %s", type(exc).__name__, exc)
        return None


async def _build_agent() -> Agent[None, LLMTagSuggestion] | None:
    model_id = await _chat_model_id()
    if not model_id:
        return None
    return Agent(
        OpenAIChatModel(model_id, provider=gateway_openai_provider()),
        output_type=LLMTagSuggestion,
        system_prompt=_tag_suggestion_system_prompt(),
        model_settings={"timeout": REQUEST_TIMEOUT_SECONDS},
    )


class LLMCandidateTagPick(BaseModel):
    """Final tech tags chosen only from a reranked candidate list."""

    tech_tags: list[str]

    @field_validator("tech_tags", mode="after")
    @classmethod
    def _clean(cls, v: list[str]) -> list[str]:
        cleaned: list[str] = []
        for name in v:
            name = name.strip()
            if name and not is_low_quality_tag(name) and name not in cleaned:
                cleaned.append(name)
        return cleaned[:9]


async def _build_candidate_pick_agent() -> Agent[None, LLMCandidateTagPick] | None:
    model_id = await _chat_model_id()
    if not model_id:
        return None
    return Agent(
        OpenAIChatModel(model_id, provider=gateway_openai_provider()),
        output_type=LLMCandidateTagPick,
        system_prompt=CANDIDATE_TAG_RULES,
        model_settings={"timeout": REQUEST_TIMEOUT_SECONDS},
    )


def _filter_picked_to_candidates(picked: list[str], candidates: list[str]) -> list[str]:
    lookup = {c.casefold(): c for c in candidates}
    out: list[str] = []
    for name in picked:
        canon = lookup.get(name.casefold())
        if canon and canon not in out:
            out.append(canon)
    return out


async def pick_tech_tags_from_candidates(
    title: str,
    body: str,
    candidates: list[str],
    *,
    max_tags: int = 9,
) -> list[str] | None:
    """LLM narrows reranked jieba pool to ≤ max_tags; None when LLM unavailable."""
    if not get_settings().llm_base_url_normalized:
        return None
    pool = [c for c in candidates if not is_low_quality_tag(c)]
    if not pool:
        return None
    cap = min(max_tags, 9, len(pool))
    listing = "、".join(pool)
    text = (
        f"标题: {title.strip()}\n\n正文摘录:\n{body.strip()[:4000]}\n\n"
        f"候选标签（共 {len(pool)} 个）: {listing}\n\n"
        f"请从中选出最多 {cap} 个。"
    )
    try:
        agent = await _build_candidate_pick_agent()
        if agent is None:
            return None
        result = await _run_logged(agent, text, "candidate_tags")
        chosen = _filter_picked_to_candidates(result.output.tech_tags, pool)
        if chosen:
            return chosen[:cap]
        return None
    except Exception as exc:  # noqa: BLE001
        logger.warning("LLM 候选标签精选失败，保留 rerank 结果: %s: %s", type(exc).__name__, exc)
        return None


async def suggest_tags_with_llm(title: str, body: str) -> LLMTagSuggestion | None:
    """Structured tag suggestion, or None on any failure (jieba stays in charge).

    Never raises: unset LLM_MODEL/LLM_BASE_URL, network/timeout errors and
    invalid structured output all log a warning and return None.
    """
    if not get_settings().llm_base_url_normalized:
        return None
    text = f"标题: {title.strip()}\n\n正文:\n{body.strip()[:6000]}" if body.strip() else title.strip()
    try:
        agent = await _build_agent()
        if agent is None:
            return None
        result = await _run_logged(agent, text, "tag_suggestion")
        suggestion = result.output
    except Exception as exc:  # noqa: BLE001 — the suggestion path must never raise
        logger.warning("LLM 标签建议失败，回退 jieba: %s: %s", type(exc).__name__, exc)
        return None
    if not suggestion.tech_tags and suggestion.value_chain_stage_code is None and suggestion.signal_type_code is None:
        return None
    return suggestion


class LLMExcerpt(BaseModel):
    """Short article summary for signal.excerpt (plain text, no nav chrome)."""

    excerpt: str

    @field_validator("excerpt", mode="after")
    @classmethod
    def _clean(cls, v: str) -> str:
        v = re.sub(r"\s+", " ", v.strip())
        if len(v) < 12:
            raise ValueError("excerpt too short")
        return v[:400]


async def _build_excerpt_agent() -> Agent[None, LLMExcerpt] | None:
    model_id = await _chat_model_id()
    if not model_id:
        return None
    return Agent(
        OpenAIChatModel(model_id, provider=gateway_openai_provider()),
        output_type=LLMExcerpt,
        system_prompt=EXCERPT_RULES,
        model_settings={"timeout": REQUEST_TIMEOUT_SECONDS},
    )


async def suggest_excerpt_with_llm(title: str, body: str) -> str | None:
    """Article excerpt for the evidence sidebar, or None on any failure."""
    if not get_settings().llm_base_url_normalized:
        return None
    if not body.strip() and not title.strip():
        return None
    text = f"标题: {title.strip()}\n\n正文:\n{body.strip()[:6000]}" if body.strip() else title.strip()
    try:
        agent = await _build_excerpt_agent()
        if agent is None:
            return None
        result = await _run_logged(agent, text, "excerpt")
        return result.output.excerpt
    except Exception as exc:  # noqa: BLE001
        logger.warning("LLM 摘要失败，回退正文导段: %s: %s", type(exc).__name__, exc)
        return None
