"""Parse 亿欧 EEA 技术全景图 workbook sheets into pydantic structures."""
from __future__ import annotations

import re
from io import BytesIO
from typing import Any
from urllib.parse import urlparse

from openpyxl import load_workbook
from pydantic import BaseModel, Field

from app.services.refcodes import normalize as normalize_ref_code

_URL_RE = re.compile(r"https?://[^\s\]]+", re.IGNORECASE)
_SKIP_CELL = {"/", "—", "-", ""}


class SourceContext(BaseModel):
    value_chain_stage_label: str
    value_chain_stage_code: str | None = None
    source_kind: str
    signal_type_code: str | None = None


class PanoramaSourceRow(BaseModel):
    url: str
    url_normalized: str
    channel_code: str
    is_pdf: bool
    contexts: list[SourceContext] = Field(default_factory=list)


class PanoramaLandingCell(BaseModel):
    domain_key: str
    domain_vocab_name: str
    name: str
    design_engineering: str | None = None
    manufacturing_engineering: str | None = None
    operations_engineering: str | None = None


class PanoramaChainRow(BaseModel):
    row: int
    value_chain_stage_label: str
    value_chain_stage_code: str | None = None
    driver: str | None = None
    demand_name: str | None = None
    function_name: str | None = None
    l2_l4_difference: str | None = None
    target_domain: str | None = None
    automation_levels: list[str] = Field(default_factory=list)
    recommendation_level: str | None = None
    recommendation_reason: str | None = None
    landing_cells: list[PanoramaLandingCell] = Field(default_factory=list)


class PanoramaDifferenceRow(BaseModel):
    title: str
    basis: str | None = None
    direction: str | None = None
    functions: str | None = None
    url: str | None = None
    url_normalized: str | None = None


class PanoramaWorkbook(BaseModel):
    sources: list[PanoramaSourceRow] = Field(default_factory=list)
    chain_rows: list[PanoramaChainRow] = Field(default_factory=list)
    differences: list[PanoramaDifferenceRow] = Field(default_factory=list)


DOMAIN_COLUMNS: dict[str, tuple[str, str]] = {
    "F": ("software", "软件"),
    "G": ("hardware", "硬件"),
    "H": ("communication", "通信"),
    "I": ("power", "电源与能源管理"),
    "J": ("tools", "工具"),
}

SOURCE_KIND_TO_SIGNAL_TYPE: dict[str, str] = {
    "产品技术发布会": "technology",
    "公开材料（招股书、官网等）": "technology",
    "专利发表": "technology",
    "学术及会议研讨": "technology",
    "新技术人才招聘": "talent",
    "投融资": "capital",
    "政策法规": "standard",
    "行业技术标准": "standard",
    "第三方用户调研报告": "strategy",
    "第三方用户洞察报告": "strategy",
    "第三方报告": "strategy",
}


