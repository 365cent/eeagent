"""Shared LaunchDarkly server-side client for feature evaluation."""

from __future__ import annotations

import time

import ldclient
from ldclient import Context
from ldclient.config import Config

from app.platform.errors import FeatureDisabledError

ONBOARDING_BACKEND_FLAG_KEY = "launchdarkly-onboarding-backend-banner"

# One flag per EEA Agent Platform workflow stage. Sample records are not flags.
# Off and on both serve Enabled, so today's behavior stays until a targeting rule serves Disabled.
PLATFORM_FEATURES: tuple[tuple[str, str], ...] = (
    ("evidence-capture", "原始信息采集与证据留存"),
    ("signal-tagging", "信号标签化"),
    ("demand-extraction", "需求提取与证据核验"),
    ("demand-function-mapping", "需求与功能映射"),
    ("technology-decomposition", "功能与关键技术拆解"),
    ("deployment-standards", "部署标准构建"),
    ("strategy-funnel", "战略四步漏斗"),
)
EVIDENCE_CAPTURE = PLATFORM_FEATURES[0][0]
SIGNAL_TAGGING = PLATFORM_FEATURES[1][0]
DEMAND_EXTRACTION = PLATFORM_FEATURES[2][0]
DEMAND_FUNCTION_MAPPING = PLATFORM_FEATURES[3][0]
TECHNOLOGY_DECOMPOSITION = PLATFORM_FEATURES[4][0]
DEPLOYMENT_STANDARDS = PLATFORM_FEATURES[5][0]
STRATEGY_FUNNEL = PLATFORM_FEATURES[6][0]

# Custom metric event keys (LD metrics in project default).
WORKFLOW_SUCCESS_EVENTS: dict[str, str] = {
    EVIDENCE_CAPTURE: "eea-evidence-capture-success",
    SIGNAL_TAGGING: "eea-signal-tagging-success",
    DEMAND_EXTRACTION: "eea-demand-extraction-success",
    DEMAND_FUNCTION_MAPPING: "eea-demand-function-mapping-success",
    TECHNOLOGY_DECOMPOSITION: "eea-technology-decomposition-success",
    DEPLOYMENT_STANDARDS: "eea-deployment-standards-success",
    STRATEGY_FUNNEL: "eea-strategy-funnel-success",
}
WORKFLOW_FEATURE_DISABLED_EVENT = "eea-workflow-feature-disabled"

ONBOARDING_BACKEND_FLAG_URL = (
    "https://app.launchdarkly.com/projects/default/flags/"
    "launchdarkly-onboarding-backend-banner/targeting?env=test"
)

_onboarding_context = Context.create("eea-backend-onboarding")


def start_launchdarkly(sdk_key: str | None) -> bool:
    """Configure the process-wide LD client. Returns whether initialization succeeded."""
    key = (sdk_key or "").strip()
    if not key:
        return False
    ldclient.set_config(Config(key))
    client = ldclient.get()
    deadline = time.monotonic() + 10.0
    while time.monotonic() < deadline:
        if client.is_initialized():
            return True
        time.sleep(0.05)
    return client.is_initialized()


def shutdown_launchdarkly() -> None:
    client = ldclient.get()
    if client.is_initialized():
        client.close()


def launchdarkly_configured() -> bool:
    client = ldclient.get()
    return client.is_initialized()


def variation_bool(flag_key: str, *, default: bool = False) -> bool:
    try:
        client = ldclient.get()
    except Exception:
        return default
    if not client.is_initialized():
        return default
    value = client.variation(flag_key, _onboarding_context, default)
    return value is True


def track_metric_event(event_key: str, data: dict[str, object] | None = None) -> None:
    """Send a custom metric event when the server SDK is live."""
    try:
        client = ldclient.get()
    except Exception:
        return
    if not client.is_initialized():
        return
    client.track(event_key, _onboarding_context, data or {})


def track_workflow_success(feature_key: str) -> None:
    event_key = WORKFLOW_SUCCESS_EVENTS.get(feature_key)
    if event_key:
        track_metric_event(event_key, {"feature": feature_key})


def require_feature(flag_key: str):
    """Block a feature only when its flag serves Disabled. Missing SDK keeps the feature on."""

    def _dependency() -> None:
        if not variation_bool(flag_key, default=True):
            track_metric_event(WORKFLOW_FEATURE_DISABLED_EVENT, {"feature": flag_key})
            raise FeatureDisabledError(f"{flag_key} is disabled")

    return _dependency


def platform_feature_states() -> list[dict[str, object]]:
    return [
        {
            "key": key,
            "name": name,
            "enabled": variation_bool(key, default=True),
            "metric_event_key": WORKFLOW_SUCCESS_EVENTS.get(key),
        }
        for key, name in PLATFORM_FEATURES
    ]
