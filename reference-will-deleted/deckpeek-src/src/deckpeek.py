#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""deckpeek -- 单文件 PPTX 快速浏览 + 元素拾取工具。

一条命令把 .pptx 变成可以在浏览器里翻页、点选、复制元素描述的页面：

    python deckpeek.py deck.pptx              # 生成到 preview/ 并打印打开方式
    python deckpeek.py deck.pptx --serve      # 起本地服务并自动打开浏览器
    python deckpeek.py deck.pptx --no-render  # 复用已有底图，只重建 HTML

产物（默认根目录 preview/）：

    index.html   自包含查看器，file:// 直接打开，不需要服务器、不联网
    slides/      PowerPoint 导出的底图 sNN.png（视觉基准）
    media/       形状内嵌图片，按内容 sha1 去重

页面里每个 PowerPoint 形状都是真实、可定位的 DOM 元素：携带几何（data-* 英寸 + 内联 px）
和重建出来的样式。两种视图 -- "底图"（PowerPoint 渲染图 + 透明可点图层）和
"结构"（DOM 自行渲染的填充/边框/文字/图片/表格）位置完全一致，都能点选。

依赖：python-pptx（必需）；pywin32 / 本机 PowerPoint（仅导出底图需要，可用
--no-render --render-dir 跳过）。

描述符格式（- 表示该项不存在，text 截断到约 80 字符）：

    SLIDE 43 | z=4 | name="Table 7" | id=132 | TABLE | L=1.20in T=2.05in W=11.30in H=2.40in | rot=0 | fill=- | line=- | text="统计口径与样本分层"
"""

import argparse
import hashlib
import html
import json
import re
import shutil
import sys
import webbrowser
from pathlib import Path

from pptx import Presentation
from pptx.opc.constants import RELATIONSHIP_TYPE as RT

# ---------------------------------------------------------------- constants --

EMU_PER_INCH = 914400
EMU_PER_PX = 9525  # 914400 / 96 -- the slide is 12192000 x 6858000 EMU = 1280x720 px
STAGE_W = 1280
STAGE_H = 720
DESC_TEXT_LIMIT = 80
A_NS = "{http://schemas.openxmlformats.org/drawingml/2006/main}"

TYPE_NAMES = {
    1: "AUTO_SHAPE", 2: "CHART", 3: "SMART_ART", 5: "FREEFORM", 6: "GROUP",
    9: "LINE", 13: "PICTURE", 14: "PLACEHOLDER", 17: "TEXT_BOX", 19: "TABLE",
    24: "MEDIA",
}

# a:dml scheme tags as reported by python-pptx -> a:clrScheme element names
THEME_ALIAS = {"tx1": "dk1", "tx2": "dk2", "bg1": "lt1", "bg2": "lt2"}

ANCHOR_NAMES = {1: "top", 3: "middle", 4: "bottom"}
ALIGN_NAMES = {1: "left", 2: "center", 3: "right", 4: "justify", 5: "justify", 6: "justify"}

# Single quotes on purpose: this string is interpolated into style="" attributes.
FONT_STACK = "'Microsoft YaHei','微软雅黑',system-ui,'Segoe UI',sans-serif"

stats = {"shapes": 0, "errors": 0, "warned": 0}


# ------------------------------------------------------------------ helpers --

def emu_px(v):
    return (v or 0) / float(EMU_PER_PX)


def emu_in(v):
    return (v or 0) / float(EMU_PER_INCH)


def warn(msg):
    stats["warned"] += 1
    sys.stderr.write("[warn] %s\n" % msg)


def clean_text(s):
    return re.sub(r"\s+", " ", (s or "").replace("\u000b", " ")).strip()


def hex_of_color(color_format, theme, default=None):
    """Best-effort 'RRGGBB' for a python-pptx ColorFormat; never raises.

    Theme/scheme colours that cannot be resolved fall back to *default*.
    """
    try:
        ctype = color_format.type
        if ctype is None:
            return default
        code = int(ctype)
    except Exception:
        return default
    if code == 1:  # MSO_COLOR_TYPE.RGB
        try:
            rgb = color_format.rgb
            return str(rgb).upper() if rgb is not None else default
        except Exception:
            return default
    if code == 2:  # MSO_COLOR_TYPE.SCHEME
        try:
            tag = getattr(color_format.theme_color, "xml_value", None)
        except Exception:
            tag = None
        if tag:
            tag = THEME_ALIAS.get(tag, tag)
            if tag in theme:
                return theme[tag]
        return default
    return default


def load_theme_colors(slide):
    """Parse <a:clrScheme> out of the slide master's theme part."""
    colors = {}
    try:
        part = slide.slide_layout.slide_master.part.part_related_by(RT.THEME)
        blob = part.blob.decode("utf-8", "replace")
    except Exception:
        return colors
    m = re.search(r"<a:clrScheme[^>]*>(.*?)</a:clrScheme>", blob, re.S)
    if not m:
        return colors
    for tag, chunk in re.findall(
            r"<a:(dk1|lt1|dk2|lt2|accent[1-6]|hlink|folHlink)>(.*?)</a:\1>",
            m.group(1), re.S):
        rgb = re.search(r'<a:srgbClr val="([0-9A-Fa-f]{6})"', chunk)
        if rgb:
            colors[tag] = rgb.group(1).upper()
            continue
        sysclr = re.search(r'<a:sysClr[^>]*lastClr="([0-9A-Fa-f]{6})"', chunk)
        if sysclr:
            colors[tag] = sysclr.group(1).upper()
    return colors


def extract_fill(shape, theme):
    """-> (css_background|None, hex|None, kind)."""
    try:
        fill = shape.fill
        ftype = fill.type
    except Exception:
        return None, None, "none"
    if ftype is None:
        return None, None, "none"
    try:
        code = int(ftype)
    except Exception:
        return None, None, "none"

    if code == 1:  # solid
        hx = hex_of_color(fill.fore_color, theme, None)
        return ("#" + hx, hx, "solid") if hx else (None, None, "none")
    if code == 5:  # background -> fully transparent
        return None, None, "background"
    if code == 3:  # gradient
        try:
            stops = []
            for stop in fill.gradient_stops:
                pos = 0.0
                try:
                    if stop.position is not None:
                        pos = float(stop.position)
                except Exception:
                    pass
                hx = hex_of_color(stop.color, theme, "F2F2F2")
                if hx:
                    stops.append((pos, "#" + hx))
            stops.sort(key=lambda s: s[0])
            if len(stops) >= 2:
                angle = 90.0
                try:
                    if fill.gradient_angle is not None:
                        angle = float(fill.gradient_angle)
                except Exception:
                    pass
                # DrawingML: 0deg = left->right.  CSS: 0deg = bottom->top.
                css_angle = (90.0 - angle) % 360.0
                parts = ", ".join("%s %.1f%%" % (c, p * 100.0) for p, c in stops)
                return ("linear-gradient(%.0fdeg, %s)" % (css_angle, parts),
                        stops[0][1].lstrip("#"), "gradient")
            if stops:
                return stops[0][1], stops[0][1].lstrip("#"), "gradient"
        except Exception:
            return None, None, "gradient"
        return None, None, "gradient"
    return None, None, "other"


def extract_line(shape, theme):
    """-> (hex|None, width_pt|None) for the outline / connector stroke."""
    try:
        line = shape.line
    except Exception:
        return None, None
    width = None
    try:
        if line.width is not None:
            width = round(line.width.pt, 2)
    except Exception:
        width = None
    try:
        ftype = line.fill.type
        code = int(ftype) if ftype is not None else None
    except Exception:
        code = None
    if code != 1:
        return None, width
    return hex_of_color(line.color, theme, None), width


def prst_geom(shape):
    node = shape._element.find(".//" + A_NS + "prstGeom")
    return node.get("prst") if node is not None else None


def xfrm_flips(shape):
    node = shape._element.find(".//" + A_NS + "xfrm")
    if node is None:
        return False, False
    return (str(node.get("flipH")).lower() in ("1", "true"),
            str(node.get("flipV")).lower() in ("1", "true"))


def layout_placeholder(slide, shape, cache):
    """Layout placeholder a placeholder inherits style from (or None)."""
    try:
        if not shape.is_placeholder:
            return None
        idx = shape.placeholder_format.idx
    except Exception:
        return None
    if idx in cache:
        return cache[idx]
    found = None
    try:
        for ph in slide.slide_layout.placeholders:
            if ph.placeholder_format.idx == idx:
                found = ph
                break
    except Exception:
        found = None
    cache[idx] = found
    return found


def line_spacing_css(value):
    if value is None:
        return None
    try:
        if hasattr(value, "pt"):
            return "%.2fpt" % value.pt
        return "%.3g" % float(value)
    except Exception:
        return None


def space_css(value):
    if value is None:
        return None
    try:
        return "%.2fpt" % value.pt
    except Exception:
        return None


def inherited_size(placeholder):
    """Font size for a run that inherits from its layout placeholder."""
    try:
        for para in placeholder.text_frame.paragraphs:
            for run in para.runs:
                if run.font.size is not None:
                    return round(run.font.size.pt, 1)
    except Exception:
        pass
    return 18.0


def run_record(run, theme, fallback_size):
    try:
        size = run.font.size
        size_pt = round(size.pt, 1) if size is not None else fallback_size
    except Exception:
        size_pt = fallback_size
    font = run.font
    try:
        bold = font.bold
    except Exception:
        bold = None
    try:
        italic = font.italic
    except Exception:
        italic = None
    try:
        underline = font.underline
    except Exception:
        underline = None
    try:
        name = font.name
    except Exception:
        name = None
    if name:
        # keep quotes out: the name is interpolated into a style="" attribute
        name = name.replace("'", "").replace('"', "")
    return {
        "t": run.text, "f": name, "s": size_pt, "b": bold, "i": italic,
        "u": underline, "c": hex_of_color(font.color, theme, None),
    }


def extract_paragraphs(text_frame, theme, inherited=None):
    """-> list of paragraph dicts with per-run style facts."""
    fallback = inherited_size(inherited) if inherited is not None else None
    out = []
    for para in text_frame.paragraphs:
        align = para.alignment
        if align is None and inherited is not None:
            try:
                align = inherited.text_frame.paragraphs[0].alignment
            except Exception:
                align = None
        align_css = ALIGN_NAMES.get(int(align)) if align is not None else None
        out.append({
            "a": align_css,
            "ls": line_spacing_css(para.line_spacing),
            "sb": space_css(para.space_before),
            "sa": space_css(para.space_after),
            "lvl": para.level or 0,
            "runs": [run_record(r, theme, fallback) for r in para.runs],
        })
    return out


def cell_border_hex(cell, theme, fallback="#BFBFBF"):
    """Read a table cell's own border colour out of the raw XML."""
    try:
        tc_pr = cell._tc.find(A_NS + "tcPr")
        if tc_pr is None:
            return fallback
        for tag in ("lnB", "lnT", "lnL", "lnR"):
            node = tc_pr.find(A_NS + tag)
            if node is None:
                continue
            srgb = node.find(".//" + A_NS + "srgbClr")
            if srgb is not None and srgb.get("val"):
                return "#" + srgb.get("val").upper()
            scheme = node.find(".//" + A_NS + "schemeClr")
            if scheme is not None:
                tag_name = THEME_ALIAS.get(scheme.get("val"), scheme.get("val"))
                if tag_name in theme:
                    return "#" + theme[tag_name]
    except Exception:
        pass
    return fallback


def cell_anchor_css(cell):
    try:
        anchor = cell._tc.find(A_NS + "tcPr").get("anchor")
    except Exception:
        return "middle"
    return {"t": "top", "ctr": "middle", "b": "bottom"}.get(anchor, "middle")


# ------------------------------------------------------------- DOM builders --

def build_paragraph_html(paras, default_color="#000000"):
    out = []
    for para in paras:
        styles = ["margin:0"]
        if para["a"]:
            styles.append("text-align:%s" % para["a"])
        styles.append("line-height:%s" % (para["ls"] or "1.2"))
        if para["sb"]:
            styles.append("margin-top:%s" % para["sb"])
        if para["sa"]:
            styles.append("margin-bottom:%s" % para["sa"])
        spans = []
        for run in para["runs"]:
            rs = []
            if run["s"]:
                rs.append("font-size:%spt" % run["s"])
            if run["b"]:
                rs.append("font-weight:700")
            if run["i"]:
                rs.append("font-style:italic")
            if run["u"]:
                rs.append("text-decoration:underline")
            if run["c"]:
                rs.append("color:#%s" % run["c"])
            if run["f"]:
                rs.append("font-family:'%s',%s" % (run["f"].replace("'", ""), FONT_STACK))
            spans.append('<span style="%s">%s</span>'
                         % (";".join(rs), html.escape(run["t"])))
        if not spans:
            spans.append('<span>&#8203;</span>')
        out.append('<p style="%s">%s</p>' % (";".join(styles), "".join(spans)))
    return "".join(out)


def build_text_layer(text_frame, paras, anchor, wrap, color_default="#000000"):
    jc = {"top": "flex-start", "middle": "center", "bottom": "flex-end"}.get(
        anchor or "top", "flex-start")
    ml = mt = mr = mb = 0.0
    try:
        if text_frame.margin_left is not None:
            ml = emu_px(text_frame.margin_left)
        if text_frame.margin_top is not None:
            mt = emu_px(text_frame.margin_top)
        if text_frame.margin_right is not None:
            mr = emu_px(text_frame.margin_right)
        if text_frame.margin_bottom is not None:
            mb = emu_px(text_frame.margin_bottom)
    except Exception:
        pass
    ws = "pre" if wrap is False else "pre-wrap"
    style = ("position:absolute;left:0;top:0;width:100%%;height:100%%;"
             "display:flex;flex-direction:column;justify-content:%s;"
             "padding:%.2fpx %.2fpx %.2fpx %.2fpx;overflow:visible;"
             "white-space:%s;overflow-wrap:break-word;color:%s;font-family:%s"
             % (jc, mt, mr, mb, ml, ws, color_default, FONT_STACK))
    return '<div class="tx" style="%s">%s</div>' % (
        style, build_paragraph_html(paras, color_default))


def build_table_html(shape, theme):
    table = shape.table
    col_px = [emu_px(c.width) for c in table.columns]
    total_px = sum(col_px) or 1.0
    shape_px = emu_px(shape.width) or total_px
    colgroup = "".join('<col style="width:%.2fpx">' % (w * shape_px / total_px)
                       for w in col_px)
    rows_html = []
    for row in table.rows:
        row_px = emu_px(row.height)
        cells_html = []
        for cell in row.cells:
            try:
                if cell.is_spanned:
                    continue
            except Exception:
                pass
            span_w = span_h = 1
            try:
                if cell.is_merge_origin:
                    span_w = max(1, cell.span_width)
                    span_h = max(1, cell.span_height)
            except Exception:
                pass
            fill_hex = None
            try:
                if int(cell.fill.type) == 1:
                    fill_hex = hex_of_color(cell.fill.fore_color, theme, None)
            except Exception:
                fill_hex = None
            border = cell_border_hex(cell, theme)
            anchor = cell_anchor_css(cell)
            try:
                text_frame = cell.text_frame
            except Exception:
                text_frame = None
            paras = extract_paragraphs(text_frame, theme) if text_frame else []
            cell_style = ("border:1px solid %s;vertical-align:%s;"
                          "padding:2.40px 4.80px;font-family:%s;overflow:hidden"
                          % (border, anchor, FONT_STACK))
            if fill_hex:
                cell_style += ";background:#" + fill_hex
            attrs = ""
            if span_w > 1:
                attrs += ' colspan="%d"' % span_w
            if span_h > 1:
                attrs += ' rowspan="%d"' % span_h
            cells_html.append('<td%s style="%s">%s</td>'
                              % (attrs, cell_style, build_paragraph_html(paras)))
        rows_html.append('<tr style="height:%.2fpx">%s</tr>'
                         % (row_px, "".join(cells_html)))
    return ('<table class="tbl" style="position:absolute;left:0;top:0;width:100%%;'
            'height:100%%;border-collapse:collapse;table-layout:fixed;font-family:%s">'
            '<colgroup>%s</colgroup><tbody>%s</tbody></table>'
            % (FONT_STACK, colgroup, "".join(rows_html)))


# ------------------------------------------------------------------ export --

