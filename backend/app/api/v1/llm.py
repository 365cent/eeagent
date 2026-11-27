"""LLM gateway status for dashboard (no secrets, no prompts)."""

from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.schemas import LlmSpeedOut, LlmStatusOut
from app.platform import model_speed
from app.services.llm_gateway import (
    configured_chat_model,
    last_attempt_budget,
    llm_configured,
    resolve_chat_model,
)

router = APIRouter(prefix="/llm", tags=["llm"])


@router.get("/status", response_model=LlmStatusOut)
async def llm_status() -> LlmStatusOut:
    """Configured model, hedge settings and the runtime TPS ranking."""
    settings = get_settings()
    model = configured_chat_model(settings) or None
    if not model and llm_configured():
        try:
            model = await resolve_chat_model()
        except Exception:
            model = None
    speeds = [LlmSpeedOut(**entry.model_dump()) for entry in await model_speed.snapshot()]
    return LlmStatusOut(
        configured=llm_configured(),
        model=model,
        attempt_budget=last_attempt_budget() or settings.chat_attempt_budget_floor,
        hedge_delay_seconds=settings.chat_hedge_delay_seconds,
        hedge_max_models=settings.chat_hedge_max_models,
        speeds=speeds,
    )
