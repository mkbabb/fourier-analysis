"""F25: Hermite functions as eigenfunctions of the Fourier transform.

Referenced in §2.4 (Hermite Polynomials). Shows the first four Hermite
functions ψ_n and their eigenvalues (-i)^n under F, illustrating the
four-fold cyclic symmetry.
"""

from __future__ import annotations

import math

import matplotlib.pyplot as plt
import numpy as np

from fourier_analysis.figures.style import (
    BLUE,
    PURPLE,
    RED,
    AMBER,
    SLATE,
    save_figure,
    setup_style,
)


def hermite_polynomial(n: int, x: np.ndarray) -> np.ndarray:
    """Compute physicist's Hermite polynomial H_n(x) via recurrence."""
    if n == 0:
        return np.ones_like(x)
    if n == 1:
        return 2 * x
    Hnm2 = np.ones_like(x)
    Hnm1 = 2 * x
    for k in range(2, n + 1):
        Hn = 2 * x * Hnm1 - 2 * (k - 1) * Hnm2
        Hnm2 = Hnm1
        Hnm1 = Hn
    return Hn


def hermite_function(n: int, x: np.ndarray) -> np.ndarray:
    """Normalized Hermite function ψ_n(x) = c_n H_n(x) e^{-x²/2}."""
    Hn = hermite_polynomial(n, x)
    # Normalization: ||ψ_n|| = 1 in L²(R)
    norm = np.sqrt(np.sqrt(np.pi) * 2**n * math.factorial(n))
    return Hn * np.exp(-x**2 / 2) / norm


def generate() -> None:
    setup_style()
    fig, axes = plt.subplots(2, 2, figsize=(9, 6))

    x = np.linspace(-4, 4, 500)
    colors = [BLUE, RED, PURPLE, AMBER]
    eigenvalue_strs = ["1", "-i", "-1", "i"]
    eigenvalue_labels = [
        r"$\mathcal{F}[\psi_0] = (+1)\,\psi_0$",
        r"$\mathcal{F}[\psi_1] = (-i)\,\psi_1$",
        r"$\mathcal{F}[\psi_2] = (-1)\,\psi_2$",
        r"$\mathcal{F}[\psi_3] = (+i)\,\psi_3$",
    ]

    for n, ax in enumerate(axes.flat):
        psi = hermite_function(n, x)
        ax.plot(x, psi, color=colors[n], linewidth=1.8)
        ax.fill_between(x, psi, alpha=0.15, color=colors[n])
        ax.axhline(0, color="black", linewidth=0.3)

        ax.set_title(
            rf"$\psi_{n}(x)$, eigenvalue $(-i)^{n} = {eigenvalue_strs[n]}$",
            fontsize=11,
        )
        ax.set_xlim(-4, 4)
        ax.set_xlabel(r"$x$")

        # Eigenvalue annotation
        ax.text(
            0.97,
            0.95,
            eigenvalue_labels[n],
            transform=ax.transAxes,
            fontsize=10,
            ha="right",
            va="top",
            color=colors[n],
            bbox=dict(boxstyle="round,pad=0.3", facecolor="white", edgecolor=colors[n], alpha=0.8),
        )

    # Add cyclic arrow diagram annotation in figure coordinates
    fig.text(
        0.50,
        0.50,
        r"$\circlearrowleft\;\mathcal{F}^4 = \mathrm{Id}$",
        fontsize=13,
        ha="center",
        va="center",
        transform=fig.transFigure,
        color=SLATE,
        bbox=dict(boxstyle="round,pad=0.4", facecolor="white", edgecolor=SLATE, alpha=0.9),
    )

    fig.suptitle(
        r"Hermite functions: eigenfunctions of $\mathcal{F}$",
        fontsize=13,
    )
    fig.tight_layout(h_pad=1.5)
    save_figure(fig, "f25_hermite_eigenfunctions")


if __name__ == "__main__":
    generate()