def error_element(slide_no, z, shape):
    try:
        left, top = shape.left or 0, shape.top or 0
        width, height = shape.width or 0, shape.height or 0
        name = str(getattr(shape, "name", ""))
        sid = getattr(shape, "shape_id", "")
    except Exception:
        left = top = width = height = 0
        name, sid = "", ""
    return ('<div class="sh err" data-error="1" data-slide="%d" data-z="%d" '
            'data-name="%s" data-shape-id="%s" data-type="ERROR" data-l="%.2f" '
            'data-t="%.2f" data-w="%.2f" data-h="%.2f" data-text="" '
            'style="left:%.2fpx;top:%.2fpx;width:%.2fpx;height:%.2fpx"></div>'
            % (slide_no, z, html.escape(name, quote=True), sid,
               emu_in(left), emu_in(top), emu_in(width), emu_in(height),
               emu_px(left), emu_px(top), max(emu_px(width), 1.0),
               max(emu_px(height), 1.0)))


def render_shape(slide_no, z, shape, theme, ph_cache, media_index, media_dir,
                 data, geo_report, slide, report_slides):
    """Build one shape element plus its inspector data record."""
    try:
        type_name = TYPE_NAMES.get(int(shape.shape_type), "UNKNOWN")
    except Exception:
        type_name = "UNKNOWN"

    left, top = shape.left or 0, shape.top or 0
    width, height = shape.width or 0, shape.height or 0
    try:
        rot = float(shape.rotation or 0.0)
    except Exception:
        rot = 0.0

    l_in, t_in = emu_in(left), emu_in(top)
    w_in, h_in = emu_in(width), emu_in(height)
    l_px, t_px = emu_px(left), emu_px(top)
    w_px, h_px = emu_px(width), emu_px(height)

    geom = prst_geom(shape)
    is_line = (type_name == "LINE") or (geom == "line")

    text = ""
    paras = []
    anchor = None
    wrap = None
    fill_css = fill_hex = None
    line_hex = line_w = None
    picture_src = None
    table_html = None

    # ---- picture ----------------------------------------------------------
    if type_name == "PICTURE":
        try:
            image = shape.image
            blob = image.blob
            sha = hashlib.sha1(blob).hexdigest()
            ext = (image.ext or "png").lower()
            if ext == "jpeg":
                ext = "jpg"
            if sha not in media_index:
                fname = "img_%s.%s" % (sha[:10], ext)
                (Path(media_dir) / fname).write_bytes(blob)
                media_index[sha] = fname
            picture_src = "media/" + media_index[sha]
        except Exception as exc:
            warn("slide %d z %d: picture decode failed: %s" % (slide_no, z, exc))

    # ---- table ------------------------------------------------------------
    elif type_name == "TABLE":
        table_html = build_table_html(shape, theme)
        try:
            cells = [c.text for row in shape.table.rows for c in row.cells]
            text = clean_text(" ".join(x for x in cells if x))
        except Exception:
            text = ""

    # ---- generic geometry styling -----------------------------------------
    else:
        if not is_line:
            fill_css, fill_hex, _kind = extract_fill(shape, theme)
        line_hex, line_w = extract_line(shape, theme)

    # ---- text -------------------------------------------------------------
    if type_name not in ("TABLE", "PICTURE", "LINE"):
        try:
            text_frame = shape.text_frame
        except Exception:
            text_frame = None
        if text_frame is not None:
            inherited = layout_placeholder(slide, shape, ph_cache)
            try:
                anchor = (ANCHOR_NAMES.get(int(text_frame.vertical_anchor))
                          if text_frame.vertical_anchor is not None else None)
            except Exception:
                anchor = None
            if anchor is None and inherited is not None:
                try:
                    if inherited.text_frame.vertical_anchor is not None:
                        anchor = ANCHOR_NAMES.get(
                            int(inherited.text_frame.vertical_anchor))
                except Exception:
                    anchor = None
            if anchor is None:
                anchor = "top"
            try:
                wrap = text_frame.word_wrap
            except Exception:
                wrap = None
            paras = extract_paragraphs(text_frame, theme, inherited)
            text = clean_text(text_frame.text)

    name = str(shape.name)
    shape_id = shape.shape_id

    # ---- compact one-line descriptor --------------------------------------
    desc_text = clean_text(text)
    if len(desc_text) > DESC_TEXT_LIMIT:
        desc_text = desc_text[:DESC_TEXT_LIMIT - 1] + "…"
    desc_text = desc_text.replace('"', "'")
    desc = ('SLIDE %d | z=%d | name="%s" | id=%s | %s | '
            'L=%.2fin T=%.2fin W=%.2fin H=%.2fin | rot=%g | '
            'fill=%s | line=%s | text="%s"'
            % (slide_no, z, name.replace('"', "'"), shape_id, type_name,
               l_in, t_in, w_in, h_in, rot,
               ("#" + fill_hex) if fill_hex else "-",
               ("#" + line_hex) if line_hex else "-", desc_text))

    # ---- inline geometry (identical in both modes) ------------------------
    styles = ["left:%.2fpx" % l_px, "top:%.2fpx" % t_px,
              "width:%.2fpx" % w_px, "height:%.2fpx" % h_px]
    if rot:
        styles.append("transform:rotate(%gdeg)" % rot)
        styles.append("transform-origin:50% 50%")

    children = []
    if is_line:
        styles.append("background:transparent")
        src_w = max(w_px, 1.0)
        src_h = max(h_px, 1.0)
        if w_px < 0.5:
            styles.append("width:1px")
        if h_px < 0.5:
            styles.append("height:1px")
        flip_h, flip_v = xfrm_flips(shape)
        if w_px < 0.5 and h_px >= 0.5:
            x1, y1, x2, y2 = 0.5, 0.0, 0.5, src_h
        elif h_px < 0.5 and w_px >= 0.5:
            x1, y1, x2, y2 = 0.0, 0.5, src_w, 0.5
        elif w_px < 0.5 and h_px < 0.5:
            x1, y1, x2, y2 = 0.5, 0.5, 0.5, 0.5
        else:
            x1, y1, x2, y2 = 0.0, 0.0, src_w, src_h
            if flip_h and flip_v:
                x1, y1, x2, y2 = src_w, src_h, 0.0, 0.0
            elif flip_h:
                x1, y1, x2, y2 = src_w, 0.0, 0.0, src_h
            elif flip_v:
                x1, y1, x2, y2 = 0.0, src_h, src_w, 0.0
        stroke = "#" + line_hex if line_hex else "#999999"
        stroke_px = max(1.0, (line_w or 0.75) * 96.0 / 72.0)
        children.append(
            '<svg class="ln" viewBox="0 0 %.2f %.2f" preserveAspectRatio="none" '
            'style="position:absolute;left:0;top:0;width:100%%;height:100%%;'
            'overflow:visible"><line x1="%.2f" y1="%.2f" x2="%.2f" y2="%.2f" '
            'stroke="%s" stroke-width="%.2f"/></svg>'
            % (src_w, src_h, x1, y1, x2, y2, stroke, stroke_px))
    else:
        if fill_css:
            styles.append("background:%s" % fill_css)
        if line_hex:
            stroke_px = max(1.0, (line_w or 0.75) * 96.0 / 72.0)
            styles.append("border:%.2fpx solid #%s" % (stroke_px, line_hex))
        if type_name != "TABLE":
            if geom == "roundRect":
                styles.append("border-radius:%.2fpx" % (min(w_px, h_px) * 0.10))
            elif geom == "round2DiagRect":
                styles.append("border-radius:%.2fpx" % (min(w_px, h_px) * 0.16))
            elif geom == "ellipse":
                styles.append("border-radius:50%")
        if picture_src:
            children.append('<img class="pic" loading="lazy" src="%s" alt="" '
                            'style="position:absolute;left:0;top:0;width:100%%;'
                            'height:100%%;object-fit:fill">'
                            % html.escape(picture_src, quote=True))
        elif table_html:
            children.append(table_html)
        elif paras:
            children.append(build_text_layer(shape.text_frame, paras, anchor, wrap))

    attrs = ('class="sh%s" data-slide="%d" data-z="%d" data-name="%s" '
             'data-shape-id="%s" data-type="%s" data-l="%.2f" data-t="%.2f" '
             'data-w="%.2f" data-h="%.2f" data-text="%s" data-desc="%s" '
             'style="%s"'
             % (" line" if is_line else "", slide_no, z,
                html.escape(name, quote=True), shape_id, type_name,
                l_in, t_in, w_in, h_in,
                html.escape(clean_text(text)[:600], quote=True),
                html.escape(desc, quote=True), ";".join(styles)))

    data["%d:%d" % (slide_no, z)] = {
        "fill": ("#" + fill_hex) if fill_hex else None,
        "line": ("#" + line_hex) if line_hex else None,
        "linew": line_w,
        "anchor": anchor,
        "rot": rot,
        "kind": type_name,
        "paras": paras[:20],
    }

    if slide_no in report_slides and len([g for g in geo_report if g[0] == slide_no]) < 3:
        geo_report.append((slide_no, z, name, type_name, l_in, t_in, w_in, h_in))

    return "<div %s>%s</div>" % (attrs, "".join(children))


