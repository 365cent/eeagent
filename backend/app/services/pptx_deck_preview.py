"""PPTX slide viewer HTML via deckpeek (structure mode; optional COM renders on Windows)."""
from __future__ import annotations

import importlib.util
import re
import shutil
import tempfile
from pathlib import Path

from app.core.config import get_settings
from app.services.doc_ingest import suffix_for
from app.services.objectstore import load_bytes, put_object
from app.services.pptx_slide_render import render_pptx_slide_pngs

_DECKPEEK_SCRIPT = Path(__file__).resolve().parents[2] / "vendor/deckpeek/deckpeek.py"
_BASE_TAG_RE = re.compile(r"<head(\s[^>]*)?>", re.IGNORECASE)
_DECKPEEK_BANNER_RE = re.compile(r'<div id="banner"[^>]*>.*?</div>\s*', re.DOTALL | re.IGNORECASE)
_DECKPEEK_LIVEBANNER_RE = re.compile(r'<div id="livebanner"[^>]*>.*?</div>\s*', re.DOTALL | re.IGNORECASE)
_BODY_CLOSE_RE = re.compile(r"</body>", re.IGNORECASE)
_LEGACY_BOOT_RE = re.compile(r"setMode\(false\);\s*show\(fromHash", re.IGNORECASE)
_EEA_DECK_EMBED_TAIL = """
<script id="eea-deck-embed-tail">
(function () {
  function stripBanners() {
    ['banner', 'livebanner'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.remove();
    });
  }
  function toStructure() {
    stripBanners();
    document.body.classList.remove('mode-bg');
    document.body.classList.add('mode-struct', 'eea-deck-embed');
    var bg = document.getElementById('m-bg');
    var st = document.getElementById('m-struct');
    if (bg) { bg.classList.remove('on'); bg.setAttribute('aria-selected', 'false'); }
    if (st) { st.classList.add('on'); st.setAttribute('aria-selected', 'true'); }
    if (typeof setMode === 'function') { setMode(true); }
    if (typeof window.eeaDeckEmbedSync === 'function') { window.eeaDeckEmbedSync(); }
    else if (typeof fit === 'function') { fit(); }
  }
  toStructure();
  window.addEventListener('load', toStructure);
  setTimeout(toStructure, 50);
  setTimeout(toStructure, 300);
})();
</script>
"""

