"""LLM gateway status for dashboard (no secrets)."""

from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.schemas import LlmStatusOut
from app.services.llm_gateway import llm_configured

router = APIRouter(prefix="/llm", tags=["llm"])


@router.get("/status", response_model=LlmStatusOut)
async def llm_status() -> LlmStatusOut:
    """Configured chat model id (from backend `.env`); reply payloads may echo upstream `model`."""
    settings = get_settings()
    return LlmStatusOut(
        configured=llm_configured(),
        model=settings.llm_model or None,
    )
