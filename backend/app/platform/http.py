"""Shared httpx client construction (timeouts, redirects, optional headers)."""
from __future__ import annotations

from collections.abc import Mapping
from contextlib import asynccontextmanager
from typing import Any

import httpx

DEFAULT_BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
)


def async_http_client(
    *,
    timeout: float | httpx.Timeout = 15.0,
    follow_redirects: bool = True,
    max_redirects: int = 5,
    headers: Mapping[str, str] | None = None,
    **kwargs: Any,
) -> httpx.AsyncClient:
    return httpx.AsyncClient(
        timeout=timeout,
        follow_redirects=follow_redirects,
        max_redirects=max_redirects,
        headers=dict(headers) if headers is not None else None,
        **kwargs,
    )


def sync_http_client(
    *,
    timeout: float | httpx.Timeout = 15.0,
    follow_redirects: bool = True,
    max_redirects: int = 5,
    headers: Mapping[str, str] | None = None,
    **kwargs: Any,
) -> httpx.Client:
    return httpx.Client(
        timeout=timeout,
        follow_redirects=follow_redirects,
        max_redirects=max_redirects,
        headers=dict(headers) if headers is not None else None,
        **kwargs,
    )


@asynccontextmanager
async def open_async_http_client(**kwargs: Any):
    client = async_http_client(**kwargs)
    try:
        yield client
    finally:
        await client.aclose()
