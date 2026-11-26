"""HTTP header helpers.

Header values are latin-1 in Starlette, so a non-ASCII filename cannot be put in
``Content-Disposition`` directly: it raises UnicodeEncodeError at response time
(the PDF preview returned 500 for every Chinese-named document). RFC 5987's
``filename*`` carries the real name; ``filename`` stays an ASCII fallback.
"""
from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import quote

_UNSAFE = re.compile(r'["\\\r\n]')


def content_disposition(filename: str, *, disposition: str = "inline") -> str:
    name = (filename or "").strip() or "document"
    suffix = Path(name).suffix
    ascii_name = _UNSAFE.sub("_", name.encode("ascii", "ignore").decode("ascii")).strip()
    if not ascii_name or ascii_name == suffix:
        ascii_name = f"document{suffix}"
    return f'{disposition}; filename="{ascii_name}"; filename*=UTF-8\'\'{quote(name)}'
