"""Hedged chat models: first model to produce a token wins, the rest are cancelled.

A single gateway model can stall for minutes (reasoning-only ids, overloaded
upstreams). Waiting for it serially leaves the chat spinner running forever.

The rule is about the first byte, not the whole answer:

1. candidate 1 starts immediately;
2. if it has not produced its first stream event within `hedge_delay` seconds,
   the next candidate starts alongside it (up to `max_parallel`);
3. the first candidate to emit an event wins and every other candidate is
   cancelled immediately - the winning model then streams alone;
4. a candidate that fails before its first event frees its slot at once, so the
   next one starts without waiting for the hedge delay;
5. a candidate that fails transiently (429/5xx/timeout) is retried in place up
   to `retries` extra times before its slot is released, so one gateway hiccup
   does not discard the model that normally answers.

`race_first` powers the non-streaming chat completion; `HedgedChatModel`
implements the pydantic-ai model protocol for the tool-using agent.
"""

from __future__ import annotations

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator, Awaitable, Callable

import httpx
from pydantic_ai.messages import (
    ModelMessage,
    ModelResponse,
    PartDeltaEvent,
    PartStartEvent,
    TextPart,
    TextPartDelta,
)
from pydantic_ai.models import Model, ModelRequestParameters, StreamedResponse
from pydantic_ai.settings import ModelSettings

from app.core.config import get_settings
from app.services import model_speed

logger = logging.getLogger(__name__)

#: Upstream statuses where an immediate fresh attempt can still succeed.
_RETRYABLE_STATUS = frozenset({404, 408, 429, 500, 502, 503, 504, 554})
#: Text markers for gateway errors that arrive without a useful status.
_TRANSIENT_MARKERS = (
    "timeout",
    "timed out",
    "temporarily",
    "overloaded",
    "rate limit",
    "connection",
    " 429",
    " 502",
    " 503",
    " 504",
)

#: A candidate may spend this long streaming reasoning before it must answer.
ANSWER_PEEK_SECONDS = 2.5
#: ... and at most this many events (one per reasoning token) in that window.
MAX_PEEK_EVENTS = 16


def transient_failure(exc: BaseException) -> bool:
    """True when one more attempt at the same model can plausibly succeed."""
    if isinstance(exc, (TimeoutError, asyncio.TimeoutError, httpx.HTTPError)):
        return True
    status = getattr(exc, "status_code", None)
    if status is None:
        status = getattr(exc, "status", None)
    if isinstance(status, int) and status in _RETRYABLE_STATUS:
        return True
    text = str(exc).lower()
    return any(marker in text for marker in _TRANSIENT_MARKERS)


def _retrying(
    factory: Callable[[], Awaitable[Any]],
    retries: int,
    should_retry: Callable[[BaseException], bool],
    *,
    base_delay: float = 0.5,
    max_delay: float = 4.0,
) -> Callable[[], Awaitable[Any]]:
    """Wrap one candidate: re-run it after transient failures, with backoff.

    Cancellation is never retried - a hedge loser must stop immediately.
    """
    if retries <= 0:
        return factory

    async def wrapped() -> Any:
        for attempt in range(retries + 1):
            try:
                return await factory()
            except BaseException as exc:  # noqa: BLE001 - classify, then re-raise
                if (
                    isinstance(exc, asyncio.CancelledError)
                    or attempt >= retries
                    or not should_retry(exc)
                ):
                    raise
                delay = min(base_delay * (2**attempt), max_delay)
                logger.info(
                    "retrying hedged candidate after %s (%.1fs backoff)",
                    type(exc).__name__,
                    delay,
                )
                await asyncio.sleep(delay)

    return wrapped


