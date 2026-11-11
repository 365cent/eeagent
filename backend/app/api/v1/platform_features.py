from fastapi import APIRouter

from app.platform.launchdarkly import platform_feature_states

router = APIRouter(tags=["platform"])


@router.get("/platform/features")
def list_platform_features() -> dict[str, object]:
    """EEA Agent Platform workflow flags. Enabled unless a targeting rule serves Disabled."""
    return {"features": platform_feature_states()}
