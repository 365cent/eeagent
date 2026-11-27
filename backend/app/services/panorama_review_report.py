"""Compatibility entry point for the legacy review report.

The implementation lives in app.domains.capture.panorama_review_report so the
documented python -m app.services.panorama_review_report command keeps working.
"""
from __future__ import annotations

import asyncio

from app.domains.capture.panorama_review_report import _main, report  # noqa: F401


if __name__ == "__main__":
    asyncio.run(_main())
