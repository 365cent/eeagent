#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""deckpeek delivery self-check (build & run verification).

Checks, in order:
  1. environment  : Python version, python-pptx importable, pywin32 presence (warn only)
  2. source build : generate a 3-slide sample .pptx, run deckpeek.py on it and validate
                    the generated HTML (render via PowerPoint when available; when COM
                    is unavailable it falls back to placeholder base images automatically)
  3. frozen build : run dist\\deckpeek.exe the same way, from a clean temp cwd, with the
                    deck under a path containing a space and CJK characters
  4. PE subsystem : the exe must be GUI-subsystem (no console window)

Usage:
    python verify.py                 # source + exe (exe step skipped if not built yet)
    python verify.py --source-only
    python verify.py --exe-only
    python verify.py --deck real.pptx    # use a real deck instead of the sample
    python verify.py --no-render         # skip PowerPoint entirely (placeholders)

Exit code 0 = all executed checks passed. No network access required.
"""
import argparse
import base64
import os
import struct
import subprocess
import sys
import tempfile
import zlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "deckpeek.py"
EXE = HERE / "dist" / "deckpeek.exe"
SLIDE_MARK = 'class="slide"'
MIN_HTML = 4000          # bytes; a 3-slide viewer is far larger
EXPECT_SIZE = (1600, 900)


def out(msg=""):
    print(msg, flush=True)


def head(title):
    out("")
    out("-" * 70)
    out(title)
    out("-" * 70)


class Fail(Exception):
    pass


def need(cond, msg):
    if not cond:
        raise Fail(msg)


# ---------------------------------------------------------------- tiny PNG
def png_1x1():
    """A valid 1x1 white PNG, built with zlib only (no Pillow needed)."""
    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))
    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    idat = zlib.compress(b"\x00\xff\xff\xff", 9)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr)
            + chunk(b"IDAT", idat) + chunk(b"IEND", b""))


def png_size(path):
    """Return (w, h) from a PNG IHDR, or None if the file is not a PNG."""
    try:
        raw = Path(path).read_bytes()[:24]
        if raw[:8] != b"\x89PNG\r\n\x1a\n":
            return None
        return struct.unpack(">II", raw[16:24])
    except Exception:  # noqa: BLE001
        return None


# ---------------------------------------------------------------- environment
def check_env():
    head("1. environment")
    out("  python      : %s" % sys.version.split()[0])
    out("  executable  : %s" % sys.executable)
    need(sys.version_info >= (3, 9), "Python 3.9+ required")
    try:
        import pptx
        out("  python-pptx : %s" % pptx.__version__)
    except Exception as exc:  # noqa: BLE001
        raise Fail("cannot import pptx: %s" % exc)
    out("  deckpeek.py : %d KB" % (SRC.stat().st_size // 1024))
    try:
        import win32com.client  # noqa: F401
        out("  pywin32     : present (PowerPoint base-image export available)")
    except Exception:  # noqa: BLE001
        out("  pywin32     : MISSING (viewer still works; base-image export disabled)")
    return True


# ------------------------------------------------------------- sample deck
def make_sample_deck(path):
    """3 slides: title text, a table, and nested shapes -- enough to exercise the parser."""
    from pptx import Presentation
    from pptx.util import Inches, Pt
    from pptx.dml.color import RGBColor
    from pptx.enum.shapes import MSO_SHAPE

    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank = prs.slide_layouts[6]

    s1 = prs.slides.add_slide(blank)
    tb = s1.shapes.add_textbox(Inches(0.8), Inches(1.2), Inches(10.0), Inches(1.4))
    tb.text_frame.text = "deckpeek build verification"
    tb.text_frame.paragraphs[0].runs[0].font.size = Pt(40)
    tb.text_frame.paragraphs[0].runs[0].font.color.rgb = RGBColor(0x33, 0x37, 0x3D)

    s2 = prs.slides.add_slide(blank)
    rows, cols = 3, 4
    tbl = s2.shapes.add_table(rows, cols, Inches(0.6), Inches(1.0),
                              Inches(9.0), Inches(2.0)).table
    for r in range(rows):
        for c in range(cols):
            tbl.cell(r, c).text = "r%dc%d" % (r, c)

    s3 = prs.slides.add_slide(blank)
    box = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                              Inches(1.0), Inches(1.0), Inches(4.0), Inches(2.0))
    box.text_frame.text = "shape with text"
    inner = s3.shapes.add_shape(MSO_SHAPE.OVAL,
                                Inches(6.0), Inches(3.5), Inches(2.0), Inches(1.0))
    inner.text_frame.text = "second shape"

    prs.save(str(path))
    return path


# ------------------------------------------------------------------ runner
def run_viewer(cmd, cwd, timeout=240):
    env = dict(os.environ)
    env["PYTHONIOENCODING"] = "utf-8"
    return subprocess.run(cmd, cwd=str(cwd), env=env, timeout=timeout,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def n_slides(deck):
    from pptx import Presentation
    try:
        return len(Presentation(str(deck)).slides)
    except Exception:  # noqa: BLE001
        return 0


def seed_placeholders(out_dir, count):
    """Write s01.png .. sNN.png placeholders so --no-render can build the viewer."""
    rdir = out_dir / "_render"
    rdir.mkdir(parents=True, exist_ok=True)
    data = png_1x1()
    for i in range(1, count + 1):
        (rdir / ("s%02d.png" % i)).write_bytes(data)
    return rdir


def run_case(binary, label, deck, out_dir, cwd, skip_render):
    """Run one deckpeek build and validate the result. Returns True if PowerPoint was used.

    `binary` is the command prefix: [sys.executable, deckpeek.py] for the source run,
    [dist\\deckpeek.exe] for the frozen run.
    """
    base = list(binary) + [str(deck), "-o", str(out_dir), "--no-open"]
    used_pp = False
    if skip_render:
        seed_placeholders(out_dir, n_slides(deck))
        proc = run_viewer(base + ["--no-render"], cwd)
        out("  render      : skipped by request (placeholder base images)")
    else:
        proc = run_viewer(base, cwd)
        used_pp = proc.returncode == 0
        if used_pp:
            out("  render      : PowerPoint (COM) export")
        else:
            out("  render      : PowerPoint unavailable -> placeholder fallback")
            need(n_slides(deck) > 0, "%s: deck has no slides" % label)
            seed_placeholders(out_dir, n_slides(deck))
            proc = run_viewer(base + ["--no-render"], cwd)

    tail = (proc.stdout or b"").decode("utf-8", "replace").strip().splitlines()
    for line in tail[-5:]:
        out("  | " + line[:100])
    if proc.returncode != 0:
        err = (proc.stderr or b"").decode("utf-8", "replace").strip()[-800:]
        raise Fail("%s exited %d\n%s" % (label, proc.returncode, err))

    validate(out_dir, label, expect_pngs=used_pp and not skip_render)
    return used_pp


def validate(out_dir, label, expect_pngs):
    idx = out_dir / "index.html"
    need(idx.exists(), "%s: index.html not created" % label)
    raw = idx.read_text(encoding="utf-8", errors="replace")
    size = idx.stat().st_size
    out("  index.html  : %.1f KB" % (size / 1024.0))
    need(size >= MIN_HTML, "%s: index.html suspiciously small (%d bytes)" % (label, size))
    slides = raw.count(SLIDE_MARK)
    out("  slides      : %d" % slides)
    need(slides == 3, "%s: expected 3 slides in HTML, found %d" % (label, slides))
    for marker in ("data-shapes=", "data-slide=", "data-desc"):
        need(marker in raw, "%s: HTML missing marker %r" % (label, marker))
    out("  markers     : data-shapes / data-slide / data-desc ok")

    if expect_pngs:
        rdir = out_dir / "_render"
        pngs = sorted(rdir.glob("s*.png"))
        out("  base images : %d" % len(pngs))
        need(len(pngs) >= 3, "%s: expected >=3 base PNGs, found %d" % (label, len(pngs)))
        dim = png_size(pngs[0])
        out("  PNG size    : %sx%s" % dim if dim else "  PNG size    : unknown")
        need(dim == EXPECT_SIZE,
             "%s: base PNG is %s, expected %sx%s" % (label, dim, *EXPECT_SIZE))
    return size


# --------------------------------------------------------------- PE subsystem
def pe_subsystem(path):
    """OptionalHeader.Subsystem: 2 = GUI, 3 = console. None if not a PE file."""
    try:
        head = Path(path).read_bytes()[:0x1000]
        if head[:2] != b"MZ":
            return None
        e_lfanew = int.from_bytes(head[0x3C:0x40], "little")
        if head[e_lfanew:e_lfanew + 4] != b"PE\0\0":
            return None
        opt = e_lfanew + 24            # PE signature (4) + COFF header (20)
        return int.from_bytes(head[opt + 0x44:opt + 0x46], "little")  # Subsystem
    except Exception:  # noqa: BLE001
        return None


def check_pe():
    head("4. PE header")
    if not EXE.exists():
        out("  skipped: exe not built yet")
        return None
    sub = pe_subsystem(EXE)
    name = {2: "GUI (no console window)", 3: "console"}.get(sub, "unknown (%s)" % sub)
    out("  subsystem   : %s" % name)
    need(sub == 2, "exe subsystem is not GUI (2) -- a console window would flash")
    return sub


# ------------------------------------------------------------------------ main
def main(argv=None):
    ap = argparse.ArgumentParser(description="deckpeek delivery self-check")
    ap.add_argument("--deck", default=None, help="use this .pptx instead of the built-in sample")
    ap.add_argument("--source-only", action="store_true")
    ap.add_argument("--exe-only", action="store_true")
    ap.add_argument("--no-render", action="store_true",
                    help="do not call PowerPoint at all (placeholder base images)")
    args = ap.parse_args(argv)

    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:  # noqa: BLE001
        pass

    out("deckpeek verify  |  %s" % HERE)
    results = {}
    tmp = Path(tempfile.mkdtemp(prefix="deckpeek_verify_"))
    try:
        deck = Path(args.deck).resolve() if args.deck else make_sample_deck(tmp / "sample.pptx")
        need(deck.exists(), "deck not found: %s" % deck)

        if args.exe_only:
            head("2. source run -- skipped")
        else:
            head("2. source run (%s)" % SRC.name)
            results["source"] = run_case([sys.executable, str(SRC)], "source", deck,
                                         tmp / "out_src", HERE, args.no_render)

        if args.source_only:
            head("3. frozen run -- skipped")
        else:
            head("3. frozen run (dist\\deckpeek.exe, clean cwd, path with space + CJK)")
            if not EXE.exists():
                out("  skipped: not built yet (run build_exe.cmd)")
                results["exe"] = None
            else:
                out("  exe         : %s" % EXE)
                out("  size        : %.1f MB" % (EXE.stat().st_size / (1024.0 * 1024.0)))
                weird = tmp / "样例 deck"
                weird.mkdir(parents=True, exist_ok=True)
                deck2 = weird / "样例 deck.pptx"
                deck2.write_bytes(deck.read_bytes())
                results["exe"] = run_case([str(EXE)], "exe", deck2,
                                          weird / "out exe", weird, args.no_render)
                results["pe"] = check_pe()
    except Fail as exc:
        out("")
        out("FAIL: %s" % exc)
        return 1
    except subprocess.TimeoutExpired as exc:
        out("")
        out("FAIL: timeout after %ss: %s" % (exc.timeout, exc.cmd))
        return 1
    finally:
        import shutil
        shutil.rmtree(tmp, ignore_errors=True)

    head("SUMMARY")
    for key in ("source", "exe", "pe"):
        if key not in results:
            continue
        val = results[key]
        state = "PASS" if val else ("SKIP" if val is None else "PASS")
        out("  %-6s %s" % (key, state))
    out("")
    out("  ALL CHECKS PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
