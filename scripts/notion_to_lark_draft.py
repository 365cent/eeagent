#!/usr/bin/env python3
"""Convert Notion-flavored markdown (from notion-fetch) to Lark docs markdown draft."""
from __future__ import annotations

import re
import sys
from pathlib import Path


def convert(raw: str) -> str:
    m = re.search(r"<content>\s*(.*)\s*</content>", raw, re.DOTALL)
    text = m.group(1).strip() if m else raw.strip()

    text = re.sub(r"<table-of-contents\s*/>\s*", "", text)
    text = re.sub(r"<p\s*/>\s*", "", text)

    text = re.sub(
        r'<image\s+source="notion-file-block://[^"]*?&name=([^"&]+)"\s*/>',
        r"![\1](@./images/\1)",
        text,
    )

    text = re.sub(r'<date\s+start="([^"]+)"\s*/>', r"\1", text)

    def fix_callout(match: re.Match[str]) -> str:
        icon = match.group(1)
        body = match.group(2).strip()
        body = re.sub(r"</?b>", "**", body)
        body = re.sub(r"<code>([^<]+)</code>", r"`\1`", body)
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", body) if p.strip()]
        inner = "".join(f"<p>{p}</p>" for p in paragraphs)
        return f'<callout emoji="{icon}" background-color="light-blue">{inner}</callout>'

    text = re.sub(
        r'<callout\s+icon="([^"]+)"\s+color="[^"]*">\s*(.*?)\s*</callout>',
        fix_callout,
        text,
        flags=re.DOTALL,
    )

    text = re.sub(r"<code>([^<]+)</code>", r"`\1`", text)
    text = re.sub(r"<b>([^<]+)</b>", r"**\1**", text)

    def mermaid_to_whiteboard(match: re.Match[str]) -> str:
        body = match.group(1).strip()
        return f"<whiteboard type=\"mermaid\">\n{body}\n</whiteboard>"

    text = re.sub(
        r"```mermaid\s*\n(.*?)\n```",
        mermaid_to_whiteboard,
        text,
        flags=re.DOTALL,
    )

    # GFM tables: escape pipe inside backticks already; fix submission\_id
    text = text.replace("\\_", "_")

    return text


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: notion_to_lark_draft.py <notion-fetch.txt> <output.md>", file=sys.stderr)
        return 2
    src = Path(sys.argv[1]).read_text(encoding="utf-8")
    out = convert(src)
    Path(sys.argv[2]).write_text(out, encoding="utf-8")
    print(f"Wrote {len(out)} chars to {sys.argv[2]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())