"""Runtime TPS book for chat models: rank by measured throughput, in memory only.

Which gateway id is fastest depends on the enterprise gateway's mood, not on a
config value. Every answered chat call feeds ``output_tokens / generation_s``
for the model that actually served it; :func:`rank_models` then puts the fastest
recently measured ids first while ids without a fresh sample keep the gateway
order. An explicit ``CHAT_MODEL`` order is never reordered - operators stay in
charge of the retry order.

The book lives in this process: a restart simply re-measures. Nothing is written
to disk, to the database, or back into ``backend/.env``. Failures are recorded
separately from speed samples so a model that returns empty content is demoted
without poisoning its TPS average.
"""

from __future__ import annotations

import asyncio
import time
from collections.abc import Iterable, Sequence

from pydantic import BaseModel, Field

from app.core.config import get_settings

DEFAULT_TTL_SECONDS = 1200.0
DEFAULT_ALPHA = 0.4
#: Consecutive failures that push a previously fast model behind untested ones.
SUSPECT_AFTER_FAILURES = 3


class ModelSpeedRecord(BaseModel):
    """One model's measured throughput and health for one task."""

    model: str
    task: str = "chat"
    tps: float = 0.0
    samples: int = 0
    failures: int = 0
    consecutive_failures: int = 0
    last_ok_at: float | None = None
    last_failure_at: float | None = None
    last_kind: str | None = None
    last_error: str | None = None
    unavailable: bool = False
    unavailable_at: float | None = None


class ModelSpeedOut(BaseModel):
    """Status shape for ``GET /llm/status`` (no secrets, no prompts)."""

    model: str
    tps: float = 0.0
    samples: int = 0
    failures: int = 0
    age_s: float | None = None
    unavailable: bool = False


def _settings_ttl() -> float:
    return float(getattr(get_settings(), "chat_model_speed_ttl_seconds", DEFAULT_TTL_SECONDS))


def _output_tokens(usage: object) -> int:
    """Completion tokens from an OpenAI usage dict (0 when unreported)."""
    if not isinstance(usage, dict):
        return 0
    for key in ("completion_tokens", "output_tokens"):
        value = usage.get(key)
        if isinstance(value, int) and not isinstance(value, bool) and value > 0:
            return value
    return 0


