from __future__ import annotations

from urllib.parse import urlparse

from app.models.models import Signal


def signal_host(signal: Signal) -> str:
    """Stable lowercase key for grouping signals by site, publisher, or channel."""
    raw = (signal.url_normalized or signal.url or "").strip()
    if raw:
        try:
            href = raw if raw.startswith("http") else f"https://{raw}"
            return (urlparse(href).hostname or raw).lower()
        except ValueError:
            pass
    pub = (signal.publisher or "").strip()
    if pub:
        return pub.lower()
    return (signal.channel_code or str(signal.id)).lower()
