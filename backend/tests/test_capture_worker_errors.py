"""Worker permanent-failure classification for domain vs transport errors."""

from __future__ import annotations

from fastapi import HTTPException

from app.platform.errors import ValidationError
def _permanent(exc: Exception) -> bool:
    from fastapi import HTTPException

    from app.platform.errors import DomainError
    from app.services.url_fetch import FetchError, RetryableFetchError

    client_error = isinstance(exc, HTTPException) or isinstance(exc, DomainError)
    return (isinstance(exc, FetchError) and not isinstance(exc, RetryableFetchError)) or (
        client_error and 400 <= exc.status_code < 500 and exc.status_code != 429
    )


def test_domain_validation_error_is_permanent() -> None:
    assert _permanent(ValidationError("bad payload"))


def test_http_422_is_permanent() -> None:
    assert _permanent(HTTPException(422, "bad"))