def export(deck_path, out_dir, render_dir, report_slides):
    import time as _time
    built = int(_time.time())
    prs = Presentation(str(deck_path))
    slides = list(prs.slides)

    out_dir = Path(out_dir)
    slides_dir = out_dir / "slides"
    media_dir = out_dir / "media"
    for d in (slides_dir, media_dir):
        if d.exists():
            shutil.rmtree(d)
        d.mkdir(parents=True, exist_ok=True)

    # -- copy the PowerPoint ground-truth renders ---------------------------
    # Each copied PNG gets a version stamp. The viewer appends it to the image
    # URL, so a re-rendered slide is fetched again instead of being served from
    # the browser's cache under the same sNN.png name.
    copied = 0
    missing = []
    slide_versions = []
    for n in range(1, len(slides) + 1):
        src = Path(render_dir) / ("s%02d.png" % n)
        if not src.exists():
            warn("missing slide render %s" % src)
            missing.append(n)
            slide_versions.append(0)
            continue
        dst = slides_dir / src.name
        shutil.copyfile(src, dst)
        slide_versions.append(int(dst.stat().st_mtime * 1000))
        copied += 1

    # -- walk every shape ---------------------------------------------------
    media_index = {}   # sha1 -> filename in media/
    shapes_html = []
    strip_html = []
    data = {}
    geo_report = []

    for slide_no, slide in enumerate(slides, 1):
        theme = load_theme_colors(slide)
        ph_cache = {}
        section = []
        for z, shape in enumerate(slide.shapes):
            stats["shapes"] += 1
            try:
                section.append(render_shape(
                    slide_no, z, shape, theme, ph_cache, media_index, media_dir,
                    data, geo_report, slide, report_slides))
            except Exception as exc:  # one bad shape must not kill the run
                stats["errors"] += 1
                warn("slide %d shape %d (%s): %s: %s"
                     % (slide_no, z, getattr(shape, "name", "?"),
                        type(exc).__name__, exc))
                section.append(error_element(slide_no, z, shape))
        n_shapes = sum(1 for s in section if 'class="sh' in s)
        shapes_html.append('<section class="slide" id="s%d" data-shapes="%d">%s</section>'
                           % (slide_no, n_shapes, "".join(section)))
        strip_html.append(
            '<button class="st" data-n="%d" title="slide %d · %d 个元素">'
            '<img loading="lazy" src="slides/s%02d.png" alt=""><i>%d</i></button>'
            % (slide_no, slide_no, n_shapes, slide_no, slide_no))

    page = render_page(shapes_html, strip_html, data, len(slides), deck_path,
                       missing, built, slide_versions)
    index = out_dir / "index.html"
    index.write_text(page, encoding="utf-8")

    # deck.json records what this folder was built from and when. The watcher
    # reads it to know what to watch, and the viewer polls it to live-reload.
    try:
        src_stat = Path(deck_path).stat()
        meta = {
            "source": str(Path(deck_path).resolve()),
            "slides": len(slides),
            "built": built,
            "source_mtime": round(src_stat.st_mtime, 3),
            "source_size": src_stat.st_size,
            "missing": len(missing),
            "rendering": False,
            "slide_versions": slide_versions,
        }
        (out_dir / "deck.json").write_text(
            json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    except OSError as exc:
        warn("could not write deck.json: %s" % exc)

    return {
        "slides": len(slides),
        "pngs": copied,
        "media": len(media_index),
        "index_bytes": index.stat().st_size,
        "geo_report": geo_report,
        "missing": missing,
        "built": built,
    }


def render_page(shapes_html, strip_html, data, slide_count, deck_path, missing,
                built=0, slide_versions=None):
    title = "%s — 结构查看器" % Path(deck_path).stem
    banner = ""
    if missing:
        banner = ('<div id="banner">缺 %d 页底图（slides/ 里没有对应的 sNN.png）—— '
                  '命令行加 <code>--force-render</code> 重跑，或在本机选择页里把同一个 .pptx '
                  '再拖一次；形状数据没丢，「结构」模式仍可查看。</div>' % len(missing))
    versions = list(slide_versions or [])
    page = (HTML_TEMPLATE
            .replace("@@CSS@@", CSS_TEMPLATE)
            .replace("@@THEME@@", THEME_SCRIPT)
            .replace("@@JS@@", JS_TEMPLATE.replace("@@COUNT@@", str(slide_count)))
            .replace("@@TITLE@@", html.escape(title))
            .replace("@@DECK@@", html.escape(Path(deck_path).stem))
            .replace("@@COUNT@@", str(slide_count))
            .replace("@@BUILT@@", str(built))
            .replace("@@SLIDEV@@", json.dumps(versions))
            .replace("@@BANNER@@", banner)
            .replace("@@STRIP@@", "".join(strip_html)))
    # user-derived content is injected last so it can never be re-substituted
    payload = json.dumps({"count": slide_count, "shapes": data},
                         ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
    return (page.replace("@@SHAPES@@", "".join(shapes_html))
                .replace("@@DATA@@", payload))


# ------------------------------------------------------- powerpoint rendering --

def _is_com_busy(exc):
    """True for the "wait and retry" COM failures (PowerPoint is busy)."""
    text = str(exc).lower()
    return ("rejected by callee" in text or "call was rejected" in text
            or "-2147418111" in text or "0x80010001" in text
            or "server busy" in text or "应用程序正在忙" in text
            or "rpc_e_call_rejected" in text)


def _com_retry(fn, tries=4, wait=1.5):
    """Run a COM call, waiting out a busy PowerPoint instead of giving up.

    Opening a large deck or sharing the COM server with another client makes
    PowerPoint reject calls for a moment ("call was rejected by callee"); that is
    recoverable. Anything that is not a busy error is raised straight away.
    """
    import time as _time

    last = None
    for attempt in range(tries):
        try:
            return fn()
        except Exception as exc:
            if not _is_com_busy(exc) or attempt == tries - 1:
                raise
            last = exc
            _time.sleep(wait * (attempt + 1))
    raise last


def open_presentation(app, deck_path):
    """Open the deck read-only; retries while PowerPoint reports itself busy."""
    return _com_retry(lambda: app.Presentations.Open(
        str(Path(deck_path).resolve()), ReadOnly=True, WithWindow=False))


def export_slide(pres, n, out, width, height):
    """Export one slide; False means this slide keeps failing (the rest continue)."""
    try:
        _com_retry(lambda: pres.Slides(n).Export(str(out), "PNG", width, height))
        return True
    except Exception as exc:
        sys.stderr.write("[warn] slide %d 导出失败：%s: %s\n"
                         % (n, type(exc).__name__, exc))
        return False


def render_slides(deck_path, render_dir, size, force=False, progress=None):
    """Export every slide to <render_dir>/sNN.png through PowerPoint COM.

    Reuses PNGs that are already there unless *force* is set. *progress* is called
    as progress(done, total) after each slide. A slide that keeps failing is
    recorded and skipped rather than aborting the run, and the result says what
    happened:

        {"rendered": n, "reused": m, "total": t, "failed": [slide, ...], "error": str}
    """
    total = len(Presentation(str(deck_path)).slides)
    render_dir = Path(render_dir)
    render_dir.mkdir(parents=True, exist_ok=True)
    todo = [n for n in range(1, total + 1)
            if force or not (render_dir / ("s%02d.png" % n)).exists()]
    reused = total - len(todo)
    failed = []
    if not todo:
        return {"rendered": 0, "reused": reused, "total": total,
                "failed": failed, "error": ""}

    try:
        import win32com.client
    except ImportError:
        msg = "未安装 pywin32，无法导出底图"
        sys.stderr.write("[warn] %s。装好后重跑，或用 "
                         "--no-render --render-dir <含 sNN.png 的目录>。\n" % msg)
        return {"rendered": 0, "reused": reused, "total": total,
                "failed": list(todo), "error": msg}

    width, height = size
    app = None
    pres = None
    done = 0
    error = ""
    try:
        app = win32com.client.Dispatch("PowerPoint.Application")
        try:
            app.DisplayAlerts = 1        # ppAlertsNone: a dialog must never block COM
        except Exception:
            pass
        pres = open_presentation(app, deck_path)
        for n in todo:
            out = (render_dir / ("s%02d.png" % n)).resolve()
            if not export_slide(pres, n, out, width, height):
                failed.append(n)
                continue
            done += 1
            if progress is not None:
                try:
                    progress(done, len(todo))
                except Exception:
                    pass
            sys.stdout.write("\r  底图导出 %d/%d" % (done, len(todo)))
            sys.stdout.flush()
        sys.stdout.write("\n")
    except Exception as exc:
        error = "%s: %s" % (type(exc).__name__, exc)
        sys.stderr.write("\n[warn] PowerPoint 导出中断（%s）。已导出 %d 页。\n"
                         % (error, done))
    finally:
        try:
            if pres is not None:
                pres.Close()
        except Exception:
            pass
    if not error and failed:
        error = "%d 页导出失败（首个：第 %d 页）" % (len(failed), failed[0])
    return {"rendered": done, "reused": reused, "total": total,
            "failed": failed, "error": error}


# -------------------------------------------------------------------- serve --
#
# A local deck library: the selection page, drag-and-drop import, and the
# generated viewers, all on 127.0.0.1. A web page can never read an arbitrary
# local path, so importing works by *uploading* the file to this process, which
# then reuses the same render + export pipeline the CLI uses.

import functools      # noqa: E402  -- only the serve app needs these
import http.server    # noqa: E402
import socketserver   # noqa: E402
import threading      # noqa: E402
import time           # noqa: E402
import urllib.parse   # noqa: E402

MAX_UPLOAD = 1 << 30          # 1 GiB
LAUNCHER_HEAD = "deckpeek · 选择 PPT"


def slugify(name):
    """Filesystem-safe slug for a deck id ('PPT 评审 v2.pptx' -> 'PPT-评审-v2')."""
    s = re.sub(r"[^\w.\u4e00-\u9fff-]+", "-", (name or "").strip(), flags=re.U)
    s = s.strip("-._")
    return (s or "deck")[:60]


def read_deck_meta(deck_dir):
    """deck.json written by export(), or None when the folder has no metadata."""
    try:
        return json.loads((Path(deck_dir) / "deck.json").read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def write_deck_meta(deck_dir, **changes):
    """Patch deck.json in place -- used to flag "rendering" while a build runs."""
    meta = read_deck_meta(deck_dir) or {}
    meta.update(changes)
    try:
        (Path(deck_dir) / "deck.json").write_text(
            json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    except OSError:
        pass


class DeckWatcher(threading.Thread):
    """Re-render a deck as soon as the .pptx it was built from changes.

    Each mounted deck is stat()ed once per *interval* (10s by default). A change
    only triggers a rebuild once size+mtime have held still for *settle* seconds
    -- PowerPoint writes the file over a second or two and we must never render a
    half-written deck. Once a change is seen the watcher waits out that settle
    window inline instead of sleeping a whole scan first, so a save is picked up
    within one scan plus the settle time. Decks are rebuilt one at a time because
    PowerPoint COM is single-instance.
    """

    def __init__(self, app, interval=10.0, settle=1.5):
        threading.Thread.__init__(self, name="deck-watch", daemon=True)
        self.app = app
        self.interval = max(0.2, float(interval))
        self.settle = max(0.0, float(settle))
        self.stop_flag = threading.Event()
        self.seen = {}                     # slug -> (size, mtime, changed_at)

    def stop(self):
        self.stop_flag.set()

    def run(self):
        while not self.stop_flag.is_set():
            try:
                self.sweep()
            except Exception as exc:
                sys.stderr.write("[watch] %s: %s\n" % (type(exc).__name__, exc))
            self.stop_flag.wait(self.interval)

    def sweep(self):
        for slug, deck_dir in self.app.mounts().items():
            meta = read_deck_meta(deck_dir)
            if not meta or not meta.get("source"):
                continue
            src = Path(meta["source"])
            try:
                stat = src.stat()
            except OSError:
                continue
            key = (stat.st_size, round(stat.st_mtime, 3))
            built_key = (meta.get("source_size"), meta.get("source_mtime"))
            prev = self.seen.get(slug)

            if prev is not None and key == prev[0]:
                if key == built_key:
                    continue                             # nothing changed, nothing stale
                if time.time() - prev[1] < self.settle:
                    continue                             # still being written

            # Changed, stale from an earlier run, or a failed rebuild being
            # retried: wait out the settle window inline so the rebuild starts
            # now instead of one whole scan later.
            key = _wait_settled(src, key, self.settle)
            self.seen[slug] = (key, time.time())
            if key == built_key:
                continue                                 # already built from this revision
            self.rebuild(slug, Path(deck_dir), src)

    def rebuild(self, slug, deck_dir, src):
        with self.app.lock:
            if self.app.rendering:
                return                                   # COM is single-instance
            self.app.rendering = slug or "-"
        write_deck_meta(deck_dir, rendering=True)      # viewers show "正在重新渲染…"
        try:
            total = len(Presentation(str(src)).slides)
            sys.stdout.write("\n[watch] %s 变了，重新渲染 %d 页…\n" % (src.name, total))
            sys.stdout.flush()
            rnd = render_slides(src, deck_dir / "_render", self.app.size, force=True)
            res = export(src, deck_dir, deck_dir / "_render", {1, max(total, 1)})
            sys.stdout.write("[watch] %s 已更新：%d 页，底图 %d 张%s%s\n"
                             % (slug, res["slides"], res["pngs"],
                                ("，%d 页缺底图" % len(res["missing"])) if res["missing"] else "",
                                ("，%d 页导出失败" % len(rnd["failed"])) if rnd["failed"] else ""))
            sys.stdout.flush()
        except Exception as exc:
            sys.stderr.write("[watch] 重新渲染失败：%s: %s\n" % (type(exc).__name__, exc))
            write_deck_meta(deck_dir, rendering=False)   # clear the flag so the page settles
        finally:
            with self.app.lock:
                self.app.rendering = ""


class DeckApp:
    def __init__(self, decks_dir, extra_dirs=(), size=(1600, 900), port=8931,
                 verbose=False):
        self.decks_dir = Path(decks_dir)
        self.extra = [Path(p) for p in extra_dirs]
        self.size = size
        self.port = port
        self.verbose = verbose
        self.jobs = {}
        self.lock = threading.Lock()
        self.rendering = ""        # slug the watcher is re-rendering right now
        self.watcher = None
        self.decks_dir.mkdir(parents=True, exist_ok=True)

    # -- library ------------------------------------------------------------
    def mounts(self):
        """slug -> deck directory (its own index.html is the viewer)."""
        out = {}
        for d in list(self.decks_dir.iterdir() if self.decks_dir.is_dir() else []) + self.extra:
            try:
                if d.is_dir() and (d / "index.html").exists():
                    out[d.name] = d
            except OSError:
                continue
        return out

    def deck_list(self):
        items = []
        for slug, d in self.mounts().items():
            try:
                idx = d / "index.html"
                stat = idx.stat()
                slides = len(list((d / "slides").glob("s*.png"))) if (d / "slides").is_dir() else 0
                src = next((p for p in [d / "source.pptx"] + sorted(d.glob("*.pptx"))
                            if p.exists()), None)
                first = d / "slides" / "s01.png"
                items.append({
                    "slug": slug,
                    "name": src.stem if src else slug,
                    "slides": slides,
                    "bytes": stat.st_size,
                    "mtime": int(stat.st_mtime),
                    "thumb": ("/d/%s/slides/s01.png?v=%d" % (slug, int(stat.st_mtime)))
                             if first.exists() else "",
                    "url": "/d/%s/index.html" % slug,
                })
            except OSError:
                continue
        items.sort(key=lambda i: -i["mtime"])
        return items

    # -- import jobs --------------------------------------------------------
    def job_snapshot(self, jid):
        job = self.jobs.get(jid)
        with self.lock:
            return dict(job) if job else None

    def start_import(self, filename, stream, length):
        with self.lock:
            busy = [j for j in self.jobs.values() if j["state"] in ("queued", "running")]
        if busy:
            raise RuntimeError("已有导入在进行（%s），等它跑完再传。" % busy[0]["slug"])
        slug = slugify(Path(filename).stem)
        deck_dir = self.decks_dir / slug
        deck_dir.mkdir(parents=True, exist_ok=True)
        src = deck_dir / "source.pptx"
        got = 0
        with open(src, "wb") as fh:
            while got < length:
                chunk = stream.read(min(1 << 20, length - got))
                if not chunk:
                    break
                fh.write(chunk)
                got += len(chunk)
        jid = "j%d" % int(time.time() * 1000)
        with self.lock:
            self.jobs[jid] = {"id": jid, "slug": slug, "name": filename, "state": "queued",
                              "stage": "", "done": 0, "total": 0, "slides": 0, "bytes": got,
                              "url": "/d/%s/index.html" % slug, "error": ""}
        threading.Thread(target=self._run_import, args=(jid, src, deck_dir),
                         name="import-%s" % slug, daemon=True).start()
        return jid, slug, got

    def _run_import(self, jid, src, deck_dir):
        job = self.jobs[jid]

        def set(**kw):
            with self.lock:
                job.update(kw)

        try:
            import pythoncom
        except ImportError:
            pythoncom = None
        if pythoncom is not None:
            pythoncom.CoInitialize()          # COM on this worker thread
        try:
            set(state="running", stage="render")
            total = len(Presentation(str(src)).slides)
            set(total=total)
            rnd = render_slides(src, deck_dir / "_render", self.size, force=True,
                                progress=lambda done, tot: set(done=done, total=tot))
            set(stage="html")
            res = export(src, deck_dir, deck_dir / "_render", {1, max(total, 1)})
            missing = res["missing"]
            warning = ""
            if missing:
                warning = ("底图只有 %d/%d 页可用，缺 %d 页"
                           % (total - len(missing), total, len(missing)))
                if rnd["error"]:
                    warning += "（%s）" % rnd["error"]
                warning += "。形状数据没丢，「结构」模式仍可查看；把同一个 .pptx 再拖一次会重导底图。"
            set(state="done", stage="", slides=res["slides"], done=res["slides"],
                rendered=rnd["rendered"], missing=len(missing), warning=warning)
        except Exception as exc:
            set(state="error", error="%s: %s" % (type(exc).__name__, exc))
        finally:
            if pythoncom is not None:
                pythoncom.CoUninitialize()


class DeckHandler(http.server.SimpleHTTPRequestHandler):
    app = None
    server_version = "deckpeek"

    def log_message(self, fmt, *args):
        if self.app is not None and self.app.verbose:
            sys.stderr.write("[serve] %s\n" % (fmt % args))

    def end_headers(self):
        # Slide PNGs and the generated index.html are rewritten by every build
        # under the same names; without this a browser may answer from its own
        # cache and the viewer looks frozen even though the deck is fresh.
        if not any(b"cache-control" in line.lower() for line in self._headers_buffer):
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    # -- responses ----------------------------------------------------------
    def _send(self, body, ctype):
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    # -- routing ------------------------------------------------------------
    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path in ("/", "/index.html"):
            return self._send(render_launcher(self.app).encode("utf-8"),
                              "text/html; charset=utf-8")
        if path == "/api/decks":
            return self._json({"decks": self.app.deck_list()})
        m = re.match(r"^/api/jobs/([A-Za-z0-9_-]+)$", path)
        if m:
            snap = self.app.job_snapshot(m.group(1))
            if snap is None:
                return self._json({"error": "no such job"}, 404)
            return self._json(snap)
        m = re.match(r"^/d/([^/]+)/(.*)$", path)
        if m:
            return self._serve_deck(m.group(1), m.group(2))
        return self.send_error(404, "not found")

    def _serve_deck(self, slug, rel):
        d = self.app.mounts().get(urllib.parse.unquote(slug))
        if d is None:
            return self.send_error(404, "no such deck")
        root = d.resolve()
        target = (root / urllib.parse.unquote(rel or "index.html")).resolve()
        if target != root and root not in target.parents:
            return self.send_error(403, "forbidden")     # never leave the deck dir
        if target.is_dir():
            target = target / "index.html"
        if not target.exists():
            return self.send_error(404, "not found")
        self.directory = str(root)
        self.path = "/" + str(target.relative_to(root)).replace("\\", "/")
        return super().do_GET()

    def do_POST(self):
        if urllib.parse.urlparse(self.path).path != "/api/import":
            return self.send_error(404, "not found")
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        name = Path((q.get("name") or ["deck.pptx"])[0]).name or "deck.pptx"
        if not name.lower().endswith((".pptx", ".ppt")):
            return self._json({"error": "只支持 .pptx / .ppt"}, 415)
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        if length <= 0:
            return self._json({"error": "空文件"}, 400)
        if length > MAX_UPLOAD:
            return self._json({"error": "文件超过 1 GB"}, 413)
        try:
            jid, slug, got = self.app.start_import(name, self.rfile, length)
        except RuntimeError as exc:
            return self._json({"error": str(exc)}, 409)
        return self._json({"job": jid, "slug": slug, "bytes": got})


def render_launcher(app):
    """The selection page: drop zone + File System Access picker + deck library."""
    page = (LAUNCHER_TEMPLATE
            .replace("@@THEME@@", THEME_SCRIPT)
            .replace("@@PORT@@", str(app.port))
            .replace("@@DIR@@", html.escape(str(Path(app.decks_dir).resolve())))
            .replace("@@TITLE@@", LAUNCHER_HEAD))
    payload = json.dumps(app.deck_list(), ensure_ascii=False,
                         separators=(",", ":")).replace("<", "\\u003c")
    return page.replace("@@DECKS@@", payload)


def ensure_streams():
    """A --noconsole build has no stdout/stderr; point them at a log file beside the exe.

    Without this every print() in a windowed exe would raise AttributeError -- and
    there would be no way to see the served URL at all. Falls back to a null sink if
    the log cannot be opened (e.g. the exe sits in a read-only folder).
    """
    import os

    sink = None
    for name in ("stdout", "stderr"):
        if getattr(sys, name, None) is not None:
            continue
        if sink is None:
            try:
                sink = open(base_dir() / "deckpeek.log", "a", encoding="utf-8")
            except OSError:
                sink = open(os.devnull, "w", encoding="utf-8")
        setattr(sys, name, sink)


class TrayApp:
    """A system-tray icon for the serve app: no console window, click to open the page.

    Plain Win32 through pywin32 (already a dependency): a hidden window receives the
    tray callback and owns the context menu. The icon comes from the exe itself, or
    from deckpeek.ico next to it, or from the system default -- never from a data file
    that would have to be bundled.
    """

    WM_TRAY = 0x0400 + 20          # WM_APP + 20
    CLASS = "DeckpeekTrayWindow"
    MENU_OPEN = 1                  # 右键菜单：打开面板
    MENU_QUIT = 2                  # 右键菜单：退出
    LABEL_OPEN = "打开 deckpeek 面板"
    LABEL_QUIT = "退出"

    def __init__(self, title, url, on_quit=None):
        self.title = title
        self.url = url
        self.on_quit = on_quit
        self.hwnd = None
        self.icon = None

    # -- icon ---------------------------------------------------------------
    def _load_icon(self):
        import win32con
        import win32gui

        if getattr(sys, "frozen", False):                 # use the icon baked into the exe
            try:
                large, _small = win32gui.ExtractIconEx(sys.executable, 0)
                if large:
                    return large[0]
            except Exception:
                pass
        for path in (base_dir() / "deckpeek.ico",):
            try:
                if path.exists():
                    return win32gui.LoadImage(0, str(path), win32con.IMAGE_ICON, 0, 0,
                                              win32con.LR_LOADFROMFILE | win32con.LR_DEFAULTSIZE)
            except Exception:
                pass
        return win32gui.LoadIcon(0, win32con.IDI_APPLICATION)

    # -- window plumbing ----------------------------------------------------
    def _wndproc(self, hwnd, msg, wparam, lparam):
        import win32con
        import win32gui

        if msg == self.WM_TRAY:
            if lparam in (win32con.WM_LBUTTONUP, win32con.WM_LBUTTONDBLCLK):
                self._open()
            elif lparam in (win32con.WM_RBUTTONUP, win32con.WM_CONTEXTMENU):
                self._popup()
        elif msg == win32con.WM_COMMAND:
            cmd = wparam & 0xFFFF
            if cmd == self.MENU_OPEN:
                self._open()
            elif cmd == self.MENU_QUIT:
                self._quit()
        elif msg == win32con.WM_DESTROY:
            self._remove_icon()
            win32gui.PostQuitMessage(0)
        return win32gui.DefWindowProc(hwnd, msg, wparam, lparam)

    def _build_menu(self):
        """Exactly two commands: open the deckpeek panel, and exit."""
        import win32con
        import win32gui

        menu = win32gui.CreatePopupMenu()
        win32gui.AppendMenu(menu, win32con.MF_STRING, self.MENU_OPEN, self.LABEL_OPEN)
        win32gui.AppendMenu(menu, win32con.MF_SEPARATOR, 0, "")
        win32gui.AppendMenu(menu, win32con.MF_STRING, self.MENU_QUIT, self.LABEL_QUIT)
        return menu

    def _popup(self):
        import win32con
        import win32gui

        menu = self._build_menu()
        x, y = win32gui.GetCursorPos()
        win32gui.SetForegroundWindow(self.hwnd)
        win32gui.TrackPopupMenu(menu, win32con.TPM_LEFTALIGN, x, y, 0, self.hwnd, None)
        win32gui.PostMessage(self.hwnd, win32con.WM_NULL, 0, 0)
        win32gui.DestroyMenu(menu)

    def _open(self):
        try:
            webbrowser.open(self.url)
        except Exception:
            pass

    def _quit(self):
        import win32gui

        try:
            win32gui.DestroyWindow(self.hwnd)      # -> WM_DESTROY -> leaves the loop
        except Exception:
            win32gui.PostQuitMessage(0)           # window already gone: still leave the loop

    def _remove_icon(self):
        try:
            import win32gui

            win32gui.Shell_NotifyIcon(win32gui.NIM_DELETE, (self.hwnd, 0))
        except Exception:
            pass

    # -- lifecycle ----------------------------------------------------------
    def run(self):
        """Create the icon and pump messages until 退出 is chosen."""
        import win32api
        import win32con
        import win32gui

        wc = win32gui.WNDCLASS()
        wc.hInstance = win32api.GetModuleHandle(None)
        wc.lpszClassName = self.CLASS
        wc.lpfnWndProc = self._wndproc
        try:
            win32gui.RegisterClass(wc)
        except win32gui.error:
            pass
        self.hwnd = win32gui.CreateWindow(self.CLASS, self.title, 0, 0, 0, 0, 0,
                                          0, 0, wc.hInstance, None)
        self.icon = self._load_icon()
        win32gui.Shell_NotifyIcon(
            win32gui.NIM_ADD,
            (self.hwnd, 0, win32gui.NIF_ICON | win32gui.NIF_MESSAGE | win32gui.NIF_TIP,
             self.WM_TRAY, self.icon, self.title))
        try:                                   # one-off balloon: "I am down here"
            win32gui.Shell_NotifyIcon(
                win32gui.NIM_MODIFY,
                (self.hwnd, 0, win32gui.NIF_INFO, self.WM_TRAY, self.icon, self.title,
                 "已在系统托盘运行 —— 右键图标可打开面板", 3000, "deckpeek"))
        except Exception:
            pass
        win32gui.PumpMessages()
        if self.on_quit is not None:
            try:
                self.on_quit()
            except Exception:
                pass


def run_tray(decks_dir, extra_dirs=(), size=(1600, 900), port=8931, host="127.0.0.1",
             watch=True, watch_interval=10.0, open_browser=True):
    """Serve in the background and live in the system tray (used by the windowed build).

    Opens the panel on startup (that is the point of launching it), which --no-open
    suppresses. A tray app must never die because a port was taken, so a busy port
    walks up to the next free one instead of failing.
    """
    app = DeckApp(decks_dir, extra_dirs, size, port)

    class BoundHandler(DeckHandler):
        pass

    BoundHandler.app = app
    socketserver.ThreadingTCPServer.allow_reuse_address = (sys.platform != "win32")
    socketserver.ThreadingTCPServer.daemon_threads = True
    httpd = None
    for candidate in range(port, port + 20):
        try:
            httpd = socketserver.ThreadingTCPServer((host, candidate), BoundHandler)
            port = candidate
            break
        except OSError:
            continue
    if httpd is None:
        sys.stderr.write("端口 %d 起不来（%d 个端口都被占）。\n" % (port, 20))
        return 1

    if watch:
        app.watcher = DeckWatcher(app, interval=watch_interval)
        app.watcher.start()
    url = "http://%s:%d/" % (host, port)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    print("deckpeek（托盘）: %s" % url)
    print("deck 目录       : %s" % Path(decks_dir).resolve())
    if watch:
        print("自动刷新        : 开（每 %.0fs 扫描一次源 .pptx，打开的页面同步刷新）"
              % watch_interval)
    print("右键托盘图标    : %s / %s" % (TrayApp.LABEL_OPEN, TrayApp.LABEL_QUIT))
    if open_browser:
        try:
            ok = webbrowser.open(url)
        except Exception as exc:
            ok = False
            print("打开面板出错    : %s: %s" % (type(exc).__name__, exc))
        if ok:
            print("已打开面板      : %s" % url)
    else:
        print("未自动打开面板  : --no-open（右键托盘图标可打开）")
    sys.stdout.flush()

    def shutdown():
        if app.watcher is not None:
            app.watcher.stop()
        try:
            httpd.shutdown()          # stop the serving loop
        except Exception:
            pass
        try:
            httpd.server_close()      # ...and release the port
        except Exception:
            pass

    try:
        from win32com.client import Dispatch  # noqa: F401  (proves pywin32 is importable)
    except ImportError:
        sys.stderr.write("[warn] 未安装 pywin32，无法使用系统托盘；改用 --serve。\n")
        return run_serve_app(decks_dir, extra_dirs, size, port, host, False, False,
                             watch, watch_interval)

    TrayApp("deckpeek — %s" % url, url, on_quit=shutdown).run()
    return 0


def run_serve_app(decks_dir, extra_dirs=(), size=(1600, 900), port=8931,
                  host="127.0.0.1", open_browser=True, verbose=False,
                  watch=True, watch_interval=10.0):
    app = DeckApp(decks_dir, extra_dirs, size, port, verbose)

    class BoundHandler(DeckHandler):
        pass

    BoundHandler.app = app
    # SO_REUSEADDR means "reuse a TIME_WAIT socket" on Unix, but on Windows it lets a
    # second process bind an already-used port and then split connections with it --
    # which shows up as random connection resets. Only set it where it is safe.
    socketserver.ThreadingTCPServer.allow_reuse_address = (sys.platform != "win32")
    socketserver.ThreadingTCPServer.daemon_threads = True
    try:
        httpd = socketserver.ThreadingTCPServer((host, port), BoundHandler)
    except OSError as exc:
        sys.stderr.write("端口 %d 起不来（%s）。换一个：--port %d\n"
                         % (port, exc, port + 1))
        return 1

    url = "http://%s:%d/" % (host, port)
    print("-" * 72)
    print("deckpeek 选择页 : %s" % url)
    print("deck 目录       : %s" % Path(decks_dir).resolve())
    decks = app.deck_list()
    if decks:
        for d in decks:
            print("  已有          : %-20s %3d 页  %s" % (d["slug"], d["slides"], d["url"]))
    else:
        print("  已有          : （空，把 .pptx 拖到选择页即可导入）")
    print("Ctrl+C 停止")
    print("-" * 72)
    if watch:
        app.watcher = DeckWatcher(app, interval=watch_interval)
        app.watcher.start()
        print("  自动刷新      : 开 —— 每 %.0fs 扫描一次源 .pptx，写稳 %.0fs 后重渲染，"
              "已打开的页面同步刷新" % (watch_interval, 1.5))
    else:
        print("  自动刷新      : 关（--no-watch）")
    if open_browser:
        try:
            webbrowser.open(url)
        except Exception:
            pass
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  已停止")
    finally:
        if app.watcher is not None:
            app.watcher.stop()
        httpd.server_close()
    return 0


# ---------------------------------------------------------------------- main --

def base_dir():
    """"Next to the program" -- the exe's folder when frozen, else this file's.

    A PyInstaller one-file build runs from a temp unpack dir, so __file__ would
    point inside it; defaults such as preview/ or decks/ have to sit beside the exe.
    """
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def pick_deck(arg):
    if arg:
        p = Path(arg)
        if not p.exists():
            sys.stderr.write("deck not found: %s\n" % p)
            return None
        return p
    here = base_dir()
    candidates = sorted(here.glob("*.pptx"))
    if len(candidates) == 1:
        return candidates[0]
    sys.stderr.write("请指定 .pptx（%s 下找到 %d 个）\n" % (here, len(candidates)))
    return None


def parse_size(text):
    m = re.match(r"^(\d+)\s*[xX*]\s*(\d+)$", text.strip())
    if not m:
        raise argparse.ArgumentTypeError("尺寸要写成 1600x900")
    return int(m.group(1)), int(m.group(2))


def _wait_settled(path, key, settle=1.5, timeout=30.0):
    """Return (size, mtime) once it has held still for *settle* seconds.

    PowerPoint writes the file over a second or two; rendering in the middle of
    that would read a half-written deck.
    """
    start = time.time()
    stable_since = time.time()
    while time.time() - start < timeout:
        time.sleep(0.3)
        try:
            st = path.stat()
        except OSError:
            return key
        cur = (st.st_size, round(st.st_mtime, 3))
        if cur != key:
            key, stable_since = cur, time.time()
        elif time.time() - stable_since >= settle:
            return key
    return key


def watch_one(deck_path, out_dir, size, interval=10.0):
    """--watch without --serve: rebuild this deck whenever its source changes.

    Over file:// a page cannot poll deck.json, so after a rebuild you refresh the
    browser yourself; with --serve the open viewer reloads on its own.
    """
    print("盯住 %s —— 一变就重新渲染，Ctrl+C 停止。" % deck_path)
    print("（想让页面自己刷新就用 --serve：file:// 下浏览器不允许这种轮询）")
    last = None
    try:
        while True:
            try:
                st = Path(deck_path).stat()
            except OSError as exc:
                sys.stderr.write("[watch] 读取源文件失败：%s\n" % exc)
                time.sleep(max(0.5, interval))
                continue
            key = (st.st_size, round(st.st_mtime, 3))
            if last is not None and key != last:
                key = _wait_settled(Path(deck_path), key)
                try:
                    total = len(Presentation(str(deck_path)).slides)
                    render_slides(deck_path, out_dir / "_render", size, force=True)
                    res = export(deck_path, out_dir, out_dir / "_render",
                                 {1, max(total, 1)})
                    print("[watch] 已重建：%d 页（built=%s）—— 刷新浏览器即可看到"
                          % (res["slides"], res["built"]))
                except Exception as exc:
                    sys.stderr.write("[watch] 重建失败：%s: %s\n"
                                     % (type(exc).__name__, exc))
            last = key
            time.sleep(max(0.2, interval))
    except KeyboardInterrupt:
        print("\n  已停止")
    return 0


def main(argv=None):
    frozen = bool(getattr(sys, "frozen", False))   # running as a packaged exe
    ensure_streams()
    here = base_dir()
    ap = argparse.ArgumentParser(
        prog="deckpeek",
        description="把 .pptx 导出成可翻页、可点选、可复制元素描述的 HTML 查看器；"
                    "--serve 起本机选择页，--tray 常驻系统托盘。")
    ap.add_argument("pptx", nargs="?", default=None,
                    help="源 deck（默认：程序同目录下唯一的 .pptx）")
    ap.add_argument("-o", "--out", default=str(here / "preview"),
                    help="输出目录（默认 %(default)s）")
    ap.add_argument("--render-dir", default=None,
                    help="底图 PNG 目录（默认 <out>/_render）")
    ap.add_argument("--no-render", action="store_true",
                    help="不调用 PowerPoint，只用 --render-dir 里已有的底图")
    ap.add_argument("--force-render", action="store_true",
                    help="即使 PNG 已存在也重新导出")
    ap.add_argument("--size", type=parse_size, default=(1600, 900),
                    help="底图像素尺寸（默认 %(default)s）")
    ap.add_argument("--serve", action="store_true",
                    help="起本机选择页（拖拽导入 + deck 列表）；给了 deck 就先构建再起")
    ap.add_argument("--tray", action="store_true",
                    help="常驻系统托盘：不起控制台窗口，启动即打开面板，右键菜单为「%s / %s」"
                         % (TrayApp.LABEL_OPEN, TrayApp.LABEL_QUIT))
    ap.add_argument("--no-open", action="store_true",
                    help="启动时不自动打开面板页面（托盘版默认会自动打开）")
    ap.add_argument("--port", type=int, default=8931, help="--serve 的端口（默认 %(default)s）")
    ap.add_argument("--decks-dir", default=str(here / "decks"),
                    help="--serve 里导入的 deck 存放目录（默认 %(default)s）")
    ap.add_argument("--watch", action="store_true",
                    help="盯着源 .pptx，一变就重新渲染（配 --serve 时页面会自动刷新）")
    ap.add_argument("--watch-interval", type=float, default=10.0,
                    help="扫描源文件变化的间隔秒数（默认 %(default)s；一次 stat 很廉价）")
    ap.add_argument("--no-watch", action="store_true",
                    help="--serve 时不启用自动重渲染")
    ap.add_argument("--open", dest="open_browser", action="store_true",
                    help="生成后用 file:// 打开浏览器")
    args = ap.parse_args(argv)

    out_dir = Path(args.out)
    decks_dir = Path(args.decks_dir)

    # tray mode: a packaged exe started with no arguments just lives in the tray
    # (clicking the exe is the normal way to start it); --tray asks for it explicitly.
    # A frozen app has no meaningful "auto-pick a deck" default anyway, and a launcher
    # shell may hand us inherited stdio, so stdio is not a reliable signal here.
    no_cli_args = not list(argv if argv is not None else sys.argv[1:])
    if args.tray or (frozen and no_cli_args):
        return run_tray(decks_dir, [out_dir], args.size, args.port,
                        watch=not args.no_watch, watch_interval=args.watch_interval,
                        open_browser=not args.no_open)

    # --serve with no deck: just open the library, do not rebuild anything
    if args.serve and args.pptx is None:
        print("deckpeek · 选择页模式（不构建 deck）")
        return run_serve_app(decks_dir, [out_dir], args.size, args.port,
                             watch=not args.no_watch,
                             watch_interval=args.watch_interval)

    deck_path = pick_deck(args.pptx)
    if deck_path is None:
        return 2

    render_dir = Path(args.render_dir) if args.render_dir else out_dir / "_render"

    print("=" * 72)
    print("deckpeek")
    print("  deck        : %s" % deck_path)
    print("  output      : %s" % out_dir.resolve())

    if args.no_render:
        rnd = {"rendered": 0, "reused": 0, "total": None, "failed": [], "error": ""}
    else:
        print("  底图目录    : %s" % render_dir)
        rnd = render_slides(deck_path, render_dir, args.size, force=args.force_render)

    report_slides = {1, 57}
    try:
        n_slides = len(Presentation(str(deck_path)).slides)
    except Exception:
        n_slides = 0
    if n_slides:
        report_slides.add(n_slides)

    result = export(deck_path, out_dir, render_dir, report_slides)

    print("  slides      : %d" % result["slides"])
    print("  slide PNGs  : %d" % result["pngs"])
    if not args.no_render:
        print("  底图导出    : %d 新导出 / %d 复用" % (rnd["rendered"], rnd["reused"]))
        if rnd["error"]:
            print("  底图告警    : %s" % rnd["error"])
    print("  media files : %d  (deduped by sha1 of bytes)" % result["media"])
    print("  shapes      : %d" % stats["shapes"])
    print("  errors      : %d" % stats["errors"])
    print("  warnings    : %d" % stats["warned"])
    print("  index.html  : %.1f KB" % (result["index_bytes"] / 1024.0))
    print("-" * 72)
    print("geometry sanity check (inches; slide = 13.33 x 7.50 in)")
    last = None
    for (sn, z, name, typ, l, t, w, h) in result["geo_report"]:
        if last is not None and sn != last:
            print("")
        last = sn
        ok = (l >= 0 and t >= 0 and w >= 0 and h >= 0
              and l + w <= 13.334 and t + h <= 7.501)
        print("  slide %-3d z=%-2d %-11s %-24s L=%.2f T=%.2f W=%.2f H=%.2f  %s"
              % (sn, z, typ, name[:24], l, t, w, h,
                 "OK" if ok else "OUT-OF-BOUNDS"))
    print("=" * 72)

    missing = result["missing"]
    if missing:
        print("!" * 72)
        print("[x] 缺 %d 页底图：%s 下没有对应的 sNN.png"
              % (len(missing), Path(render_dir).resolve()))
        if rnd.get("error"):
            print("    上次导出报错：%s" % rnd["error"])
        print("    常见原因：本机没装 PowerPoint；COM 被占用或被拦截；"
              "或用了 --no-render 但目录里没有现成底图")
        print("    修复：去掉 --no-render 重跑，或加 --force-render，"
              "或用 --render-dir 指向已有 PNG 的目录")
        print("    说明：形状数据没丢，「结构」模式仍可查看；底图模式会空着")
        print("!" * 72)

    index = out_dir / "index.html"
    if args.serve:
        return run_serve_app(decks_dir, [out_dir], args.size, args.port,
                             watch=not args.no_watch,
                             watch_interval=args.watch_interval)
    print("打开：%s" % index.resolve())
    if args.open_browser:
        webbrowser.open(index.resolve().as_uri())
    if args.watch:
        return watch_one(deck_path, out_dir, args.size, args.watch_interval)
    return 1 if (stats["errors"] or missing) else 0


# ---------------------------------------------------------------- templates --

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>@@TITLE@@</title>
@@THEME@@
<style>
@@CSS@@
</style>
</head>
<body class="mode-bg" data-deck-built="@@BUILT@@">
<header id="bar">
  <a id="btn-home" href="/" title="返回首页（deck 列表）" aria-label="返回首页">
    <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/></svg>
  </a>
  <div class="brand" title="@@DECK@@">
    <svg class="mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg><span class="name">@@DECK@@</span>
  </div>
  <div class="seg" role="tablist" aria-label="视图模式">
    <button id="m-bg" role="tab" aria-selected="true" class="on" title="底图模式 (1)">底图</button>
    <button id="m-struct" role="tab" aria-selected="false" title="结构模式 (2)">结构</button>
  </div>
  <div class="nav">
    <button id="btn-prev" class="sq" title="上一页 (← / PageUp)" aria-label="上一页">&#8249;</button>
    <input id="jump" type="number" min="1" max="@@COUNT@@" value="1"
      title="跳转到页码" aria-label="页码">
    <span id="pos">1 / @@COUNT@@</span>
    <button id="btn-next" class="sq" title="下一页 (→ / PageDown)" aria-label="下一页">&#8250;</button>
  </div>
  <span id="info" class="muted"></span>
  <span class="spacer"></span>
  <button id="btn-refresh" class="ghost" title="重新拉取本页底图，绕开浏览器缓存 (R)">刷新本页</button>
  <button id="btn-all" class="ghost" title="选中本页全部元素 (Ctrl/&#8984;+A)">全选本页</button>
  <button id="btn-theme" class="ghost sq" title="切到浅色 (T)" aria-label="切换主题"
    aria-pressed="false">
    <svg class="ic ic-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    <svg class="ic ic-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
  </button>
  <button id="btn-focus" class="ghost sq" title="专注模式 (F)" aria-label="专注模式"
    aria-pressed="false">
    <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
      <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
  </button>
</header>
@@BANNER@@
<div id="main">
  <div id="stagewrap">
    <div id="sizer">
      <div id="stage">
        <img id="bg" alt="">
        <div id="shapes">@@SHAPES@@</div>
        <div id="marquee"></div>
        <div id="badges" aria-hidden="true"></div>
        <div id="hoverbox"></div>
        <div id="selbox"></div>
      </div>
    </div>
  </div>
</div>
<aside id="panel">
  <section class="card">
    <div class="hd">元素描述<span id="copied" role="status" aria-live="polite"></span></div>
    <textarea id="desc" readonly spellcheck="false"
      placeholder="点选幻灯片里的元素：Ctrl/&#8984; 点击多选，Shift 点击连选，右键拖动框选…"></textarea>
    <div class="row">
      <button id="btn-copy" class="primary">复制描述</button>
      <button id="btn-clear" class="ghost">取消选中</button>
      <span id="cnt" class="muted"></span>
    </div>
  </section>
  <section class="card">
    <div class="hd">属性<span id="selinfo"></span></div>
    <div id="detail" class="detail"><div class="empty">未选中元素</div></div>
  </section>
  <section class="card keys">
    <div class="hd">操作</div>
    <div class="kv"><span>点选</span><em><kbd>单击</kbd></em></div>
    <div class="kv"><span>多选 / 连选</span>
      <em><kbd>Ctrl/&#8984; 点击</kbd><kbd>Shift 点击</kbd></em></div>
    <div class="kv"><span>框选</span><em><kbd>右键拖动</kbd></em></div>
    <div class="kv"><span>全选本页</span><em><kbd>Ctrl/&#8984;</kbd><kbd>A</kbd></em></div>
    <div class="kv"><span>翻页</span><em><kbd>&#8592;</kbd><kbd>&#8594;</kbd></em></div>
    <div class="kv"><span>刷新本页</span><em><kbd>R</kbd></em></div>
    <div class="kv"><span>底图 / 结构</span><em><kbd>1</kbd><kbd>2</kbd></em></div>
    <div class="kv"><span>专注模式</span><em><kbd>F</kbd></em></div>
    <div class="kv"><span>取消选中</span><em><kbd>Esc</kbd></em></div>
  </section>
</aside>
<div id="strip" role="tablist" aria-label="幻灯片"><div class="inner">@@STRIP@@</div></div>
<div id="tip" role="tooltip"></div>
<div id="toast" role="status" aria-live="polite"></div>
<textarea id="copybuf" readonly spellcheck="false" aria-hidden="true"
  style="position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0"></textarea>
<script id="shapedata" type="application/json">@@DATA@@</script>
<script>
@@JS@@
</script>
</body>
</html>
"""

CSS_TEMPLATE = """
:root{
  /* Kimi brand */
  --brand:#007CFF; --brand-hi:#2B93FF; --brand-deep:#002F5B; --brand-ink:#fff;
  /* dark theme (default) */
  --bg:#05121F; --panel-bg:#081A2B;
  --card:rgba(255,255,255,.03); --card-hi:rgba(255,255,255,.07);
  --btn:rgba(255,255,255,.04); --btn-hi:rgba(255,255,255,.09); --kbd:rgba(255,255,255,.03);
  --line:rgba(255,255,255,.08); --line-hi:rgba(255,255,255,.16);
  --fg:#E8EEF6; --fg-dim:#93A9C2; --fg-mute:#67809A;
  --ok:#4ADE80; --warn:#FBBF5B;
  --field:#05121F; --desc-ink:#C8DFF6; --code:#8CC6FF; --run:#A9E6C6;
  --pop:#0B1F33; --pop-shadow:0 8px 20px rgba(0,0,0,.5);
  --thumb:#04101C; --ring:rgba(5,18,31,.85); --scroll:rgba(255,255,255,.12);
  --stage-shadow:0 8px 24px rgba(0,0,0,.5); --stage-line:transparent;
  --hover-outline:rgba(79,168,255,.6);
  --pill-bg:rgba(5,18,31,.8); --pill-ink:#E2E8F0;
  --banner-bg:rgba(251,191,91,.1); --banner-line:rgba(251,191,91,.4); --banner-ink:#FBD38D;
  --panel:360px; --strip:118px; --top:52px;
  --mono:ui-monospace,"Cascadia Mono",Consolas,"Courier New",monospace;
  /* one shared pace for every state change, so nothing snaps */
  --dur:.25s;
  --ease:background-color var(--dur) ease,border-color var(--dur) ease,
    color var(--dur) ease,opacity var(--dur) ease,box-shadow var(--dur) ease;
  color-scheme:dark;
}
/* ---------- light theme ---------- */
html.light{
  color-scheme:light;
  --brand-hi:#0066D6;
  --bg:#F1F4F8; --panel-bg:#FFFFFF;
  --card:#FFFFFF; --card-hi:#EEF2F7;
  --btn:#F1F5F9; --btn-hi:#E4EAF2; --kbd:#F1F5F9;
  --line:rgba(15,23,42,.12); --line-hi:rgba(15,23,42,.24);
  --fg:#0F172A; --fg-dim:#475569; --fg-mute:#64748B;
  --ok:#15803D; --warn:#B45309;
  --field:#FFFFFF; --desc-ink:#0F172A; --code:#0B5FCC; --run:#0F766E;
  --pop:#FFFFFF; --pop-shadow:0 8px 20px rgba(15,23,42,.16);
  --thumb:#F8FAFC; --ring:#FFFFFF; --scroll:rgba(15,23,42,.18);
  --stage-shadow:0 6px 18px rgba(15,23,42,.14); --stage-line:rgba(15,23,42,.10);
  --hover-outline:rgba(0,102,214,.55);
  --pill-bg:rgba(15,23,42,.72); --pill-ink:#F1F5F9;
  --banner-bg:#FEF6E7; --banner-line:#F0C36D; --banner-ink:#8A5A00;
}
*{box-sizing:border-box}
html,body{margin:0;height:100%;overflow:hidden;background:var(--bg);color:var(--fg);
  font:13px/1.5 system-ui,"Segoe UI","Microsoft YaHei",sans-serif;
  -webkit-font-smoothing:antialiased;transition:background-color var(--dur) ease,
  color var(--dur) ease}
button{font:inherit;color:var(--fg);background:var(--btn);border:1px solid var(--line);
  border-radius:6px;padding:5px 10px;cursor:pointer;transition:var(--ease)}
button:hover:not(:disabled){background:var(--btn-hi);border-color:var(--line-hi)}
button:disabled{opacity:.4;cursor:not-allowed}
:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
.ghost{background:transparent}
.ghost:hover:not(:disabled){background:var(--btn)}
.primary{background:var(--brand);border-color:var(--brand);color:var(--brand-ink);font-weight:500}
.primary:hover:not(:disabled){background:var(--brand-hi);border-color:var(--brand-hi)}
.sq{width:28px;padding:5px 0;display:inline-flex;align-items:center;justify-content:center}
.ic{width:15px;height:15px;display:block}
html:not(.light) .ic-sun{display:none}
html.light .ic-moon{display:none}
.muted{color:var(--fg-mute)}
kbd{font:11px/1 var(--mono);background:var(--kbd);border:1px solid var(--line);
  border-radius:4px;padding:3px 5px;color:var(--fg-dim);white-space:nowrap}
.spacer{flex:1}

/* ---------- top bar ---------- */
#bar{position:fixed;top:0;left:0;right:0;height:var(--top);display:flex;align-items:center;
  gap:8px;padding:0 12px;background:var(--panel-bg);border-bottom:1px solid var(--line);
  z-index:40;transition:var(--ease)}
.brand{display:flex;align-items:center;gap:8px;max-width:300px;margin-right:4px}
.brand .mark{width:16px;height:16px;flex:none;color:var(--brand)}
.brand .name{font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.seg{display:inline-flex;background:var(--card);border:1px solid var(--line);
  border-radius:8px;padding:2px;gap:2px}
.seg button{border:0;background:transparent;border-radius:6px;padding:4px 12px;font-weight:500;
  color:var(--fg-dim)}
.seg button:hover:not(.on){background:var(--card-hi);color:var(--fg)}
.seg button.on,.seg button.on:hover{background:var(--brand);color:var(--brand-ink)}
.nav{display:flex;align-items:center;gap:4px;background:var(--card);border:1px solid var(--line);
  border-radius:8px;padding:2px 4px}
.nav #pos{font-variant-numeric:tabular-nums;color:var(--fg-dim);white-space:nowrap;
  min-width:72px;text-align:center;font-size:12px}
.nav button{border-color:transparent;background:transparent;color:var(--fg-dim)}
.nav button:hover:not(:disabled){background:var(--card-hi);border-color:transparent;color:var(--fg)}
input#jump{width:52px;font:inherit;font-variant-numeric:tabular-nums;text-align:center;
  background:transparent;color:var(--fg);border:1px solid transparent;border-radius:6px;
  padding:4px;transition:background-color var(--dur) ease,border-color var(--dur) ease}
input#jump:hover{background:var(--card-hi)}
input#jump:focus{border-color:var(--brand);background:var(--field);outline:none}
#info{font-size:12px;white-space:nowrap}

/* ---------- stage ---------- */
#main{position:fixed;top:var(--top);left:0;right:var(--panel);bottom:var(--strip);
  overflow:hidden;background:var(--bg);transition:background-color var(--dur) ease}
#stagewrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  overflow:hidden}
#sizer{position:relative}
#stage{position:absolute;left:0;top:0;width:1280px;height:720px;transform-origin:0 0;
  background:#fff;border-radius:3px;box-shadow:var(--stage-shadow);
  outline:1px solid var(--stage-line);outline-offset:0;transition:box-shadow var(--dur) ease}
