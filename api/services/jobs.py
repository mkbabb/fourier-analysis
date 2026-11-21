"""Compute jobs with streamed progress (owner 2026-11-12, TRIAGE-16 rows F-a and 50).

A long computation answers its POST at once with a job id; the work runs as an
asyncio task in this process and publishes an ordered list of events:

    stage    {"stage", "fraction", ...detail}  progress, ``fraction`` in [0, 1],
                                                never decreasing across the job
    partial  {"stage", ...payload}              a drawable piece of the answer
    result   {...}                              the final answer, the shape the
                                                synchronous route returns
    error    {"status", "detail"}               the job failed
    cancelled {"reason"}                        the job was stopped

Each event carries a ``seq`` (1, 2, 3, ...). A client that drops its stream
reconnects with the last ``seq`` it saw and is sent every later event, so a
dropped stream recovers without losing a stage or a partial.

Why one process. The registry lives in this process's memory. The API runs ONE
uvicorn worker (``WORKERS=1``, api/Dockerfile; one replica, docker-compose.prod
.yml): the compute slot (``computation._semaphore``) and the rate limiters are
already per-process for the same reason. With more than one worker the POST that
creates a job and the GET that streams it may land on different processes, and
the GET answers 404; ``api.main``'s lifespan refuses to boot with ``WORKERS > 1``
so that cannot ship silently. Moving the registry to Mongo (a job document plus a
change stream) is the cure if the API ever scales out.

Cancellation. A job stops when its client asks (``DELETE /api/jobs/{id}``) or
when nobody is watching: the last stream closing, or a job never streamed or
polled, starts a grace timer (``UNWATCHED_GRACE_S``) that a reconnect or a poll
resets. A job the grace expires on is cancelled. Work in a thread or a worker
process cannot be interrupted mid-call; it stops at its next progress report
(``Progress.check``), which raises ``JobCancelled``, and the compute slot is
released when it does.

Lifetime. A finished job (done, failed or cancelled) is kept ``FINISHED_TTL_S``
so a late reconnect still reads its result, then dropped. The sweep runs on every
create and lookup, so no background task is needed.
"""

from __future__ import annotations

import asyncio
import contextvars
import secrets
import threading
import time
from collections.abc import Callable, Coroutine
from dataclasses import dataclass, field
from typing import Any, Literal

JobState = Literal["queued", "running", "done", "failed", "cancelled"]
TERMINAL: frozenset[str] = frozenset({"done", "failed", "cancelled"})

FINISHED_TTL_S = 600.0
UNWATCHED_GRACE_S = 15.0
MAX_LIVE_JOBS = 32


class JobCancelled(Exception):
    """Raised inside a job's work when the job has been cancelled."""


class TooManyJobs(Exception):
    """The registry holds ``MAX_LIVE_JOBS`` unfinished jobs already."""


@dataclass(frozen=True)
class JobEvent:
    seq: int
    event: str
    data: dict[str, Any]


Stages = dict[str, tuple[float, float]]


