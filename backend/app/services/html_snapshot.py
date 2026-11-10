"""HTML snapshot parsing (W2 / B3, backend/TODO.md:128).

`parse_html_snapshot` turns one captured page (typically a self-contained
SingleFile HTML, weixin mp articles included) into the quartet the ingest
pipeline needs: markdown body + title + publisher + published_at.

Design constraints:
- No network by default. When ``page_url`` is supplied, remaining remote
  article ``img`` sources may be fetched and inlined before figure lift
  (SingleFile archives that still reference the CDN).
- Bad input never raises; missing metadata defaults to None.
- SingleFile pages inline images as base64 <img>: they must not leak into
  the body markdown (that body feeds jieba tags downstream).
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from html import escape as html_escape
from urllib.parse import urljoin, urlparse

import base64

import io

from bs4 import BeautifulSoup
from markitdown import MarkItDown, StreamInfo

__all__ = [
    "HtmlSnapshot",
    "parse_html_snapshot",
    "prepare_archive_replay_html",
    "extract_title",
    "extract_publisher",
    "extract_published_at",
    "extract_body_md",
    "enrich_snapshot_figures",
]


@dataclass(slots=True)
class HtmlSnapshot:
    """Result of parsing one captured HTML page.

    title / publisher / published_at are None when absent in the source;
    body_md is "" when no readable body could be extracted (the caller
    turns that into a 422, TODO.md B3 evidence rule: no body, no retained).
    """

    title: str | None
    publisher: str | None
    published_at: datetime | None
    body_md: str
    # Inlined content images lifted out of the article before MarkItDown.
    # `caption` starts as the img alt; vision may replace it later.
    figures: list = field(default_factory=list)


_META_NAME_PUBTIME = re.compile(r"^pubtime$", re.IGNORECASE)
_TZ_ABBR_TAIL = re.compile(r"\s+(GMT|UTC|CST)([+-]\d{1,2}(:?\d{2})?)?\s*$", re.IGNORECASE)
_CN_DATE = re.compile(r"^(\d{4})年(\d{1,2})月(\d{1,2})日")
_SLASH_DATE = re.compile(r"^(\d{4})/(\d{1,2})/(\d{1,2})(.*)$")

# Fixed offset applied to timezone-naive values. eea_signal.published_at is
# timestamptz: an aware datetime pins the instant, so the stored value no
# longer drifts with the server's session timezone (a UTC deployment must
# not shift every weixin "2026-06-01 12:00" by 8 hours). Asia/Shanghai
# (+08:00) is the project's deployment locale.
_NAIVE_TZ = timezone(timedelta(hours=8))


def _soup(html: bytes | str) -> BeautifulSoup:
    # bs4's UnicodeDammit sniffs the declared charset (meta / BOM) and decodes
    # bytes for us; str passes straight through.
    return BeautifulSoup(html, "html.parser")


def _meta(soup: BeautifulSoup, key: str) -> str | None:
    for tag in soup.find_all("meta"):
        prop = (tag.get("property") or tag.get("name") or "").strip()
        if prop.lower() == key.lower():
            content = (tag.get("content") or "").strip()
            return content or None
    return None


def _text_of(tag) -> str | None:
    if tag is None:
        return None
    text = tag.get_text(" ", strip=True)
    return text or None


# ---------------------------------------------------------------- title
_TITLE_SEPARATOR = re.compile(r"\s+[\|｜\-–—]\s+")
# Portal <title> / og:title prefixes (no whitespace before hyphen).
_PORTAL_TITLE_PREFIX = re.compile(r"^(新闻详情|文章详情|详情页?)[\-–—]\s*")


def _clean_title(value: str) -> str:
    """Strip " - 站名 / | 站名" tails from a <title> value.

    The headline is normally the LONGEST segment ("某站 - 真实标题在这里" and
    "真实标题在这里 - 某站" both keep the headline; "48V - 12V 转换" keeps
    "12V 转换" because "48V - " was a prefix separator, not a tail). Picking
    the first segment instead would cut "某站 - 真实标题" down to "某站".
    Separators need whitespace on both sides so "48V-12V" stays intact.
    """
    value = _PORTAL_TITLE_PREFIX.sub("", value.strip())
    segments = [seg.strip() for seg in _TITLE_SEPARATOR.split(value) if seg.strip()]
    if not segments:
        return value
    return max(segments, key=len) if len(segments) > 1 else segments[0]


def extract_title(soup: BeautifulSoup) -> str | None:
    """og:title -> <title> (cleaned) -> first non-empty <h1>, first hit wins.

    og:title wins over <title>: weixin mp pages and news portals usually put
    the clean headline in og:title while <title> carries site decoration
    ("某站 - 真实标题在这里"), so preferring the metadata field avoids
    depending on separator cleanup guessing which segment is the headline.
    """
    value = _meta(soup, "og:title")
    if value:
        return _clean_title(value)
    value = _text_of(soup.title)
    if value:
        return _clean_title(value)
    return _text_of(soup.find("h1"))


# ------------------------------------------------------------ publisher
def extract_publisher(soup: BeautifulSoup) -> str | None:
    """og:site_name -> #js_name (weixin mp) -> meta author, first hit wins."""
    for value in (
        _meta(soup, "og:site_name"),
        _text_of(soup.find(id="js_name")),
        _meta(soup, "author"),
    ):
        if value:
            return value
    return None


