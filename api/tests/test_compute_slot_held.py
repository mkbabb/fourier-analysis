"""A compute slot is held until its work ends, not until its request does.

``submit_compute_job`` bounds the compute threads with a semaphore of
``compute_concurrency`` slots. A thread cannot be cancelled, so when the
request awaiting it ends first (the client aborted, the handler was
cancelled, or the job ran past ``compute_timeout_s``) the thread keeps
running. Releasing the slot at that moment let the next job start beside
work still on the CPU: a page that superseded a few extractions left them
running unbounded, and the next request waited on a starved host (the CI
flakes after the contour-extraction and image-control specs, value.js
COHESION §0hz.mt2.fourier.r2).
"""

from __future__ import annotations

import asyncio
import contextlib
import threading

import pytest

from api.config import settings
from api.services import computation


@pytest.fixture
def one_slot(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(settings, "compute_concurrency", 1)
    monkeypatch.setattr(computation, "_semaphore", None)
    yield
    computation._semaphore = None


def _held_job() -> tuple[threading.Event, threading.Event, object]:
    started, release = threading.Event(), threading.Event()

    def work() -> str:
        started.set()
        release.wait(10)
        return "held"

    return started, release, work


async def _second_job_waits_for(release: threading.Event) -> None:
    seen: list[bool] = []

    def quick() -> str:
        seen.append(release.is_set())
        return "quick"

    second = asyncio.create_task(computation.submit_compute_job("quick", quick))
    await asyncio.sleep(0.3)
    assert not second.done(), "a second job started while the first one's thread was still running"
    release.set()
    assert await asyncio.wait_for(second, 10) == "quick"
    assert seen == [True]


def test_a_cancelled_request_keeps_its_slot_until_its_thread_ends(one_slot) -> None:
    async def scenario() -> None:
        started, release, work = _held_job()
        first = asyncio.create_task(computation.submit_compute_job("held", work))
        await asyncio.to_thread(started.wait, 10)
        first.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await first
        await _second_job_waits_for(release)

    asyncio.run(scenario())


def test_a_timed_out_job_keeps_its_slot_until_its_thread_ends(
    one_slot, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "compute_timeout_s", 0.2)

    async def scenario() -> None:
        started, release, work = _held_job()
        with pytest.raises(Exception) as exc:
            await computation.submit_compute_job("held", work)
        assert getattr(exc.value, "status_code", None) == 504
        assert started.is_set()
        monkeypatch.setattr(settings, "compute_timeout_s", 30)
        await _second_job_waits_for(release)

    asyncio.run(scenario())