# Responsive overrides when deckpeek runs inside the evidence studio iframe (narrow column).
_EEA_DECK_EMBED_HEAD = """
<style id="eea-deck-embed">
#banner, #livebanner { display: none !important; visibility: hidden !important; }
/* EEA embed serves sans COM PNGs — structure view + collapsed panel even before JS runs */
#panel { display: none !important; }
:root { --panel: 0px !important; }
#main, #strip { left: 0 !important; right: 0 !important; }
body.mode-bg #bg { display: none !important; }
body.eea-deck-embed #bg { display: none !important; }
body.eea-deck-embed #stage.noimg::after { display: none !important; content: none !important; }
body.eea-deck-embed.mode-bg .sh:not(.err) {
  background: var(--eea-sh-bg, revert-layer) !important;
  border-color: var(--eea-sh-border, revert-layer) !important;
  color: var(--eea-sh-color, inherit) !important;
}
body.eea-deck-embed.mode-bg .sh > * { visibility: visible !important; }
/* Evidence studio embed: always narrow column — compact chrome, full-width stage/strip */
body.eea-deck-embed {
  --panel: 0px;
  --strip: 76px;
  overflow-x: hidden;
}
body.eea-deck-embed #bar {
  flex-wrap: wrap;
  height: auto !important;
  min-height: 44px;
  padding: 6px 8px;
  gap: 6px;
  row-gap: 6px;
  align-content: flex-start;
}
body.eea-deck-embed #bar .brand,
body.eea-deck-embed #bar #info,
body.eea-deck-embed #bar #btn-refresh,
body.eea-deck-embed #bar #btn-all,
body.eea-deck-embed #bar #btn-home { display: none !important; }
body.eea-deck-embed #main,
body.eea-deck-embed #strip { left: 0; right: 0; }
body.eea-deck-embed #stagewrap {
  padding: 2px 4px;
  box-sizing: border-box;
}
body.eea-deck-embed #strip .inner {
  padding: 6px 8px 2px;
  scroll-snap-type: x proximity;
}
body.eea-deck-embed .st {
  width: clamp(68px, 16vw, 112px);
  height: clamp(38px, 9vw, 63px);
  margin-right: 6px;
  scroll-snap-align: start;
}
body.eea-deck-embed .nav #pos {
  font-size: 11px;
  min-width: 52px;
}
body.eea-deck-embed .seg button {
  padding: 4px 8px;
  font-size: 12px;
}
@media (max-width: 900px) {
  body.eea-deck-embed { --strip: 70px; }
  body.eea-deck-embed .st {
    width: clamp(60px, 18vw, 96px);
    height: clamp(34px, 10vw, 54px);
  }
  body.eea-deck-embed #jump { width: 48px; }
}
@media (max-width: 520px) {
  body.eea-deck-embed.eea-deck-stack {
    --panel-stack: min(38vh, 280px);
    --strip: 62px;
  }
  body.eea-deck-embed.eea-deck-stack #panel {
    width: 100%;
    left: 0;
    right: 0;
    top: auto;
    bottom: var(--strip);
    height: var(--panel-stack);
    max-height: var(--panel-stack);
    border-left: 0;
    border-top: 1px solid var(--line);
    padding: 8px;
  }
  body.eea-deck-embed.eea-deck-stack #main {
    right: 0;
    bottom: calc(var(--strip) + var(--panel-stack));
  }
  body.eea-deck-embed.eea-deck-stack #strip {
    right: 0;
    bottom: var(--panel-stack);
  }
  body.eea-deck-embed .st { width: 56px; height: 32px; }
}
/* Collapse deckpeek right panel by default in evidence studio; stage + strip stay full width. */
body.eea-deck-embed.eea-deck-panel-closed { --panel: 0px; }
body.eea-deck-embed.eea-deck-panel-closed #panel { display: none !important; }
body.eea-deck-embed.eea-deck-panel-closed #main,
body.eea-deck-embed.eea-deck-panel-closed #strip { right: 0; }
body.eea-deck-embed.eea-deck-panel-closed.eea-deck-stack #main {
  bottom: var(--strip);
}
#eea-deck-panel-toggle {
  position: fixed;
  top: calc(var(--top) + 8px);
  right: 0;
  z-index: 25;
  padding: 6px 8px;
  border: 1px solid var(--line);
  border-right: 0;
  border-radius: 8px 0 0 8px;
  background: var(--panel-bg);
  color: var(--fg-dim);
  font-size: 12px;
  cursor: pointer;
  box-shadow: -2px 0 8px rgba(0,0,0,.06);
}
body.eea-deck-embed:not(.eea-deck-panel-closed) #eea-deck-panel-toggle { display: none; }
</style>
<script id="eea-deck-embed-init">
(function () {
  var STACK_W = 520;
  function measureBar() {
    var bar = document.getElementById('bar');
    if (!bar) return;
    var h = Math.ceil(bar.getBoundingClientRect().height);
    if (h > 0) document.documentElement.style.setProperty('--top', h + 'px');
  }
  function syncLayout() {
    document.body.classList.add('eea-deck-embed');
    measureBar();
    document.body.classList.toggle('eea-deck-stack', window.innerWidth < STACK_W);
    if (typeof fit === 'function') { fit(); }
  }
  window.eeaDeckEmbedSync = syncLayout;
  window.addEventListener('resize', syncLayout);
  document.addEventListener('DOMContentLoaded', function () {
    syncLayout();
    var bar = document.getElementById('bar');
    if (bar && typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(syncLayout).observe(bar);
    }
    var main = document.getElementById('main');
    if (main && typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(syncLayout).observe(main);
    }
  });
})();
</script>
<script id="eea-deck-embed-boot">
(function () {
  function stripBanners() {
    ['banner', 'livebanner'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.remove();
    });
  }
  function applyStructureMode() {
    stripBanners();
    if (typeof setMode === 'function') { setMode(true); }
  }
  function wirePanel() {
    var body = document.body;
    body.classList.add('eea-deck-embed', 'eea-deck-panel-closed');
    if (document.getElementById('eea-deck-panel-toggle')) return;
    function setPanelOpen(open) {
      body.classList.toggle('eea-deck-panel-closed', !open);
      if (typeof window.eeaDeckEmbedSync === 'function') { window.eeaDeckEmbedSync(); }
      else if (typeof fit === 'function') { fit(); }
    }
    var toggle = document.createElement('button');
    toggle.id = 'eea-deck-panel-toggle';
    toggle.type = 'button';
    toggle.title = '打开元素属性侧栏';
    toggle.setAttribute('aria-label', '打开元素属性侧栏');
    toggle.textContent = '属性';
    toggle.addEventListener('click', function () { setPanelOpen(true); });
    document.body.appendChild(toggle);
    var shapes = document.getElementById('shapes');
    if (shapes) { shapes.addEventListener('click', function () { setPanelOpen(true); }); }
    var clearBtn = document.getElementById('btn-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        window.setTimeout(function () {
          var desc = document.getElementById('desc');
          if (desc && !desc.value) { setPanelOpen(false); }
        }, 0);
      });
    }
  }
  function boot() {
    applyStructureMode();
    wirePanel();
  }
  /* deckpeek ends its bundle with setMode(false); run after that on load + delayed pass */
  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', function () { boot(); setTimeout(boot, 0); setTimeout(applyStructureMode, 120); });
})();
</script>
"""


