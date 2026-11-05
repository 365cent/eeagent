"""Simplified User-Agent labels for the access history (browser + OS only)."""
from __future__ import annotations

import re

_BROWSER_PATTERNS = (
    ("Edge", re.compile(r"Edg/(\d+)")),
    ("Opera", re.compile(r"OPR/(\d+)")),
    ("Chrome", re.compile(r"Chrome/(\d+)")),
    ("Firefox", re.compile(r"Firefox/(\d+)")),
    ("Safari", re.compile(r"Version/(\d+).*Safari")),
)


def simplify_ua(raw: str | None) -> tuple[str, str]:
    """Return (browser major, OS) such as ("Chrome 141", "Windows 10/11")."""
    ua = (raw or "").strip()
    if not ua:
        return "Unknown", "Unknown"

    browser = "Other"
    for name, pattern in _BROWSER_PATTERNS:
        match = pattern.search(ua)
        if match:
            browser = f"{name} {match.group(1)}"
            break

    if "Windows NT 10.0" in ua:
        os_name = "Windows 10/11"
    elif "Windows NT 6.3" in ua:
        os_name = "Windows 8.1"
    elif "Windows NT 6.1" in ua:
        os_name = "Windows 7"
    elif (match := re.search(r"Android (\d+)", ua)) is not None:
        os_name = f"Android {match.group(1)}"
    elif (match := re.search(r"(?:iPhone|iPad).*?OS (\d+)[._]", ua)) is not None:
        os_name = f"iOS {match.group(1)}"
    elif (match := re.search(r"Mac OS X (\d+)[._](\d+)", ua)) is not None:
        major, minor = int(match.group(1)), int(match.group(2))
        os_name = f"macOS {major}" if major >= 11 else f"macOS 10.{minor}"
    elif "Linux" in ua:
        os_name = "Linux"
    else:
        os_name = "Other"
    return browser, os_name