@dataclass
class Job:
    id: str
    kind: str
    stages: Stages
    loop: asyncio.AbstractEventLoop
    created_at: float
    state: JobState = "queued"
    events: list[JobEvent] = field(default_factory=list)
    result: Any = None
    fraction: float = 0.0
    stage: str | None = None
    finished_at: float | None = None
    # Set from any thread; read by the work at each progress report.
    cancel_flag: threading.Event = field(default_factory=threading.Event)
    task: asyncio.Task[Any] | None = None
    watchers: int = 0
    _changed: asyncio.Event = field(default_factory=asyncio.Event)
    _grace: asyncio.TimerHandle | None = None
    # Called with the job when it is cancelled (the process-pool bridge flags
    # the worker through it).
    on_cancel: list[Callable[[Job], None]] = field(default_factory=list)

    # -- publishing (event-loop thread only) -------------------------------

    def publish(self, event: str, data: dict[str, Any]) -> JobEvent | None:
        if self.state in TERMINAL:
            return None
        if event == "stage":
            # Monotone: a stage report never moves the bar backwards.
            self.fraction = max(self.fraction, float(data.get("fraction", 0.0)))
            data = {**data, "fraction": round(self.fraction, 4)}
            self.stage = data.get("stage", self.stage)
            if self.state == "queued" and self.stage != "queued":
                self.state = "running"
        elif event == "result":
            self.state, self.result, self.fraction = "done", data, 1.0
        elif event == "error":
            self.state = "failed"
        elif event == "cancelled":
            self.state = "cancelled"
        ev = JobEvent(len(self.events) + 1, event, data)
        self.events.append(ev)
        if self.state in TERMINAL:
            self.finished_at = time.monotonic()
            self._cancel_grace()
        self._changed.set()
        self._changed = asyncio.Event()
        return ev

    async def events_after(self, seq: int, timeout: float) -> list[JobEvent]:
        """The events after ``seq``; waits up to ``timeout`` for one if none
        is there yet and the job is still live (an empty list means: idle)."""
        if len(self.events) <= seq and self.state not in TERMINAL:
            changed = self._changed
            try:
                await asyncio.wait_for(changed.wait(), timeout)
            except TimeoutError:
                pass
        return self.events[seq:]

    # -- watching and cancellation -----------------------------------------

    def watch(self) -> None:
        self.watchers += 1
        self._cancel_grace()

    def unwatch(self) -> None:
        self.watchers = max(0, self.watchers - 1)
        if self.watchers == 0:
            self.arm_grace()

    def touch(self) -> None:
        """A poll: someone is still watching. Restarts the grace timer."""
        if self.watchers == 0:
            self.arm_grace()

    def arm_grace(self, grace: float | None = None) -> None:
        self._cancel_grace()
        if self.state in TERMINAL:
            return
        self._grace = self.loop.call_later(
            UNWATCHED_GRACE_S if grace is None else grace,
            self.cancel,
            "unwatched",
        )

    def _cancel_grace(self) -> None:
        if self._grace is not None:
            self._grace.cancel()
            self._grace = None

    def cancel(self, reason: str = "client") -> bool:
        """Stop the job. Returns False when it had already finished."""
        if self.state in TERMINAL:
            return False
        self.cancel_flag.set()
        for hook in self.on_cancel:
            hook(self)
        self.publish("cancelled", {"reason": reason})
        if self.task is not None:
            self.task.cancel()
        return True

    def snapshot(self) -> dict[str, Any]:
        last_partial = next((e.data for e in reversed(self.events) if e.event == "partial"), None)
        error = next((e.data for e in reversed(self.events) if e.event == "error"), None)
        return {
            "id": self.id,
            "kind": self.kind,
            "state": self.state,
            "stage": self.stage,
            "fraction": round(self.fraction, 4),
            "seq": len(self.events),
            "partial": last_partial,
            "result": self.result,
            "error": error,
        }


class Progress:
    """What a job's work reports through. Safe from any thread.

    ``stage(name, local)`` maps the stage's own 0..1 onto the job's bar through
    the job's ``stages`` table (``{name: (start, end)}``).
    """

    def __init__(self, job: Job) -> None:
        self.job = job

    def _post(self, event: str, data: dict[str, Any]) -> None:
        try:
            on_loop = asyncio.get_running_loop() is self.job.loop
        except RuntimeError:
            on_loop = False
        if on_loop:
            self.job.publish(event, data)
        else:
            self.job.loop.call_soon_threadsafe(self.job.publish, event, data)

    def check(self) -> None:
        if self.job.cancel_flag.is_set():
            raise JobCancelled(self.job.id)

    def stage(self, name: str, local: float = 0.0, **detail: Any) -> None:
        self.check()
        lo, hi = self.job.stages.get(name, (self.job.fraction, self.job.fraction))
        local = min(1.0, max(0.0, local))
        self._post("stage", {"stage": name, "fraction": lo + (hi - lo) * local, **detail})

    def partial(self, name: str, payload: dict[str, Any]) -> None:
        self.check()
        self._post("partial", {"stage": name, **payload})


# The running job's reporter. ``computation.submit_compute_job`` copies the
# context into its thread, so code a job runs in a thread reads it as well.
_current: contextvars.ContextVar[Progress | None] = contextvars.ContextVar("job_progress", default=None)


def current_progress() -> Progress | None:
    return _current.get()


