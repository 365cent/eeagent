"""PDF preview for uploaded documents: pass-through PDF or LibreOffice conversion."""
from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

from app.services.doc_ingest import suffix_for

_OFFICE_SUFFIXES = frozenset({".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".xlsm"})


class DocumentPreviewError(Exception):
    """Base error for preview generation."""


class UnsupportedDocumentPreviewError(DocumentPreviewError):
    """MIME/filename is not eligible for PDF preview."""


class OfficePreviewUnavailableError(DocumentPreviewError):
    """Office→PDF needs LibreOffice on the server host."""


def document_pdf_preview_supported(filename: str | None, mime: str | None) -> bool:
    suffix = suffix_for(filename, mime)
    return suffix == ".pdf" or suffix in _OFFICE_SUFFIXES


def build_pdf_preview_bytes(raw: bytes, filename: str | None, mime: str | None) -> bytes:
    """Return PDF bytes suitable for inline viewing."""
    suffix = suffix_for(filename, mime)
    if suffix == ".pdf":
        return raw
    if suffix not in _OFFICE_SUFFIXES:
        raise UnsupportedDocumentPreviewError(f"不支持以 PDF 预览的类型：{suffix or mime or 'unknown'}")
    return _office_bytes_to_pdf(raw, suffix)


def _soffice_path() -> str | None:
    return shutil.which("soffice") or shutil.which("libreoffice")


def _office_bytes_to_pdf(data: bytes, suffix: str) -> bytes:
    soffice = _soffice_path()
    if not soffice:
        raise OfficePreviewUnavailableError(
            "未安装 LibreOffice（soffice）。请在 Linux 内网节点安装以预览 Word/PPT/Excel 原件。"
        )
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        stem = "preview-source"
        source = work / f"{stem}{suffix}"
        source.write_bytes(data)
        proc = subprocess.run(
            [soffice, "--headless", "--nologo", "--norestore", "--convert-to", "pdf", "--outdir", str(work), str(source)],
            capture_output=True,
            timeout=180,
            check=False,
        )
        if proc.returncode != 0:
            err = (proc.stderr or proc.stdout or b"").decode("utf-8", errors="replace")[:400]
            raise DocumentPreviewError(f"LibreOffice 转换失败（exit {proc.returncode}）：{err or '无输出'}")
        out = work / f"{stem}.pdf"
        if not out.is_file():
            candidates = list(work.glob("*.pdf"))
            if len(candidates) == 1:
                out = candidates[0]
            else:
                raise DocumentPreviewError("LibreOffice 未生成 PDF 输出文件")
        return out.read_bytes()
