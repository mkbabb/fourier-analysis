"""Tier 1: Symbolic Fourier coefficient computation via sympy.integrate."""

from __future__ import annotations

import signal as sig
from collections.abc import Callable
from contextlib import contextmanager

import numpy as np
import sympy as sp

from fourier_analysis.symbolic.models import FourierTerm


@contextmanager
def _timeout(seconds: float):
    """Context manager that raises TimeoutError after *seconds*."""
    def _handler(signum, frame):
        raise TimeoutError(f"Symbolic integration timed out after {seconds}s")

    old = sig.signal(sig.SIGALRM, _handler)
    sig.setitimer(sig.ITIMER_REAL, seconds)
    try:
        yield
    finally:
        sig.setitimer(sig.ITIMER_REAL, 0)
        sig.signal(sig.SIGALRM, old)


def _compute_cn(
    expr: sp.Expr,
    x: sp.Symbol,
    n_val: int,
    a: sp.Rational,
    b: sp.Rational,
    T: sp.Expr,
    omega: sp.Expr,
    timeout_s: float = 5.0,
) -> complex | None:
    """Compute a single Fourier coefficient c_n symbolically.

    Returns None if integration fails or times out.
    """
    if n_val == 0:
        integrand = expr
    else:
        integrand = expr * sp.exp(-sp.I * n_val * omega * x)

    try:
        with _timeout(timeout_s):
            result = sp.integrate(integrand, (x, a, b))
            result = result / T
            # Try to evaluate numerically
            val = complex(result.evalf())
            if not (np.isfinite(val.real) and np.isfinite(val.imag)):
                return None
            return val
    except (TimeoutError, Exception):
        return None


def _general_cn(
    expr: sp.Expr,
    x: sp.Symbol,
    n: sp.Symbol,
    a: sp.Expr,
    b: sp.Expr,
    T: sp.Expr,
    omega: sp.Expr,
    timeout_s: float = 5.0,
) -> sp.Expr | None:
    """c_n as one closed form in the integer symbol ``n`` (n != 0), or None.

    One ``integrate`` with ``n`` symbolic replaces one per harmonic: for the
    default ``x(pi - x)`` at N = 20 that is 41 integrations, ~1.5 s, against
    one, ~0.1 s (owner 2026-11-12, TRIAGE-16 row F-a: "the fourier API seems
    to be very slow"). A resonance (``cos(3x)`` at n = +-3) comes back as a
    ``Piecewise`` the substitution resolves; an integral sympy cannot do in
    general returns None and the per-harmonic loop takes over.
    """
    try:
        with _timeout(timeout_s):
            result = sp.integrate(expr * sp.exp(-sp.I * n * omega * x), (x, a, b)) / T
    except (TimeoutError, Exception):
        return None
    if result.has(sp.Integral):
        return None
    return result


def _evaluate_cn(general: sp.Expr, n: sp.Symbol, n_val: int, timeout_s: float = 5.0) -> complex | None:
    try:
        with _timeout(timeout_s):
            val = complex(general.subs(n, n_val).evalf())
    except (TimeoutError, Exception):
        return None
    if not (np.isfinite(val.real) and np.isfinite(val.imag)):
        return None
    return val


def symbolic_fourier_coefficients(
    expr: sp.Expr,
    n_harmonics: int,
    domain: tuple[float, float],
    period: float | None = None,
    on_term: Callable[[FourierTerm, int, int], None] | None = None,
    on_miss: Callable[[int], None] | None = None,
) -> list[FourierTerm] | None:
    """Compute Fourier coefficients via symbolic integration.

    Uses sympy's integrate() for the integral (1/T) ∫ f(x) e^{-inωx} dx: once
    with ``n`` symbolic (``_general_cn``), then per harmonic for any ``n`` the
    general form cannot give. Falls through to None if the DC term or more than
    three harmonics fail.

    Parameters
    ----------
    expr : sp.Expr
        Sympy expression in variable x.
    n_harmonics : int
        Number of positive harmonics to compute (also computes negatives).
    domain : tuple[float, float]
        Integration bounds [a, b].
    period : float, optional
        Period T. Defaults to b - a.
    on_term : callable, optional
        Called as ``on_term(term, done, total)`` after each coefficient, in the
        order 0, +1, -1, +2, -2, ... (a progress report; it may raise to stop).
    on_miss : callable, optional
        Called as ``on_miss(n)`` for a harmonic neither form could integrate
        (its timeout, or sympy's failure); the series carries a zero for it.

    Returns
    -------
    list[FourierTerm] or None
        None if symbolic integration fails for any coefficient.
    """
    x = sp.Symbol("x")
    a_val, b_val = domain
    T_val = period if period is not None else (b_val - a_val)

    a = sp.Rational(a_val).limit_denominator(1000) if a_val == int(a_val) else sp.Float(a_val)
    b = sp.Rational(b_val).limit_denominator(1000) if b_val == int(b_val) else sp.Float(b_val)
    T = sp.Rational(T_val).limit_denominator(1000) if T_val == int(T_val) else sp.Float(T_val)

    # Use exact pi if close
    if abs(a_val) < 1e-12:
        a = sp.Integer(0)
    if abs(b_val - float(sp.pi)) < 1e-10:
        b = sp.pi
    if abs(b_val - 2 * float(sp.pi)) < 1e-10:
        b = 2 * sp.pi
    if abs(T_val - float(sp.pi)) < 1e-10:
        T = sp.pi
    if abs(T_val - 2 * float(sp.pi)) < 1e-10:
        T = 2 * sp.pi

    omega = 2 * sp.pi / T
    total = 2 * n_harmonics + 1

    terms: list[FourierTerm] = []
    failed = 0

    def _add(n_val: int, cn: complex) -> None:
        term = FourierTerm(
            n=n_val,
            coefficient=cn,
            symbolic_expr=None,
            amplitude=abs(cn),
            phase=float(np.angle(cn)),
        )
        terms.append(term)
        if on_term is not None:
            on_term(term, len(terms), total)

    # Compute DC term
    c0 = _compute_cn(expr, x, 0, a, b, T, omega)
    if c0 is None:
        return None
    _add(0, c0)

    n = sp.Symbol("n", integer=True, nonzero=True)
    general = _general_cn(expr, x, n, a, b, T, omega)

    # Compute positive and negative harmonics
    for k in range(1, n_harmonics + 1):
        for sign in [1, -1]:
            n_val = sign * k
            cn = _evaluate_cn(general, n, n_val) if general is not None else None
            if cn is None:
                cn = _compute_cn(expr, x, n_val, a, b, T, omega)
            if cn is None:
                failed += 1
                if on_miss is not None:
                    on_miss(n_val)
                # Without a general form sympy could not do the integral for
                # symbolic n, and a harmonic it cannot do either says the rest
                # will each spend their timeout the same way: hand over to the
                # next tier now (``exp(sin(x))`` spent 4 x 5 s here, ~19 s in
                # production, before falling through).
                if failed > 3 or general is None:
                    return None
                # Use zero for this term
                cn = 0j
            _add(n_val, cn)

    terms.sort(key=lambda t: t.amplitude, reverse=True)
    return terms