def report(name: str, local: float = 0.0, **detail: Any) -> None:
    """Report a stage from code that also serves the synchronous routes
    (a no-op outside a job)."""
    p = _current.get()
    if p is not None:
        p.stage(name, local, **detail)


def report_partial(name: str, payload: dict[str, Any]) -> None:
    p = _current.get()
    if p is not None:
        p.partial(name, payload)


class JobRegistry:
    def __init__(self, clock: Callable[[], float] = time.monotonic) -> None:
        self._jobs: dict[str, Job] = {}
        self._clock = clock

    def sweep(self) -> None:
        now = self._clock()
        for jid in [
            jid
            for jid, j in self._jobs.items()
            if j.finished_at is not None and now - j.finished_at > FINISHED_TTL_S
        ]:
            del self._jobs[jid]

    def get(self, job_id: str) -> Job | None:
        self.sweep()
        return self._jobs.get(job_id)

    def __len__(self) -> int:
        return len(self._jobs)

    def start(
        self,
        kind: str,
        stages: Stages,
        work: Callable[[Progress], Coroutine[Any, Any, dict[str, Any]]],
        on_error: Callable[[BaseException], dict[str, Any]],
    ) -> Job:
        """Create a job and start ``work(progress)``; its return value is the
        job's result. ``on_error`` turns a failure into the error event's data."""
        self.sweep()
        if sum(1 for j in self._jobs.values() if j.state not in TERMINAL) >= MAX_LIVE_JOBS:
            raise TooManyJobs()
        loop = asyncio.get_running_loop()
        job = Job(
            id=secrets.token_urlsafe(16), kind=kind, stages=stages, loop=loop, created_at=self._clock()
        )
        self._jobs[job.id] = job
        progress = Progress(job)
        job.publish("stage", {"stage": "queued", "fraction": 0.0})

        async def _run() -> None:
            _current.set(progress)
            try:
                result = await work(progress)
            except (JobCancelled, asyncio.CancelledError):
                job.cancel("cancelled")
                return
            except Exception as exc:  # the job's failure is its error event
                job.publish("error", on_error(exc))
                return
            job.publish("result", result)

        job.task = loop.create_task(_run(), name=f"job:{kind}:{job.id}")
        # Not yet watched: the client has the grace to open the stream or poll.
        job.arm_grace()
        return job


registry = JobRegistry()


# -- the process-pool bridge ------------------------------------------------
#
# A job's work in a pool worker (the equation series: its symbolic tier needs a
# process's main thread) cannot reach the registry. The pool is built with one
# queue the worker posts its reports to and one shared ring of cancelled job
# serials it reads (``computation.get_process_pool`` passes both through the
# pool initializer). The API process drains the queue on a thread and replays
# each report through the job's ``Progress``.

CANCEL_RING = 256

_worker_queue: Any = None
_worker_cancelled: Any = None


def init_worker(queue: Any, cancelled: Any) -> None:
    """The pool initializer: keep the report queue and the cancel ring."""
    global _worker_queue, _worker_cancelled
    _worker_queue, _worker_cancelled = queue, cancelled


class WorkerProgress:
    """``Progress`` as a pool worker has it (same three methods)."""

    def __init__(self, serial: int) -> None:
        self.serial = serial

    def check(self) -> None:
        if _worker_cancelled is not None and _worker_cancelled[self.serial % CANCEL_RING] == self.serial:
            raise JobCancelled(str(self.serial))

    def stage(self, name: str, local: float = 0.0, **detail: Any) -> None:
        self.check()
        _worker_queue.put((self.serial, "stage", name, local, detail))

    def partial(self, name: str, payload: dict[str, Any]) -> None:
        self.check()
        _worker_queue.put((self.serial, "partial", name, payload, None))


def run_in_worker(fn: Callable[..., Any], serial: int, *args: Any) -> Any:
    """Run ``fn(*args, progress=...)`` in a pool worker, reporting as ``serial``.

    The answer returns on the pool's own pipe and the reports on the queue, so
    the last report says so (``end``): the API process publishes the result
    only after every report before it."""
    try:
        return fn(*args, progress=WorkerProgress(serial))
    finally:
        _worker_queue.put((serial, "end", None, None, None))
