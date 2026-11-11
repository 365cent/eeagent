"""Shared list pagination query parameters."""
from __future__ import annotations

from dataclasses import dataclass

from fastapi import Query


@dataclass(frozen=True, slots=True)
class PageParams:
    limit: int
    offset: int


def page_params(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> PageParams:
    """Default list paging aligned with GET /signals (50 default, 1–200)."""
    return PageParams(limit=limit, offset=offset)
