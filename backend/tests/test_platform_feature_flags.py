"""LaunchDarkly workflow release gates (seven EEA stages, server-side)."""

import pytest

from app.platform.errors import FeatureDisabledError
from app.platform.launchdarkly import PLATFORM_FEATURES, require_feature, variation_bool

pytestmark = pytest.mark.no_db

WORKFLOW_FLAG_KEYS = (
    "evidence-capture",
    "signal-tagging",
    "demand-extraction",
    "demand-function-mapping",
    "technology-decomposition",
    "deployment-standards",
    "strategy-funnel",
)


def test_workflow_release_flags_match_seven_stages() -> None:
    assert [key for key, _label in PLATFORM_FEATURES] == list(WORKFLOW_FLAG_KEYS)


def test_workflow_gate_fail_open_when_launchdarkly_unconfigured() -> None:
    assert variation_bool("signal-tagging", default=True) is True


def test_workflow_gate_blocks_only_when_flag_disabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "app.platform.launchdarkly.variation_bool",
        lambda _key, default=False: False,
    )
    with pytest.raises(FeatureDisabledError):
        require_feature("signal-tagging")()

    monkeypatch.setattr(
        "app.platform.launchdarkly.variation_bool",
        lambda _key, default=False: True,
    )
    require_feature("signal-tagging")()
