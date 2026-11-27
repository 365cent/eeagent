"""Pydantic AI wiring for agent tooling (W3+/REQ-AGT).

The OpenAI-compatible gateway already serves chat completions for the research
assistant; Pydantic AI talks to the same endpoint so agents share one model
resolver, one key, and one place to observe traffic.

The legacy signal assistant still uses `llm_gateway.chat_completion`.
BE-14 uses `app.services.agent_workflow.build_eea_agent`.
"""
from __future__ import annotations

from pydantic_ai import Agent
from pydantic_ai.models import Model
from pydantic_ai.models.openai import OpenAIChatModel

from app.core.config import get_settings
from app.platform.llm import build_chat_model
from app.platform.hedged_model import HedgedChatModel
from app.services.llm_gateway import (
    LLMNotConfiguredError,
    build_chat_model_chain,
    configured_chat_model,
    remember_chat_model,
)

from app.services.llm_prompts import LEGACY_CHAT_SYSTEM as DEFAULT_SYSTEM_PROMPT


def build_model(
    model_name: str, *, base_url: str, api_key: str = ""
) -> OpenAIChatModel:
    """One chat model bound to the enterprise OpenAI-compatible gateway."""
    return build_chat_model(model_name, base_url=base_url, api_key=api_key)


async def _remember_winner(model_name: str) -> None:
    """With CHAT_MODEL unset, start the next request from the model that won."""
    if model_name and not configured_chat_model():
        remember_chat_model(model_name)


async def build_hedged_model() -> Model:
    """Resolve the attempt sequence and race it on the first token.

    When ``CHAT_MODEL`` is unset the chain is the speed-ranked gateway list
    expanded to max(30, candidate count); a single configured id stays exactly
    that id but still gets the per-candidate transport retries.
    """
    settings = get_settings()
    base = settings.chat_base_url_normalized
    if not base:
        raise LLMNotConfiguredError("CHAT_BASE_URL must be set in backend/.env")
    chain = await build_chat_model_chain()
    if not chain:
        raise LLMNotConfiguredError("no chat model candidates were resolved")
    models: list[Model] = [
        build_model(name, base_url=base, api_key=settings.chat_api_key_value) for name in chain
    ]
    return HedgedChatModel(
        models,
        hedge_delay=settings.chat_hedge_delay_seconds,
        total_timeout=settings.chat_first_token_timeout_seconds,
        max_parallel=settings.chat_hedge_max_models,
        retries=settings.chat_model_retries,
        on_winner=_remember_winner,
    )


async def build_agent(
    system_prompt: str = "",
    *,
    model_name: str | None = None,
) -> Agent[None, str]:
    """Agent over the gateway; the model is explicit or auto-resolved.

    Raises `LLMNotConfiguredError` when `CHAT_BASE_URL` is unset and
    `LLMNoModelError` when the gateway offers no working chat model.
    """
    settings = get_settings()
    base = settings.chat_base_url_normalized
    if not base:
        raise LLMNotConfiguredError("CHAT_BASE_URL must be set in backend/.env")
    model = (
        build_model(model_name, base_url=base, api_key=settings.chat_api_key_value)
        if model_name
        else await build_hedged_model()
    )
    return Agent(
        model,
        system_prompt=system_prompt or DEFAULT_SYSTEM_PROMPT,
        output_type=str,
    )
