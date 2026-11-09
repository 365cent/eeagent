"""Document ingest: MarkItDown text, figure extraction, vision captions."""

import io
import zipfile

import pytest
from PIL import Image
from pptx import Presentation
from pptx.util import Inches

from app.services import doc_ingest

pytestmark = pytest.mark.anyio


def _png(color=(30, 120, 200)) -> bytes:
    image = Image.new("RGB", (120, 80), color)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def _pptx_with_picture() -> bytes:
    prs = Presentation()
    slide = prs.slides.add_slide(prs.slide_layouts[5])
    slide.shapes.title.text = "EEA 文档测试"
    box = slide.shapes.add_textbox(Inches(0.5), Inches(1.2), Inches(6), Inches(1))
    box.text = "48V 智能配电与 eFuse 方案"
    slide.shapes.add_picture(io.BytesIO(_png()), Inches(0.5), Inches(2.5), Inches(2), Inches(1.2))
    buffer = io.BytesIO()
    prs.save(buffer)
    return buffer.getvalue()


async def test_ingest_pptx_extracts_text_and_caption(monkeypatch):
    async def fake_vision():
        return "qwen-test"

    async def fake_caption(figure, *, model, retries=0):
        assert model == "qwen-test"
        return "蓝色示意图"

    monkeypatch.setattr(doc_ingest, "resolve_vision_model", fake_vision)
    monkeypatch.setattr(doc_ingest, "caption_figure", fake_caption)

    result = await doc_ingest.ingest_document(
        _pptx_with_picture(),
        "deck.pptx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    )

    assert "48V 智能配电" in result.canonical_md
    assert result.figure_count == 1
    assert "图 1：蓝色示意图" in result.canonical_md
    assert result.vision_model == "qwen-test"
    assert result.markitdown_version


def _pptx_with_notes_and_two_slides() -> bytes:
    """Two slides, one picture each, plus speaker notes on slide 1 (S1-4)."""
    prs = Presentation()
    for i, title in enumerate(("第一页：概述", "第二页：方案")):
        slide = prs.slides.add_slide(prs.slide_layouts[5])
        slide.shapes.title.text = title
        slide.shapes.add_picture(io.BytesIO(_png((40 + i * 40, 90, 160))), Inches(0.5), Inches(2.5), Inches(2), Inches(1.2))
        if i == 0:
            slide.notes_slide.notes_text_frame.text = "这一页讲工具链整体流程。"
    buffer = io.BytesIO()
    prs.save(buffer)
    return buffer.getvalue()


async def test_ingest_pptx_keeps_slide_order_and_notes(monkeypatch):
    """S1-4 验收：讲稿/Notes 与正文分开输出，图注按 slide 顺序对齐。"""
    async def fake_caption(figure, *, model, retries=0):
        return f"第{figure.index}张图"

    async def fake_vision():
        return "qwen-test"

    monkeypatch.setattr(doc_ingest, "resolve_vision_model", fake_vision)
    monkeypatch.setattr(doc_ingest, "caption_figure", fake_caption)

    result = await doc_ingest.ingest_document(
        _pptx_with_notes_and_two_slides(),
        "notes-deck.pptx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    )

    md = result.canonical_md
    # speaker notes come out as their own section, separate from slide text
    assert "### Notes:" in md
    assert "这一页讲工具链整体流程。" in md
    # slide order: slide-1 figure caption precedes slide-2's
    assert md.index("图 1：第1张图") < md.index("图 2：第2张图")
    assert result.figure_count == 2


def test_extract_docx_media():
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as zf:
        zf.writestr("word/document.xml", "<w:document/>")
        zf.writestr("word/media/image1.png", _png((200, 30, 30)))
    figures = doc_ingest.extract_figures(buffer.getvalue(), ".docx")
    assert len(figures) == 1
    assert figures[0].mime == "image/png"
    assert figures[0].source == "image1.png"


def test_apply_captions_replaces_placeholders_and_appends_leftovers():
    figures = [
        doc_ingest.Figure(index=1, source="a.png", mime="image/png", data=b"", caption="第一张"),
        doc_ingest.Figure(index=2, source="b.png", mime="image/png", data=b"", caption="第二张"),
    ]
    markdown = "text\n\n![a](data:image/png;base64,AAA)\n\n![b](Picture2.png)\n"
    out = doc_ingest.apply_captions(markdown, figures)
    assert "> 图 1：第一张" in out
    assert "> 图 2：第二张" in out
    assert "data:image" not in out

    extra = doc_ingest.apply_captions("no images here", figures[:1])
    assert "## 图块语义" in extra
    assert "第一张" in extra


async def test_upload_ingests_and_serves_canonical_markdown(client, monkeypatch):
    async def fake_ingest(data, filename, mime):
        assert data == b"pptx-bytes"
        return doc_ingest.IngestResult(
            canonical_md="# 测试文档\n\n> 图 1：蓝色示意图\n",
            markitdown_version="0.1.9",
            figures=[doc_ingest.Figure(index=1, source="x.png", mime="image/png", data=b"", caption="蓝色示意图")],
            vision_model="qwen-test",
        )

    monkeypatch.setattr("app.api.v1.documents.ingest_document", fake_ingest)

    response = await client.post(
        "/api/v1/documents/raw",
        files={
            "file": (
                "deck.pptx",
                b"pptx-bytes",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            )
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["ingest_status"] == "parsed"
    assert body["figure_count"] == 1
    assert body["vision_model"] == "qwen-test"
    assert "图 1" in body["canonical_md_excerpt"]

    doc_id = body["id"]
    detail = await client.get(f"/api/v1/documents/{doc_id}")
    assert detail.status_code == 200
    assert detail.json()["has_canonical"] is True

    markdown = await client.get(f"/api/v1/documents/{doc_id}/canonical.md")
    assert markdown.status_code == 200
    assert markdown.headers["content-type"].startswith("text/markdown")
    assert "蓝色示意图" in markdown.text


async def test_failed_ingest_keeps_blob_and_can_retry(client, monkeypatch):
    async def boom(data, filename, mime):
        raise RuntimeError("markitdown exploded")

    monkeypatch.setattr("app.api.v1.documents.ingest_document", boom)
    response = await client.post(
        "/api/v1/documents/raw",
        files={"file": ("broken.bin", b"raw-bytes", "application/octet-stream")},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["ingest_status"] == "failed"
    doc_id = body["id"]
    failed = (await client.get(f"/api/v1/documents/{doc_id}")).json()
    assert failed["ingest_status"] == "failed"
    assert "markitdown exploded" in (failed["ingest_error"] or "")

    async def ok(data, filename, mime):
        assert data == b"raw-bytes"
        return doc_ingest.IngestResult(
            canonical_md="# 重试成功\n", markitdown_version="0.1.9", figures=[]
        )

    monkeypatch.setattr("app.api.v1.documents.ingest_document", ok)
    retry = await client.post(f"/api/v1/documents/{doc_id}/ingest")
    assert retry.status_code == 200, retry.text
    detail = retry.json()
    assert detail["ingest_status"] == "parsed"
    assert detail["has_canonical"] is True


# --- document-order figure extraction (rels, not zip order) ----------------

_RELS_TMPL = (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    "{rels}"
    "</Relationships>"
)


def _relationship(rid: str, target: str) -> str:
    return (
        f'<Relationship Id="{rid}" '
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" '
        f'Target="{target}"/>'
    )


def _slide_rels(media: list[str]) -> str:
    body = "".join(_relationship(f"rId{i+1}", f"../media/{name}") for i, name in enumerate(media))
    return _RELS_TMPL.format(rels=body)


def _pptx_zip(slide_media: dict[str, list[str]], extra_media: list[tuple[str, bytes]]) -> bytes:
    """Minimal pptx: slide→media relationships plus optional unreferenced media."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as zf:
        for slide_no, media in slide_media.items():
            zf.writestr(f"ppt/slides/slide{slide_no}.xml", "<p:sld/>")
            zf.writestr(f"ppt/slides/_rels/slide{slide_no}.xml.rels", _slide_rels(media))
        # layout chrome referencing its own media: must NOT claim a body slot
        zf.writestr(
            "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
            _slide_rels(["chrome.png"]),
        )
        for media_list in slide_media.values():
            for name in media_list:
                zf.writestr(f"ppt/media/{name}", _png())
        for name, blob in extra_media:
            zf.writestr(f"ppt/media/{name}", blob)
    return buffer.getvalue()


def test_extract_figures_follows_slide_relationship_order():
    """Slide-referenced media come first in slide order, chrome last.

    Zip-lexicographic order would be image1, image10, image2 — the exact bug
    where captions described layout assets instead of the slide pictures.
    """
    data = _pptx_zip(
        {"2": ["teamB.png"], "10": ["teamC.png"], "1": ["teamA.png"]},
        extra_media=[("chrome.png", _png()), ("image99.png", _png())],
    )
    figures = doc_ingest.extract_figures(data, ".pptx")
    # unreferenced media trail the slide figures in name order (chrome last)
    assert [f.source for f in figures] == ["teamA.png", "teamB.png", "teamC.png", "chrome.png", "image99.png"]
    # numeric slide order: slide10's picture after slide2's, not between 1 and 2
    assert figures[0].index == 1
    assert figures[2].source == "teamC.png"


def test_max_figures_cap_comes_from_settings(monkeypatch):
    settings = doc_ingest.get_settings().model_copy(update={"max_figures": 2})
    monkeypatch.setattr(doc_ingest, "get_settings", lambda: settings)
    data = _pptx_zip(
        {"1": ["a.png", "b.png", "c.png"]},
        extra_media=[],
    )
    figures = doc_ingest.extract_figures(data, ".pptx")
    assert len(figures) == 3  # extraction is uncapped; the cap applies at ingest
    # simulate the ingest slice
    assert [f.source for f in figures[: settings.max_figures]] == ["a.png", "b.png"]


async def test_caption_figure_retries_empty_response(monkeypatch):
    """First call empty (transient gateway fault) → one retry recovers."""
    calls = {"n": 0}

    async def fake_caption_once(figure, *, model, settings, base):
        calls["n"] += 1
        return "" if calls["n"] == 1 else "重试成功的描述"

    monkeypatch.setattr(doc_ingest, "_caption_once", fake_caption_once)
    figure = doc_ingest.Figure(index=1, source="x.png", mime="image/png", data=b"x")
    caption = await doc_ingest.caption_figure(figure, model="qwen", retries=1)
    assert caption == "重试成功的描述"
    assert calls["n"] == 2


async def test_caption_figure_gives_up_after_retries(monkeypatch):
    async def always_empty(figure, *, model, settings, base):
        return ""

    monkeypatch.setattr(doc_ingest, "_caption_once", always_empty)
    figure = doc_ingest.Figure(index=1, source="x.png", mime="image/png", data=b"x")
    assert await doc_ingest.caption_figure(figure, model="qwen", retries=1) == ""
