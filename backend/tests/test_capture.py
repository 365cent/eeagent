"""Web-page capture ingestion: multipart /signals/capture, channel inference,
server-side HTML parsing and SingleFile archive replay (REQ-SIG-01/02/10,
TODO.md B3/B4/B6 — no network access, the archive HTML is inline)."""

import pytest

from tests.support import (
    SUPPLY_CHAIN_BODY,
    assign_signal_theme,
    create_signal,
    create_theme,
    set_signal_tags,
)

pytestmark = pytest.mark.anyio

# Inline SingleFile-style fixture page: og metadata + weixin-mp layout
# (#js_name / #publish_time / #js_content), inlined base64 image, script/style
# noise inside the container and a footer outside it (must stay out of the body).
ARCHIVE_HTML = """<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta property="og:title" content="48V低压供电网络研究">
<meta property="og:site_name" content="与非网">
<meta property="og:article:published_time" content="2026-06-01T08:30:00+08:00">
<title>48V低压供电网络研究</title>
<style>.x { color: red }</style>
<script>var noise = 1;</script>
</head>
<body>
<div id="js_name">与非网</div>
<div id="publish_time">2026-06-01 08:30</div>
<div id="js_content">
<p>48V供应链活跃，多家功率半导体厂商布局eFuse、SSCB等智能配电器件，将优先落地线控底盘等高功率场景。</p>
<p>智能配电与区域控制是低压系统的核心，智能配电架构在区域控制器上实现，智能配电、区域控制、eFuse 器件被广泛讨论。</p>
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==">
</div>
<div class="footer">京ICP备00000000号 干扰文本</div>
</body>
</html>
"""

CAPTURE_URL = "https://mp.weixin.qq.com/s/efuse-48v-era"


async def _capture(client, url=CAPTURE_URL, html: bytes | None = None, channel_code=None):
    """POST the capture multipart form (the interface under test)."""
    files = {"archive_html": ("page.html", html if html is not None else ARCHIVE_HTML.encode("utf-8"), "text/html")}
    data = {"url": url}
    if channel_code is not None:
        data["channel_code"] = channel_code
    return await client.post("/api/v1/signals/capture", data=data, files=files)


async def _count_signals(client) -> int:
    return len((await client.get("/api/v1/signals")).json())


async def _capture_ok(client, **kw) -> dict:
    r = await _capture(client, **kw)
    assert r.status_code == 201, r.text
    return r.json()


async def test_capture_creates_signal_with_parsed_metadata(client):
    """B3: one multipart capture stores the HTML, parses body/metadata
    server-side and lands the signal 已留存 (retained default, no sixth status)."""
    sig = await _capture_ok(client)
    assert sig["title"] == "48V低压供电网络研究"
    assert sig["published_at"] == "2026-06-01T08:30:00+08:00"
    assert sig["publisher"] == "与非网"
    assert sig["evidence_status_code"] == "retained"
    assert sig["channel_code"] == "wechat_mp"
    assert sig["body_object_key"] is not None
    assert sig["captured_at"] is not None
    # tags: the parsed body feeds the machine pre-tagger (REQ-TAG-05)
    assert len(sig["tags"]) >= 1
    haystack = sig["title"] + ARCHIVE_HTML
    assert all(tag in haystack for tag in sig["tags"])


async def test_capture_keys_are_content_addressed(client):
    sig = await _capture_ok(client)
    assert sig["snapshot_html_object_key"].startswith("signals/")
    assert sig["snapshot_html_object_key"].endswith(".html")
    assert sig["body_object_key"].startswith("signals/")


async def test_capture_body_and_archive_round_trip(client):
    """B4: the parsed body serves as text/plain; the archive replays the
    uploaded HTML byte-for-byte as text/html."""
    sig = await _capture_ok(client)
    r = await client.get(f"/api/v1/signals/{sig['id']}/body")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/plain")
    assert "eFuse" in r.text  # body 非空，来自服务端解析
    assert "供应链" in r.text
    # Negative assertions: the fixture's traps must stay OUT of the body —
    # head script/style noise, the inlined base64 image, and the footer
    # outside #js_content (fixture design: 干扰文本/京ICP备 never leak in;
    # without these a whole-page-scrape regression would still pass above).
    assert "var noise" not in r.text
    assert "干扰文本" not in r.text
    assert "京ICP备" not in r.text
    assert "color: red" not in r.text  # <style> rule body
    assert "iVBOR" not in r.text  # base64 img payload

    r = await client.get(f"/api/v1/signals/{sig['id']}/archive")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/html")
    assert "48V低压供电网络研究".encode() in r.content
    assert b'<base href="https://mp.weixin.qq.com/s/"' in r.content


