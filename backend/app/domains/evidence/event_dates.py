"""Actual event date text and precision for signals (BE-02)."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

EventPrecision = Literal["year", "month", "day", "unknown"]


def event_date_from_published(published_at: datetime | None) -> tuple[str | None, EventPrecision]:
    if published_at is None:
        return None, "unknown"
    local = published_at
    if local.tzinfo is not None:
        from zoneinfo import ZoneInfo

        local = published_at.astimezone(ZoneInfo("Asia/Shanghai"))
    if local.hour or local.minute or local.second:
        precision: EventPrecision = "day"
        text = local.strftime("%Y-%m-%d")
    elif local.day != 1:
        precision = "day"
        text = local.strftime("%Y-%m-%d")
    elif local.month != 1:
        precision = "month"
        text = local.strftime("%Y-%m")
    else:
        precision = "year"
        text = local.strftime("%Y")
    return text, precision
