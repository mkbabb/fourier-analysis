"""F.W14U.srv — the server halves of the fourier UI-audit rows (UIA-F-35, -39,
-46, -83, -112), each driven through the real ASGI stack (``conftest.asgi``).

- **F-35** the expanded equation truncated the budget by single exponential
  terms, so the cut could split a ``±n`` conjugate pair and the last trig term
  rendered half its value (x(π−x): ``−0.031 cos(4t)`` at budget 8, a₄ = −1/16).
  The budget now counts whole harmonics (``|n|`` groups; DC is one).
- **F-83** every expanded renderer hard-capped its output at 4 terms plus
  ``⋯``, so the Terms slider (2–20) never showed more than 4. The renderer now
  shows every term the budget kept.
- **F-112** a parse failure (and an expression that is not a real function of
  ``x``) raised through the compute job to a 500. It is now a typed 422
  (``urn:contract:validation-failed``) whose ``detail`` names the problem.
- **F-39** the list endpoint ignored ``q``, ``tier`` and ``basis``; it now
  narrows by them.
- **F-46** there was no like endpoint; ``PUT /api/visualizations/{slug}/like``
  sets the session's like state (idempotent), and the count never drops below 0.
"""

from __future__ import annotations

import json
import re
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest

from conftest import asgi, requires_mongo, run_db

JSON = [("content-type", "application/json")]


async def _compute(**body: Any) -> tuple[int, dict[str, Any], bytes]:
    status, raw = await asgi("POST", "/api/equations/compute", json.dumps(body).encode(), JSON)
    try:
        parsed = json.loads(raw)
    except ValueError:
        parsed = {}
    return status, parsed, raw


def _run(coro: Any) -> Any:
    import asyncio

    return asyncio.run(coro)


def _coefficient_of(latex: str, fn: str, arg: str) -> float:
    m = re.search(rf"([+-]?[0-9.]+(?:e[+-]?[0-9]+)?)\\{fn}\({re.escape(arg)}\)", latex)
    assert m, f"no \\{fn}({arg}) in {latex!r}"
    return float(m.group(1))


# ---------------------------------------------------------------------------
# F-35 — the budget never splits a conjugate pair
# ---------------------------------------------------------------------------

HALF_PERIOD = {"expression": "x*(pi-x)", "domain_start": 0, "domain_end": 3.141592653589793}


def test_f35_budget_keeps_whole_harmonics():
    """x(π−x) on [0, π]: a₄ = −1/16 at every budget that shows cos(4t)."""
    s8, d8, _ = _run(_compute(**HALF_PERIOD, budget=8, notation="trig"))
    s10, d10, _ = _run(_compute(**HALF_PERIOD, budget=10, notation="trig"))
    assert (s8, s10) == (200, 200)
    a4_at_8 = _coefficient_of(d8["latex"], "cos", "4t")
    a4_at_10 = _coefficient_of(d10["latex"], "cos", "4t")
    assert a4_at_8 == pytest.approx(-0.0625, abs=0.001)
    assert a4_at_8 == pytest.approx(a4_at_10, abs=1e-9)


def test_f35_truncation_is_by_harmonic_group():
    """Every kept ``n`` keeps its conjugate ``−n``; DC counts as one of the budget."""
    from fourier_analysis.symbolic.models import FourierTerm
    from fourier_analysis.symbolic.simplification import truncate_by_budget

    terms = [
        FourierTerm(n=n, coefficient=complex(1.0 / (1 + abs(n)), 0.0), symbolic_expr=None,
                    amplitude=1.0 / (1 + abs(n)), phase=0.0)
        for n in range(-10, 11)
    ]
    for budget in range(2, 12):
        kept = truncate_by_budget(terms, budget)
        ns = {t.n for t in kept}
        assert all(-n in ns for n in ns), (budget, sorted(ns))
        assert len({abs(n) for n in ns}) == budget, (budget, sorted(ns))