def _cell_str(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _is_url(text: str) -> bool:
    text = text.strip()
    if not _URL_RE.search(text):
        return False
    return text.startswith("http://") or text.startswith("https://")


def _extract_url(text: str) -> str | None:
    text = text.strip()
    if _is_url(text):
        return _URL_RE.search(text).group(0).rstrip(".,;)")
    match = _URL_RE.search(text)
    return match.group(0).rstrip(".,;)") if match else None


def _row_number(row: Any) -> int | None:
    for cell in row:
        row_no = getattr(cell, "row", None)
        if row_no is not None:
            return row_no
    return None


def _real_cell(cell: Any) -> bool:
    return getattr(cell, "row", None) is not None


def _url_from_cell(cell: Any) -> str | None:
    """Excel often stores links as hyperlinks while the displayed cell text is a title."""
    if cell is None:
        return None
    url = _extract_url(_cell_str(cell.value))
    if url:
        return url
    link = getattr(cell, "hyperlink", None)
    if link is not None and link.target:
        target = str(link.target).strip()
        return _extract_url(target) or (target if _is_url(target) else None)
    return None


def _normalize_url_like_tagging(url: str) -> str:
    p = urlparse(url.strip())
    path = p.path.rstrip("/")
    return f"{p.scheme.lower()}://{p.netloc.lower()}{path}"


def _infer_channel(url: str) -> str:
    host = urlparse(url).netloc.lower()
    if "mp.weixin.qq.com" in host or host.endswith("weixin.qq.com"):
        return "wechat_mp"
    return "web"


def _is_pdf_url(url: str) -> bool:
    path = urlparse(url).path.lower()
    return path.endswith(".pdf")


def _map_stage_label(label: str) -> str | None:
    label = label.strip()
    if not label:
        return None
    return normalize_ref_code("value_chain_stage", label)


def _map_signal_type(source_kind: str) -> str | None:
    source_kind = source_kind.strip()
    if not source_kind:
        return None
    code = SOURCE_KIND_TO_SIGNAL_TYPE.get(source_kind)
    if code:
        return code
    for key, mapped in SOURCE_KIND_TO_SIGNAL_TYPE.items():
        if key in source_kind or source_kind in key:
            return mapped
    return None


def _slash_empty(value: str | None) -> bool:
    if value is None:
        return True
    value = value.strip()
    return value in _SKIP_CELL


def _parse_automation_levels(text: str | None) -> list[str]:
    if not text or _slash_empty(text):
        return []
    levels = []
    for token in re.findall(r"L[0-5](?:\+)?", text.upper()):
        base = token.rstrip("+")
        if base in {"L0", "L1", "L2", "L3", "L4", "L5"} and base not in levels:
            levels.append(base)
    return levels


def parse_panorama_workbook(data: bytes) -> PanoramaWorkbook:
    # read_only strips hyperlinks; 数据来源 stores URLs as links, not cell text.
    wb = load_workbook(BytesIO(data), data_only=True)
    sources = _parse_sources(wb["数据来源"])
    chain_rows = _parse_panorama_sheet(wb["EEA 技术全景图"])
    differences = _parse_differences(wb["数据来源-功能要求差异"])
    extra_urls = [d.url for d in differences if d.url]
    sources = _merge_extra_urls(sources, extra_urls)
    return PanoramaWorkbook(sources=sources, chain_rows=chain_rows, differences=differences)


def _parse_sources(ws) -> list[PanoramaSourceRow]:
    by_url: dict[str, PanoramaSourceRow] = {}
    stage_label = ""
    source_kind = ""
    for row in ws.iter_rows(min_row=2, values_only=False):
        row_no = _row_number(row)
        if row_no is None or row_no < 4:
            continue
        b = _cell_str(row[1].value if len(row) > 1 and _real_cell(row[1]) else None)
        c = _cell_str(row[2].value if len(row) > 2 and _real_cell(row[2]) else None)
        if b:
            stage_label = b
        if c:
            source_kind = c
        url = _url_from_cell(row[3] if len(row) > 3 else None)
        if not url:
            continue
        norm = _normalize_url_like_tagging(url)
        ctx = SourceContext(
            value_chain_stage_label=stage_label,
            value_chain_stage_code=_map_stage_label(stage_label),
            source_kind=source_kind,
            signal_type_code=_map_signal_type(source_kind),
        )
        if norm not in by_url:
            by_url[norm] = PanoramaSourceRow(
                url=url,
                url_normalized=norm,
                channel_code=_infer_channel(url),
                is_pdf=_is_pdf_url(url),
                contexts=[ctx],
            )
        else:
            by_url[norm].contexts.append(ctx)
    return list(by_url.values())


def _merge_extra_urls(sources: list[PanoramaSourceRow], urls: list[str | None]) -> list[PanoramaSourceRow]:
    by_url = {s.url_normalized: s for s in sources}
    for raw in urls:
        if not raw:
            continue
        url = _extract_url(raw) or raw.strip()
        if not _is_url(url):
            continue
        norm = _normalize_url_like_tagging(url)
        if norm in by_url:
            continue
        by_url[norm] = PanoramaSourceRow(
            url=url,
            url_normalized=norm,
            channel_code=_infer_channel(url),
            is_pdf=_is_pdf_url(url),
            contexts=[
                SourceContext(
                    value_chain_stage_label="",
                    value_chain_stage_code="regulation_standard",
                    source_kind="行业技术标准",
                    signal_type_code="standard",
                )
            ],
        )
    return list(by_url.values())


def _parse_differences(ws) -> list[PanoramaDifferenceRow]:
    rows: list[PanoramaDifferenceRow] = []
    for row in ws.iter_rows(min_row=2, values_only=False):
        if not row or not any(_real_cell(c) and c.value for c in row):
            continue
        title = _cell_str(row[0].value if len(row) > 0 and _real_cell(row[0]) else None)
        if not title:
            continue
        url = _url_from_cell(row[4] if len(row) > 4 else None)
        rows.append(
            PanoramaDifferenceRow(
                title=title,
                basis=_cell_str(row[1] if len(row) > 1 else None) or None,
                direction=_cell_str(row[2] if len(row) > 2 else None) or None,
                functions=_cell_str(row[3] if len(row) > 3 else None) or None,
                url=url,
                url_normalized=_normalize_url_like_tagging(url) if url else None,
            )
        )
    return rows


def _parse_panorama_sheet(ws) -> list[PanoramaChainRow]:
    rows_out: list[PanoramaChainRow] = []
    stage_label = ""
    driver = ""
    demand_name = ""
    function_name = ""
    l2_l4 = ""
    target_domain = ""
    automation_text = ""
    rec_level = ""
    rec_reason = ""

    for row in ws.iter_rows(min_row=4, values_only=False):
        row_no = _row_number(row)
        if row_no is None:
            continue

        def col(letter: str) -> str:
            idx = ord(letter) - ord("A")
            if idx >= len(row) or not _real_cell(row[idx]):
                return ""
            return _cell_str(row[idx].value)

        b, c, d, e = col("B"), col("C"), col("D"), col("E")
        n, p, q, r, s = col("N"), col("P"), col("Q"), col("R"), col("S")
        k, l_, m = col("K"), col("L"), col("M")

        if b:
            stage_label = b
        if c:
            driver = c
        if d:
            demand_name = d
        if e:
            function_name = e
        if n and not _slash_empty(n):
            l2_l4 = n
        if p and not _slash_empty(p):
            target_domain = p
        if q and not _slash_empty(q):
            automation_text = q
        if r and not _slash_empty(r):
            rec_level = r
        if s and not _slash_empty(s):
            rec_reason = s

        landing_cells: list[PanoramaLandingCell] = []
        for letter, (key, vocab_name) in DOMAIN_COLUMNS.items():
            text = col(letter)
            if _slash_empty(text):
                continue
            landing_cells.append(
                PanoramaLandingCell(
                    domain_key=key,
                    domain_vocab_name=vocab_name,
                    name=text,
                    design_engineering=k or None,
                    manufacturing_engineering=l_ or None,
                    operations_engineering=m or None,
                )
            )

        if not landing_cells and not (demand_name or function_name or driver):
            continue

        rows_out.append(
            PanoramaChainRow(
                row=row_no,
                value_chain_stage_label=stage_label,
                value_chain_stage_code=_map_stage_label(stage_label),
                driver=driver or None,
                demand_name=demand_name or None,
                function_name=function_name or None,
                l2_l4_difference=l2_l4 or None,
                target_domain=target_domain or None,
                automation_levels=_parse_automation_levels(automation_text),
                recommendation_level=rec_level or None,
                recommendation_reason=rec_reason or None,
                landing_cells=landing_cells,
            )
        )
    return rows_out