#bg{position:absolute;left:0;top:0;width:1280px;height:720px;display:block}
body.mode-struct #bg{display:none}
#stage.noimg #bg{display:none}
/* placeholder only in 底图 mode -- in 结构 mode the rebuilt shapes are the view */
body.mode-bg #stage.noimg::after{content:"该页没有底图（缺少 slides/sNN.png）";
  position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;
  display:flex;align-items:center;justify-content:center;
  color:#8A94A6;font-size:15px;background:#F7F8FA}
#shapes{position:absolute;left:0;top:0;width:1280px;height:720px}
.slide{position:absolute;left:0;top:0;width:1280px;height:720px;display:none}
.slide.on{display:block}
/* a transparent outline in the base state keeps the 0.25s colour fade from
   shifting anything (outline-width changes would reflow the shape) */
.sh{position:absolute;overflow:visible;cursor:pointer;outline:2px solid transparent;
  outline-offset:0;transition:outline-color var(--dur) ease}
.sh:hover{outline-color:var(--hover-outline)}
.sh.sel{outline-color:var(--brand)}
.sh > *{pointer-events:none}
.sh.err{background:rgba(255,90,90,.22);border:1px dashed #FF6B6B}
body.mode-bg .sh:not(.err){background:transparent !important;
  border-color:transparent !important;color:transparent !important}
body.mode-bg .sh > *{visibility:hidden}
/* the primary selection box glides from shape to shape instead of jumping */
#selbox{position:absolute;display:none;pointer-events:none;z-index:5;
  outline:2px solid var(--brand);outline-offset:0;transform-origin:50% 50%;
  transition:left var(--dur) ease,top var(--dur) ease,width var(--dur) ease,
    height var(--dur) ease,transform var(--dur) ease}