# ---------------------------------------------------------------------------
# F-83 — the renderer shows every term the budget kept (no 4-term cap)
# ---------------------------------------------------------------------------

SAWTOOTH = {"expression": "x"}  # [0, 2π): b_k = −2/k, a slow decay, no a_k


@pytest.mark.parametrize("budget", [6, 15, 20])
def test_f83_compute_renders_the_budget(budget):
    status, d, _ = _run(_compute(**SAWTOOTH, budget=budget, notation="trig"))
    assert status == 200
    # DC is one of the budget; each kept harmonic renders its one sine.
    assert d["latex"].count(r"\sin(") == budget - 1, d["latex"]


def test_f83_simplify_renders_the_budget():
    """The 2D visualizer's Terms slider path (``/simplify``) at its max of 20."""
    status, d, _ = _run(_compute(**SAWTOOTH, n_harmonics=40, budget=2))
    assert status == 200
    s, raw = _run(asgi(
        "POST", "/api/equations/simplify",
        json.dumps({"coefficients": d["coefficients"], "budget": 20, "notation": "trig"}).encode(),
        JSON,
    ))
    assert s == 200, raw
    assert json.loads(raw)["latex"].count(r"\sin(") == 19


# ---------------------------------------------------------------------------
# F-112 — an invalid f(x) is a typed 422, never a 500
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("expression", ["sin((x", "x +", "foo(x)", "1/0", "x*y"])
def test_f112_invalid_expression_is_typed_422(expression):
    status, body, raw = _run(_compute(expression=expression))
    assert status == 422, raw
    assert body.get("type") == "urn:contract:validation-failed", raw
    assert body.get("detail"), raw


def test_f112_valid_expression_still_computes():
    status, body, raw = _run(_compute(expression="x*(pi-x)"))
    assert status == 200, raw
    assert body["status"] == "ok"


# ---------------------------------------------------------------------------
# F-39 / F-46 — the gallery list filters and the like toggle (live Mongo)
# ---------------------------------------------------------------------------

SLUGS = {
    "alpha": "amber-brave-calm-dove",
    "beta": "azure-bold-cool-duck",
    "gamma": "ashen-bright-crisp-deer",
    "delta": "ample-busy-clear-dingo",
}


def _viz(key: str, *, title: str, tier: str | None, bases: list[str], age: int, **extra: Any) -> dict:
    now = datetime.now(UTC)
    doc = {
        "slug": SLUGS[key],
        "owner_slug": "owner-quiet-grey-heron",
        "visibility": "public",
        "title": title,
        "description": None,
        "tags": [],
        "active_bases": bases,
        "likes": 0,
        "views": 0,
        "deleted_at": None,
        "created_at": now - timedelta(minutes=age),
        "updated_at": now,
    }
    if tier is not None:
        doc["tier"] = tier
    doc.update(extra)
    return doc


async def _seed(db: Any) -> None:
    from api.services import database

    database._db = db
    await db.visualizations.insert_many([
        _viz("alpha", title="Spiral heron", tier="featured", bases=["fourier", "legendre"], age=1),
        _viz("beta", title="Quiet lake", tier="saved", bases=["fourier"], age=2),
        _viz("gamma", title="Heron in flight", tier=None, bases=["chebyshev"], age=3,
             tags=["bird"]),
        _viz("delta", title="Draft heron", tier="featured", bases=["legendre"], age=4,
             visibility="draft"),
    ])


async def _list(query: str) -> tuple[int, list[str]]:
    status, raw = await asgi("GET", "/api/visualizations", query=query)
    body = json.loads(raw)
    return status, [item["slug"] for item in body.get("items", [])]