async def race_first(
    factories: list[Callable[[], Awaitable[Any]]],
    *,
    hedge_delay: float,
    total_timeout: float,
    max_parallel: int,
    accept: Callable[[Any], bool] | None = None,
    retries: int = 0,
    should_retry: Callable[[BaseException], bool] = transient_failure,
) -> Any:
    """Run candidates with a staggered start; return the first accepted result.

    A failing candidate frees its slot immediately, so the next one starts
    without waiting for the hedge delay; a transient failure first consumes its
    own `retries` budget (`CHAT_MODEL_RETRIES`). Raises the last error, or
    TimeoutError when no candidate answered inside total_timeout.
    """
    accept = accept or (lambda _value: True)
    factories = [_retrying(factory, retries, should_retry) for factory in factories]
    tasks: dict[asyncio.Task[Any], int] = {}
    started = 0
    errors: list[BaseException] = []
    deadline = time.monotonic() + total_timeout

    def launch(index: int) -> None:
        nonlocal started
        task = asyncio.create_task(factories[index]())
        tasks[task] = index
        started = index + 1

    try:
        while True:
            while started < len(factories) and len(tasks) < max_parallel:
                launch(started)
                # Only one candidate starts per hedge window; the loop below
                # waits hedge_delay before adding the next.
                break
            if not tasks:
                break
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise TimeoutError(f"no chat model answered within {total_timeout:.0f}s")
            wait_for = (
                min(hedge_delay, remaining)
                if started < len(factories)
                else remaining
            )
            done, _pending = await asyncio.wait(
                set(tasks), timeout=wait_for, return_when=asyncio.FIRST_COMPLETED
            )
            for task in done:
                tasks.pop(task)
                exc = task.exception()
                if exc is not None:
                    errors.append(exc)
                    continue
                value = task.result()
                if accept(value):
                    return value
                errors.append(RuntimeError("candidate returned an unusable result"))
    finally:
        for task in tasks:
            task.cancel()
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    if errors:
        raise errors[-1]
    raise TimeoutError("no chat model candidates were available")


def _event_has_answer(event: Any) -> bool:
    """True when one stream event already carries answer text or a tool call."""
    if isinstance(event, PartStartEvent):
        part = event.part
        if isinstance(part, TextPart) and part.content.strip():
            return True
        return bool(getattr(part, "tool_name", None))
    if isinstance(event, PartDeltaEvent):
        delta = event.delta
        if isinstance(delta, TextPartDelta) and (delta.content_delta or "").strip():
            return True
        return bool(getattr(delta, "tool_name_delta", None))
    return False


class EmptyAnswerError(RuntimeError):
    """The stream produced reasoning but no answer text in the peek window."""


class _ReplayAsyncIterator:
    """Re-yield the peeked events before continuing with the live iterator."""

    def __init__(self, head: list[Any], tail: Any) -> None:
        self._head = head
        self._tail = tail

    def __aiter__(self) -> "_ReplayAsyncIterator":
        return self

    async def __anext__(self) -> Any:
        if self._head:
            return self._head.pop(0)
        return await self._tail.__anext__()


async def _open_until_first_event(
    model: Model,
    messages: list[ModelMessage],
    model_settings: ModelSettings | None,
    model_request_parameters: ModelRequestParameters,
    run_context: Any,
) -> tuple[Any, StreamedResponse]:
    """Open a stream and wait for the first answer event; return (manager, stream).

    Waiting for the first event is what makes the hedge meaningful: a provider
    that accepts the request and then stalls produces no token, so another
    candidate is allowed to start. The first *answer* event matters, not the
    first event: some gateway ids (Qwen 3.6 today) stream reasoning until
    max_tokens and answer nothing, which would otherwise win the race and leave
    a blank reply. Peeked events are replayed to the winner, so its thinking
    still reaches the consumer.
    """
    manager = model.request_stream(
        messages, model_settings, model_request_parameters, run_context
    )
    stream = await manager.__aenter__()
    try:
        iterator = aiter(stream)
        buffered: list[Any] = []
        peek_seconds = float(
            getattr(get_settings(), "chat_answer_peek_seconds", ANSWER_PEEK_SECONDS)
        )
        deadline = time.monotonic() + peek_seconds
        answered = False
        while len(buffered) < MAX_PEEK_EVENTS:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                break
            try:
                event = await asyncio.wait_for(anext(iterator), timeout=remaining)
            except StopAsyncIteration:
                break
            buffered.append(event)
            if _event_has_answer(event):
                answered = True
                break
        if not answered:
            raise EmptyAnswerError(f"{model.model_name} streamed no answer text")
        stream._event_iterator = _ReplayAsyncIterator(buffered, iterator)
    except BaseException:
        await manager.__aexit__(None, None, None)
        raise
    return manager, stream


def _finished_response(stream: StreamedResponse) -> ModelResponse | None:
    """Final response only when the consumer read the stream to the end."""
    state = getattr(stream, "state", "complete")
    if getattr(state, "value", state) != "complete":
        return None
    try:
        return stream.get()
    except Exception:  # noqa: BLE001 - a partially read stream is not an empty answer
        return None


