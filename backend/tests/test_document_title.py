"""Document-derived signal titles (commit 34245e0)."""
from types import SimpleNamespace

from app.domains.evidence.document_pipeline import document_title


def _doc(filename: str | None, sha: str = "0123456789abcdef"):
    return SimpleNamespace(filename=filename, sha256=sha)


def test_heading_wins_over_scanner_filename():
    assert document_title(_doc("759945687121989.pdf"), "# 白皮书\n\n48V 智能配电") == "白皮书"


def test_meaningful_filename_wins_over_a_noisy_cover():
    assert document_title(_doc("德赛西威EEA技术扫描.docx"), "2026 - 2028\nPROTOCOL") == "德赛西威EEA技术扫描"


def test_heading_used_when_filename_is_missing():
    assert document_title(_doc(""), "# 智能配电") == "智能配电"


def test_fallback_uses_the_sha_prefix():
    assert document_title(_doc("", "abcdef0123456789"), None) == "文档 abcdef01"

