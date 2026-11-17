"""Local theme-name fallback used when the model does not answer."""

import pytest

from app.services.theme_naming import fallback_working_name, majority_stage


@pytest.mark.no_db
def test_fallback_name_uses_stage_and_shared_tags():
    name = fallback_working_name(
        ["低压网络多来源行业观察样本"],
        ["智能配电", "区域控制", "eFuse"],
        "创造端",
    )
    assert name == "创造端 · 智能配电与区域控制与eFuse相关需求"


@pytest.mark.no_db
def test_fallback_name_keeps_a_title_that_already_names_the_tags():
    name = fallback_working_name(
        ["汽车加速进入48V eFuse时代的智能配电"],
        ["eFuse", "智能配电"],
        "创造端",
    )
    assert name == "汽车加速进入48V eFuse时代的智能配电"


@pytest.mark.no_db
def test_majority_stage_picks_the_common_code():
    assert majority_stage(["creation_supply", "delivery_oem", "creation_supply"]) == "creation_supply"
    assert majority_stage([None, None]) is None
