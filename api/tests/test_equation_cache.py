"""The equation series is answered once and kept, and the API computes the page's
first request at boot.

Measured on production (19 Nov 2026): a warm worker answers the page's default
f(x) in 0.23 s, but a cold API took ~3.5 s on the first POST (its first parse
imports sympy) and ~4 s more spawning and importing its worker, and every
identical request was integrated again. The series now files its answer in the
compute cache (subject ``"equation"``), and the lifespan starts ``warm``, which
computes the page's first request before anyone asks for it. Only an exact
answer is kept: each integral runs under a wall-clock timeout, so a busy host's
answer can carry a zero for a harmonic it ran out of time on.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any

import pytest

from api.services import computation, jobs
from conftest import asgi, requires_mongo, run_db
from test_compute_jobs import DEFAULT, Stream

JSON = [("content-type", "application/json")]


@pytest.fixture(autouse=True)
def _fresh_compute_state(monkeypatch):
    monkeypatch.setattr(computation, "_semaphore", None)
    monkeypatch.setattr(jobs, "registry", jobs.JobRegistry())
    yield


@pytest.fixture(scope="module", autouse=True)
def _pool_down():
    yield
    computation.shutdown_process_pool()


async def _job_events(body: dict[str, Any]) -> list[tuple[int, str, dict[str, Any]]]:
    status, raw = await asgi("POST", "/api/equations/jobs", json.dumps(body).encode(), JSON)
    assert status == 202, raw
    s = Stream(json.loads(raw)["events_url"])
    got = [e async for e in s.events()]
    await s.close()
    return got


@requires_mongo
def test_a_repeated_series_is_answered_from_the_cache():
    from api.services import database

    async def body(db: Any) -> tuple[list, list, int, dict, list]:
        database._db = db
        try:
            first = await _job_events(DEFAULT)
            again = await _job_events(DEFAULT)
            status, raw = await asgi("POST", "/api/equations/compute", json.dumps(DEFAULT).encode(), JSON)
            docs = await db.compute_cache.find({}, {"subject": 1, "label": 1}).to_list(None)
            return first, again, status, json.loads(raw), docs
        finally:
            database._db = None

    first, again, status, sync, docs = run_db(body)
    assert sum(1 for _, ev, d in first if ev == "partial" and d["stage"] == "coefficient") == 13
    # The same request again: no integration, the answer at once.
    assert [(ev, d.get("stage")) for _, ev, d in again] == [("stage", "queued"), ("result", None)]
    assert again[-1][2] == first[-1][2]
    assert status == 200 and sync == first[-1][2]
    assert [(d["subject"], d["label"]) for d in docs] == [("equation", "equation")]


@requires_mongo
def test_warm_computes_the_pages_first_request_into_the_cache():
    from api.models.equations import ComputeEquationRequest
    from api.routers import equations
    from api.services import compute_cache, database
    from api.services.equation_series import WARM_REQUEST

    async def body(db: Any) -> dict[str, Any] | None:
        database._db = db
        try:
            await equations.warm()
            params = ComputeEquationRequest(**WARM_REQUEST).model_dump()
            return await compute_cache.lookup("equation", params, label="test")
        finally:
            database._db = None

    hit = run_db(body)
    assert hit is not None, "the warm-up filed nothing"
    assert hit["tier"] == "symbolic" and len(hit["coefficients"]) == 41
    assert computation._process_pool is not None, "the worker was not started"


def test_boot_starts_the_warm_up(monkeypatch):
    import api.main as api_main

    calls: list[str] = []

    async def _noop() -> None:
        return None

    async def _warm() -> None:
        calls.append("warm")

    monkeypatch.setattr(api_main, "connect_db", _noop)
    monkeypatch.setattr(api_main, "close_db", _noop)
    monkeypatch.setattr(api_main, "run_janitor", _noop)
    monkeypatch.setattr(api_main.equations, "warm", _warm)

    async def _boot() -> None:
        async with api_main.lifespan(api_main.app):
            await asyncio.sleep(0)

    asyncio.run(_boot())
    assert calls == ["warm"]


def _miss_second_harmonic(monkeypatch):
    """Integration as on a host too busy for harmonic ±2: neither the general
    form's value nor the harmonic's own integral answers it in time."""
    from fourier_analysis.symbolic import integration

    real_cn, real_eval = integration._compute_cn, integration._evaluate_cn
    monkeypatch.setattr(
        integration,
        "_evaluate_cn",
        lambda general, n, n_val, *a, **k: None if abs(n_val) == 2 else real_eval(general, n, n_val, *a, **k),
    )
    monkeypatch.setattr(
        integration,
        "_compute_cn",
        lambda expr, x, n_val, *a, **k: None if abs(n_val) == 2 else real_cn(expr, x, n_val, *a, **k),
    )


def test_a_missed_harmonic_is_reported_and_the_answer_is_not_exact(monkeypatch):
    from api.services.equation_series import compute_series
    from fourier_analysis.symbolic import integration
    import sympy as sp

    _miss_second_harmonic(monkeypatch)
    missed: list[int] = []
    terms = integration.symbolic_fourier_coefficients(
        sp.sympify("x*(pi - x)"), 3, (0.0, 3.141592653589793), on_miss=missed.append
    )
    assert terms is not None and missed == [2, -2]
    assert {t.n: t.coefficient for t in terms}[2] == 0j

    result = compute_series(DEFAULT)
    assert result["tier"] == "symbolic" and result["exact"] is False


def test_an_exact_answer_says_so():
    from api.services.equation_series import compute_series

    assert compute_series(DEFAULT)["exact"] is True


@requires_mongo
def test_an_answer_that_is_not_exact_is_sent_and_not_kept(monkeypatch):
    from api.routers import equations
    from api.services import database
    from api.services.equation_series import compute_series

    _miss_second_harmonic(monkeypatch)
    result = compute_series(DEFAULT)

    async def body(db: Any) -> tuple[dict, int]:
        database._db = db
        try:
            wire = await equations._file(dict(DEFAULT), result)
            return wire, await db.compute_cache.count_documents({})
        finally:
            database._db = None

    wire, kept = run_db(body)
    assert wire["tier"] == "symbolic" and len(wire["coefficients"]) == 13
    assert kept == 0
