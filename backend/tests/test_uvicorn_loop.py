"""Windows dev loop selection and LaunchDarkly shutdown guards."""
import asyncio
import sys

import pytest

from app.core.uvicorn_loop import eea_event_loop

pytestmark = pytest.mark.no_db


def test_eea_event_loop_returns_a_selector_loop_on_windows():
    loop = eea_event_loop()
    try:
        assert isinstance(loop, asyncio.AbstractEventLoop)
        if sys.platform == "win32":
            assert isinstance(loop, asyncio.SelectorEventLoop)
    finally:
        loop.close()
