"""Basis fitting and decomposition for parametric curves.

Decomposes contour points into Fourier, Chebyshev, and Legendre basis
expansions. The Chebyshev fit uses NumPy's well-conditioned fitting routine;
Legendre coefficients are obtained by basis conversion.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from numpy.polynomial import chebyshev, legendre
from numpy.typing import NDArray

from fourier_analysis.series import fourier_coefficients


@dataclass(frozen=True, slots=True)
class BasisComponent:
    """One term in a basis expansion: c_k * phi_k(t)."""

    index: int
    coefficient: complex
    amplitude: float
    phase: float


@dataclass(frozen=True, slots=True)
class BasisDecomposition:
    """Complete decomposition of a signal or curve component in one basis."""

    basis: str
    components: list[BasisComponent]
    domain: tuple[float, float]


@dataclass(frozen=True, slots=True)
class CurveApproximation:
    """Decomposition of a parametric curve in multiple bases."""

    x: dict[str, BasisDecomposition]
    y: dict[str, BasisDecomposition]
    fourier: BasisDecomposition
    n_points: int
    max_degree: int


def _make_component(index: int, coeff: complex) -> BasisComponent:
    return BasisComponent(
        index=index,
        coefficient=coeff,
        amplitude=abs(coeff),
        phase=float(np.angle(coeff)),
    )


def fourier_decomposition(
    signal: NDArray[np.complexfloating] | NDArray[np.floating],
    n_harmonics: int | None = None,
) -> BasisDecomposition:
    """Decompose a complex signal into Fourier basis components."""
    coeffs = fourier_coefficients(signal, n_harmonics=n_harmonics)
    N = len(signal)
    nh = n_harmonics if n_harmonics is not None else N // 2

    components: list[BasisComponent] = []
    # DC term
    components.append(_make_component(0, complex(coeffs[0])))
    # Positive and negative frequencies
    for k in range(1, nh + 1):
        if k < len(coeffs):
            components.append(_make_component(k, complex(coeffs[k])))
        neg_idx = -k % N if n_harmonics is None else len(coeffs) - k
        if 0 < neg_idx < len(coeffs) and neg_idx != k:
            components.append(_make_component(-k, complex(coeffs[neg_idx])))

    components.sort(key=lambda c: c.amplitude, reverse=True)
    return BasisDecomposition(basis="fourier", components=components, domain=(0.0, 1.0))


def chebyshev_fit(
    signal: NDArray[np.floating],
    degree: int,
) -> NDArray[np.float64]:
    """Fit a real signal to Chebyshev polynomials of the first kind.

    Parameters
    ----------
    signal : 1-D real array
        Sampled values.
    degree : int
        Maximum polynomial degree.

    Returns
    -------
    NDArray[float64]
        Chebyshev coefficients c_0 .. c_degree.
    """
    n = len(signal)
    s = np.linspace(-1, 1, n)
    fit = chebyshev.Chebyshev.fit(s, signal, deg=degree, domain=[-1, 1])
    return np.asarray(fit.coef, dtype=np.float64)


def legendre_fit(
    signal: NDArray[np.floating],
    degree: int,
) -> NDArray[np.float64]:
    """Fit a real signal to Legendre polynomials directly.

    This produces a DIFFERENT least-squares fit than converting from
    Chebyshev, because ``Legendre.fit`` minimizes the unweighted L2
    error in the Legendre basis, whereas converting from Chebyshev
    gives the same polynomial (just re-expressed).

    Parameters
    ----------
    signal : 1-D real array
        Sampled values.
    degree : int
        Maximum polynomial degree.

    Returns
    -------
    NDArray[float64]
        Legendre coefficients d_0 .. d_degree.
    """
    n = len(signal)
    s = np.linspace(-1, 1, n)
    fit = legendre.Legendre.fit(s, signal, deg=degree, domain=[-1, 1])
    return np.asarray(fit.coef, dtype=np.float64)


def legendre_from_chebyshev(
    cheb_coeffs: NDArray[np.float64],
) -> NDArray[np.float64]:
    """Convert Chebyshev coefficients to Legendre coefficients.

    Uses NumPy's polynomial conversion: Chebyshev -> Legendre via the
    monomial basis as intermediate.

    NOTE: This produces the same polynomial as the Chebyshev fit, just
    re-expressed in the Legendre basis. For a genuinely different
    approximation, use ``legendre_fit`` instead.
    """
    cheb = chebyshev.Chebyshev(cheb_coeffs, domain=[-1, 1])
    leg = cheb.convert(kind=legendre.Legendre)
    return np.asarray(leg.coef, dtype=np.float64)


def _real_decomposition(
    signal: NDArray[np.floating],
    degree: int,
    basis_name: str,
    coeffs: NDArray[np.float64],
) -> BasisDecomposition:
    """Build a BasisDecomposition from real polynomial coefficients."""
    components = [_make_component(k, complex(c)) for k, c in enumerate(coeffs)]
    components.sort(key=lambda c: c.amplitude, reverse=True)
    domain = (-1.0, 1.0)
    return BasisDecomposition(basis=basis_name, components=components, domain=domain)


def chebyshev_decomposition(
    signal: NDArray[np.floating],
    degree: int,
) -> BasisDecomposition:
    """Decompose a real signal into Chebyshev basis."""
    coeffs = chebyshev_fit(signal, degree)
    return _real_decomposition(signal, degree, "chebyshev", coeffs)


def legendre_decomposition(
    signal: NDArray[np.floating],
    degree: int,
) -> BasisDecomposition:
    """Decompose a real signal into Legendre basis (via Chebyshev conversion).

    NOTE: For equispaced data, Chebyshev.fit and Legendre.fit both solve
    the same discrete least-squares problem — the resulting polynomial is
    identical. Only the coefficient representation differs. We convert
    from Chebyshev to preserve the well-conditioned Chebyshev fitting
    while exposing Legendre coefficients.
    """
    cheb_coeffs = chebyshev_fit(signal, degree)
    leg_coeffs = legendre_from_chebyshev(cheb_coeffs)
    return _real_decomposition(signal, degree, "legendre", leg_coeffs)


def approximate_curve(
    contour_points: NDArray[np.complex128],
    max_degree: int,
    n_harmonics: int | None = None,
) -> CurveApproximation:
    """Full pipeline: decompose a complex contour into all 3 bases.

    Parameters
    ----------
    contour_points : 1-D complex array
        Contour as complex numbers (x + iy).
    max_degree : int
        Maximum polynomial degree for Chebyshev/Legendre.
    n_harmonics : int, optional
        Number of Fourier harmonics. Defaults to max_degree.

    Returns
    -------
    CurveApproximation
    """
    if n_harmonics is None:
        n_harmonics = max_degree

    x_signal = contour_points.real.astype(np.float64)
    y_signal = contour_points.imag.astype(np.float64)

    fourier = fourier_decomposition(contour_points, n_harmonics=n_harmonics)

    x_decomps: dict[str, BasisDecomposition] = {}
    y_decomps: dict[str, BasisDecomposition] = {}

    for name, decomp_fn in [("chebyshev", chebyshev_decomposition), ("legendre", legendre_decomposition)]:
        x_decomps[name] = decomp_fn(x_signal, max_degree)
        y_decomps[name] = decomp_fn(y_signal, max_degree)

    return CurveApproximation(
        x=x_decomps,
        y=y_decomps,
        fourier=fourier,
        n_points=len(contour_points),
        max_degree=max_degree,
    )
