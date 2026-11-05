"""Extension-side upload contract: the self-contained HTML the MV3 client wraps
for the browser, ingested through POST /signals/capture (offline, inline fixtures).

Why this file exists next to test_capture.py: that file feeds the server a
SingleFile-shaped page. The extension instead wraps a ``#js_content`` fragment
(content.js snapshots the container with ``cloneNode(true).outerHTML``) into a
synthesized document whose head carries the ``og:*`` triple and whose body
carries ``#js_name`` / ``<em id="publish_time">`` (lib/eea-upload.js). Those
bytes — produced by loading the real lib in node on 2026-10-30, and pinned
shape-wise by reader-collection/scripts/validate.mjs — are what this test
uploads, so the two sides cannot drift apart unnoticed.

No network access anywhere: the archive HTML is inline, and the 422 assertions
read the exact detail strings lib/eea-upload.js classifies into terminal reasons.
"""

import pytest

pytestmark = pytest.mark.anyio

# lib/eea-upload.js recordToSelfContainedHtml() output for a weixin fragment.
WRAPPED_FRAGMENT = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>48V低压供电网络研究</title>
<meta property="og:title" content="48V低压供电网络研究">
<meta property="og:site_name" content="域车电子">
<meta property="og:article:published_time" content="2026-09-02 20:22">
</head>
<body>
<div id="js_name">域车电子</div>
<em id="publish_time">2026-09-02 20:22</em>
<div id="js_content"><p>48V供应链活跃，多家功率半导体厂商布局eFuse、SSCB等智能配电器件。</p><p>智能配电与区域控制在区域控制器上实现，eFuse 器件被广泛讨论。</p></div>
</body>
</html>
"""

FRAGMENT_URL = "https://mp.weixin.qq.com/s/extension-contract-demo"

# Same wrapper for a title/author that would break out of their elements if the
# client ever stopped escaping the head it synthesizes.
WRAPPED_ESCAPED = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>A &amp; B &quot;演示&quot; &lt;/title&gt;&lt;script&gt;var noise=1;&lt;/script&gt;</title>
<meta property="og:title" content="A &amp; B &quot;演示&quot; &lt;/title&gt;&lt;script&gt;var noise=1;&lt;/script&gt;">
<meta property="og:site_name" content="&lt;b&gt;加粗站点&lt;/b&gt;">
<meta property="og:article:published_time" content="2026-06-01T08:30:00+08:00">
</head>
<body>
<div id="js_name">&lt;b&gt;加粗站点&lt;/b&gt;</div>
<em id="publish_time">2026-06-01T08:30:00+08:00</em>
<div id="js_content"><p>正文保持完整，不被头部转义影响。</p></div>
</body>
</html>
"""

ESCAPED_URL = "https://example.com/extension-contract-escaping"


async def _capture(client, url: str, html: str, channel_code: str | None = None):
    data = {"url": url}
    if channel_code is not None:
        data["channel_code"] = channel_code
    files = {"archive_html": ("archive.html", html.encode("utf-8"), "text/html")}
    return await client.post("/api/v1/signals/capture", data=data, files=files)


async def _capture_ok(client, url: str, html: str) -> dict:
    r = await _capture(client, url, html)
    assert r.status_code == 201, r.text
    return r.json()


async def test_wrapped_fragment_lands_head_metadata(client):
    """The synthesized head is what carries title/publisher/published_at:
    a #js_content fragment on its own has none of them."""
    sig = await _capture_ok(client, FRAGMENT_URL, WRAPPED_FRAGMENT)
    assert sig["title"] == "48V低压供电网络研究"
    assert sig["publisher"] == "域车电子"
    # naive client-side time string is pinned to +08:00 by the server
    assert sig["published_at"] == "2026-09-02T20:22:00+08:00"
    assert sig["channel_code"] == "wechat_mp"  # inferred from the mp host
    assert sig["evidence_status_code"] == "retained"
    assert sig["snapshot_html_object_key"] is not None


