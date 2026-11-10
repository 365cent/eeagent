"""Pydantic AI wiring for agent tooling (W3+/REQ-AGT).

The OpenAI-compatible gateway already serves chat completions for the research
assistant; Pydantic AI talks to the same endpoint so agents share one model
resolver, one key, and one place to observe traffic.

The legacy signal assistant still uses `llm_gateway.chat_completion`.
BE-14 uses `app.services.agent_workflow.build_eea_agent`.
"""
from __future__ import annotations

from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

from app.core.config import get_settings
from app.services.llm_gateway import LLMNotConfiguredError, resolve_chat_model

from app.services.llm_prompts import LEGACY_CHAT_SYSTEM as DEFAULT_SYSTEM_PROMPT


def build_model(
    model_name: str, *, base_url: str, api_key: str = ""
) -> OpenAIChatModel:
    """One chat model bound to the enterprise OpenAI-compatible gateway."""
    provider = OpenAIProvider(base_url=base_url, api_key=api_key or "not-needed")
    return OpenAIChatModel(model_name, provider=provider)


async def build_agent(
    system_prompt: str = "",
    *,
    model_name: str | None = None,
) -> Agent[None, str]:
    """Agent over the gateway; the model is explicit or auto-resolved.

    Raises `LLMNotConfiguredError` when `LLM_BASE_URL` is unset and
    `LLMNoModelError` when the gateway offers no working chat model.
    """
    settings = get_settings()
    base = settings.llm_base_url_normalized
    if not base:
        raise LLMNotConfiguredError("LLM_BASE_URL must be set in backend/.env")
    chosen = model_name or await resolve_chat_model()
    return Agent(
        build_model(chosen, base_url=base, api_key=settings.llm_api_key),
        system_prompt=system_prompt or DEFAULT_SYSTEM_PROMPT,
        output_type=str,
    )