/* selection order badges -- the number matches the line number in #desc */
#badges{position:absolute;left:0;top:0;width:1280px;height:720px;pointer-events:none;z-index:6}
.nbadge{position:absolute;min-width:17px;height:17px;padding:0 4px;border-radius:5px;
  background:var(--brand);color:var(--brand-ink);font-size:11px;font-weight:600;line-height:17px;
  font-variant-numeric:tabular-nums;text-align:center;
  box-shadow:0 0 0 2px var(--ring);transform:translate(-40%,-40%);
  animation:badge-in var(--dur) ease-out}
@keyframes badge-in{
  from{opacity:0;transform:translate(-40%,-40%) scale(.55)}
  to{opacity:1;transform:translate(-40%,-40%) scale(1)}
}

/* ---------- right-drag marquee ---------- */
#marquee{position:absolute;display:none;pointer-events:none;z-index:4;
  border:1px solid var(--brand);border-radius:2px;background:rgba(0,124,255,.12)}
html.light #marquee{background:rgba(0,124,255,.10)}
body.banding #stage{cursor:crosshair}

/* ---------- back to the deck library ---------- */
#btn-home{display:none;width:28px;height:26px;flex:none;align-items:center;
  justify-content:center;border:1px solid var(--line);border-radius:6px;background:var(--btn);
  color:var(--fg-dim);text-decoration:none;transition:var(--ease)}
