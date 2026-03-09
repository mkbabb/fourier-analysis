"""F24: Runge phenomenon — equispaced vs Chebyshev interpolation.

Referenced in §2.7 (Lagrange Interpolation). Shows how equispaced
polynomial interpolation of 1/(1+25x²) diverges at the endpoints,
while Chebyshev node interpolation converges.
"""

from __future__ import annotations

import matplotlib.pyplot as plt
import numpy as np

from fourier_analysis.figures.style import (
    PURPLE,
    RED,
    BLUE,
    AMBER,
    SLATE,
    save_figure,
    setup_style,
)


def lagrange_interp(nodes: np.ndarray, values: np.ndarray, x: np.ndarray) -> np.ndarray:
    """Evaluate the Lagrange interpolant at points x."""
    n = len(nodes)
    result = np.zeros_like(x)
    for i in range(n):
        Li = np.ones_like(x)
        for j in range(n):
            if j != i:
                Li *= (x - nodes[j]) / (nodes[i] - nodes[j])
        result += values[i] * Li
    return result


def generate() -> None:
    setup_style()
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.5), sharey=True)

    # Runge's function
    f = lambda x: 1.0 / (1.0 + 25.0 * x**2)
    x_fine = np.linspace(-1, 1, 500)
    y_true = f(x_fine)

    degrees = [5, 10, 15]
    colors = [BLUE, PURPLE, RED]

    # --- Left: equispaced nodes ---
    for deg, color in zip(degrees, colors):
        nodes = np.linspace(-1, 1, deg + 1)
        values = f(nodes)
        y_interp = lagrange_interp(nodes, values, x_fine)
        ax1.plot(x_fine, y_interp, color=color, linewidth=1.2, label=f"$n = {deg}$")

    ax1.plot(x_fine, y_true, color=SLATE, linewidth=2, linestyle="--", label=r"$f(x)$", alpha=0.7)

    # Show equispaced nodes for n=15
    nodes_15 = np.linspace(-1, 1, 16)
    ax1.scatter(nodes_15, f(nodes_15), color=SLATE, s=15, zorder=5, alpha=0.5)

    ax1.set_ylim(-1.5, 2.5)
    ax1.set_xlim(-1, 1)
    ax1.set_xlabel(r"$x$")
    ax1.set_ylabel(r"$p_n(x)$")
    ax1.set_title("Equispaced nodes")
    ax1.legend(fontsize=9, loc="upper left")

    # --- Right: Chebyshev nodes ---
    for deg, color in zip(degrees, colors):
        nodes = np.cos((2 * np.arange(deg + 1) + 1) * np.pi / (2 * (deg + 1)))
        values = f(nodes)
        y_interp = lagrange_interp(nodes, values, x_fine)
        ax2.plot(x_fine, y_interp, color=color, linewidth=1.2, label=f"$n = {deg}$")

    ax2.plot(x_fine, y_true, color=SLATE, linewidth=2, linestyle="--", label=r"$f(x)$", alpha=0.7)

    # Show Chebyshev nodes for n=15
    cheb_15 = np.cos((2 * np.arange(16) + 1) * np.pi / 32)
    ax2.scatter(cheb_15, f(cheb_15), color=SLATE, s=15, zorder=5, alpha=0.5)

    ax2.set_xlim(-1, 1)
    ax2.set_xlabel(r"$x$")
    ax2.set_title("Chebyshev nodes")
    ax2.legend(fontsize=9, loc="upper left")

    fig.suptitle(
        r"Interpolation of $f(x) = 1/(1 + 25x^2)$",
        fontsize=13,
    )
    fig.tight_layout()
    save_figure(fig, "f24_runge_phenomenon")


if __name__ == "__main__":
    generate()
