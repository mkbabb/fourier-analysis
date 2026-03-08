"""Basis evaluation (synthesis) for animation and visualization.

Evaluates truncated basis expansions at evenly spaced points and
precomputes partial sums for frontend transfer.
"""

from __future__ import annotations

import numpy as np
from numpy.polynomial import chebyshev, legendre
from numpy.typing import NDArray

from fourier_analysis.bases_fitting import (
    BasisDecomposition,
    approximate_curve,
    chebyshev_fit,
    legendre_from_chebyshev,
)


def evaluate_partial_sum(
    decomposition: BasisDecomposition,
    degree: int,
    n_eval: int = 1000,
) -> NDArray[np.float64 | np.complex128]:
    """Evaluate a truncated series at evenly spaced points.

    Parameters
    ----------
    decomposition : BasisDecomposition
        The basis decomposition to evaluate.
    degree : int
        Number of terms to include.
    n_eval : int
        Number of evaluation points.

    Returns
    -------
    NDArray
        Evaluated values. Complex for Fourier, real for polynomial bases.
    """
    basis = decomposition.basis

    # Collect coefficients up to `degree`
    coeff_dict: dict[int, complex] = {}
    for comp in decomposition.components:
        if basis == "fourier":
            if abs(comp.index) <= degree:
                coeff_dict[comp.index] = comp.coefficient
        else:
            if 0 <= comp.index <= degree:
                coeff_dict[comp.index] = comp.coefficient

    if basis == "fourier":
        t = np.linspace(0, 1, n_eval, endpoint=False)
        result = np.zeros(n_eval, dtype=np.complex128)
        for k, c in coeff_dict.items():
            result += c * np.exp(2j * np.pi * k * t)
        return result

    # Polynomial bases — trim endpoints to mitigate Runge phenomenon
    # on closed contours (which have an inherent discontinuity at s=±1)
    eps = 0.03
    s = np.linspace(-1 + eps, 1 - eps, n_eval)
    max_k = max(coeff_dict.keys()) if coeff_dict else 0
    coeffs_arr = np.zeros(max_k + 1, dtype=np.float64)
    for k, c in coeff_dict.items():
        coeffs_arr[k] = c.real

    if basis == "chebyshev":
        return chebyshev.chebval(s, coeffs_arr)
    elif basis == "legendre":
        return legendre.legval(s, coeffs_arr)
    else:
        raise ValueError(f"Unknown basis: {basis!r}")


def _default_levels(max_degree: int) -> list[int]:
    """Generate a geometric progression of truncation levels."""
    levels = set()
    k = 1
    while k <= max_degree:
        levels.add(k)
        k = max(k + 1, int(k * 1.5))
    levels.add(max_degree)
    return sorted(levels)


def _serialize_decomposition(decomp: BasisDecomposition) -> dict:
    """Convert a BasisDecomposition to a JSON-serializable dict."""
    return {
        "basis": decomp.basis,
        "domain": list(decomp.domain),
        "components": [
            {
                "index": c.index,
                "coefficient": [c.coefficient.real, c.coefficient.imag],
                "amplitude": c.amplitude,
                "phase": c.phase,
            }
            for c in decomp.components
        ],
    }


def build_animation_data(
    contour_points: NDArray[np.complex128],
    max_degree: int,
    levels: list[int] | None = None,
    n_eval: int = 1000,
) -> dict:
    """Precompute all partial sums for frontend transfer.

    Parameters
    ----------
    contour_points : 1-D complex array
    max_degree : int
    levels : list of int, optional
        Truncation levels to precompute. Defaults to a geometric progression.
    n_eval : int
        Evaluation points per partial sum.

    Returns
    -------
    dict
        Serializable dictionary with original path, decompositions, and
        partial sums at each level for each basis.
    """
    if levels is None:
        levels = _default_levels(max_degree)

    approx = approximate_curve(contour_points, max_degree)

    partial_sums: dict[str, dict[int, dict[str, list[float]]]] = {}

    # Fourier partial sums (complex -> x, y)
    partial_sums["fourier"] = {}
    for n in levels:
        vals = evaluate_partial_sum(approx.fourier, n, n_eval)
        partial_sums["fourier"][n] = {
            "x": vals.real.tolist(),
            "y": vals.imag.tolist(),
        }

    # Polynomial basis partial sums — fit separately at each level
    # (truncating a high-degree fit is incorrect for equispaced data)
    x_signal = contour_points.real.astype(np.float64)
    y_signal = contour_points.imag.astype(np.float64)
    eps = 0.03
    s_eval = np.linspace(-1 + eps, 1 - eps, n_eval)

    for basis_name in ("chebyshev", "legendre"):
        partial_sums[basis_name] = {}
        for n in levels:
            deg = min(n, len(contour_points) - 1)
            cheb_x = chebyshev_fit(x_signal, deg)
            cheb_y = chebyshev_fit(y_signal, deg)
            if basis_name == "chebyshev":
                x_vals = chebyshev.chebval(s_eval, cheb_x)
                y_vals = chebyshev.chebval(s_eval, cheb_y)
            else:
                leg_x = legendre_from_chebyshev(cheb_x)
                leg_y = legendre_from_chebyshev(cheb_y)
                x_vals = legendre.legval(s_eval, leg_x)
                y_vals = legendre.legval(s_eval, leg_y)
            partial_sums[basis_name][n] = {
                "x": x_vals.tolist(),
                "y": y_vals.tolist(),
            }

    # Serialize decompositions
    decompositions = {}
    decompositions["fourier"] = _serialize_decomposition(approx.fourier)
    for basis_name in ("chebyshev", "legendre"):
        decompositions[f"{basis_name}_x"] = _serialize_decomposition(approx.x[basis_name])
        decompositions[f"{basis_name}_y"] = _serialize_decomposition(approx.y[basis_name])

    return {
        "original": {
            "x": contour_points.real.tolist(),
            "y": contour_points.imag.tolist(),
        },
        "decompositions": decompositions,
        "partial_sums": partial_sums,
        "eval_points": np.linspace(0, 1, n_eval, endpoint=False).tolist(),
        "levels": levels,
    }