def _has_usable_part(response: ModelResponse | None) -> bool:
    """True when the answer carries text or a tool call (thinking alone is not)."""
    if response is None:
        return False
    for part in response.parts:
        if getattr(part, "tool_name", None):
            return True
        if isinstance(part, TextPart) and part.content.strip():
            return True
    return False


class _SpeedTrackedStream:
    """Pass-through stream that records TPS once the consumer finishes it.

    The winner is yielded to pydantic-ai, which iterates the stream directly;
    the surrounding async generator stays suspended, so completion has to be
    observed here rather than after ``yield``.
    """

    def __init__(
        self,
        stream: StreamedResponse,
        on_done: Callable[[BaseException | None], Awaitable[None]],
    ) -> None:
        self._stream = stream
        self._iterator = aiter(stream)
        self._on_done = on_done
        self._finished = False

    def __getattr__(self, name: str) -> Any:
        return getattr(self._stream, name)

    def __aiter__(self) -> "_SpeedTrackedStream":
        return self

    async def __anext__(self) -> Any:
        try:
            return await anext(self._iterator)
        except StopAsyncIteration:
            await self._finish(None)
            raise
        except BaseException as exc:  # noqa: BLE001 - recorded, then re-raised
            await self._finish(exc)
            raise

    async def _finish(self, exc: BaseException | None) -> None:
        if self._finished:
            return
        self._finished = True
        await self._on_done(exc)


