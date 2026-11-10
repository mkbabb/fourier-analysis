"""The DC term of a trig series is written as its value (restraint precept,
canon F11): the sawtooth's constant read ``\\frac{2\\pi}{2}`` where the series
means ``\\pi``."""

from __future__ import annotations

import math

from fourier_analysis.symbolic.latex_rendering import render_trig, render_trig_sigma
from fourier_analysis.symbolic.models import FourierTerm


def _term(n: int, c: complex) -> FourierTerm:
    return FourierTerm(n=n, coefficient=c, symbolic_expr=None, amplitude=abs(c), phase=math.atan2(c.imag, c.real))


# f(x) = x on [0, 2π]: c_0 = π, c_±n = ±i/n (b_n = −2/n).
SAWTOOTH = [_term(0, math.pi + 0j)] + [t for n in range(1, 4) for t in (_term(n, 1j / n), _term(-n, -1j / n))]


def test_sawtooth_dc_is_pi_in_both_forms():
    for render in (render_trig, render_trig_sigma):
        tex = render(SAWTOOTH)
        assert r"\frac" not in tex.split("+")[0], tex
        assert tex.startswith(r"\pi"), tex


def test_dc_alone_is_its_value():
    assert render_trig_sigma([_term(0, 1.645 + 0j)]) == "1.6"
