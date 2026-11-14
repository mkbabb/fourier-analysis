"""The symbolic tier integrates c_n once with ``n`` symbolic (TRIAGE-16 F-a).

Each coefficient must equal the numerical integral (1/T) ∫ f(x) e^{-inωx} dx,
including at a resonance the general form carries as a ``Piecewise``
(``cos(3x)`` at n = ±3), and ``on_term`` reports every coefficient in order.
"""

from __future__ import annotations

import math

import numpy as np
import pytest
import sympy as sp
from scipy.integrate import quad

from fourier_analysis.symbolic.integration import symbolic_fourier_coefficients

CASES = [
    ("x*(pi - x)", (0.0, math.pi)),
    ("x**2*sin(x)", (0.0, 2 * math.pi)),
    ("cos(3*x)", (0.0, 2 * math.pi)),
    ("exp(-x)*cos(3*x)", (0.0, 2 * math.pi)),
    ("Heaviside(x - pi)", (0.0, 2 * math.pi)),
]


def _numeric_cn(f, n: int, a: float, b: float) -> complex:
    T = b - a
    w = 2 * math.pi / T
    re = quad(lambda t: f(t) * math.cos(n * w * t), a, b, limit=200, points=[math.pi])[0]
    im = -quad(lambda t: f(t) * math.sin(n * w * t), a, b, limit=200, points=[math.pi])[0]
    return complex(re, im) / T


@pytest.mark.parametrize(("source", "domain"), CASES)
def test_each_coefficient_matches_the_numerical_integral(source: str, domain: tuple[float, float]):
    x = sp.Symbol("x")
    expr = sp.sympify(source, locals={"x": x})
    f = sp.lambdify(x, expr, modules=[{"Heaviside": lambda v, h=0.5: np.heaviside(v, h)}, "numpy"])
    terms = symbolic_fourier_coefficients(expr, 6, domain)
    assert terms is not None
    assert sorted(t.n for t in terms) == list(range(-6, 7))
    for t in terms:
        want = _numeric_cn(lambda v: float(f(v)), t.n, *domain)
        assert abs(t.coefficient - want) < 1e-7, (source, t.n, t.coefficient, want)


def test_on_term_reports_every_coefficient_in_order():
    seen: list[tuple[int, int, int]] = []
    expr = sp.sympify("x*(pi - x)")
    terms = symbolic_fourier_coefficients(
        expr, 3, (0.0, math.pi), on_term=lambda t, done, total: seen.append((t.n, done, total))
    )
    assert terms is not None
    assert [s[0] for s in seen] == [0, 1, -1, 2, -2, 3, -3]
    assert [s[1] for s in seen] == list(range(1, 8))
    assert {s[2] for s in seen} == {7}


def test_on_term_may_stop_the_computation():
    class Stop(Exception):
        pass

    def stop_at_three(t, done, total):
        if done == 3:
            raise Stop

    with pytest.raises(Stop):
        symbolic_fourier_coefficients(sp.sympify("x"), 5, (0.0, 2 * math.pi), on_term=stop_at_three)