async def test_wrapped_fragment_body_is_scoped_to_js_content(client):
    """Body extraction must stay inside #js_content: the wrapper's own
    js_name / publish_time nodes are chrome, not content."""
    sig = await _capture_ok(client, FRAGMENT_URL, WRAPPED_FRAGMENT)
    r = await client.get(f"/api/v1/signals/{sig['id']}/body")
    assert r.status_code == 200
    assert "eFuse" in r.text
    assert "智能配电" in r.text
    assert "域车电子" not in r.text  # #js_name stays out
    assert "2026-09-02" not in r.text  # #publish_time stays out


async def test_wrapped_fragment_replays_with_capture_base(client):
    """GET /archive injects <base href> from the capture URL so iframe subresources
    do not hit /api/v1/signals/{id}/…. Original HTML bytes remain in the body."""
    sig = await _capture_ok(client, FRAGMENT_URL, WRAPPED_FRAGMENT)
    r = await client.get(f"/api/v1/signals/{sig['id']}/archive")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/html")
    assert b"id=\"js_content\"" in r.content
    assert b"<base href=" in r.content


async def test_escaped_head_parses_back_to_the_original_text(client):
    """A title containing quotes / a closing </title> / a script tag must come
    back as literal text, and its payload must never reach the body."""
    sig = await _capture_ok(client, ESCAPED_URL, WRAPPED_ESCAPED)
    assert sig["title"] == 'A & B "演示" </title><script>var noise=1;</script>'
    assert sig["publisher"] == "<b>加粗站点</b>"
    assert sig["published_at"] == "2026-06-01T08:30:00+08:00"
    assert sig["channel_code"] == "web"  # non-mp host

    r = await client.get(f"/api/v1/signals/{sig['id']}/body")
    assert "正文保持完整" in r.text
    assert "var noise" not in r.text  # escaping kept the script inert
    assert "加粗站点" not in r.text


async def test_explicit_channel_from_the_client_is_accepted(client):
    """The client sends channel_code from lib/eea-upload.js mapChannelCode();
    both values it can produce are in the closed vocabulary."""
    wechat = await _capture(client, FRAGMENT_URL, WRAPPED_FRAGMENT, channel_code="wechat_mp")
    assert wechat.status_code == 201, wechat.text
    web = await _capture(client, ESCAPED_URL, WRAPPED_ESCAPED, channel_code="web")
    assert web.status_code == 201, web.text


async def test_422_detail_texts_the_client_classifies_on(client):
    """lib/eea-upload.js terminalReasonFrom422 keys on these exact substrings;
    rewording the endpoint without updating the client would silently turn
    'rejected' into a generic retryable failure."""
    empty = await _capture(client, FRAGMENT_URL, "")
    assert empty.status_code == 422
    assert "文件为空" in empty.json()["detail"]

    bodyless = await _capture(client, FRAGMENT_URL, "<html><body><script>var x=1;</script></body></html>")
    assert bodyless.status_code == 422
    assert "body_md 为空" in bodyless.json()["detail"]

    bad_channel = await _capture(client, FRAGMENT_URL, WRAPPED_FRAGMENT, channel_code="carrier_pigeon")
    assert bad_channel.status_code == 422
    detail = bad_channel.json()["detail"]
    assert "封闭词表" in detail and "channel" in detail


async def test_rejected_uploads_leave_no_rows(client):
    """All three 422 branches fire before save_bytes / row creation
    (signals.py:328-342), so a rejected client retry cannot pile up signals."""
    before = len((await client.get("/api/v1/signals")).json())
    await _capture(client, FRAGMENT_URL, "")
    await _capture(client, FRAGMENT_URL, "<html><body><p></p></body></html>")
    await _capture(client, FRAGMENT_URL, WRAPPED_FRAGMENT, channel_code="carrier_pigeon")
    assert len((await client.get("/api/v1/signals")).json()) == before
