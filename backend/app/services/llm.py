"""LLM tag suggestions via Pydantic AI (WBS 1.3.1 / TODO.md W3).

LLM-first with silent jieba fallback (TODO.md W3: "jieba 保留作 fallback"):
every failure mode — `LLM_MODEL` unset, gateway unreachable, timeout, invalid
structured output — returns None so no exception ever reaches the request
path; callers keep the jieba result (app/api/v1/signals.py integration).

The model points at the enterprise OpenAI-compatible gateway from
`app/core/config.py` (`llm_base_url_normalized` + `llm_api_key` + `llm_model`).
`LLM_MODEL` unset short-circuits to None without touching the network: the
gateway's auto model resolution (`llm_gateway.resolve_chat_model`) probes
models with live requests, which is not acceptable on the tag-suggestion
path (short budget, must never block ingest).

Tests stub the model with pydantic-ai's TestModel/FunctionModel
(tests/test_llm_tags.py) — no real endpoint is ever contacted.
"""
from __future__ import annotations

import logging

from pydantic import BaseModel, field_validator

from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

from app.core.config import get_settings
from app.services.refcodes import codes, labels, normalize

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
            if name and name not in cleaned:
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


_SYSTEM_PROMPT = (
    "你是 EEA 前瞻技术扫描平台的标签建议器。根据信号的标题与正文，从给定封闭词表中选出"
    "最匹配的一项价值链环节与一项信号类型，并提炼 3-6 个技术方向标签。\n"
    "价值链环节（code: label）: "
    + "; ".join(f"{c}: {l}" for c, l in zip(codes("value_chain_stage"), labels("value_chain_stage")))
    + "\n信号类型（code: label）: "
    + "; ".join(f"{c}: {l}" for c, l in zip(codes("signal_type"), labels("signal_type")))
    + "\n只输出词表内的 code；不确定时该字段留 null。标签用简体中文，不得编造。"
)


def _build_agent() -> Agent[None, LLMTagSuggestion]:
    """Agent over the enterprise gateway (same endpoint as
    app/services/pydantic_agent.py, but pinned to the explicit LLM_MODEL)."""
    settings = get_settings()
    provider = OpenAIProvider(
        base_url=settings.llm_base_url_normalized,
        api_key=settings.llm_api_key or "not-needed",
    )
    model = OpenAIChatModel(settings.llm_model, provider=provider)
    return Agent(
        model,
        output_type=LLMTagSuggestion,
        system_prompt=_SYSTEM_PROMPT,
        model_settings={"timeout": REQUEST_TIMEOUT_SECONDS},
    )


async def suggest_tags_with_llm(title: str, body: str) -> LLMTagSuggestion | None:
    """Structured tag suggestion, or None on any failure (jieba stays in charge).

    Never raises: unset LLM_MODEL/LLM_BASE_URL, network/timeout errors and
    invalid structured output all log a warning and return None.
    """
    settings = get_settings()
    if not settings.llm_model or not settings.llm_base_url_normalized:
        return None
    text = f"标题: {title.strip()}\n\n正文:\n{body.strip()[:6000]}" if body.strip() else title.strip()
    try:
        agent = _build_agent()
        result = await agent.run(text)
        suggestion = result.output
    except Exception as exc:  # noqa: BLE001 — the suggestion path must never raise
        logger.warning("LLM 标签建议失败，回退 jieba: %s: %s", type(exc).__name__, exc)
        return None
    if not suggestion.tech_tags and suggestion.value_chain_stage_code is None and suggestion.signal_type_code is None:
        return None
    return suggestion
