"""W2 B3 解析层单测：`parse_html_snapshot` 纯函数（backend/TODO.md:128）。

不连数据库、不访问网络、不用 `client` fixture——fixture HTML 直接
内联在本文件里（TODO.md B6：不访问公网）。同步测试，pytest 直接收集。
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.services.html_snapshot import (
    HtmlSnapshot,
    parse_html_snapshot,
    prepare_archive_replay_html,
)

# Timezone-naive published times are pinned to the deployment locale
# (Asia/Shanghai, +08:00) so the timestamptz column stores a fixed instant.
TZ_CN = timezone(timedelta(hours=8))

# ---------------------------------------------------------------------------
# 内联 fixture：模拟微信公众号文章页（og 元数据 + #js_name + #publish_time
# + #js_content 两段正文 + base64 img + script/style 噪声 + 容器外 footer 干扰）
# ---------------------------------------------------------------------------
WEIXIN_MP_HTML = """<!DOCTYPE html>
<html lang="zh_CN">
<head>
<meta charset="utf-8"/>
<meta property="og:title" content="48V低压供电网络研究"/>
<meta property="og:site_name" content="与非网"/>
<meta property="og:article:published_time" content="2026-06-01 12:00"/>
<title>48V低压供电网络研究 - 与非网</title>
<style>.content { color: red; }</style>
<script>var a = 1; var color = "red";</script>
</head>
<body>
<div id="js_name">与非网</div>
<em id="publish_time">2026-06-01 12:00</em>
<div id="meta_content"></div>
<div id="js_content">
<h1>48V低压供电网络研究</h1>
<p>48V 低压供电网络采用 eFuse 与固态继电器实现配电保护。</p>
<p>供应链方面，国产化替代进程正在加速。</p>
<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="/>
<script>var b = 2; var base64 = "x";</script>
</div>
<footer>版权所有 与非网 footer-noise-应不出现</footer>
</body>
</html>"""

# og 元数据全缺的普通网页：<article> 回退 + pubtime meta + author 兜底
PLAIN_ARTICLE_HTML = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>独立文章标题</title>
<meta name="pubtime" content="2026-06-01"/>
<meta name="author" content="某研究院"/>
</head>
<body>
<nav>导航噪声 navigation-noise</nav>
<article>
<h1>独立文章标题</h1>
<p>纯日期发布时间的一篇文章，正文包含供电与域控制器字样。</p>
</article>
<footer>页脚噪声 footer-noise-plain</footer>
</body>
</html>"""

# 什么都没有：三项元数据 None，正文取 <body> 兜底
BARE_HTML = """<html><body><p>只有一段正文</p></body></html>"""

def _edn_article_body_html() -> str:
    import base64

    payload = base64.b64encode(b"\x89PNG\r\n" + b"x" * 2000).decode("ascii")
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"/><title>中央计算白皮书</title></head>
<body>
<nav>首页 资讯 navigation-noise</nav>
<div class="art-con article_body article_text">
<div class="article_text">
<p>中央计算架构与区域控制器是本文主线。</p>
<img src="data:image/png;base64,{payload}" alt="diagram"/>
</div>
</div>
<footer>footer-noise-edn</footer>
</body>
</html>"""

# 德赛 OA / Froala：正文在 .fr-view；<main> 还带评论与访问统计噪声
OA_FROALA_HTML = """<!DOCTYPE html>
<html>
<head>
<meta property="og:title" content="新闻详情-智造新进阶，向卓越而行"/>
<title>新闻详情-智造新进阶，向卓越而行</title>
</head>
<body>
<nav>导航噪声 navigation-noise</nav>
<main>
<h1>智造新进阶，向卓越而行</h1>
<p>曾雯静(IMD_M&amp;S(市场营销组))2026-10-29 17:21</p>
<div class="lui-froala-viewer">
<div class="fr-view">
<p>近日，工业与信息化部公示<strong>名单</strong>，公司成功入选。</p>
<p>近日，工业与信息化部公示<strong>名单</strong>，公司成功入选。后续段落。</p>
</div>
</div>
<div class="comment-panel">展开访问统计 评论19条评论 方小兰 今天 09:04</div>
</main>
<footer>页脚噪声 footer-noise-oa</footer>
</body>
</html>"""


def test_weixin_mp_full_extraction() -> None:
    snap = parse_html_snapshot(WEIXIN_MP_HTML)
    assert isinstance(snap, HtmlSnapshot)
    assert snap.title == "48V低压供电网络研究"
    assert snap.publisher == "与非网"
    assert snap.published_at == datetime(2026, 6, 1, 12, 0, tzinfo=TZ_CN)
    # 正文：非空、含两段关键词、噪声全排除
    assert snap.body_md != ""
    assert "eFuse" in snap.body_md
    assert "固态继电器" in snap.body_md
    assert "国产化替代" in snap.body_md
    assert "footer-noise" not in snap.body_md
    assert "var" not in snap.body_md
    assert "color" not in snap.body_md
    assert "base64" not in snap.body_md
    assert "iVBOR" not in snap.body_md
    assert "导航噪声" not in snap.body_md


def test_bytes_and_str_inputs_agree() -> None:
    from_str = parse_html_snapshot(WEIXIN_MP_HTML)
    from_bytes = parse_html_snapshot(WEIXIN_MP_HTML.encode("utf-8"))
    assert from_str == from_bytes


def test_inline_remote_images_when_page_url_set(monkeypatch) -> None:
    png = b"\x89PNG\r\n" + b"x" * 2000

    class _Response:
        status_code = 200
        content = png

        @property
        def headers(self):
            return {"content-type": "image/png"}

    class _Client:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def get(self, url, headers=None):
            assert url.startswith("https://")
            return _Response()

    monkeypatch.setattr("httpx.Client", _Client)
    html = """<!DOCTYPE html><html><body>