class PptxDeckPreviewError(Exception):
    pass


class PptxDeckPreviewUnavailableError(PptxDeckPreviewError):
    """Reference deckpeek.py missing or export failed."""


def pptx_deck_preview_supported(filename: str | None, mime: str | None) -> bool:
    return suffix_for(filename, mime) in {".ppt", ".pptx"}


def deck_preview_prefix(doc_sha256: str) -> str:
    return f"documents/deck-preview/{doc_sha256}"


def deck_preview_index_key(doc_sha256: str) -> str:
    return f"{deck_preview_prefix(doc_sha256)}/index.html"


def deck_preview_cached(doc_sha256: str) -> bool:
    return load_bytes(deck_preview_index_key(doc_sha256)) is not None


def clear_deck_preview_cache(doc_sha256: str) -> None:
    root = Path(get_settings().object_dir).resolve()
    path = (root / deck_preview_prefix(doc_sha256)).resolve()
    if not path.is_relative_to(root):
        raise ValueError("deck preview path must stay inside OBJECT_DIR")
    if path.is_dir():
        shutil.rmtree(path)


def deck_preview_html_is_legacy(html: bytes | str) -> bool:
    text = html.decode("utf-8", errors="replace") if isinstance(html, bytes) else html
    if "force-render" in text or "slides/ 里没有对应的 sNN.png" in text:
        return True
    if _DECKPEEK_BANNER_RE.search(text):
        return True
    return _LEGACY_BOOT_RE.search(text) is not None


_BODY_OPEN_RE = re.compile(r"<body([^>]*)\sclass=\"([^\"]*)\"", re.IGNORECASE)


def _eea_embed_body_class(existing: str) -> str:
    drop = {"mode-bg", "mode-struct", "eea-deck-embed", "eea-deck-panel-closed"}
    parts = [p for p in existing.split() if p and p not in drop]
    return " ".join(["mode-struct", "eea-deck-embed", "eea-deck-panel-closed", *parts])


def _sanitize_deckpeek_html_for_eea(text: str) -> str:
    """Drop CLI-only missing-PNG banner; default viewer to structure mode."""
    text = _DECKPEEK_BANNER_RE.sub("", text)
    text = _DECKPEEK_LIVEBANNER_RE.sub("", text)
    # deckpeek boot forces 底图 mode last; structure mode is correct without COM renders.
    text = text.replace("setMode(false);\nshow(fromHash()", "setMode(true);\nshow(fromHash()")
    text = text.replace("setMode(false);show(fromHash()", "setMode(true);show(fromHash()")
    if _BODY_OPEN_RE.search(text):
        text = _BODY_OPEN_RE.sub(
            lambda m: f'<body{m.group(1)} class="{_eea_embed_body_class(m.group(2))}"',
            text,
            count=1,
        )
    text = text.replace(
        'id="m-bg" role="tab" aria-selected="true" class="on"',
        'id="m-bg" role="tab" aria-selected="false" class=""',
    )
    text = text.replace(
        'id="m-struct" role="tab" aria-selected="false"',
        'id="m-struct" role="tab" aria-selected="true" class="on"',
    )
    # Avoid deck.json / slide-PNG polling in the embed (reduces proxy errors when COM renders are absent).
    text = text.replace("setInterval(tick, 2000);", "/* eea: deck.json poll disabled */")
    return text


