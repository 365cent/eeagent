"""Document ingest: MarkItDown text, figure extraction, vision captions."""

import asyncio
import io
import zipfile
from pathlib import Path

import pytest
from PIL import Image
from pptx import Presentation
from pptx.util import Inches

from app.domains.evidence import doc_ingest

pytestmark = pytest.mark.anyio


def _png(color=(30, 120, 200)) -> bytes:
    image = Image.new("RGB", (120, 80), color)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def _pdf_with_one_image() -> bytes:
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfgen import canvas

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=(200, 200))
    pdf.drawImage(ImageReader(io.BytesIO(_png())), 20, 20, 160, 160)
    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


def _png_for_name(name: str) -> bytes:
    h = hash(name) % 0xFFFFFF
    return _png(((h >> 16) & 255, (h >> 8) & 255, h & 255))


def _xlsx_workbook() -> bytes:
    from openpyxl import Workbook
    from openpyxl.drawing.image import Image as XLImage

    wb = Workbook()
    ws = wb.active
    ws.title = "EEA 技术全景图"
    ws["A1"] = "中央计算架构"
    ws["A2"] = "区域控制器"
    buffer = io.BytesIO()
    img = Image.new("RGB", (80, 60), (20, 100, 180))
    img_buf = io.BytesIO()
    img.save(img_buf, format="PNG")
    img_buf.seek(0)
    xl_img = XLImage(img_buf)
    ws.add_image(xl_img, "C3")
    wb.save(buffer)
    return buffer.getvalue()


async def test_ingest_xlsx_extracts_sheet_text_and_figure(monkeypatch):
    async def fake_caption(figure, *, model, retries=0):
        return "全景示意图"

    async def fake_vision():
        return "qwen-test"

    monkeypatch.setattr(doc_ingest, "resolve_vision_model", fake_vision)
    monkeypatch.setattr(doc_ingest, "caption_figure", fake_caption)

    result = await doc_ingest.ingest_document(
        _xlsx_workbook(),
        "全景图.xlsx",
        "application/zip",
    )

    assert "中央计算架构" in result.canonical_md
    assert result.figure_count == 1
    assert "全景示意图" in result.canonical_md


def test_normalize_document_mime_prefers_xlsx_extension():
    mime = doc_ingest.normalize_document_mime(
        "report.xlsx",
        "application/zip",
    )
    assert mime == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


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
    async def fake_ingest(data, filename, mime, **kwargs):
        assert data == b"pptx-bytes"
        return doc_ingest.IngestResult(
            canonical_md="# 测试文档\n\n> 图 1：蓝色示意图\n",
            markitdown_version="0.1.9",
            figures=[doc_ingest.Figure(index=1, source="x.png", mime="image/png", data=b"", caption="蓝色示意图")],
            vision_model="qwen-test",
        )

    monkeypatch.setattr("app.domains.evidence.document_pipeline.ingest_document", fake_ingest)

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
    async def boom(data, filename, mime, **kwargs):
        raise RuntimeError("markitdown exploded")

    monkeypatch.setattr("app.domains.evidence.document_pipeline.ingest_document", boom)
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

    async def ok(data, filename, mime, **kwargs):
        assert data == b"raw-bytes"
        return doc_ingest.IngestResult(
            canonical_md="# 重试成功\n", markitdown_version="0.1.9", figures=[]
        )

    monkeypatch.setattr("app.domains.evidence.document_pipeline.ingest_document", ok)
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
                zf.writestr(f"ppt/media/{name}", _png_for_name(name))
        for name, blob in extra_media:
            zf.writestr(f"ppt/media/{name}", blob if blob != _png() else _png_for_name(name))
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
    assert figures[0].page == 1
    assert figures[2].page == 10