# ---------------------------------------------------------- published_at
def _as_aware(dt: datetime) -> datetime:
    """Naive -> +08:00; aware values pass through unchanged."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=_NAIVE_TZ)
    return dt


def _parse_rfc1123(normalized: str) -> datetime | None:
    """RFC-1123 / RFC-822 date strings ("Mon, 01 Jun 2026 12:00:00 GMT").

    email.utils.parsedate_to_datetime handles the whole family, including the
    "+0800" numeric-offset forms; it returns an aware datetime (naive only for
    the legacy "-0000" marker, which _as_aware pins). Guarded by the cheap
    prefix check so ordinary ISO strings skip this branch.
    """
    if not re.match(r"^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),", normalized, re.IGNORECASE):
        return None
    try:
        dt = parsedate_to_datetime(normalized)
    except (TypeError, ValueError):
        return None
    if dt is None:  # pragma: no cover - parsedate_to_datetime raises instead
        return None
    return _as_aware(dt)


def _parse_datetime(raw: str) -> datetime | None:
    raw = raw.strip()
    if not raw:
        return None
    # Formats seen in the wild / weixin mp floors: "2026-06-01 12:00",
    # "2026-06-01T12:00:00+08:00", "2026-06-01T12:00:00Z", "2026-06-01",
    # RFC-1123 ("Mon, 01 Jun 2026 12:00:00 GMT"), CN calendar dates
    # ("2026年06月01日 12:00") and slash dates ("2026/06/01 12:00").
    # Timezone-naive values are pinned to +08:00 (see _NAIVE_TZ) so the
    # timestamptz column receives a fixed instant instead of the session
    # timezone's interpretation.
    # RFC-1123 first, on the raw string: its zone token IS the offset
    # ("GMT" means UTC), so the abbreviation-tail stripping below must not
    # eat it before the RFC-1123 parser gets a look.
    parsed = _parse_rfc1123(raw)
    if parsed is not None:
        return parsed
    # Only the ISO separator T (digit-T-digit) becomes a space: a blanket
    # str.replace would mangle the GMT/UTC/CST zone tokens ("GMT" -> "GM T"),
    # which is why the old abbreviation-tail handling never actually fired.
    normalized = re.sub(r"(?<=\d)T(?=\d)", " ", raw).strip()
    normalized = _TZ_ABBR_TAIL.sub("", normalized).strip()
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"
    # "2026年06月01日 12:00" -> "2026-06-01 12:00"
    cn = _CN_DATE.match(normalized)
    if cn:
        normalized = _CN_DATE.sub(
            lambda m: f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}", normalized
        )
    # "2026/06/01 12:00" -> "2026-06-01 12:00"
    normalized = _SLASH_DATE.sub(
        lambda m: f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}{m.group(4)}", normalized
    )
    normalized = normalized.replace(" ", "T", 1) if " " in normalized else normalized
    # Date-only -> midnight (naive, pinned to +08:00 by _as_aware).
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", normalized):
        normalized += "T00:00:00"
    try:
        return _as_aware(datetime.fromisoformat(normalized))
    except ValueError:
        return None


def extract_published_at(soup: BeautifulSoup) -> datetime | None:
    """og:article:published_time -> pubtime meta -> #publish_time -> <time>.

    Each candidate is tried until one parses; all failures -> None.
    """
    candidates: list[str | None] = [
        _meta(soup, "og:article:published_time"),
        _meta(soup, "article:published_time"),
    ]
    for tag in soup.find_all("meta"):
        name = (tag.get("name") or "").strip()
        if _META_NAME_PUBTIME.match(name):
            candidates.append((tag.get("content") or "").strip() or None)
    publish_time = soup.find(id="publish_time")
    if publish_time is not None:
        candidates.append(publish_time.get_text(strip=True) or None)
    time_tag = soup.find("time")
    if time_tag is not None:
        candidates.append(time_tag.get("datetime") or time_tag.get_text(strip=True) or None)
    for raw in candidates:
        if not raw:
            continue
        parsed = _parse_datetime(raw)
        if parsed is not None:
            return parsed
    return None


# ----------------------------------------------------------------- body
_STRIP_TAGS = ("script", "style", "noscript", "svg", "iframe", "template")
# Prefer article-like regions before portal chrome (<main> often wraps comments).
_BODY_SELECTORS = ("#js_content", ".article_body", ".fr-view", "article", "main", "body")
_MIN_CONTAINER_TEXT = 80
# Trim OA / portal widgets that MarkItDown would otherwise keep as plain text.
_BODY_NOISE_MARKERS = (
    "\n展开访问统计",
    "\nTo pick up a draggable item",
    "\n0/1000\n",
    "\n\n按最新\n",
    "\n\n评论",
    "\n\n发布\n",
)
# Drop portal comment / operation blocks before conversion when using a wide container.
_CHROME_SELECTORS = (
    "[class*='comment']",
    "[class*='Comment']",
    "[id*='comment']",
    "[class*='reply']",
    "[class*='Reply']",
    "[class*='operation']",
    "[class*='Operation']",
    "[class*='access-stat']",
    "[class*='AccessStat']",
)
# Skip spacers, tracking pixels, and icons. Article photos are far larger.
_MIN_FIGURE_BYTES = 1500
_DATA_IMAGE = re.compile(r"^data:(image/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$", re.I)
_FIGURE_TOKEN = re.compile(r"EEAFIG(\d+)")


def _decode_data_image(src: str) -> tuple[str, bytes] | None:
    match = _DATA_IMAGE.match(src.strip())
    if not match:
        return None
    import base64

    try:
        data = base64.b64decode(match.group(2), validate=False)
    except Exception:  # noqa: BLE001
        return None
    if len(data) < _MIN_FIGURE_BYTES:
        return None
    return match.group(1).lower(), data


def _inline_remote_images(container, page_url: str | None) -> None:
    """Promote remote article images to data: URIs when the archive still hotlinks the CDN."""
    if not page_url or container is None:
        return
    try:
        import httpx
    except ImportError:  # pragma: no cover
        return
    referer = page_url
    headers = {
        "User-Agent": "EEA-evidence/1.0",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer": referer,
    }
    for img in list(container.find_all("img")):
        src = (img.get("src") or img.get("data-src") or "").strip()
        if not src or src.startswith("data:"):
            continue
        resolved = src if src.startswith(("http://", "https://")) else urljoin(page_url, src)
        try:
            with httpx.Client(timeout=20.0, follow_redirects=True) as client:
                response = client.get(resolved, headers=headers)
        except httpx.HTTPError:
            continue
        if response.status_code >= 400:
            continue
        blob = response.content
        if len(blob) < _MIN_FIGURE_BYTES or len(blob) > 4 * 1024 * 1024:
            continue
        mime = (response.headers.get("content-type") or "image/png").split(";")[0].strip().lower()
        if not mime.startswith("image/"):
            mime = "image/png"
        encoded = base64.b64encode(blob).decode("ascii")
        img["src"] = f"data:{mime};base64,{encoded}"
        for attr in ("data-src", "data-original", "data-lazy-src"):
            if img.has_attr(attr):
                del img[attr]


def _lift_content_images(container) -> list:
    """Replace inlined article images with a token MarkItDown will keep.

    The base64 payload never enters the markdown. Tiny images are dropped.
    """
    from app.services.doc_ingest import Figure

    figures: list[Figure] = []
    for img in list(container.find_all("img")):
        decoded = _decode_data_image(img.get("src") or "")
        if decoded is None:
            img.decompose()
            continue
        mime, data = decoded
        index = len(figures) + 1
        alt = (img.get("alt") or "").strip()
        figures.append(
            Figure(index=index, source=f"html-img-{index}", mime=mime, data=data, caption=alt)
        )
        token = container.new_tag("p")
        token.string = f"EEAFIG{index}"
        img.replace_with(token)
    return figures


def _quotes_for_figures(markdown: str, figures: list) -> str:
    """Turn EEAFIG tokens into blockquotes. Alt text fills in until vision runs."""

    def replace(match: re.Match[str]) -> str:
        index = int(match.group(1))
        figure = next((item for item in figures if item.index == index), None)
        if figure is None:
            return ""
        text = figure.caption or "（待视觉描述）"
        return f"\n\n> 图 {index}：{text}\n\n"

    return _FIGURE_TOKEN.sub(replace, markdown).strip()


def extract_body_md(soup: BeautifulSoup) -> str:
    """Markdown of the main content region, surrounding whitespace stripped.

    Container order: #js_content (weixin mp) -> .fr-view (OA/Froala) ->
    <article> -> <main> (with inner .fr-view preferred) -> <body>.
    Content images are lifted first (see HtmlSnapshot.figures); leftover
    noise tags are removed so SingleFile base64 payloads never reach the body.
    """
    body_md, _figures = _extract_body(soup)
    return body_md


def _container_text_len(tag) -> int:
    if tag is None:
        return 0
    return len(tag.get_text(" ", strip=True))


def _pick_body_container(soup: BeautifulSoup):
    js_content = soup.select_one("#js_content")
    if js_content is not None:
        return js_content

    article_shell = soup.select_one(".art-con.article_body, .article_body")
    if article_shell is not None:
        container = article_shell.select_one(".article_text") or article_shell
        if _container_text_len(container) >= _MIN_CONTAINER_TEXT or container.select("img"):
            return container

    fr_view = soup.select_one(".fr-view")
    if fr_view is not None and _container_text_len(fr_view) >= _MIN_CONTAINER_TEXT:
        return fr_view

    article = soup.select_one("article")
    if article is not None:
        return article

    main = soup.select_one("main")
    if main is not None:
        inner = main.select_one(".fr-view")
        if inner is not None and _container_text_len(inner) >= _MIN_CONTAINER_TEXT:
            return inner
        return main

    if soup.body is not None:
        return soup.body
    return soup


def _prune_portal_chrome(container) -> None:
    for selector in _CHROME_SELECTORS:
        for tag in list(container.select(selector)):
            tag.decompose()


def _normalize_body_markdown(markdown: str) -> str:
    text = markdown.replace("\\_", "_").strip()
    for marker in _BODY_NOISE_MARKERS:
        idx = text.find(marker)
        if idx != -1:
            text = text[:idx].rstrip()
    blocks = [block.strip() for block in re.split(r"\n{2,}", text) if block.strip()]
    if len(blocks) >= 2:
        def _plain(value: str) -> str:
            return re.sub(r"[*_>#`\s]", "", value)

        if _plain(blocks[0]) and _plain(blocks[0]) in _plain(blocks[1]):
            blocks.pop(0)
        elif _plain(blocks[1]) and _plain(blocks[1]) in _plain(blocks[0]):
            blocks.pop(1)
    return "\n\n".join(blocks)


def _prepend_title_heading(markdown: str, title: str | None) -> str:
    if not title or not markdown:
        return markdown
    heading = _clean_title(title.strip())
    # A title can carry markup-looking text verbatim (an escaped `</title>`
    # leaves `<script>…</script>` as literal RCDATA). Copying that into
    # body_md would hand raw HTML to Markdown renderers downstream — strip
    # script/style blocks with their contents, then any remaining tags; the
    # title field keeps the original text.
    heading = re.sub(
        r"<(script|style)\b[^>]*>.*?</\1>", "", heading, flags=re.IGNORECASE | re.DOTALL
    )
    heading = re.sub(r"<[^>]*>", "", heading).strip()
    if not heading:
        return markdown
    head = re.sub(r"^#+\s*", "", markdown.lstrip())[:120]
    if heading[: min(len(heading), 24)] in head:
        return markdown
    return f"# {heading}\n\n{markdown}"


def _extract_body(
    soup: BeautifulSoup, *, title: str | None = None, page_url: str | None = None
) -> tuple[str, list]:
    container = _pick_body_container(soup)
    _prune_portal_chrome(container)
    _inline_remote_images(container, page_url)

    figures = _lift_content_images(container)
    for tag_name in _STRIP_TAGS:
        for tag in soup.find_all(tag_name):
            tag.decompose()

    fragment = str(container).encode("utf-8")
    stream = io.BytesIO(fragment)
    result = MarkItDown().convert_stream(
        stream,
        stream_info=StreamInfo(mimetype="text/html", extension=".html"),
    )
    markdown = _quotes_for_figures((result.text_content or "").strip(), figures)
    markdown = _normalize_body_markdown(markdown)
    markdown = _prepend_title_heading(markdown, title)
    return markdown, figures


# --------------------------------------------------------------- facade
def parse_html_snapshot(html: bytes | str, *, page_url: str | None = None) -> HtmlSnapshot:
    """Parse one captured HTML page. Never raises; metadata may be None.

    Accepts the raw bytes read from an upload (charset auto-sniffed via
    bs4/UnicodeDammit) or a decoded str; both give identical results.
    """
    try:
        soup = _soup(html)
    except Exception:  # noqa: BLE001 - bad input must not crash ingest
        return HtmlSnapshot(title=None, publisher=None, published_at=None, body_md="")

    try:
        title = extract_title(soup)
    except Exception:  # noqa: BLE001
        title = None
    try:
        publisher = extract_publisher(soup)
    except Exception:  # noqa: BLE001
        publisher = None
    try:
        published_at = extract_published_at(soup)
    except Exception:  # noqa: BLE001
        published_at = None
    try:
        body_md, figures = _extract_body(soup, title=title, page_url=page_url)
    except Exception:  # noqa: BLE001
        body_md, figures = "", []

    return HtmlSnapshot(
        title=title,
        publisher=publisher,
        published_at=published_at,
        body_md=body_md,
        figures=figures,
    )


async def _caption_snapshot_figures(figures: list) -> None:
    from app.core.config import get_settings
    from app.services.doc_ingest import caption_figure
    from app.services.llm_gateway import resolve_vision_model

    settings = get_settings()
    try:
        model = await resolve_vision_model()
    except Exception:  # noqa: BLE001
        return
    for figure in figures:
        alt = figure.caption
        described = await caption_figure(
            figure, model=model, retries=settings.vision_caption_retry
        )
        figure.caption = described or alt


async def enrich_snapshot_figures(
    snapshot: HtmlSnapshot,
    *,
    vision_captions: bool = True,
) -> HtmlSnapshot:
    """Replace alt-text figure quotes with a one-line vision description.

    Best-effort: if the gateway has no vision model, the alt-text quote stays.
    Base64 payloads are never written into body_md.
    """
    if not snapshot.figures:
        return snapshot
    import asyncio

    from app.core.config import get_settings

    settings = get_settings()
    figures = snapshot.figures[: settings.max_figures]
    if vision_captions:
        try:
            await asyncio.wait_for(
                _caption_snapshot_figures(figures),
                timeout=settings.doc_ingest_vision_timeout_seconds,
            )
        except (asyncio.TimeoutError, Exception):  # noqa: BLE001
            pass
    snapshot.body_md = _quotes_for_figures(snapshot.body_md, figures)
    # Tokens are already quotes; a second pass only updates lines we still
    # have as blockquotes. Rewrite those lines from the (possibly new) caption.
    for figure in figures:
        text = figure.caption or "（视觉模型未返回描述）"
        snapshot.body_md = re.sub(
            rf"> 图 {figure.index}：[^\n]*",
            f"> 图 {figure.index}：{text}",
            snapshot.body_md,
            count=1,
        )
    snapshot.figures = []
    return snapshot


def figure_data_urls(figures: list) -> list[dict[str, int | str]]:
    """Serialize lifted figures for GET /signals/{id}/figures (no vision re-run)."""
    import base64

    from app.services.doc_ingest import Figure

    items: list[dict[str, int | str]] = []
    for figure in figures:
        if not isinstance(figure, Figure) or not figure.data:
            continue
        encoded = base64.b64encode(figure.data).decode("ascii")
        items.append(
            {
                "index": figure.index,
                "mime": figure.mime,
                "src": f"data:{figure.mime};base64,{encoded}",
            }
        )
    return items


def _document_base_url(page_url: str) -> str | None:
    """Directory URL for resolving relative assets in a captured page."""
    parsed = urlparse(page_url.strip())
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return None
    path = parsed.path or "/"
    if not path.endswith("/"):
        if "/" in path.lstrip("/"):
            path = path.rsplit("/", 1)[0] + "/"
        else:
            path = "/"
    return f"{parsed.scheme}://{parsed.netloc}{path}"


_SCRIPT_BLOCK = re.compile(r"<script\b[^>]*>.*?</script>", re.I | re.S)
_SCRIPT_EMPTY = re.compile(r"<script\b[^>]*/\s*>", re.I)
_META_REFRESH = re.compile(
    r"<meta\b[^>]*http-equiv\s*=\s*[\"']?\s*refresh\s*[\"']?[^>]*>",
    re.I,
)


def _strip_replay_scripts(text: str) -> str:
    """Drop scripts and meta-refresh so a captured page cannot replace itself with an error shell."""
    text = _SCRIPT_BLOCK.sub("", text)
    text = _SCRIPT_EMPTY.sub("", text)
    return _META_REFRESH.sub("", text)


def prepare_archive_replay_html(html: bytes, *, page_url: str | None) -> bytes:
    """Replay HTML for the evidence iframe.

    Strips scripts (captured CMS pages often paint, then swap in a reload error)
    and injects ``<base href>`` so stylesheets and images resolve on the original site.
    """
    text = _strip_replay_scripts(html.decode("utf-8", errors="replace"))
    base = _document_base_url(page_url) if page_url else None
    if not base:
        return text.encode("utf-8")

    tag = f'<base href="{html_escape(base, quote=True)}">'
    if re.search(r"<base\s", text, re.I):
        text = re.sub(r"<base\b[^>]*>", tag, text, count=1, flags=re.I)
    elif re.search(r"<head\b", text, re.I):
        text = re.sub(r"(<head\b[^>]*>)", rf"\1\n{tag}", text, count=1, flags=re.I)
    elif re.search(r"<html\b", text, re.I):
        text = re.sub(r"(<html\b[^>]*>)", rf"\1\n<head>{tag}</head>", text, count=1, flags=re.I)
    else:
        text = f"<!DOCTYPE html><html><head>{tag}</head>{text}"
    return text.encode("utf-8")