#btn-home:hover{background:var(--btn-hi);border-color:var(--line-hi);color:var(--fg)}
#btn-home.on{display:inline-flex}

/* ---------- selection: translucent fill + a slightly darker ring ---------- */
:root{--sel-fill:rgba(0,124,255,.16); --sel-ring:#007CFF}
html.light{--sel-fill:rgba(0,124,255,.12); --sel-ring:#0066D6}
.sh{transition:outline-color var(--dur) ease,background-color var(--dur) ease}
.sh.sel{background:var(--sel-fill);outline-color:var(--sel-ring)}
.sh.sel:hover{outline-color:var(--sel-ring)}
/* 底图 mode blanks the rebuilt styling, so the fill has to out-rank that rule */
body.mode-bg .sh:not(.err).sel{background:var(--sel-fill) !important}
/* the primary box jumps with the click instead of gliding */
#selbox{outline:2px solid var(--sel-ring);transition:none}
/* ---------- hover: one box that travels between shapes ---------- */
.sh:hover{outline-color:transparent}      /* the per-shape ring gives way to the box */
#hoverbox{position:absolute;opacity:0;pointer-events:none;z-index:3;
  outline:2px solid var(--hover-outline);outline-offset:0;transform-origin:50% 50%;
  transition:left var(--dur) ease,top var(--dur) ease,width var(--dur) ease,
    height var(--dur) ease,transform var(--dur) ease,opacity .2s ease}
#hoverbox.jump{transition:none}           /* first appearance: place it, then fade in */
/* only :hover fades -- paint() marks the tree with .snap so a click lands instantly */
html.snap .sh{transition:none}
html.snap .nbadge{animation:none}

/* ---------- right panel ---------- */
#panel{position:fixed;top:var(--top);right:0;bottom:0;width:var(--panel);
  background:var(--panel-bg);border-left:1px solid var(--line);overflow:auto;
  padding:12px;z-index:30;transition:var(--ease)}
#panel .card{background:var(--card);border:1px solid var(--line);border-radius:8px;
  padding:10px 11px;margin-bottom:10px}
#panel .hd{display:flex;align-items:center;gap:8px;font-weight:500;color:var(--fg-dim);
  margin-bottom:8px;font-size:12px}
#panel .hd #copied{font-weight:400;color:var(--ok);font-size:12px;margin-left:auto}
#panel .hd #selinfo{margin-left:auto;color:var(--fg-mute)}
#desc{width:100%;height:150px;resize:vertical;background:var(--field);color:var(--desc-ink);
  border:1px solid var(--line);border-radius:6px;padding:8px 9px;
  font:12px/1.55 var(--mono);white-space:pre;overflow:auto;
  transition:background-color var(--dur) ease,border-color var(--dur) ease,
    color var(--dur) ease}
#desc:focus{border-color:var(--brand);outline:none}
#panel .row{display:flex;align-items:center;gap:8px;margin-top:8px}
#panel .row #cnt{font-size:12px;margin-left:auto}
.detail{font-size:12px;line-height:1.6}
.detail .empty{color:var(--fg-mute)}
.detail .k{color:var(--fg-mute);display:inline-block;min-width:72px}
.detail .v{color:var(--fg);word-break:break-all}
.detail .blk{border-top:1px solid var(--line);margin-top:9px;padding-top:9px}
.detail .pr{margin:6px 0 0 0;padding-left:9px;border-left:1px solid var(--line-hi)}
.detail .run{color:var(--run)}
.detail code{color:var(--code);font-family:var(--mono)}
.keys .kv{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:6px 0;
  color:var(--fg-dim);font-size:12px}
.keys .kv em{display:flex;gap:4px;font-style:normal}

/* ---------- thumbnail strip ---------- */
#strip{position:fixed;left:0;right:var(--panel);bottom:0;height:var(--strip);
  background:var(--panel-bg);border-top:1px solid var(--line);z-index:20;
  transition:var(--ease)}
#strip .inner{position:absolute;inset:0;overflow-x:auto;overflow-y:hidden;
  white-space:nowrap;padding:11px 11px 0}
.st{position:relative;display:inline-block;vertical-align:top;margin-right:8px;padding:0;
  border:1px solid var(--line);background:var(--thumb);border-radius:6px;overflow:hidden;
  width:160px;height:90px;transition:border-color var(--dur) ease,box-shadow var(--dur) ease}
.st:hover{border-color:var(--line-hi)}
.st img{display:block;width:100%;height:100%;object-fit:contain;opacity:.85;
  transition:opacity var(--dur) ease}
.st i{position:absolute;left:5px;bottom:5px;font-style:normal;font-size:11px;
  font-variant-numeric:tabular-nums;color:var(--pill-ink);background:var(--pill-bg);
  border:1px solid var(--line);border-radius:4px;padding:0 5px;line-height:16px;
  transition:background-color var(--dur) ease,border-color var(--dur) ease,
    color var(--dur) ease}
.st.on{border-color:var(--brand);box-shadow:0 0 0 1px var(--brand)}
.st.on img{opacity:1}
.st.on i{background:var(--brand);border-color:var(--brand);color:var(--brand-ink);font-weight:600}
#strip .inner::-webkit-scrollbar{height:8px}
#strip .inner::-webkit-scrollbar-track{background:transparent}
#strip .inner::-webkit-scrollbar-thumb{background:var(--scroll);border-radius:4px}
#strip .inner::-webkit-scrollbar-thumb:hover{background:var(--line-hi)}
#panel::-webkit-scrollbar,#desc::-webkit-scrollbar{width:8px;height:8px}
#panel::-webkit-scrollbar-thumb,#desc::-webkit-scrollbar-thumb{
  background:var(--scroll);border-radius:4px}

/* ---------- overlays ---------- */
#tip{position:fixed;display:none;z-index:60;pointer-events:none;max-width:460px;
  background:var(--pop);border:1px solid var(--line-hi);border-radius:6px;padding:6px 9px;
  font-size:12px;line-height:1.5;color:var(--fg);box-shadow:var(--pop-shadow);
  white-space:pre-wrap}
#tip b{color:var(--code)}
#toast{position:fixed;left:50%;bottom:calc(var(--strip) + 16px);transform:translate(-50%,6px);
  z-index:70;pointer-events:none;opacity:0;
  transition:opacity var(--dur) ease,transform var(--dur) ease;
  background:var(--pop);border:1px solid var(--line-hi);border-radius:6px;padding:6px 12px;
  font-size:12px;color:var(--fg);box-shadow:var(--pop-shadow)}
#toast.on{opacity:1;transform:translate(-50%,0)}
#banner,#livebanner{position:fixed;top:calc(var(--top) + 10px);left:50%;transform:translateX(-50%);
  z-index:50;background:var(--banner-bg);border:1px solid var(--banner-line);
  color:var(--banner-ink);border-radius:6px;padding:5px 12px;font-size:12px}
/* this banner carries the "how to fix it" text, so let it wrap and stay readable */
#banner,#livebanner{max-width:min(820px,92vw);white-space:normal;line-height:1.5;text-align:center}
#banner code{font-family:var(--mono);font-size:11px}
/* the live-refresh note stacks under the warning banner instead of covering it */
#livebanner{top:calc(var(--top) + 54px)}
/* a slide whose PNG is missing should read as "no preview", not as a broken glyph */
.st img.miss{visibility:hidden}

/* ---------- focus mode ---------- */
body.focus{--panel:0px;--strip:0px}
body.focus #panel,body.focus #strip{display:none}
body.focus #main{bottom:0}
body.focus #toast{bottom:20px}
"""

JS_TEMPLATE = """
(function(){
"use strict";
var COUNT = @@COUNT@@;
var PAYLOAD = JSON.parse(document.getElementById('shapedata').textContent);
var SHAPES = PAYLOAD.shapes;
var stage = document.getElementById('stage');
var sizer = document.getElementById('sizer');
var bg = document.getElementById('bg');
var shapesEl = document.getElementById('shapes');
var badgesEl = document.getElementById('badges');
var selbox = document.getElementById('selbox');
var tip = document.getElementById('tip');
var toastEl = document.getElementById('toast');
var desc = document.getElementById('desc');
var detail = document.getElementById('detail');
var jump = document.getElementById('jump');
var posEl = document.getElementById('pos');
var infoEl = document.getElementById('info');
var cntEl = document.getElementById('cnt');
var selinfoEl = document.getElementById('selinfo');
var copiedEl = document.getElementById('copied');
var stripEl = document.getElementById('strip');
var stripInner = stripEl.querySelector('.inner');
var btnPrev = document.getElementById('btn-prev');
var btnNext = document.getElementById('btn-next');
var btnBg = document.getElementById('m-bg');
var btnStruct = document.getElementById('m-struct');
var btnFocus = document.getElementById('btn-focus');
var btnRefresh = document.getElementById('btn-refresh');
/* order  = selected elements, in selection order (badge number = index + 1)
   primary = the element whose properties the panel shows (last one clicked)
   anchor  = origin of a shift-click range */
var cur = 1, order = [], primary = null, anchor = null, toastTimer = null;
/* per-slide cache versions from the build; the image URL carries one so a
   re-rendered sNN.png is fetched again instead of coming from the cache */
var BUILT = document.body.getAttribute('data-deck-built') || '0';
var SLIDE_V = @@SLIDEV@@;
var HTTP = location.protocol === 'http:' || location.protocol === 'https:';

/* ---- scale the 1280x720 stage to fit (transform, never zoom) ---- */
function fit(){
  var wrap = document.getElementById('stagewrap');
  var k = Math.min(wrap.clientWidth / 1280, wrap.clientHeight / 720);
  if (!isFinite(k) || k <= 0) k = 0.05;
  stage.style.transform = 'scale(' + k + ')';
  sizer.style.width = (1280 * k) + 'px';
  sizer.style.height = (720 * k) + 'px';
}
window.addEventListener('resize', fit);

/* ---- slide switching + #sNN hash routing ---- */
function pad(n){ return (n < 10 ? '0' : '') + n; }
function slideEl(n){ return document.getElementById('s' + n); }

/* Build the image URL for one slide. Over http the version query makes the
   browser fetch the freshly rendered PNG; over file:// a query string is left
   off because browsers disagree on how to resolve it against the filesystem. */
function slideSrc(n, bust){
  var src = 'slides/s' + pad(n) + '.png';
  if (!HTTP) return src;
  src += '?v=' + (SLIDE_V[n - 1] || BUILT);
  return bust ? src + '&r=' + Date.now() : src;
}

function show(n, updateHash){
  if (!(n >= 1 && n <= COUNT)) return;
  cur = n;
  var prev = document.querySelector('.slide.on');
  if (prev) prev.classList.remove('on');
  var el = slideEl(n);
  if (el) el.classList.add('on');
  stage.classList.remove('noimg');
  bg.src = slideSrc(n);
  posEl.textContent = n + ' / ' + COUNT;
  infoEl.textContent = el ? (el.dataset.shapes || '0') + ' 个元素' : '';
  jump.value = String(n);
  btnPrev.disabled = n <= 1;
  btnNext.disabled = n >= COUNT;
  var btns = document.querySelectorAll('#strip .st');
  for (var i = 0; i < btns.length; i++){
    var on = Number(btns[i].dataset.n) === n;
    btns[i].classList.toggle('on', on);
    btns[i].setAttribute('aria-selected', on ? 'true' : 'false');
    btns[i].tabIndex = on ? 0 : -1;
    if (on && stripInner){
      var target = btns[i].offsetLeft - (stripInner.clientWidth - btns[i].offsetWidth) / 2;
      if (stripInner.scrollTo) stripInner.scrollTo({left: Math.max(0, target),
        behavior: 'smooth'});
      else stripInner.scrollLeft = Math.max(0, target);
    }
  }
  anchor = null;
  clearSelection();
  if (updateHash !== false){
    var t = '#s' + n;
    if (location.hash !== t) location.hash = t;
  }
}

function fromHash(){
  var m = /^#s(\\d+)$/.exec(location.hash || '');
  if (m){
    var n = parseInt(m[1], 10);
    if (n >= 1 && n <= COUNT) return n;
  }
  return 1;
}
window.addEventListener('hashchange', function(){
  var n = fromHash();
  if (n !== cur) show(n, false);
});

/* ---- transient toast ---- */
function toast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('on');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ toastEl.classList.remove('on'); }, 1800);
}

/* ---- selection: click, ctrl/cmd-click to toggle, shift-click for a range ----
   Every selected element gets a numbered badge on the stage, and the same
   number prefixes its line in #desc, so "改 #2" means the same shape twice. */
function slideShapes(){
  return Array.prototype.slice.call(document.querySelectorAll('#s' + cur + ' .sh'));
}

function setSelection(list, prim){
  order = [];
  for (var i = 0; i < list.length; i++){
    if (list[i] && order.indexOf(list[i]) < 0) order.push(list[i]);
  }
  primary = (prim && order.indexOf(prim) >= 0) ? prim : (order[order.length - 1] || null);
  paint();
}

function clearSelection(){ setSelection([], null); }
function selectAllOnSlide(){ setSelection(slideShapes(), null); }

/* Hover fades in and out (pure CSS), but a click has to land immediately: mark
   the tree with .snap for the duration of the change so no transition or badge
   animation starts, then drop the mark so hovering keeps its fade. */
var rootEl = document.documentElement;
var snapTimer = null;
function snapSelection(){
  rootEl.classList.add('snap');
  if (snapTimer) clearTimeout(snapTimer);
  snapTimer = setTimeout(function(){ rootEl.classList.remove('snap'); }, 80);
}

function paint(){
  snapSelection();
  var was = document.querySelectorAll('.sh.sel');
  for (var i = 0; i < was.length; i++) was[i].classList.remove('sel');
  for (var j = 0; j < order.length; j++) order[j].classList.add('sel');
  renderBadges();
  renderDesc();
  renderDetail();
  placeSelbox();
  copiedEl.textContent = '';
  selinfoEl.textContent = order.length > 1 ? ('已选 ' + order.length + ' 个') : '';
  if (!order.length) cntEl.textContent = '';
  else if (order.length > 1) cntEl.textContent = order.length + ' 个元素';
  else cntEl.textContent = 'z=' + primary.dataset.z + ' · id=' + primary.dataset.shapeId;
}

function renderBadges(){
  badgesEl.innerHTML = '';
  for (var i = 0; i < order.length; i++){
    var b = document.createElement('span');
    b.className = 'nbadge';
    b.textContent = String(i + 1);
    b.style.left = order[i].style.left;
    b.style.top = order[i].style.top;
    badgesEl.appendChild(b);
  }
}

function renderDesc(){
  var lines = [];
  for (var i = 0; i < order.length; i++){
    lines.push('#' + (i + 1) + ' ' + (order[i].dataset.desc || ''));
  }
  desc.value = lines.join('\\n');
}

function renderDetail(){
  if (!primary){
    detail.innerHTML = '<div class="empty">未选中元素</div>';
    return;
  }
  detail.innerHTML = describe(primary);
}

function placeSelbox(){
  if (!primary){ selbox.style.display = 'none'; return; }
  selbox.style.display = 'block';
  selbox.style.left = primary.style.left;
  selbox.style.top = primary.style.top;
  selbox.style.width = primary.style.width;
  selbox.style.height = primary.style.height;
  selbox.style.transform = primary.style.transform || 'none';
}