def test_pptx_figure_dedupes_identical_bytes():
    blob = _png_for_name("shared")
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as zf:
        zf.writestr("ppt/slides/slide1.xml", "<p:sld/>")
        zf.writestr("ppt/slides/_rels/slide1.xml.rels", _slide_rels(["dupA.png"]))
        zf.writestr("ppt/slides/slide2.xml", "<p:sld/>")
        zf.writestr("ppt/slides/_rels/slide2.xml.rels", _slide_rels(["dupB.png"]))
        zf.writestr("ppt/media/dupA.png", blob)
        zf.writestr("ppt/media/dupB.png", blob)
    figures = doc_ingest.extract_figures(buffer.getvalue(), ".pptx")
    assert [f.source for f in figures] == ["dupA.png"]


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
    settings = doc_ingest.get_settings().model_copy(update={"chat_base_url": "https://example.test"})
    monkeypatch.setattr(doc_ingest, "get_settings", lambda: settings)

    async def fake_caption_once(figure, *, model, settings, base, attempt=1):
        calls["n"] += 1
        return ("", "") if calls["n"] == 1 else ("重试成功的描述", "qwen")

    monkeypatch.setattr(doc_ingest, "_caption_once", fake_caption_once)
    figure = doc_ingest.Figure(index=1, source="x.png", mime="image/png", data=b"x")
    caption = await doc_ingest.caption_figure(figure, model="qwen", retries=1)
    assert caption == "重试成功的描述"
    assert calls["n"] == 2


async def test_caption_figure_gives_up_after_retries(monkeypatch):
    settings = doc_ingest.get_settings().model_copy(update={"chat_base_url": "https://example.test"})
    monkeypatch.setattr(doc_ingest, "get_settings", lambda: settings)
    async def always_empty(figure, *, model, settings, base, attempt=1):
        return "", ""

    monkeypatch.setattr(doc_ingest, "_caption_once", always_empty)
    figure = doc_ingest.Figure(index=1, source="x.png", mime="image/png", data=b"x")
    assert await doc_ingest.caption_figure(figure, model="qwen", retries=1) == ""


async def test_caption_figure_falls_back_through_the_vision_model_chain(monkeypatch):
    """VISION_MODEL=A,B: a model the gateway rejects must not end the figure."""
    settings = doc_ingest.get_settings().model_copy(update={"chat_base_url": "https://example.test"})
    monkeypatch.setattr(doc_ingest, "get_settings", lambda: settings)
    tried: list[str] = []

    async def fake_caption_once(figure, *, model, settings, base, attempt=1):
        tried.append(model)
        return ("第二个模型识别成功", model) if model == "qwen-b" else ("", "")

    monkeypatch.setattr(doc_ingest, "_caption_once", fake_caption_once)
    figure = doc_ingest.Figure(index=1, source="x.png", mime="image/png", data=b"x")
    caption = await doc_ingest.caption_figure(figure, model="qwen-a,qwen-b", retries=0)
    assert caption == "第二个模型识别成功"
    assert tried == ["qwen-a", "qwen-b"]


