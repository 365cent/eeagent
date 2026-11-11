"""Single factory for OpenAI-compatible pydantic-ai models and providers."""
from __future__ import annotations

from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

from app.core.config import Settings, get_settings


def build_openai_provider(
    *,
    base_url: str,
    api_key: str = "",
) -> OpenAIProvider:
    return OpenAIProvider(base_url=base_url, api_key=api_key or "not-needed")


def build_chat_model(
    model_name: str,
    *,
    base_url: str,
    api_key: str = "",
) -> OpenAIChatModel:
    return OpenAIChatModel(model_name, provider=build_openai_provider(base_url=base_url, api_key=api_key))


def gateway_openai_provider(settings: Settings | None = None) -> OpenAIProvider:
    settings = settings or get_settings()
    return build_openai_provider(
        base_url=settings.llm_base_url_normalized,
        api_key=settings.llm_api_key,
    )