function esc(s){
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function row(k, v){
  return '<div><span class="k">' + esc(k) + '</span><span class="v">' + v + '</span></div>';
}

function describe(el){
  var d = el.dataset;
  var rec = SHAPES[d.slide + ':' + d.z] || {};
  var px = function(inch){ return (Number(inch) * 96).toFixed(2); };
  var out = '';
  out += row('幻灯片', 'slide ' + esc(d.slide));
  out += row('z 序', esc(d.z) + ' （第 ' + (Number(d.z) + 1) + ' 个元素，自下而上）');
  out += row('名称', esc(d.name));
  out += row('shape id', esc(d.shapeId));
  out += row('类型', esc(d.type));
  out += row('left', '<code>' + esc(d.l) + ' in</code> / ' + px(d.l) + ' px');
  out += row('top', '<code>' + esc(d.t) + ' in</code> / ' + px(d.t) + ' px');
  out += row('width', '<code>' + esc(d.w) + ' in</code> / ' + px(d.w) + ' px');
  out += row('height', '<code>' + esc(d.h) + ' in</code> / ' + px(d.h) + ' px');
  out += row('rotation', esc(rec.rot || 0) + ' deg');
  out += row('填充', rec.fill ? '<code>' + esc(rec.fill) + '</code>' : '-');
  out += row('描边', rec.line
    ? '<code>' + esc(rec.line) + '</code>' + (rec.linew != null ? ' / ' + esc(rec.linew) + ' pt' : '')
    : '-');
  if (rec.anchor) out += row('垂直锚点', esc(rec.anchor));

  var text = d.text || '';
  out += '<div class="blk"><div><span class="k">文本</span><span class="v">' +
         (text ? esc(text) : '<span class="muted">（无）</span>') + '</span></div>';
  var paras = rec.paras || [];
  for (var i = 0; i < paras.length; i++){
    var p = paras[i];
    var bits = [];
    if (p.a) bits.push('align=' + p.a);
    if (p.ls) bits.push('line-height=' + p.ls);
    if (p.lvl) bits.push('lvl=' + p.lvl);
    var runs = '';
    for (var j = 0; j < (p.runs || []).length; j++){
      var r = p.runs[j];
      var rb = ['font=' + (r.f || 'inherit'),
                'size=' + (r.s != null ? r.s + 'pt' : 'inherit')];
      if (r.b) rb.push('bold');
      if (r.i) rb.push('italic');
      if (r.u) rb.push('underline');
      rb.push('color=' + (r.c ? '#' + r.c : 'inherit'));
      runs += '<div class="run">' + esc(r.t) +
              ' &nbsp;<span class="muted">[' + esc(rb.join(', ')) + ']</span></div>';
    }
    out += '<div class="pr"><div class="muted">&#182;' + i +
           (bits.length ? ' (' + esc(bits.join(', ')) + ')' : '') + '</div>' + runs + '</div>';
  }
  out += '</div>';
  return out;
}

shapesEl.addEventListener('click', function(ev){
  var el = ev.target.closest ? ev.target.closest('.sh') : null;
  if (!el){
    anchor = null;
    clearSelection();
    return;
  }
  var list = slideShapes();
  var add = ev.ctrlKey || ev.metaKey;
  if (ev.shiftKey && anchor && list.indexOf(anchor) >= 0){
    var a = list.indexOf(anchor), b = list.indexOf(el);
    if (a > b){ var t = a; a = b; b = t; }
    var seg = list.slice(a, b + 1);
    setSelection(add ? order.concat(seg) : seg, el);
  } else if (add){
    var idx = order.indexOf(el);
    var next = order.slice();
    if (idx >= 0) next.splice(idx, 1); else next.push(el);
    setSelection(next, el);
  } else {
    setSelection([el], el);
  }
  anchor = el;
});

/* ---- travelling hover box ----
   Hover is drawn by ONE box that slides between shapes (0.25s) instead of every
   shape lighting up on its own. A selected shape already carries its own ring,
   so the travelling box stands down there. */
var hoverbox = document.getElementById('hoverbox');
var hoverShown = false;

function placeHoverBox(el){
  if (el && el.classList.contains('sel')) el = null;
  if (!el){
    hoverShown = false;
    hoverbox.style.opacity = '0';
    return;
  }
  if (!hoverShown) hoverbox.classList.add('jump');     /* place it, do not glide in */
  hoverbox.style.left = el.style.left;
  hoverbox.style.top = el.style.top;
  hoverbox.style.width = el.style.width;
  hoverbox.style.height = el.style.height;
  hoverbox.style.transform = el.style.transform || 'none';
  if (!hoverShown){
    void hoverbox.offsetWidth;                         /* commit before transitions */
    hoverbox.classList.remove('jump');
  }
  hoverbox.style.opacity = '1';
  hoverShown = true;
}

shapesEl.addEventListener('mousemove', function(ev){
  var el = ev.target.closest ? ev.target.closest('.sh') : null;
  placeHoverBox(el);
  if (!el){ tip.style.display = 'none'; return; }
  var d = el.dataset;
  tip.innerHTML = '<b>' + esc(d.name) + '</b>  <span class="muted">' + esc(d.type) +
    ' · z=' + esc(d.z) + ' · id=' + esc(d.shapeId) + '</span>\\n' +
    'L=' + esc(d.l) + ' T=' + esc(d.t) + ' W=' + esc(d.w) + ' H=' + esc(d.h) + ' in';
  tip.style.display = 'block';
  var x = ev.clientX + 14, y = ev.clientY + 16;
  var r = tip.getBoundingClientRect();
  if (x + r.width > window.innerWidth - 8) x = ev.clientX - r.width - 14;
  if (y + r.height > window.innerHeight - 8) y = ev.clientY - r.height - 16;
  tip.style.left = x + 'px';
  tip.style.top = y + 'px';
});
shapesEl.addEventListener('mouseleave', function(){
  tip.style.display = 'none';
  placeHoverBox(null);
});

/* ---- copy to clipboard ----
   execCommand runs first: it is synchronous and reports a result immediately,
   which matters on file:// where the async Clipboard API may need permissions
   or document focus and can otherwise leave the user with no feedback. */
function legacyCopy(txt){
  var buf = document.getElementById('copybuf');
  var ok = false;
  buf.value = txt;
  buf.removeAttribute('readonly');
  try {
    buf.select();
    ok = document.execCommand('copy');
  } catch (e) { ok = false; }
  buf.setAttribute('readonly', 'readonly');
  try { window.getSelection().removeAllRanges(); } catch (e) {}
  return ok;
}
function copyFailed(){
  try { desc.focus(); desc.select(); } catch (e) {}
  copiedEl.textContent = '复制失败：已全选，请按 Ctrl+C';
}
function copyText(txt){
  copiedEl.textContent = '';
  var note = '已复制 ' + txt.length + ' 字符';
  if (legacyCopy(txt)){ copiedEl.textContent = note; toast(note); return; }
  if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(function(){
      copiedEl.textContent = note; toast(note);
    }, copyFailed);
    return;
  }
  copyFailed();
}
document.getElementById('btn-copy').addEventListener('click', function(){
  if (!desc.value){ copiedEl.textContent = '没有可复制的内容'; return; }
  copyText(desc.value);
});
document.getElementById('btn-clear').addEventListener('click', function(){
  anchor = null;
  clearSelection();
});
document.getElementById('btn-all').addEventListener('click', function(){
  anchor = null;
  selectAllOnSlide();
  toast('已选中本页 ' + order.length + ' 个元素');
});

/* ---- view mode ---- */
function setMode(struct){
  document.body.classList.toggle('mode-struct', struct);
  document.body.classList.toggle('mode-bg', !struct);
  btnBg.classList.toggle('on', !struct);
  btnStruct.classList.toggle('on', struct);
  btnBg.setAttribute('aria-selected', struct ? 'false' : 'true');
  btnStruct.setAttribute('aria-selected', struct ? 'true' : 'false');
}
btnBg.addEventListener('click', function(){ setMode(false); });
btnStruct.addEventListener('click', function(){ setMode(true); });

/* ---- focus mode ---- */
function toggleFocus(force){
  var on = typeof force === 'boolean' ? force : !document.body.classList.contains('focus');
  document.body.classList.toggle('focus', on);
  btnFocus.setAttribute('aria-pressed', on ? 'true' : 'false');
  setTimeout(fit, 0);
}
btnFocus.addEventListener('click', function(){ toggleFocus(); });

/* ---- navigation ---- */
btnPrev.addEventListener('click', function(){ show(cur - 1); });
btnNext.addEventListener('click', function(){ show(cur + 1); });
jump.addEventListener('change', function(){
  var n = parseInt(jump.value, 10);
  if (n >= 1 && n <= COUNT) show(n); else jump.value = String(cur);
});
jump.addEventListener('keydown', function(ev){
  if (ev.key === 'Enter'){ ev.preventDefault(); jump.blur(); }
});
stripEl.addEventListener('click', function(ev){
  var b = ev.target.closest ? ev.target.closest('.st') : null;
  if (b) show(Number(b.dataset.n));
});
bg.addEventListener('error', function(){ stage.classList.add('noimg'); });
bg.addEventListener('load', function(){ stage.classList.remove('noimg'); });

/* ---- refresh this page's cached image ----
   The button (and the R key) re-reads deck.json for the newest per-slide
   version and loads the current slide under a fresh URL, so a stale cached
   sNN.png never survives. Only this page is re-fetched; the rest of the viewer
   keeps its state. */
function refreshPage(){
  function paint(meta){
    if (meta){
      if (meta.slide_versions && meta.slide_versions.length) SLIDE_V = meta.slide_versions;
      if (meta.built) BUILT = String(meta.built);
    }
    var n = cur;
    var thumb = document.querySelector('#strip .st[data-n="' + n + '"] img');
    if (HTTP){
      bg.src = slideSrc(n, true);
      if (thumb) thumb.src = slideSrc(n, true);
    } else {
      /* file://: drop the src first so the browser re-reads the local file */
      bg.removeAttribute('src');
      bg.src = slideSrc(n);
      if (thumb){ thumb.removeAttribute('src'); thumb.src = slideSrc(n); }
    }
    toast('已刷新第 ' + n + ' 页');
  }
  fetch('deck.json?t=' + Date.now(), {cache: 'no-store'})
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(paint, function(){ paint(null); });
}
btnRefresh.addEventListener('click', refreshPage);

document.addEventListener('keydown', function(ev){
  var t = ev.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (ev.key === 'ArrowRight' || ev.key === 'PageDown'){ ev.preventDefault(); show(cur + 1); }
  else if (ev.key === 'ArrowLeft' || ev.key === 'PageUp'){ ev.preventDefault(); show(cur - 1); }
  else if (ev.key === 'Home'){ ev.preventDefault(); show(1); }
  else if (ev.key === 'End'){ ev.preventDefault(); show(COUNT); }
  else if ((ev.key === 'a' || ev.key === 'A') && (ev.ctrlKey || ev.metaKey)){
    ev.preventDefault(); anchor = null; selectAllOnSlide();
  }
  else if (ev.key === '1'){ setMode(false); }
  else if (ev.key === '2'){ setMode(true); }
  else if (ev.key === 'f' || ev.key === 'F'){ toggleFocus(); }
  else if (ev.key === 'r' || ev.key === 'R'){ refreshPage(); }
  else if (ev.key === 'Escape'){ anchor = null; clearSelection(); }
});

/* ---- right-drag marquee ----
   Left click picks a shape, so rubber-banding uses the right button. The shapes'
   own inline geometry is authoritative (no layout reads, rotation ignored --
   same approximation the rest of the viewer makes). */
var marquee = document.getElementById('marquee');
var banding = false, bandStart = null, bandRect = null, bandAdd = false, noMenu = false;

function stagePoint(ev){
  var r = stage.getBoundingClientRect();
  var k = r.width / 1280 || 1;              /* the stage is scaled by a transform */
  return {x: (ev.clientX - r.left) / k, y: (ev.clientY - r.top) / k};
}

function shapeBox(el){
  return {l: parseFloat(el.style.left) || 0, t: parseFloat(el.style.top) || 0,
          w: parseFloat(el.style.width) || 0, h: parseFloat(el.style.height) || 0};
}

function endBanding(){
  banding = false;
  bandRect = null;
  marquee.style.display = 'none';
  document.body.classList.remove('banding');
}

/* the browser would otherwise open its menu on the second click of the drag */
document.addEventListener('contextmenu', function(ev){
  var t = ev.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
  if (noMenu || (t && t.closest && t.closest('#stage'))) ev.preventDefault();
  noMenu = false;
});

stage.addEventListener('mousedown', function(ev){
  if (ev.button !== 2) return;
  ev.preventDefault();
  noMenu = true;
  tip.style.display = 'none';
  banding = true;
  bandAdd = ev.ctrlKey || ev.metaKey;
  bandStart = stagePoint(ev);
  marquee.style.display = 'block';
  marquee.style.left = bandStart.x + 'px';
  marquee.style.top = bandStart.y + 'px';
  marquee.style.width = '0px';
  marquee.style.height = '0px';
  document.body.classList.add('banding');
});

document.addEventListener('mousemove', function(ev){
  if (!banding) return;
  var p = stagePoint(ev);
  var x = Math.min(p.x, bandStart.x), y = Math.min(p.y, bandStart.y);
  var w = Math.abs(p.x - bandStart.x), h = Math.abs(p.y - bandStart.y);
  marquee.style.left = x + 'px';
  marquee.style.top = y + 'px';
  marquee.style.width = w + 'px';
  marquee.style.height = h + 'px';
  bandRect = {l: x, t: y, r: x + w, b: y + h};
});

document.addEventListener('mouseup', function(ev){
  if (!banding) return;
  var rect = bandRect;
  endBanding();
  if (!rect || rect.r - rect.l < 3 || rect.b - rect.t < 3) return;   /* a bare right click */
  var hits = slideShapes().filter(function(el){
    var b = shapeBox(el);
    return !(b.l > rect.r || b.l + b.w < rect.l || b.t > rect.b || b.t + b.h < rect.t);
  });
  if (bandAdd) hits = order.concat(hits);
  setSelection(hits, hits.length ? hits[hits.length - 1] : null);
  anchor = hits.length ? hits[hits.length - 1] : null;
  toast(hits.length ? ('框选到 ' + hits.length + ' 个元素') : '框选：范围内没有元素');
});

window.addEventListener('blur', function(){ if (banding) endBanding(); });

/* ---- boot ---- */
(function initStrip(){
  var btns = document.querySelectorAll('#strip .st');
  for (var i = 0; i < btns.length; i++){
    btns[i].setAttribute('role', 'tab');
    btns[i].setAttribute('aria-label', 'slide ' + btns[i].dataset.n);
    var thumb = btns[i].querySelector('img');
    if (thumb) thumb.addEventListener('error', function(){ this.className = 'miss'; });
  }
})();
/* the way back to the library only exists when deckpeek's own server serves us */
(function initHome(){
  var a = document.getElementById('btn-home');
  if (a && location.pathname.indexOf('/d/') === 0) a.classList.add('on');
})();

/* ---- live refresh ----
   deck.json sits next to this page and is rewritten on every build, so polling it
   lets an already-open viewer follow a re-render of the source .pptx by itself.
   A whole new build reloads the page (the #sNN hash keeps you on the same slide),
   while a slide whose PNG alone was re-rendered is swapped in place. Over file://
   the fetch is blocked and everything here stays silent. */
(function liveRefresh(){
  var mine = document.body.getAttribute('data-deck-built') || '';
  function note(text){
    var box = document.getElementById('livebanner');
    if (!text){
      if (box){
        if (box.remove) box.remove();
        else if (box.parentNode) box.parentNode.removeChild(box);
      }
      return;
    }
    if (!box){
      box = document.createElement('div');
      box.id = 'livebanner';
      document.body.appendChild(box);
    }
    box.textContent = text;
  }
  function repaint(n){
    bg.src = slideSrc(n, true);
    var thumb = document.querySelector('#strip .st[data-n="' + n + '"] img');
    if (thumb) thumb.src = slideSrc(n, true);
  }
  function adopt(meta){
    if (meta.built){ mine = String(meta.built); BUILT = mine; }
    if (meta.slide_versions && meta.slide_versions.length) SLIDE_V = meta.slide_versions;
  }
  function tick(){
    fetch('deck.json?t=' + Date.now(), {cache: 'no-store'})
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(meta){
        if (!meta) return;
        if (meta.rendering){ note('源文件已更新，正在重新渲染…'); return; }
        note('');
        var versions = meta.slide_versions || [];
        if (String(meta.built) !== mine){
          /* a new build is on disk: reload so the shape data matches too; the
             hash keeps the viewer on the slide the user was reading */
          adopt(meta);
          if (HTTP) location.reload();
          return;
        }
        var v = versions.length ? String(versions[cur - 1]) : '';
        if (v && v !== String(SLIDE_V[cur - 1])){
          /* only this slide changed: refresh its image without reloading */
          SLIDE_V[cur - 1] = versions[cur - 1];
          if (HTTP) repaint(cur);
        }
      })
      .catch(function(){ /* not served over http -- nothing to poll */ });
  }
  setInterval(tick, 2000);
  tick();
})();

