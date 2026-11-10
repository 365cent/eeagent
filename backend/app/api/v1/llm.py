"""LLM gateway status for dashboard (no secrets)."""

from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.schemas import LlmStatusOut
from app.services.llm_gateway import configured_chat_model, llm_configured, resolve_chat_model

router = APIRouter(prefix="/llm", tags=["llm"])


@router.get("/status", response_model=LlmStatusOut)
async def llm_status() -> LlmStatusOut:
    """Configured ``LLM_MODEL``, or probed default when unset (no secrets)."""
    settings = get_settings()
    model = configured_chat_model(settings) or None
    if not model and llm_configured():
        try:
            model = await resolve_chat_model()
        except Exception:
            model = None
    return LlmStatusOut(configured=llm_configured(), model=model)
