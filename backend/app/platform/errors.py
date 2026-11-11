"""Domain errors mapped to HTTP responses in app.main."""
from __future__ import annotations


class DomainError(Exception):
    """Business rule violation; routers may translate or rely on global handler."""

    status_code: int = 400

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class NotFoundError(DomainError):
    status_code = 404


class ConflictError(DomainError):
    status_code = 409


class ValidationError(DomainError):
    status_code = 422


class FeatureDisabledError(DomainError):
    status_code = 403
