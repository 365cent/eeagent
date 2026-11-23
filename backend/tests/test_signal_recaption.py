"""Regenerate figure captions for one whole signal article."""

import pytest
from fastapi import HTTPException

from app.services import signal_recaption

pytestmark = pytest.mark.anyio


def test_counts_failed_captions() -> None:
    body = "> 图 1：（视觉模型未返回描述）\n\n> 图 2：架构图\n"
    assert signal_recaption.count_failed_captions(body) == (2, 1)


def test_blank_caption_counts_as_failed() -> None:
    assert signal_recaption.count_failed_captions("> 图 1：  \n") == (1, 1)
    assert signal_recaption.caption_is_failed(None) is True
    assert signal_recaption.caption_is_failed("架构图") is False


async def test_requires_an_html_archive() -> None:
    class Signal:
        snapshot_html_object_key = None
        body_object_key = "body"
        url = "https://example.test/a"

    with pytest.raises(HTTPException) as exc:
        await signal_recaption.recaption_signal_article(None, Signal())
    assert exc.value.status_code == 409


async def test_requires_a_stored_body() -> None:
    class Signal:
        snapshot_html_object_key = "html"
        body_object_key = None
        url = "https://example.test/a"

    with pytest.raises(HTTPException) as exc:
        await signal_recaption.recaption_signal_article(None, Signal())
    assert exc.value.status_code == 409
