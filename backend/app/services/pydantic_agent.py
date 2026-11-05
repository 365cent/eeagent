"""Pydantic AI wiring for agent tooling (W3+/REQ-AGT).

The OpenAI-compatible gateway already serves chat completions for the research
assistant; Pydantic AI talks to the same endpoint so future tool-using agents
share one model resolver, one key, and one place to observe traffic.

Nothing here is on a request path yet: the assistant still uses
`llm_gateway.chat_completion` (plain HTTP). W3 tools import `build_agent`.
"""
from __future__ import annotations

from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

from app.core.config import get_settings
from app.services.llm_gateway import LLMNotConfiguredError, resolve_chat_model

DEFAULT_SYSTEM_PROMPT = (
    "你是 EEA 前瞻技术扫描平台的证据研究助手。仅根据给定上下文回答；"
    "信息不足时明确说明，不要伪造引用或数据。回答使用简体中文，简洁专业。"
)


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
