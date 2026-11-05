"""UA simplification: browser major + OS only."""

import pytest

from app.services.useragent import simplify_ua

CASES = [
    (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/141.0.0.0 Safari/537.36",
        ("Chrome 141", "Windows 10/11"),
    ),
    (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
        ("Edge 141", "Windows 10/11"),
    ),
    (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 15.2; rv:121.0) Gecko/20100101 Firefox/121.0",
        ("Firefox 121", "macOS 15"),
    ),
    (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 "
        "(KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
        ("Safari 17", "iOS 17"),
    ),
    ("", ("Unknown", "Unknown")),
]


@pytest.mark.parametrize("raw,expected", CASES)
def test_simplify(raw, expected):
    assert simplify_ua(raw) == expected