class HedgedChatModel(Model):
    """pydantic-ai model that races several gateway models on the first token."""

    def __init__(
        self,
        models: list[Model],
        *,
        hedge_delay: float = 2.0,
        total_timeout: float = 15.0,
        max_parallel: int = 4,
        retries: int = 0,
        on_winner: Callable[[str], Awaitable[None]] | None = None,
    ) -> None:
        super().__init__()
        if not models:
            raise ValueError("HedgedChatModel needs at least one model")
        self.models = models
        self.hedge_delay = hedge_delay
        self.total_timeout = total_timeout
        self.max_parallel = max(1, max_parallel)
        self.retries = max(0, retries)
        self.on_winner = on_winner
        #: Gateway id of the last stream winner, for turn-level failure demotion.
        self.last_winner: str | None = None

    @property
    def model_name(self) -> str:
        return self.models[0].model_name

    @property
    def system(self) -> str:
        return self.models[0].system

    async def request(
        self,
        messages: list[ModelMessage],
        model_settings: ModelSettings | None,
        model_request_parameters: ModelRequestParameters,
    ) -> ModelResponse:
        def usable(response: ModelResponse) -> bool:
            return any(
                getattr(part, "content", None) or getattr(part, "tool_name", None)
                for part in response.parts
            )

        started = time.monotonic()
        response = await race_first(
            [
                lambda index=index: self.models[index].request(
                    messages, model_settings, model_request_parameters
                )
                for index in range(len(self.models))
            ],
            hedge_delay=self.hedge_delay,
            total_timeout=self.total_timeout,
            max_parallel=self.max_parallel,
            accept=usable,
            retries=self.retries,
        )
        model_name = response.model_name or self.model_name
        await model_speed.record_success(
            model_name,
            output_tokens=int(getattr(response.usage, "output_tokens", 0) or 0),
            seconds=max(0.0, time.monotonic() - started),
        )
        await self._notify_winner(model_name)
        return response

    async def _notify_winner(self, model_name: str) -> None:
        """Let the resolver cache the model that just answered (best effort)."""
        if self.on_winner is None:
            return
        try:
            await self.on_winner(model_name)
        except Exception:  # noqa: BLE001 - caching the winner must never fail a turn
            logger.debug("hedged winner callback failed", exc_info=True)

    async def _record_first_token(self, model: Model, exc: BaseException) -> None:
        """A candidate that never produced an answer is demoted in the speed book."""
        if isinstance(exc, asyncio.CancelledError):
            return
        await model_speed.record_failure(
            model.model_name,
            error=str(exc),
            kind="empty" if isinstance(exc, EmptyAnswerError) else "first-token",
        )

    async def _record_generation(
        self,
        index: int,
        stream: StreamedResponse,
        first_event_at: float,
        failure: BaseException | None,
    ) -> None:
        """Record tokens/second over the winning stream's generation window."""
        model_name = self.models[index].model_name
        if isinstance(failure, (asyncio.CancelledError, GeneratorExit)):
            # The consumer stopped early (cancel or break): not a model failure.
            return
        if failure is not None:
            await model_speed.record_failure(model_name, error=str(failure), kind="stream")
            return
        seconds = time.monotonic() - first_event_at
        try:
            usage = stream.usage  # property on pydantic-ai streams, callable on fakes
            if callable(usage):
                usage = usage()
            tokens = int(getattr(usage, "output_tokens", 0) or 0)
        except Exception:  # noqa: BLE001 - an unmeasured stream is still a win
            tokens = 0
        response = _finished_response(stream)
        # A reasoning-only response burns tokens yet answers nothing (the gateway's
        # Qwen 3.6 trap): demote it instead of ranking it by its token count.
        if response is not None and not _has_usable_part(response):
            await model_speed.record_failure(
                model_name, error="empty assistant content", kind="empty"
            )
            return
        # Sub-50ms streams are too short to rank by throughput; still advertise the win.
        if tokens and seconds >= 0.05:
            await model_speed.record_success(model_name, output_tokens=tokens, seconds=seconds)
        await self._notify_winner(model_name)

    @asynccontextmanager
    async def request_stream(
        self,
        messages: list[ModelMessage],
        model_settings: ModelSettings | None,
        model_request_parameters: ModelRequestParameters,
        run_context: Any = None,
    ) -> AsyncIterator[StreamedResponse]:
        opened: dict[asyncio.Task[Any], int] = {}
        started = 0
        errors: list[BaseException] = []
        deadline = time.monotonic() + self.total_timeout

        def launch(index: int) -> None:
            nonlocal started
            task = asyncio.create_task(
                _retrying(
                    lambda index=index: _open_until_first_event(
                        self.models[index],
                        messages,
                        model_settings,
                        model_request_parameters,
                        run_context,
                    ),
                    self.retries,
                    transient_failure,
                )()
            )
            opened[task] = index
            started = index + 1

        async def cancel_losers() -> None:
            """Cancel pending candidates and close any stream they already opened."""
            pending = list(opened)
            opened.clear()
            for task in pending:
                task.cancel()
            if not pending:
                return
            finished = await asyncio.gather(*pending, return_exceptions=True)
            for task, result in zip(pending, finished):
                if task.cancelled() or isinstance(result, BaseException):
                    continue
                # Opened but lost the race: release its HTTP stream immediately.
                manager = result[0]
                try:
                    await manager.__aexit__(None, None, None)
                except Exception:  # noqa: BLE001 - closing a losing stream is best effort
                    logger.debug("closing losing hedged stream failed", exc_info=True)

        winner: tuple[Any, StreamedResponse, int] | None = None
        try:
            while winner is None:
                while started < len(self.models) and len(opened) < self.max_parallel:
                    launch(started)
                    break
                if not opened:
                    break
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise TimeoutError(
                        f"no chat model produced a first token within {self.total_timeout:.0f}s"
                    )
                wait_for = (
                    min(self.hedge_delay, remaining)
                    if started < len(self.models)
                    else remaining
                )
                done, _pending = await asyncio.wait(
                    set(opened), timeout=wait_for, return_when=asyncio.FIRST_COMPLETED
                )
                for task in done:
                    index = opened.pop(task, 0)
                    exc = task.exception()
                    if exc is not None:
                        errors.append(exc)
                        logger.info(
                            "hedged model %s failed before first token: %s",
                            self.models[index].model_name,
                            exc,
                        )
                        await self._record_first_token(self.models[index], exc)
                        continue
                    manager, stream = task.result()
                    winner = (manager, stream, index)
                    self.last_winner = self.models[index].model_name
                    break
                if winner is not None:
                    # First token arrived: stop every other candidate right away.
                    await cancel_losers()
            if winner is None:
                if errors:
                    raise errors[-1]
                raise TimeoutError("no chat model produced a first token")
            manager, stream, index = winner
            logger.info(
                "hedged model winner=%s after %.1fs (candidates started=%s)",
                self.models[index].model_name,
                time.monotonic() - (deadline - self.total_timeout),
                started,
            )
            first_event_at = time.monotonic()
            tracked = _SpeedTrackedStream(
                stream,
                lambda exc: self._record_generation(
                    index, stream, first_event_at, exc
                ),
            )
            try:
                yield tracked
            finally:
                await manager.__aexit__(None, None, None)
        finally:
            await cancel_losers()
