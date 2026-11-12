from __future__ import annotations

from urllib.parse import urlparse


def _infer_channel_code(url: str) -> str:
    """Capture default channel (TODO.md B3): the weixin mp host maps to
    wechat_mp, every other origin to web — the two closed-vocab channels."""
    return "wechat_mp" if urlparse(url).netloc.lower() == "mp.weixin.qq.com" else "web"