/* thumbnails carry the same per-slide version, so the strip never shows a
   cached render after a rebuild */
(function versionThumbs(){
  if (!HTTP) return;
  var btns = document.querySelectorAll('#strip .st');
  for (var i = 0; i < btns.length; i++){
    var img = btns[i].querySelector('img');
    if (img) img.src = slideSrc(Number(btns[i].dataset.n));
  }
})();

setMode(false);
show(fromHash(), true);
fit();
setTimeout(fit, 60);
window.addEventListener('load', fit);
})();
"""


THEME_SCRIPT = """<script>
/* Light / dark, shared by the viewer and the selection page. Applied before the
   first paint (saved choice, else the OS preference) so there is no flash. */
(function(){
  var KEY = 'deckpeek-theme';
  var root = document.documentElement;
  function isLight(){ return root.classList.contains('light'); }
  function apply(light, remember){
    root.classList.toggle('light', !!light);
    var b = document.getElementById('btn-theme');
    if (b){
      b.setAttribute('aria-pressed', light ? 'true' : 'false');
      b.setAttribute('aria-label', light ? '切到深色' : '切到浅色');
      b.title = light ? '切到深色 (T)' : '切到浅色 (T)';
    }
    if (remember){ try { localStorage.setItem(KEY, light ? 'light' : 'dark'); } catch (e) {} }
  }
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  var prefersLight = false;
  try {
    prefersLight = !!(window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: light)').matches);
  } catch (e) {}
  apply(saved ? saved === 'light' : prefersLight, false);

  function wire(){
    var b = document.getElementById('btn-theme');
    if (b) b.addEventListener('click', function(){ apply(!isLight(), true); });
    document.addEventListener('keydown', function(ev){
      var t = ev.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (ev.key === 't' || ev.key === 'T') apply(!isLight(), true);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
</script>"""


LAUNCHER_TEMPLATE = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>@@TITLE@@</title>
@@THEME@@
<style>
:root{
  --brand:#007CFF; --brand-hi:#2B93FF; --brand-ink:#fff;
  --bg:#05121F; --card:rgba(255,255,255,.03); --card-hi:rgba(255,255,255,.07);
  --btn:rgba(255,255,255,.04); --btn-hi:rgba(255,255,255,.09);
  --line:rgba(255,255,255,.08); --line-hi:rgba(255,255,255,.16);
  --fg:#E8EEF6; --fg-dim:#93A9C2; --fg-mute:#67809A;
  --ok:#4ADE80; --bad:#FF6B6B; --thumb:#04101C; --scroll:rgba(255,255,255,.12);
  --dur:.25s;
  --ease:background-color var(--dur) ease,border-color var(--dur) ease,
    color var(--dur) ease,opacity var(--dur) ease,box-shadow var(--dur) ease;
  color-scheme:dark;
}
html.light{
  color-scheme:light;
  --bg:#F1F4F8; --card:#FFFFFF; --card-hi:#EEF2F7;
  --btn:#F1F5F9; --btn-hi:#E4EAF2;
  --line:rgba(15,23,42,.12); --line-hi:rgba(15,23,42,.24);
  --fg:#0F172A; --fg-dim:#475569; --fg-mute:#64748B;
  --ok:#15803D; --bad:#DC2626; --thumb:#F8FAFC; --scroll:rgba(15,23,42,.18);
}
*{box-sizing:border-box}
body{margin:0;min-height:100%;background:var(--bg);color:var(--fg);
  font:13px/1.6 system-ui,"Segoe UI","Microsoft YaHei",sans-serif;
  -webkit-font-smoothing:antialiased;transition:background-color var(--dur) ease,
  color var(--dur) ease}
button{font:inherit;color:var(--fg);background:var(--btn);border:1px solid var(--line);
  border-radius:6px;padding:6px 12px;cursor:pointer;transition:var(--ease)}
button:hover{background:var(--btn-hi);border-color:var(--line-hi)}
:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
.primary{background:var(--brand);border-color:var(--brand);color:var(--brand-ink);font-weight:500}
.primary:hover{background:var(--brand-hi);border-color:var(--brand-hi)}
.ghost{background:transparent}
.ghost:hover{background:var(--btn)}
.sq{width:30px;padding:6px 0;display:inline-flex;align-items:center;justify-content:center}
.ic{width:15px;height:15px;display:block}
html:not(.light) .ic-sun{display:none}
html.light .ic-moon{display:none}
.muted{color:var(--fg-mute)}
.mono,code{font-family:ui-monospace,"Cascadia Mono",Consolas,monospace;font-size:12px}
.spacer{flex:1}

#bar{position:sticky;top:0;display:flex;align-items:center;gap:10px;padding:0 18px;
  height:52px;background:var(--bg);border-bottom:1px solid var(--line);z-index:10;
  transition:var(--ease)}
.brand{display:flex;align-items:center;gap:8px;font-weight:500}
.brand .mark{width:16px;height:16px;flex:none;color:var(--brand)}
.pill{font-size:12px;color:var(--fg-mute);border:1px solid var(--line);border-radius:999px;
  padding:2px 10px}
main{max-width:920px;margin:0 auto;padding:28px 18px 40px}

.drop{border:1px dashed var(--line-hi);border-radius:12px;background:var(--card);
  padding:34px 24px;text-align:center;cursor:pointer;transition:var(--ease)}
.drop:hover{background:var(--card-hi)}
body.dragging .drop{border-color:var(--brand);background:var(--card-hi)}
.drop .up{width:28px;height:28px;color:var(--fg-mute);transition:color var(--dur) ease}
.drop:hover .up{color:var(--brand)}
.drop h1{font-size:16px;font-weight:500;margin:12px 0 6px}
.drop p{margin:4px 0}
.link{background:none;border:0;padding:0;color:var(--brand);cursor:pointer;font:inherit;
  transition:color var(--dur) ease}
.link:hover{text-decoration:underline}

.card{border:1px solid var(--line);border-radius:10px;background:var(--card);padding:14px 16px}
.job{margin-top:18px}
.job-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px}
.bar{height:6px;border-radius:999px;background:var(--card-hi);overflow:hidden}
.bar i{display:block;height:100%;width:0;background:var(--brand);
  transition:width var(--dur) ease}
#job-msg{margin:9px 0 0;font-size:12px}
.err{color:var(--bad)}

#lib{margin-top:28px}
.sec{display:flex;align-items:baseline;justify-content:space-between;
  font-size:12px;color:var(--fg-dim);margin-bottom:10px}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:12px}
.deck{display:flex;gap:12px;align-items:center;text-decoration:none;color:inherit;
  border:1px solid var(--line);border-radius:10px;background:var(--card);padding:10px;
  transition:var(--ease)}
.deck:hover{background:var(--card-hi);border-color:var(--line-hi)}
.deck .thumb{width:96px;height:54px;flex:none;border-radius:6px;overflow:hidden;
  background:var(--thumb);border:1px solid var(--line)}
.deck .thumb img{width:100%;height:100%;object-fit:contain;display:block}
.deck .meta{min-width:0;display:flex;flex-direction:column;gap:2px}
.deck .meta b{font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.deck .meta span{font-size:12px}
footer{max-width:920px;margin:0 auto;padding:0 18px 30px;color:var(--fg-mute);font-size:12px}
::-webkit-scrollbar{width:9px;height:9px}
::-webkit-scrollbar-thumb{background:var(--scroll);border-radius:4px}
</style>
</head>
<body>
<header id="bar">
  <div class="brand">
    <svg class="mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg><span>deckpeek</span>
  </div>
  <span class="pill">本机 127.0.0.1:@@PORT@@</span>
  <span class="spacer"></span>
  <button id="btn-theme" class="ghost sq" title="切到浅色 (T)" aria-label="切换主题"
    aria-pressed="false">
    <svg class="ic ic-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    <svg class="ic ic-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
  </button>
</header>
<main>
  <section id="drop" class="drop" role="button" tabindex="0"
    aria-label="把 pptx 拖到这里，或按回车选择文件">
    <svg class="up" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="16 16 12 12 8 16"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
    <h1>把 .pptx 拖到这里</h1>
    <p class="muted">或者 <button id="btn-pick" class="link" type="button">从本机选择文件…</button></p>
    <p class="muted" style="font-size:12px">由本机 PowerPoint 导出底图 · 同名文件会覆盖已有导入</p>
    <p id="drop-file" class="muted mono" style="margin-top:10px"></p>
    <input id="file" type="file" accept=".pptx,.ppt" hidden>
  </section>

  <section id="job" class="card job" hidden aria-live="polite">
    <div class="job-hd"><b id="job-state">正在导入…</b><span id="job-pct" class="muted"></span></div>
    <div class="bar"><i id="job-bar"></i></div>
    <p id="job-msg" class="muted"></p>
  </section>

  <section id="lib">
    <div class="sec"><span>已导入的 deck</span><span id="lib-count" class="muted"></span></div>
    <div id="cards" class="cards"></div>
    <p id="lib-empty" class="muted" hidden>还没有 deck —— 把 .pptx 拖进上面的区域。</p>
  </section>
</main>
<footer>deck 目录 <code>@@DIR@@</code></footer>
<script id="deckdata" type="application/json">@@DECKS@@</script>
<script>
(function(){
"use strict";
var dropEl = document.getElementById('drop');
var input = document.getElementById('file');
var dropFile = document.getElementById('drop-file');
var jobBox = document.getElementById('job');
var jobState = document.getElementById('job-state');
var jobPct = document.getElementById('job-pct');
var jobBar = document.getElementById('job-bar');
var jobMsg = document.getElementById('job-msg');
var cards = document.getElementById('cards');
var empty = document.getElementById('lib-empty');
var count = document.getElementById('lib-count');
var poller = null;

function esc(s){
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function pctText(v){ return Math.round(v * 100) + '%'; }
function fmtBytes(n){
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
}
function fmtTime(sec){
  try { return new Date(sec * 1000).toLocaleString(); } catch (e) { return ''; }
}

function renderDecks(list){
  cards.innerHTML = '';
  count.textContent = list.length ? list.length + ' 个' : '';
  empty.hidden = list.length > 0;
  list.forEach(function(d){
    var a = document.createElement('a');
    a.className = 'deck';
    a.href = d.url;
    a.innerHTML = '<div class="thumb">' +
      (d.thumb ? '<img loading="lazy" src="' + esc(d.thumb) + '" alt="">' : '') +
      '</div><div class="meta"><b>' + esc(d.name) + '</b><span class="muted">' +
      d.slides + ' 页 · ' + esc(fmtTime(d.mtime)) + '</span></div>';
    cards.appendChild(a);
  });
}
function refresh(){
  fetch('/api/decks').then(function(r){ return r.json(); }).then(function(r){
    renderDecks(r.decks || []);
  }).catch(function(){});
}

/* ---- progress ---- */
function showJob(state, msg){
  jobBox.hidden = false;
  jobState.textContent = state;
  jobMsg.textContent = msg || '';
  jobMsg.className = 'muted';
}
function setProgress(v, msg, pctLabel){
  jobBar.style.width = Math.max(0, Math.min(1, v)) * 100 + '%';
  jobPct.textContent = pctLabel === undefined ? pctText(Math.max(0, Math.min(1, v))) : pctLabel;
  if (msg !== undefined) jobMsg.textContent = msg;
}
function fail(msg){
  showJob('导入失败', msg);
  jobMsg.className = 'muted err';
  jobPct.textContent = '';
  if (poller){ clearInterval(poller); poller = null; }
}

/* ---- upload ---- */
function upload(file){
  if (!/\\.pptx?$/i.test(file.name)){ fail('只支持 .pptx / .ppt'); return; }
  dropFile.textContent = file.name + ' · ' + fmtBytes(file.size);
  showJob('上传中…', '');
  setProgress(0, '', '0%');
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/import?name=' + encodeURIComponent(file.name), true);
  xhr.upload.onprogress = function(ev){
    if (ev.lengthComputable) setProgress(ev.loaded / ev.total, '', pctText(ev.loaded / ev.total));
  };
  xhr.onload = function(){
    var res = null;
    try { res = JSON.parse(xhr.responseText); } catch (e) {}
    if (xhr.status === 200 && res && res.job){
      jobState.textContent = '已收到，正在导入…';
      poll(res.job);
      return;
    }
    fail((res && res.error) || ('HTTP ' + xhr.status));
  };
  xhr.onerror = function(){ fail('上传失败：和本地服务断开了'); };
  xhr.send(file);
}

function poll(id){
  showJob('导入中…', '本机 PowerPoint 正在导出底图，稍等…');
  poller = setInterval(function(){
    fetch('/api/jobs/' + id).then(function(r){ return r.json(); }).then(function(j){
      if (j.state === 'queued' || j.state === 'running'){
        if (j.stage === 'render' && j.total){
          setProgress(j.done / j.total, '导出底图 ' + j.done + ' / ' + j.total,
            pctText(j.done / j.total));
        } else if (j.stage === 'html'){
          setProgress(1, '生成页面…', '100%');
        } else {
          setProgress(0.02, '准备中…', '2%');
        }
      } else if (j.state === 'done'){
        clearInterval(poller); poller = null;
        var warn = j.warning || '';
        setProgress(1, warn || '完成，正在打开…', '100%');
        jobState.textContent = warn ? '完成，有告警' : '完成';
        if (warn) jobMsg.className = 'muted err';
        setTimeout(function(){ location.href = j.url; }, warn ? 3000 : 400);
      } else {
        fail(j.error || '导入失败');
      }
    }).catch(function(){ fail('轮询失败：和本地服务断开了'); });
  }, 500);
}

/* ---- picking a file ----
   input 是 #drop 的子节点，程序化 input.click() 会冒泡回 #drop 的 click 监听，
   若不拦截就会反复弹选择框；这里既拦冒泡，也做一次 800ms 防抖。 */
var pickAt = 0;
function pickFromDialog(){
  var now = Date.now();
  if (now - pickAt < 800) return;          // 同一次交互只弹一次
  pickAt = now;
  try { input.value = ''; } catch (e) {}   // 允许重复选同一个文件
  input.click();
}
var pickBtn = document.getElementById('btn-pick');
pickBtn.addEventListener('click', function(ev){
  ev.stopPropagation();
  ev.preventDefault();
  pickFromDialog();
});
input.addEventListener('click', function(ev){ ev.stopPropagation(); });
dropEl.addEventListener('click', function(ev){
  var t = ev.target;
  if (t && t.closest && t.closest('button, input, label, a')) return;
  pickFromDialog();
});
dropEl.addEventListener('keydown', function(ev){
  if (ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); pickFromDialog(); }
});
input.addEventListener('change', function(){
  var f = input.files && input.files[0];
  if (f) upload(f);
  input.value = '';
});

/* ---- drag and drop ---- */
function onDragOver(ev){
  ev.preventDefault();
  if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy';
  document.body.classList.add('dragging');
}
window.addEventListener('dragenter', onDragOver);
window.addEventListener('dragover', onDragOver);
window.addEventListener('dragleave', function(ev){
  if (ev.relatedTarget === null) document.body.classList.remove('dragging');
});
window.addEventListener('drop', function(ev){
  ev.preventDefault();
  document.body.classList.remove('dragging');
  var files = ev.dataTransfer && ev.dataTransfer.files;
  if (files && files.length) upload(files[0]);
});

/* ---- boot ---- */
try {
  renderDecks(JSON.parse(document.getElementById('deckdata').textContent) || []);
} catch (e) {}
refresh();
})();
</script>
</body>
</html>
"""


if __name__ == "__main__":
    # Git Bash / piped stdout on Windows defaults to the ANSI code page, which
    # mangles the Chinese progress lines; UTF-8 is what both it and the Windows
    # console layer expect.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    sys.exit(main())
