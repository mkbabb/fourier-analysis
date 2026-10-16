"""The equation route's series job: parse, compute by tier, render.

X.F.W14V `.u2` — UIA-F-253 (server limb), the "Conjectured" polynomial. The
symbolic tier bounds each coefficient's ``sympy.integrate`` with a ``SIGALRM``
interval timer (``fourier_analysis.symbolic.integration._timeout``), and a
signal handler can be installed only in a process's MAIN thread. The job used to
run on ``asyncio.to_thread``, so every symbolic attempt raised ``ValueError``
("signal only works in main thread"), was swallowed as a failed integral, and
fell through to sequence identification: ``x``, ``x**2`` and the default
``x(π−x)`` were all labelled "Conjectured". ``compute_series`` is therefore a
module-level function the router runs in a worker PROCESS
(``computation.submit_process_job``), whose main thread owns the timer, so the
exact tier is reached whenever sympy can integrate.

X.F.W14V `.u2` — UIA-F-201 (server limb). The Σ form is rendered to the
DISPLAYED N (``displayed_n``): with ``auto_harmonics`` that is the Parseval
effective N capped at the computed harmonics, the same N the page's plot,
legend and timeline draw; without it, every computed harmonic.
"""

from __future__ import annotations

from typing import Any


class ExpressionInvalid(ValueError):
    """The user's f(x) is not a finite real function of ``x`` (a client error)."""


def parse_function_of_x(expression: str) -> Any:
    """Parse *expression* as a function of ``x`` alone, or raise ``ExpressionInvalid``.

    A parse failure, an unknown function, a free symbol other than ``x`` or a
    non-finite constant (``1/0`` is ``zoo``) cannot be evaluated on the grid;
    each is the caller's input, so it answers 422, never a 500 (UIA-F-112).
    """
    import sympy as sp

    from fourier_analysis.symbolic.parsing import parse_expression

    try:
        expr = parse_expression(expression)
    except ValueError as e:
        raise ExpressionInvalid(str(e)) from e
    unknown = sorted({str(f.func) for f in expr.atoms(sp.core.function.AppliedUndef)})
    if unknown:
        raise ExpressionInvalid(f"Unknown function: {', '.join(unknown)}")
    others = sorted(str(s) for s in expr.free_symbols - {sp.Symbol("x")})
    if others:
        raise ExpressionInvalid(f"f(x) may depend only on x, not {', '.join(others)}")
    if expr.has(sp.zoo, sp.nan, sp.oo, -sp.oo):
        raise ExpressionInvalid("f(x) is not finite")
    return expr


def displayed_n(terms: list, auto_harmonics: bool) -> int:
    """The N the page shows: the Parseval effective N under Auto, else every harmonic."""
    from fourier_analysis.symbolic.simplification import compute_effective_n

    computed = max((abs(t.n) for t in terms), default=0)
    return min(compute_effective_n(terms), computed) if auto_harmonics else computed


def render_sigma(terms: list, notation: str, shown: int) -> str:
    """The Σ form over the displayed harmonics ``|n| ≤ shown`` (its bound is ``shown``)."""
    from fourier_analysis.symbolic.latex_rendering import render_latex_sigma

    return render_latex_sigma([t for t in terms if abs(t.n) <= shown], notation)


def compute_series(req: dict[str, Any]) -> dict[str, Any]:
    """Compute the closed-form series for ``req`` (a ``ComputeEquationRequest`` dump).

    Tries three tiers: symbolic integration (exact), sequence identification
    (conjectured), spline approximation (approximate). Runs in a worker
    process's main thread (see the module docstring).
    """
    import numpy as np
    import sympy as sp

    from fourier_analysis.symbolic.identification import identify_sequence
    from fourier_analysis.symbolic.integration import symbolic_fourier_coefficients
    from fourier_analysis.symbolic.simplification import compute_effective_n, simplify_series
    from fourier_analysis.symbolic.spline import spline_fourier_coefficients

    expr = parse_function_of_x(req["expression"])
    x = sp.Symbol("x")
    domain = (req["domain_start"], req["domain_end"])
    period = domain[1] - domain[0]
    n_harmonics = req["n_harmonics"]

    # Evaluate original function on grid
    f_numpy = sp.lambdify(x, expr, modules=["numpy"])
    x_eval = np.linspace(domain[0], domain[1], req["n_eval_points"], endpoint=False)
    try:
        raw = f_numpy(x_eval)
        y_eval = np.broadcast_to(np.asarray(raw, dtype=np.float64), x_eval.shape).copy()
    except Exception:
        y_eval = np.array([complex(expr.subs(x, xv)).real for xv in x_eval])

    # Tier 1: Symbolic integration
    tier = "symbolic"
    terms = symbolic_fourier_coefficients(expr, n_harmonics, domain, period)

    # Tier 2: Sequence identification
    if terms is None:
        tier = "identified"
        spline_terms = spline_fourier_coefficients(y_eval, x_eval, n_harmonics, period)
        coeffs = [t.coefficient for t in spline_terms]
        indices = [t.n for t in spline_terms]
        terms = identify_sequence(coeffs, indices)

    # Tier 3: Spline fallback
    if terms is None:
        tier = "spline"
        terms = spline_fourier_coefficients(y_eval, x_eval, n_harmonics, period)

    latex, energy = simplify_series(terms, req["budget"], req["notation"])
    latex_sigma = render_sigma(terms, req["notation"], displayed_n(terms, req["auto_harmonics"]))

    # Reconstruct from all terms
    y_recon = np.zeros_like(x_eval, dtype=complex)
    for t in terms:
        if t.n == 0:
            y_recon += t.coefficient
        else:
            y_recon += t.coefficient * np.exp(1j * t.n * 2 * np.pi / period * x_eval)

    return {
        "status": "ok",
        "tier": tier,
        "latex": latex,
        "latex_sigma": latex_sigma,
        "terms": terms,
        "original_points": {"x": x_eval.tolist(), "y": y_eval.tolist()},
        "reconstructed_points": {"x": x_eval.tolist(), "y": y_recon.real.tolist()},
        "energy_captured": energy,
        "effective_n": compute_effective_n(terms),
    }