async def test_ingest_records_primary_vision_model_and_passes_the_chain(monkeypatch):
    seen: list[str] = []

    async def fake_vision():
        return "Qwen3.8-27B,Qwen3.6-35B"

    async def fake_caption(figure, *, model, retries=0):
        seen.append(model)
        return "蓝色示意图"

    monkeypatch.setattr(doc_ingest, "resolve_vision_model", fake_vision)
    monkeypatch.setattr(doc_ingest, "caption_figure", fake_caption)

    result = await doc_ingest.ingest_document(
        _pptx_with_picture(),
        "deck.pptx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    )

    assert seen == ["Qwen3.8-27B,Qwen3.6-35B"]
    assert result.vision_model == "Qwen3.8-27B"


async def test_ingest_records_the_vision_model_that_answered(monkeypatch):
    """Metadata names the served model, not the head of VISION_MODEL."""

    async def fake_vision():
        return "Qwen3.8-27B,Qwen3.6-35B"

    async def fake_caption(figure, *, model, retries=0):
        figure.caption = "蓝色示意图"
        figure.caption_model = "Qwen3.6-35B"
        return figure.caption

    monkeypatch.setattr(doc_ingest, "resolve_vision_model", fake_vision)
    monkeypatch.setattr(doc_ingest, "caption_figure", fake_caption)

    result = await doc_ingest.ingest_document(
        _pptx_with_picture(),
        "deck.pptx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    )

    assert result.vision_model == "Qwen3.6-35B"


def _docx_with_seven_images_eight_references() -> bytes:
    buffer = io.BytesIO()
    rels = [
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    ]
    for index in range(1, 8):
        rels.append(
            f'<Relationship Id="rId{index}" '
            'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" '
            f'Target="media/image{index}.png"/>'
        )
    rels.append("</Relationships>")
    refs = [f"rId{index}" for index in range(1, 8)] + ["rId1"]
    drawing = "".join(f'<a:blip r:embed="{rid}"/>' for rid in refs)
    document = (
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
        f"<w:body>{drawing}</w:body></w:document>"
    )
    with zipfile.ZipFile(buffer, "w") as zf:
        zf.writestr("word/_rels/document.xml.rels", "".join(rels))
        zf.writestr("word/document.xml", document)
        for index in range(1, 8):
            zf.writestr(f"word/media/image{index}.png", _png((index * 20, 80, 160)))
    return buffer.getvalue()


@pytest.mark.no_db
def test_docx_distinguishes_seven_images_from_eight_insertions():
    figures = doc_ingest.extract_figures(_docx_with_seven_images_eight_references(), ".docx")
    assert len(figures) == 7
    assert sum(figure.occurrence_count for figure in figures) == 8
    assert figures[0].occurrence_count == 2
    assert [figure.source for figure in figures] == [f"image{index}.png" for index in range(1, 8)]


@pytest.mark.no_db
def test_captions_then_figure_locations_track_heading_paths():
    from app.domains.evidence.doc_structure import assign_figure_locations

    figures = [
        doc_ingest.Figure(index=1, source="a.png", mime="image/png", data=b"", caption="第一张"),
        doc_ingest.Figure(index=2, source="b.png", mime="image/png", data=b"", caption="第二张"),
    ]
    markdown = "# 总览\n\n## 方案\n\n![a](data:image/png;base64,AAA)\n\n## 结论\n\n![b](Picture2.png)\n"
    out = doc_ingest.apply_captions(markdown, figures)
    assign_figure_locations(out, figures)
    assert figures[0].section_path == ["总览", "方案"]
    assert figures[1].section_path == ["总览", "结论"]
    assert figures[0].position == out.index("> 图 1")
    assert figures[1].position == out.index("> 图 2")



async def test_document_figures_chunks_and_keywords_api(client, monkeypatch):
    canonical = "# 总览\n\n概述\n\n## 结构\n\neFuse 智能配电\n\n> 图 1：架构图\n"
    image_bytes = _png((20, 100, 180))

    async def fake_ingest(data, filename, mime, **kwargs):
        return doc_ingest.IngestResult(
            canonical_md=canonical,
            markitdown_version="test",
            figures=[
                doc_ingest.Figure(
                    index=1,
                    source="architecture.png",
                    mime="image/png",
                    data=image_bytes,
                    caption="架构图",
                    page=2,
                    occurrence_count=2,
                    section_path=["总览", "结构"],
                    position=canonical.index("> 图 1"),
                )
            ],
            vision_model="fake-vision",
        )

    async def fake_tags(filename, text):
        assert "eFuse" in text
        return ["eFuse"], "heuristic", 0.91

    monkeypatch.setattr(
        "app.domains.evidence.document_pipeline.ingest_document", fake_ingest
    )
    monkeypatch.setattr("app.api.v1.documents.suggest_tech_tags", fake_tags)

    response = await client.post(
        "/api/v1/documents/raw",
        files={
            "file": (
                "structure.docx",
                b"docx-bytes",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    assert response.status_code == 201, response.text
    document_id = response.json()["id"]

    figures = (await client.get(f"/api/v1/documents/{document_id}/figures")).json()
    assert len(figures) == 1
    figure = figures[0]
    assert figure["source"] == "architecture.png"
    assert figure["page"] == 2
    assert figure["position"] == canonical.index("> 图 1")
    assert figure["section_path"] == ["总览", "结构"]
    assert figure["occurrence_count"] == 2
    assert figure["review_status"] == "ready"
    assert figure["image_url"] == (
        f"/api/v1/documents/{document_id}/figures/1/image"
    )

    image = await client.get(figure["image_url"])
    assert image.status_code == 200
    assert image.headers["content-type"].startswith("image/png")
    assert image.content == image_bytes

    chunks = (await client.get(f"/api/v1/documents/{document_id}/chunks")).json()
    assert [chunk["section_path"] for chunk in chunks] == [["总览"], ["总览", "结构"]]
    assert chunks[1]["figure_indices"] == [1]
    assert chunks[1]["text"].startswith("## 结构")

    keywords = (await client.get(f"/api/v1/documents/{document_id}/keywords")).json()
    assert keywords[0]["term"] == "eFuse"
    assert keywords[0]["chunk_id"] == 2
    assert keywords[0]["section_path"] == ["总览", "结构"]
    assert (await client.get(f"/api/v1/documents/{document_id}/figures/99/image")).status_code == 404


async def test_document_keywords_timeout_falls_back_and_caches(client, monkeypatch):
    canonical = "# 总览\n\neFuse 智能配电\n"

    async def fake_ingest(data, filename, mime, **kwargs):
        return doc_ingest.IngestResult(
            canonical_md=canonical,
            markitdown_version="test",
            figures=[],
            vision_model="fake-vision",
        )

    monkeypatch.setattr(
        "app.domains.evidence.document_pipeline.ingest_document", fake_ingest
    )
    from app.api.v1 import documents as documents_api

    documents_api._keyword_cache.clear()
    calls = {"slow": 0}

    async def slow_tags(filename, text):
        calls["slow"] += 1
        await asyncio.sleep(0.2)
        return ["slow-model"], "llm", 0.9

    monkeypatch.setattr("app.api.v1.documents.suggest_tech_tags", slow_tags)
    monkeypatch.setattr("app.api.v1.documents._KEYWORD_LLM_TIMEOUT_SECONDS", 0.05)

    response = await client.post(
        "/api/v1/documents/raw",
        files={"file": ("timeout.md", b"# x", "text/markdown")},
    )
    assert response.status_code == 201, response.text
    document_id = response.json()["id"]

    first = await client.get(f"/api/v1/documents/{document_id}/keywords")
    assert first.status_code == 200, first.text
    rows = first.json()
    assert "eFuse" in [row["term"] for row in rows]
    assert all(any(ch.isalnum() for ch in row["term"]) for row in rows)
    assert rows[0]["source"] == "jieba-frequency"

    calls_after_first = calls["slow"]
    second = await client.get(f"/api/v1/documents/{document_id}/keywords")
    assert second.json() == rows
    assert calls["slow"] == calls_after_first


async def test_failed_reingest_keeps_previous_figure_and_chunk_index(client, monkeypatch):
    canonical = "# 总览\n\n保留旧索引\n\n> 图 1：旧图\n"

    async def good_ingest(data, filename, mime, **kwargs):
        return doc_ingest.IngestResult(
            canonical_md=canonical,
            markitdown_version="test",
            figures=[
                doc_ingest.Figure(
                    index=1,
                    source="old.png",
                    mime="image/png",
                    data=_png((80, 30, 30)),
                    caption="旧图",
                    section_path=["总览"],
                    position=canonical.index("> 图 1"),
                )
            ],
        )

    monkeypatch.setattr(
        "app.domains.evidence.document_pipeline.ingest_document", good_ingest
    )
    response = await client.post(
        "/api/v1/documents/raw",
        files={
            "file": (
                "retry.docx",
                b"retry-bytes",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        },
    )
    assert response.status_code == 201, response.text
    document_id = response.json()["id"]

    async def failing_ingest(data, filename, mime, **kwargs):
        raise RuntimeError("synthetic parse failure")

    monkeypatch.setattr(
        "app.domains.evidence.document_pipeline.ingest_document", failing_ingest
    )
    retry = await client.post(f"/api/v1/documents/{document_id}/ingest")
    assert retry.status_code == 200
    assert retry.json()["ingest_status"] == "failed"
    figures = (await client.get(f"/api/v1/documents/{document_id}/figures")).json()
    assert len(figures) == 1
    assert figures[0]["caption"] == "旧图"
    chunks = (await client.get(f"/api/v1/documents/{document_id}/chunks")).json()
    assert chunks[0]["section_path"] == ["总览"]



async def test_scanned_pdf_without_text_layer_fails_explicitly():
    with pytest.raises(ValueError, match="OCR"):
        await doc_ingest.ingest_document(
            _pdf_with_one_image(), "scan.pdf", "application/pdf", vision_captions=False
        )


async def test_caption_only_pdf_is_not_readable_text(monkeypatch):
    """A PDF whose only text is the figure section still needs OCR."""

    def stub_convert(data, suffix):
        return "d1-05", None

    monkeypatch.setattr("app.domains.evidence.doc_ingest._convert_sync", stub_convert)
    with pytest.raises(ValueError, match="OCR"):
        await doc_ingest.ingest_document(
            _pdf_with_one_image(), "d1-05.pdf", "application/pdf", vision_captions=False
        )

async def test_scanned_pdf_upload_keeps_raw_and_reports_ocr_failure(client):
    response = await client.post(
        "/api/v1/documents/raw",
        files={"file": ("scan.pdf", _pdf_with_one_image(), "application/pdf")},
    )
    assert response.status_code == 201, response.text
    document_id = response.json()["id"]
    detail = await client.get(f"/api/v1/documents/{document_id}")
    assert detail.status_code == 200
    assert detail.json()["ingest_status"] == "failed"
    assert "OCR" in (detail.json()["ingest_error"] or "")

def test_real_efuse_word_has_seven_images_and_eight_insertions():
    """BE-12: the supplied Word references seven distinct images eight times."""
    path = (
        Path(__file__).resolve().parents[2]
        / "docs"
        / "reference"
        / "德赛西威EEA关键技术落脚点推导链路逐环节图文对照说明-以「智能保险丝（eFuse）」为案例-1009.docx"
    )
    if not path.is_file():
        pytest.skip("source Word is not present")
    figures = doc_ingest.extract_figures(path.read_bytes(), ".docx")
    assert len(figures) == 7
    assert sum(figure.occurrence_count for figure in figures) == 8
    assert max(figure.occurrence_count for figure in figures) == 2

async def test_caption_figure_serves_the_second_call_from_cache(tmp_path, monkeypatch):
    """Duplicate captures of the same image must not call the gateway twice."""
    from app.platform import caption_cache

    monkeypatch.setattr(caption_cache, "cache_root", lambda directory=None: tmp_path)
    settings = doc_ingest.get_settings().model_copy(update={"chat_base_url": "https://example.test"})
    monkeypatch.setattr(doc_ingest, "get_settings", lambda: settings)
    calls = {"n": 0}

    async def fake_once(figure, *, model, settings, base, attempt=1):
        calls["n"] += 1
        return "cached caption", model

    monkeypatch.setattr(doc_ingest, "_caption_once", fake_once)
    data = b"PNG" + b"q" * 50
    first = doc_ingest.Figure(index=1, source="a.png", mime="image/png", data=data)
    second = doc_ingest.Figure(index=1, source="a.png", mime="image/png", data=data)
    assert await doc_ingest.caption_figure(first, model="qwen-a", retries=0) == "cached caption"
    assert await doc_ingest.caption_figure(second, model="qwen-a", retries=0) == "cached caption"
    assert calls["n"] == 1
    assert second.caption_model == "qwen-a"


async def test_caption_once_sends_the_image_through_pydantic_ai(monkeypatch):
    from types import SimpleNamespace

    from pydantic_ai import BinaryContent
    from pydantic_ai.usage import RunUsage

    seen: dict[str, object] = {}

    class StubAgent:
        async def run(self, content):
            seen["content"] = content
            return SimpleNamespace(
                output="line one\nline two",
                response=SimpleNamespace(model_name="qwen-served"),
                usage=RunUsage(),
                new_messages=lambda: [],
            )

    monkeypatch.setattr(doc_ingest, "_caption_agent", lambda model, settings: StubAgent())
    figure = doc_ingest.Figure(index=2, source="b.png", mime="image/jpeg", data=b"jpegbytes")
    caption, served = await doc_ingest._caption_once(
        figure,
        model="Qwen3.8-27B",
        settings=doc_ingest.get_settings(),
        base="https://example.test",
        attempt=2,
    )
    assert caption == "line one line two"
    assert served == "qwen-served"
    part = seen["content"][0]
    assert isinstance(part, BinaryContent)
    assert part.data == b"jpegbytes"
    assert part.media_type == "image/jpeg"


async def test_caption_once_returns_empty_when_the_gateway_rejects_the_id(monkeypatch):
    class FailingAgent:
        async def run(self, content):
            del content
            raise RuntimeError("model_not_found")

    monkeypatch.setattr(doc_ingest, "_caption_agent", lambda model, settings: FailingAgent())
    figure = doc_ingest.Figure(index=3, source="c.png", mime="image/png", data=b"bytes")
    caption, served = await doc_ingest._caption_once(
        figure,
        model="missing-model",
        settings=doc_ingest.get_settings(),
        base="https://example.test",
    )
    assert caption == ""
    assert served == ""