class ModelSpeedBook:
    """In-process, TTL-bounded TPS measurements guarded by one lock."""

    def __init__(self, *, alpha: float = DEFAULT_ALPHA) -> None:
        self.alpha = min(1.0, max(0.05, alpha))
        self._records: dict[tuple[str, str], ModelSpeedRecord] = {}
        self._lock = asyncio.Lock()

    # -- writes -----------------------------------------------------------
    def _entry(self, task: str, model: str) -> ModelSpeedRecord:
        key = (task, model)
        record = self._records.get(key)
        if record is None:
            record = ModelSpeedRecord(model=model, task=task)
            self._records[key] = record
        return record

    async def record_success(
        self,
        model: str,
        *,
        output_tokens: int,
        seconds: float,
        task: str = "chat",
    ) -> float | None:
        """Record one answered call; returns the sample's TPS (None if unusable)."""
        if not model or output_tokens <= 0 or seconds <= 0:
            return None
        tps = output_tokens / seconds
        async with self._lock:
            record = self._entry(task, model)
            record.tps = tps if record.samples == 0 else (
                self.alpha * tps + (1 - self.alpha) * record.tps
            )
            record.samples += 1
            record.consecutive_failures = 0
            record.last_ok_at = time.monotonic()
            record.last_kind = "ok"
            record.unavailable = False
            record.unavailable_at = None
        return tps

    async def record_failure(
        self,
        model: str,
        *,
        task: str = "chat",
        error: str = "",
        kind: str = "error",
        permanent: bool = False,
        weight: int = 1,
    ) -> None:
        """Demote one failed call; ``permanent`` ids are skipped for one TTL.

        ``weight`` raises the failure streak faster than one per attempt: a turn
        that breaks the agent contract costs the user a whole reply.
        """
        if not model:
            return
        async with self._lock:
            record = self._entry(task, model)
            record.failures += 1
            record.consecutive_failures += max(1, weight)
            record.last_kind = kind
            record.last_error = (error or "")[:200] or None
            record.last_failure_at = time.monotonic()
            if permanent:
                record.unavailable = True
                record.unavailable_at = record.last_failure_at

    def mark_unavailable(self, model: str, *, task: str = "chat", reason: str = "") -> None:
        """Skip an id that the gateway says does not exist (synchronous, tests)."""
        record = self._entry(task, model)
        record.unavailable = True
        record.unavailable_at = time.monotonic()
        record.last_error = (reason or "")[:200] or None
        record.last_kind = "unavailable"

    # -- reads ------------------------------------------------------------
    def _fresh(self, record: ModelSpeedRecord | None, now: float, ttl: float) -> bool:
        if record is None or record.samples == 0 or record.last_ok_at is None:
            return False
        return now - record.last_ok_at <= ttl

    def _suspect(self, record: ModelSpeedRecord | None, now: float, ttl: float) -> bool:
        if record is None:
            return False
        if record.unavailable and record.unavailable_at is not None:
            if now - record.unavailable_at <= ttl:
                return True
        return record.consecutive_failures >= SUSPECT_AFTER_FAILURES

    async def rank(self, models: Sequence[str], *, task: str = "chat") -> list[str]:
        """Fastest measured first; unmeasured keep their given order; suspects last."""
        now = time.monotonic()
        ttl = _settings_ttl()
        async with self._lock:
            records = {model: self._records.get((task, model)) for model in models}
        order = {model: index for index, model in enumerate(models)}

        def bucket(model: str) -> int:
            record = records.get(model)
            if self._suspect(record, now, ttl):
                return 2
            if self._fresh(record, now, ttl):
                return 0
            return 1

        def key(model: str) -> tuple[int, float, int]:
            record = records.get(model)
            tps = record.tps if record is not None and self._fresh(record, now, ttl) else 0.0
            return (bucket(model), -tps, order[model])

        return sorted(dict.fromkeys(models), key=key)

    async def snapshot(self, *, task: str = "chat") -> list[ModelSpeedOut]:
        """Every measured model, fastest first, for operator visibility."""
        now = time.monotonic()
        ttl = _settings_ttl()
        async with self._lock:
            records = [record for (kind, _model), record in self._records.items() if kind == task]
        entries = [
            ModelSpeedOut(
                model=record.model,
                tps=round(record.tps, 2),
                samples=record.samples,
                failures=record.failures,
                age_s=(
                    round(now - record.last_ok_at, 1)
                    if record.last_ok_at is not None and self._fresh(record, now, ttl)
                    else None
                ),
                unavailable=self._suspect(record, now, ttl),
            )
            for record in records
        ]
        return sorted(entries, key=lambda entry: (-entry.tps, entry.model))

    def reset(self) -> None:
        """Drop every measurement (tests, and explicit operator resets)."""
        self._records.clear()


BOOK = ModelSpeedBook()


async def record_success(
    model: str, *, output_tokens: int, seconds: float, task: str = "chat"
) -> float | None:
    return await BOOK.record_success(
        model, output_tokens=output_tokens, seconds=seconds, task=task
    )


async def record_failure(
    model: str,
    *,
    task: str = "chat",
    error: str = "",
    kind: str = "error",
    permanent: bool = False,
    weight: int = 1,
) -> None:
    await BOOK.record_failure(
        model, task=task, error=error, kind=kind, permanent=permanent, weight=weight
    )


async def rank_models(models: Iterable[str], *, task: str = "chat") -> list[str]:
    return await BOOK.rank(list(models), task=task)


async def snapshot(task: str = "chat") -> list[ModelSpeedOut]:
    return await BOOK.snapshot(task=task)


def reset_speed_book() -> None:
    BOOK.reset()


def usage_output_tokens(usage: object) -> int:
    """Public wrapper: completion tokens from an OpenAI usage payload."""
    return _output_tokens(usage)


__all__ = [
    "BOOK",
    "ModelSpeedBook",
    "ModelSpeedOut",
    "ModelSpeedRecord",
    "rank_models",
    "record_failure",
    "record_success",
    "reset_speed_book",
    "snapshot",
    "usage_output_tokens",
]
