from fastapi import APIRouter

from app.platform.launchdarkly import (
    ONBOARDING_BACKEND_FLAG_KEY,
    ONBOARDING_BACKEND_FLAG_URL,
    launchdarkly_configured,
    variation_bool,
)

router = APIRouter(tags=["launchdarkly"])


@router.get("/launchdarkly/onboarding-banner")
def launchdarkly_onboarding_banner() -> dict[str, object]:
    """Expose server-side onboarding flag state for the LaunchDarkly reveal."""
    configured = launchdarkly_configured()
    on = variation_bool(ONBOARDING_BACKEND_FLAG_KEY, default=False) if configured else False
    message = (
        "LaunchDarkly backend test banner (flag is on)"
        if on
        else "LaunchDarkly backend test banner (flag is off)"
    )
    return {
        "configured": configured,
        "on": on,
        "message": message,
        "flag_key": ONBOARDING_BACKEND_FLAG_KEY,
        "dashboard_url": ONBOARDING_BACKEND_FLAG_URL,
    }