<div class="art-con article_body"><div class="article_text">
<p>蔚来 ET9 数字架构说明文字补充长度以满足解析容器阈值与图像提取流程测试需要。</p>
<img src="https://cdn.example/mbxy.png" alt="架构图一">
</div></div></body></html>"""
    snap = parse_html_snapshot(
        html,
        page_url="https://www.ednchina.com/technews/31623.html",
    )
    assert len(snap.figures) == 1
    assert "> 图 1：架构图一" in snap.body_md
    assert snap.figures[0].caption == "架构图一"


def test_edn_article_body_container_and_figures() -> None:
    snap = parse_html_snapshot(_edn_article_body_html())
    assert "中央计算架构" in snap.body_md
    assert "navigation-noise" not in snap.body_md
    assert "footer-noise-edn" not in snap.body_md
    assert len(snap.figures) == 1
    assert "diagram" in (snap.figures[0].caption or "")


def test_fallback_to_article_when_no_js_content() -> None:
    snap = parse_html_snapshot(PLAIN_ARTICLE_HTML)
    assert snap.title == "独立文章标题"
    assert snap.publisher == "某研究院"
    # 纯日期 -> datetime(2026, 6, 1) pinned to +08:00 (naive values are not
    # left to the DB session timezone's interpretation)
    assert snap.published_at == datetime(2026, 6, 1, tzinfo=TZ_CN)
    assert "域控制器" in snap.body_md
    assert "footer-noise" not in snap.body_md


def test_bare_html_metadata_none_body_fallback() -> None:
    snap = parse_html_snapshot(BARE_HTML)
    assert snap.title is None
    assert snap.publisher is None
    assert snap.published_at is None
    assert "只有一段正文" in snap.body_md


def test_oa_froala_prefers_fr_view_and_strips_comment_chrome() -> None:
    snap = parse_html_snapshot(OA_FROALA_HTML)
    assert snap.title == "智造新进阶，向卓越而行"
    assert "公司成功入选" in snap.body_md
    assert "footer-noise" not in snap.body_md
    assert "navigation-noise" not in snap.body_md
    assert "展开访问统计" not in snap.body_md
    assert "方小兰" not in snap.body_md
    assert snap.body_md.startswith("# ")


def test_empty_and_garbage_input_do_not_crash() -> None:
    for bad in ("", b"", "not html at all", b"\x00\xff\xfe garbage", "<html>"):
        snap = parse_html_snapshot(bad)
        assert isinstance(snap, HtmlSnapshot)
        assert isinstance(snap.body_md, str)


def test_empty_body_md_when_no_text_content() -> None:
    # 有 <body> 但容器里没有任何可读文本（script/style/img 被剥后为空）
    html = "<html><body><script>var x=1;</script><style>p{}</style><img src='data:image/png;base64,iVBOR'/></body></html>"
    snap = parse_html_snapshot(html)
    assert snap.body_md == ""


def test_iso8601_z_and_offset_and_space_separator() -> None:
    z = parse_html_snapshot(
        '<html><head><meta property="og:article:published_time" content="2026-06-01T05:00:00Z"/></head></html>'
    )
    # Z -> +00:00：offset-aware，比较用 aware 基准
    assert z.published_at is not None
    assert z.published_at == datetime(2026, 6, 1, 5, 0, tzinfo=timezone.utc)

    off = parse_html_snapshot(
        '<html><head><meta property="og:article:published_time" content="2026-06-01T12:00:00+08:00"/></head></html>'
    )
    assert off.published_at is not None
    assert off.published_at.utcoffset().total_seconds() == 8 * 3600

    space = parse_html_snapshot(
        '<html><head><meta property="og:article:published_time" content="2026-06-01 12:00"/></head></html>'
    )
    assert space.published_at == datetime(2026, 6, 1, 12, 0, tzinfo=TZ_CN)


def test_time_tag_datetime_attribute() -> None:
    snap = parse_html_snapshot(
        '<html><body><time datetime="2026-06-01T08:30">发布</time><p>正文</p></body></html>'
    )
    assert snap.published_at == datetime(2026, 6, 1, 8, 30, tzinfo=TZ_CN)


def test_unparseable_published_time_falls_back_to_none() -> None:
    snap = parse_html_snapshot(
        '<html><head><meta property="og:article:published_time" content="not-a-date"/></head>'
        "<body><p>正文</p></body></html>"
    )
    assert snap.published_at is None


def test_og_title_wins_over_decorated_title() -> None:
    """og:title 优先于 <title>：<title> 带站名装饰时不得抢走 og:title 的干净标题。"""
    snap = parse_html_snapshot(
        '<html><head><meta property="og:title" content="真实标题"/>'
        "<title>某站</title></head></html>"
    )
    assert snap.title == "真实标题"


def test_title_separator_keeps_headline_segment() -> None:
    """无 og:title 时按分隔符清洗 <title>，保留最长段（标题段），而非机械取首段。"""
    # 站名在前：标题在后 -> 取最长段
    snap = parse_html_snapshot("<html><head><title>某站 - 真实标题在这里</title></head></html>")
    assert snap.title == "真实标题在这里"
    # 标题在前：站名在后 -> 同样保留标题
    snap = parse_html_snapshot("<html><head><title>真实标题在这里 - 某站</title></head></html>")
    assert snap.title == "真实标题在这里"
    # 竖线分隔同样适用
    snap = parse_html_snapshot("<html><head><title>真实标题 | 某站</title></head></html>")
    assert snap.title == "真实标题"
    # 无空格连字符不视为分隔符（48V-12V 这类术语保持原样）
    snap = parse_html_snapshot("<html><head><title>48V-12V 转换器</title></head></html>")
    assert snap.title == "48V-12V 转换器"


def test_cn_calendar_and_slash_and_rfc1123_dates_parse() -> None:
    """非 ISO 形态（中文年月日 / 斜杠日期 / RFC-1123）均可解析，不再落 None。"""
    cases = {
        "2026年06月01日 12:00": datetime(2026, 6, 1, 12, 0, tzinfo=TZ_CN),
        "2026年6月1日 09:05": datetime(2026, 6, 1, 9, 5, tzinfo=TZ_CN),
        "2026/06/01 12:00": datetime(2026, 6, 1, 12, 0, tzinfo=TZ_CN),
        "Mon, 01 Jun 2026 12:00:00 GMT": datetime(2026, 6, 1, 12, 0, tzinfo=timezone.utc),
        "Mon, 01 Jun 2026 20:00:00 +0800": datetime(2026, 6, 1, 20, 0, tzinfo=TZ_CN),
    }
    for content, expected in cases.items():
        snap = parse_html_snapshot(
            f'<html><head><meta property="og:article:published_time" content="{content}"/>'
            "</head></html>"
        )
        assert snap.published_at == expected, content


def test_zone_abbreviation_tail_parses() -> None:
    """带 GMT/UTC/CST 尾缀的非 ISO 时间（weixin 风格）按北京时间解析，不再被
    `replace("T", " ")` 破坏（GMT/UTC/CST 都含字母 T，旧的整串替换会将其切碎）。"""
    for content in ("2026-06-01 12:00 GMT+8", "2026-06-01 12:00 GMT", "2026-06-01 12:00 UTC"):
        snap = parse_html_snapshot(
            f'<html><head><meta property="og:article:published_time" content="{content}"/>'
            "</head></html>"
        )
        assert snap.published_at == datetime(2026, 6, 1, 12, 0, tzinfo=TZ_CN), content


def test_prepare_archive_replay_html_injects_base_from_page_url() -> None:
    html = (
        b"<html><head></head><body>"
        b'<script>document.body.innerHTML="reload"</script>'
        b'<link href="sys-ui/ui/style.css">'
        b"</body></html>"
    )
    out = prepare_archive_replay_html(
        html,
        page_url="https://news.example.com/cms/article/12345.html",
    )
    assert b'<base href="https://news.example.com/cms/article/">' in out
    assert b"<script" not in out.lower()


def test_inlined_content_image_becomes_a_figure_quote_without_payload() -> None:
    import base64

    payload = base64.b64encode(b"\x89PNG\r\n" + b"x" * 2000).decode("ascii")
    html = (
        "<html><body><article><p>正文段落</p>"
        f'<img alt="公示名单截图" src="data:image/png;base64,{payload}">'
        "</article></body></html>"
    )
    snap = parse_html_snapshot(html)
    assert "> 图 1：公示名单截图" in snap.body_md
    assert "正文段落" in snap.body_md
    assert payload[:40] not in snap.body_md
    assert len(snap.figures) == 1
    assert snap.figures[0].caption == "公示名单截图"