def _patch_deckpeek_export_for_server(deckpeek) -> None:
    """Server builds skip Windows COM slide PNGs — do not emit the missing-render banner."""
    export_fn = deckpeek.export

    def export_without_missing_banner(deck_path, out_dir, render_dir, report_slides):
        _orig_render = deckpeek.render_page

        def render_page(*args, **kwargs):
            fixed = list(args)
            if len(fixed) >= 6:
                fixed[5] = []
            return _orig_render(*fixed, **kwargs)

        deckpeek.render_page = render_page
        try:
            return export_fn(deck_path, out_dir, render_dir, report_slides)
        finally:
            deckpeek.render_page = _orig_render

    deckpeek.export = export_without_missing_banner


def _load_deckpeek():
    if not _DECKPEEK_SCRIPT.is_file():
        raise PptxDeckPreviewUnavailableError(
            f"deckpeek 参考实现不存在：{_DECKPEEK_SCRIPT}"
        )
    spec = importlib.util.spec_from_file_location("deckpeek_ref", _DECKPEEK_SCRIPT)
    if spec is None or spec.loader is None:
        raise PptxDeckPreviewUnavailableError("无法加载 deckpeek 模块")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def build_pptx_deck_preview(
    raw: bytes, filename: str | None, doc_sha256: str, *, force: bool = False
) -> None:
    """Generate deckpeek HTML tree into the object store (idempotent per doc sha256)."""
    if deck_preview_cached(doc_sha256):
        if not force:
            return
        clear_deck_preview_cache(doc_sha256)
    if not pptx_deck_preview_supported(filename, None):
        raise PptxDeckPreviewError("非 PPTX 文档")

    deckpeek = _load_deckpeek()
    _patch_deckpeek_export_for_server(deckpeek)
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        name = Path(filename or "deck.pptx").name
        if not name.lower().endswith((".ppt", ".pptx")):
            name = "deck.pptx"
        src = work / name
        src.write_bytes(raw)
        out_dir = work / "out"
        render_dir = out_dir / "_render"
        render_dir.mkdir(parents=True)
        render_pptx_slide_pngs(raw, render_dir, filename=name)
        try:
            deckpeek.export(str(src), str(out_dir), str(render_dir), {1})
        except Exception as exc:  # noqa: BLE001
            raise PptxDeckPreviewError(f"deckpeek 导出失败：{exc}") from exc
        index = out_dir / "index.html"
        if not index.is_file():
            raise PptxDeckPreviewError("deckpeek 未生成 index.html")
        index.write_text(
            _sanitize_deckpeek_html_for_eea(index.read_text(encoding="utf-8")),
            encoding="utf-8",
        )

        prefix = deck_preview_prefix(doc_sha256)
        for path in out_dir.rglob("*"):
            if not path.is_file():
                continue
            rel = path.relative_to(out_dir).as_posix()
            payload = path.read_bytes()
            if rel == "index.html":
                payload = _sanitize_deckpeek_html_for_eea(payload.decode("utf-8")).encode("utf-8")
            put_object(f"{prefix}/{rel}", payload)


def inject_deck_preview_base_href(html: bytes, base_href: str) -> bytes:
    text = html.decode("utf-8", errors="replace")
    text = _sanitize_deckpeek_html_for_eea(text)
    tag = f'<base href="{base_href}">{_EEA_DECK_EMBED_HEAD}'
    if _BASE_TAG_RE.search(text):
        text = _BASE_TAG_RE.sub(rf"<head\1>{tag}", text, count=1)
    else:
        text = tag + text
    if _BODY_CLOSE_RE.search(text):
        text = _BODY_CLOSE_RE.sub(_EEA_DECK_EMBED_TAIL + "</body>", text, count=1)
    else:
        text += _EEA_DECK_EMBED_TAIL
    return text.encode("utf-8")