@requires_mongo
def test_f39_list_honours_q_tier_basis():
    async def body(db: Any) -> dict[str, tuple[int, list[str]]]:
        await _seed(db)
        return {
            q: await _list(q)
            for q in (
                "",
                "q=zzz-no-such",
                "q=HERON",
                "q=bird",
                "tier=featured",
                "tier=saved",
                "tier=normal",
                "tier=all",
                "basis=legendre",
                "q=heron&basis=chebyshev",
                "tier=bogus",
            )
        }

    got = run_db(body)
    a, b, g = SLUGS["alpha"], SLUGS["beta"], SLUGS["gamma"]
    assert got[""] == (200, [a, b, g])
    assert got["q=zzz-no-such"] == (200, [])
    assert got["q=HERON"] == (200, [a, g])  # case-insensitive; the draft never lists
    assert got["q=bird"] == (200, [g])  # tags are searched too
    assert got["tier=featured"] == (200, [a])
    assert got["tier=saved"] == (200, [b])
    assert got["tier=normal"] == (200, [g])  # an un-tiered row is normal
    assert got["tier=all"] == (200, [a, b, g])
    assert got["basis=legendre"] == (200, [a])
    assert got["q=heron&basis=chebyshev"] == (200, [g])
    assert got["tier=bogus"][0] == 422


async def _session() -> str:
    status, raw = await asgi("POST", "/api/sessions")
    assert status == 200, raw
    return json.loads(raw)["token"]


async def _like(slug: str, liked: bool, token: str | None) -> tuple[int, dict[str, Any]]:
    headers = list(JSON) + ([("X-Session-Token", token)] if token else [])
    status, raw = await asgi(
        "PUT", f"/api/visualizations/{slug}/like", json.dumps({"liked": liked}).encode(), headers
    )
    return status, json.loads(raw) if raw else {}


@requires_mongo
def test_f46_like_is_a_persisted_idempotent_toggle():
    """Two sessions, eight verbs: within the per-IP write budget (10/min) the
    production limiter enforces, which a like spends like any write."""

    async def body(db: Any) -> dict[str, Any]:
        await _seed(db)
        slug = SLUGS["alpha"]
        one, two = await _session(), await _session()
        steps = {
            "one-like": await _like(slug, True, one),
            "one-like-again": await _like(slug, True, one),  # idempotent: still 1
            "two-like": await _like(slug, True, two),
            "one-unlike": await _like(slug, False, one),
            "one-unlike-again": await _like(slug, False, one),  # idempotent: still 1
            "two-unlike": await _like(slug, False, two),
            "two-unlike-again": await _like(slug, False, two),  # floor: never below 0
            "two-relike": await _like(slug, True, two),
        }
        state_status, state_raw = await asgi(
            "GET", f"/api/visualizations/{slug}/like", headers=[("X-Session-Token", two)]
        )
        persisted = (await db.visualizations.find_one({"slug": slug}))["likes"]
        return {
            "steps": {k: (v[0], v[1].get("liked"), v[1].get("likes")) for k, v in steps.items()},
            "state": (state_status, json.loads(state_raw)),
            "persisted": persisted,
        }

    got = run_db(body)
    assert got["steps"] == {
        "one-like": (200, True, 1),
        "one-like-again": (200, True, 1),
        "two-like": (200, True, 2),
        "one-unlike": (200, False, 1),
        "one-unlike-again": (200, False, 1),
        "two-unlike": (200, False, 0),
        "two-unlike-again": (200, False, 0),
        "two-relike": (200, True, 1),
    }
    assert got["state"] == (200, {"slug": SLUGS["alpha"], "liked": True, "likes": 1})
    assert got["persisted"] == 1


@requires_mongo
def test_f46_like_needs_a_session_and_a_readable_row():
    async def body(db: Any) -> tuple[int, int]:
        await _seed(db)
        token = await _session()
        anonymous = (await _like(SLUGS["alpha"], True, None))[0]
        draft = (await _like(SLUGS["delta"], True, token))[0]  # another owner's draft
        return anonymous, draft

    assert run_db(body) == (401, 404)
