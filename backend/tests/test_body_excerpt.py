"""Signal excerpt skips portal chrome and prefers article lead."""

import pytest

pytestmark = pytest.mark.no_db

from app.services.body_excerpt import lead_excerpt_from_markdown


EDN_NAV = """# 蔚来 ET9 架构

 

* [首页](https://www.ednchina.com/)
* [资讯](https://www.ednchina.com/technews/)

模拟/混合信号 + 嵌入式系统 + 处理器/DSP + 测试与测量 + 电源管理 + 通信 + PCB设计 + EDN原创 + 全部标签

蔚来 ET9 采用中央计算与区域控制器相结合的数字架构，强化高压配电与区域控制器之间的供电粒度。
域控制器负责整车算力与网络主干，供应商在 eFuse 与预熔丝方案上持续迭代。
"""


def test_lead_excerpt_skips_nav_rail():
    out = lead_excerpt_from_markdown("蔚来 ET9", EDN_NAV)
    assert "模拟/混合信号" not in out
    assert "首页" not in out
    assert "中央计算" in out or "域控制器" in out
