"""Server-side page fetch for the unified capture entry (P0-4).

`POST /api/v1/capture` accepts a bare URL: the server
fetches the page itself so the user never has to care whether a link or a
file is the input. Static pages (news, weixin mp articles — server-rendered
HTML) come back whole; JS-rendered SPAs will yield an empty body, which the
caller reports as "use the browser extension" instead of a raw stack error.

Design constraints:
- http/https only; enterprise intranet is the deployment target, so no proxy
  handling.
- Hard byte cap (reuses the document upload cap) enforced while streaming, so
  one giant response cannot fill memory before a Content-Length check.
- Bad input never raises: fetch errors come back as FetchError with a
  user-facing Chinese message; the endpoint turns them into a 422.
"""
from __future__ import annotations

from dataclasses import dataclass

import httpx

from app.core.config import get_settings

#: Desktop UA: some intranet/new portals serve mobile or empty shells to
#: unknown agents. Label matches the ones the capture extension sends.
_DESKTOP_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
)
FETCH_TIMEOUT = 20.0
_MAX_REDIRECTS = 5


class FetchError(RuntimeError):
    """User-facing fetch failure; `message` goes straight into a 422 detail."""


@dataclass(slots=True)
class FetchedPage:
    data: bytes
    content_type: str
    final_url: str
    filename: str | None


def _filename_from_url(url: str) -> str | None:
    tail = url.rstrip("/").rsplit("/", 1)[-1]
    return tail or None


def _check_size(response: httpx.Response, cap: int) -> None:
    declared = response.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > cap:
        raise FetchError(
            f"页面声明大小 {declared} 字节超过上限 {cap}，拒绝抓取"
        )


async def fetch_url(url: str) -> FetchedPage:
    """Fetch one page (or file) by URL. Raises FetchError on any failure."""
    url = url.strip()
    if not url.lower().startswith(("http://", "https://")):
        raise FetchError("仅支持 http/https 链接")
    cap = get_settings().doc_raw_upload_max_bytes
    try:
        async with httpx.AsyncClient(
            timeout=FETCH_TIMEOUT,
            follow_redirects=True,
            max_redirects=_MAX_REDIRECTS,
            headers={"User-Agent": _DESKTOP_UA, "Accept-Language": "zh-CN,zh;q=0.9"},
        ) as client:
            async with client.stream("GET", url) as response:
                _check_size(response, cap)
                chunks: list[bytes] = []
                received = 0
                async for chunk in response.aiter_bytes():
                    received += len(chunk)
                    if received > cap:
                        raise FetchError(
                            f"页面流式传输超过上限 {cap} 字节，拒绝抓取"
                        )
                    chunks.append(chunk)
                data = b"".join(chunks)
                content_type = (response.headers.get("content-type") or "").split(";")[0].strip().lower()
                final_url = str(response.url)
    except FetchError:
        raise
    except httpx.HTTPStatusError as exc:
        raise FetchError(f"目标站点返回 {exc.response.status_code}，无法抓取") from exc
    except httpx.HTTPError as exc:
        raise FetchError(f"抓取失败：{exc.__class__.__name__}") from exc
    if not data:
        raise FetchError("目标页面返回空内容（可能是 JS 渲染页），请用浏览器扩展采集")
    return FetchedPage(
        data=data,
        content_type=content_type or "application/octet-stream",
        final_url=final_url,
        filename=_filename_from_url(final_url),
    )
