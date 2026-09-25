"""X.F.W14V `.u2` — the server limbs of UIA-F-201 and UIA-F-253 (F-W14U.md
addendum (h): `.eq` E-2 and E-4), each driven through the real ASGI stack.

- **F-201 (server)** the Σ form's upper bound was the *requested*
  ``n_harmonics`` (20) while the plot, legend and timeline draw the displayed N
  (the Parseval effective N under Auto: 8 for x(π−x)). With
  ``auto_harmonics`` the request asks for the displayed series, and both
  ``/compute`` and ``/simplify`` render Σ to that N (``/simplify`` now answers
  ``latex_sigma`` too, so a re-render never costs a recompute).
- **F-253 (server) — hover** the expanded TeX carried no ``eq-coeff`` hover
  hooks, so coefficient hover existed only in Σ mode. Every expanded term now
  wears the hook of its coefficient family.
- **F-253 (server) — "Conjectured"** a polynomial was labelled
  ``identified`` ("Conjectured"): the symbolic tier's per-coefficient timer is
  a ``SIGALRM`` interval timer, which exists only in a process's main thread,
  and the job ran in a worker thread, so every symbolic attempt raised
  ``ValueError`` and fell through. The equation job now runs in a worker
  *process*, whose main thread owns the timer; a polynomial is ``symbolic``.
"""

from __future__ import annotations

import json
import re
from typing import Any

import pytest

from conftest import asgi

JSON = [("content-type", "application/json")]
HALF_PERIOD = {"expression": "x*(pi-x)", "domain_start": 0, "domain_end": 3.141592653589793}


def _run(coro: Any) -> Any:
    import asyncio

    return asyncio.run(coro)


def _post(path: str, body: dict[str, Any]) -> tuple[int, dict[str, Any]]:
    status, raw = _run(asgi("POST", path, json.dumps(body).encode(), JSON))
    try:
        return status, json.loads(raw)
    except ValueError:
        return status, {"raw": raw.decode(errors="replace")}


def _sigma_bound(latex: str) -> int:
    m = re.search(r"\\sum_\{n=-?\d*\}\^\{(\d+)\}", latex)
    assert m, f"no Σ bound in {latex!r}"
    return int(m.group(1))


# ---------------------------------------------------------------------------
# F-201 — Σ is bounded at the displayed N
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("notation", ["trig", "exponential", "polar"])
def test_f201_compute_sigma_bound_is_the_displayed_n(notation):
    s, d = _post("/api/equations/compute", {**HALF_PERIOD, "n_harmonics": 20,
                                            "notation": notation, "auto_harmonics": True})
    assert s == 200, d
    shown = min(d["effective_n"], 20)
    assert shown < 20, d["effective_n"]
    assert _sigma_bound(d["latex_sigma"]) == shown, d["latex_sigma"]


def test_f201_compute_without_auto_keeps_the_requested_n():
    s, d = _post("/api/equations/compute", {**HALF_PERIOD, "n_harmonics": 20, "notation": "trig"})
    assert s == 200, d
    assert _sigma_bound(d["latex_sigma"]) == 20, d["latex_sigma"]


def test_f201_simplify_answers_sigma_at_the_displayed_n():
    s, d = _post("/api/equations/compute", {**HALF_PERIOD, "n_harmonics": 20, "notation": "trig"})
    assert s == 200, d
    body = {"coefficients": d["coefficients"], "budget": 6, "notation": "trig"}
    s_auto, auto = _post("/api/equations/simplify", {**body, "auto_harmonics": True})
    s_all, every = _post("/api/equations/simplify", body)
    assert (s_auto, s_all) == (200, 200), (auto, every)
    assert _sigma_bound(auto["latex_sigma"]) == min(d["effective_n"], 20), auto
    assert _sigma_bound(every["latex_sigma"]) == 20, every


# ---------------------------------------------------------------------------
# F-253 — the expanded form carries the coefficient hover hooks
# ---------------------------------------------------------------------------

HOOK = {"trig": r"\htmlClass{eq-coeff eq-", "exponential": r"\htmlClass{eq-coeff eq-cn}",
        "polar": r"\htmlClass{eq-coeff eq-An}"}


@pytest.mark.parametrize("notation", ["trig", "exponential", "polar"])
def test_f253_expanded_tex_carries_the_hover_hooks(notation):
    s, d = _post("/api/equations/compute", {**HALF_PERIOD, "notation": notation, "budget": 6})
    assert s == 200, d
    assert HOOK[notation] in d["latex"], d["latex"]
    s2, simp = _post("/api/equations/simplify",
                     {"coefficients": d["coefficients"], "budget": 6, "notation": notation})
    assert s2 == 200, simp
    assert HOOK[notation] in simp["latex"], simp["latex"]


# ---------------------------------------------------------------------------
# F-253 — a polynomial is exact, never "Conjectured"
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("expression", ["x*(pi-x)", "x", "x**2"])
def test_f253_a_polynomial_is_the_symbolic_tier(expression):
    s, d = _post("/api/equations/compute", {"expression": expression, "n_harmonics": 8})
    assert s == 200, d
    assert d["tier"] == "symbolic", d["tier"]