async def test_capture_figures_endpoint_lists_inlined_images(client):
    import base64

    payload = base64.b64encode(b"\x89PNG\r\n" + b"x" * 2000).decode("ascii")
    html = (
        "<!doctype html><html><body><article><p>正文段落</p>"
        f'<img alt="公示名单截图" src="data:image/png;base64,{payload}">'
        "</article></body></html>"
    ).encode("utf-8")
    sig = await _capture_ok(client, html=html)
    r = await client.get(f"/api/v1/signals/{sig['id']}/figures")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert items[0]["index"] == 1
    assert items[0]["mime"] == "image/png"
    assert items[0]["src"].startswith("data:image/png;base64,")


async def test_capture_archive_404_without_html_key(client):
    """A JSON-path signal has no html snapshot: archive 404s like /body."""
    sig = await create_signal(client, body_text=SUPPLY_CHAIN_BODY)
    r = await client.get(f"/api/v1/signals/{sig['id']}/archive")
    assert r.status_code == 404


async def test_capture_reuses_ingest_pipeline(client):
    """B3 step 3: the capture path shares the JSON path's post-creation
    logic — stage auto-judged (REQ-TAG-04), tags generated (REQ-TAG-05),
    auto-aggregated into a matching theme (REQ-SIG-08)."""
    sig = await _capture_ok(client)
    assert sig["value_chain_stage_code"] == "creation_supply"

    # a pre-built theme whose display tags match the capture's machine tags
    seed = await create_signal(client, body_text=SUPPLY_CHAIN_BODY)
    theme = await create_theme(client, working_name="低压系统智能化")
    await set_signal_tags(client, seed["id"], ["智能配电", "区域控制", "eFuse"])
    await assign_signal_theme(client, seed["id"], theme["id"])

    second = await _capture_ok(client, url="https://mp.weixin.qq.com/s/second")
    assert second["tech_theme_id"] == theme["id"]
    assert second["theme"]["working_name"] == "低压系统智能化"


async def test_capture_channel_inference(client):
    """channel_code optional: inferred from the URL host, validated when
    explicit — closed vocabulary either way (CONV-CLOSED-VOCAB)."""
    wechat = await _capture_ok(client)  # mp.weixin.qq.com, no channel part
    assert wechat["channel_code"] == "wechat_mp"

    web = await _capture_ok(client, url="https://example.com/industry/48v")
    assert web["channel_code"] == "web"

    labeled = await _capture_ok(client, url="https://example.com/labeled", channel_code="微信公众号")
    assert labeled["channel_code"] == "wechat_mp"

    before = await _count_signals(client)
    r = await _capture(client, channel_code="carrier-pigeon")
    assert r.status_code == 422
    assert "channel" in r.text
    assert await _count_signals(client) == before


async def test_capture_rejects_empty_or_bodyless_html_without_creating_rows(client):
    before = await _count_signals(client)
    r = await _capture(client, html=b"")
    assert r.status_code == 422
    r = await _capture(client, html=b"<html><body><script>var x=1;</script></body></html>")
    assert r.status_code == 422
    assert await _count_signals(client) == before


async def test_json_and_capture_paths_coexist(client):
    """B5: the paste fallback (REQ-SIG-11) and the capture path both create
    signals — no path replaces the other."""
    pasted = await create_signal(client, body_text=SUPPLY_CHAIN_BODY)
    captured = await _capture_ok(client, url="https://example.com/second")
    assert pasted["evidence_status_code"] == "retained"
    assert captured["evidence_status_code"] == "retained"
    ids = {s["id"] for s in (await client.get("/api/v1/signals")).json()}
    assert {pasted["id"], captured["id"]} <= ids
