"""Tagging input: strip markitdown nav URLs before jieba."""

import pytest

pytestmark = pytest.mark.no_db

from app.services.tagging import suggest_tags_from_snapshot, text_for_tagging


def test_text_for_tagging_strips_markdown_links_and_urls():
    body = """# 蔚来 ET9 架构

* [首页](https://www.ednchina.com/)
* [资讯](https://www.ednchina.com/technews/)

中央计算 域控制器 供应链 电子电气架构
"""
    cleaned = text_for_tagging("标题", body)
    assert "https" not in cleaned
    assert "ednchina" not in cleaned.lower()
    assert "中央计算" in cleaned
    tags = suggest_tags_from_snapshot("标题", body)
    assert tags
    assert "https" not in tags
    assert "com" not in tags
    assert any(t in {"中央", "计算", "控制器", "供应链", "架构", "电气"} for t in tags)
