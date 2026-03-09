"""F23: PCA covariance ellipse — data cloud with eigenvector axes.

Referenced in §6.2 (PCA). Shows a 2D data cloud with the eigenvectors
of the covariance matrix as the axes of the best-fit ellipse.
"""

from __future__ import annotations

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Ellipse

from fourier_analysis.figures.style import (
    BLUE,
    PURPLE,
    RED,
    SLATE,
    save_figure,
    setup_style,
)


def generate() -> None:
    setup_style()
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.5))

    # Generate correlated 2D data
    rng = np.random.default_rng(42)
    n = 200
    # Covariance with correlation
    cov_true = np.array([[2.5, 1.8], [1.8, 1.5]])
    mean = np.array([0.0, 0.0])
    data = rng.multivariate_normal(mean, cov_true, n)

    # Center the data
    mu = data.mean(axis=0)
    X = data - mu

    # Sample covariance
    C = X.T @ X / (n - 1)
    eigvals, eigvecs = np.linalg.eigh(C)
    # Sort descending
    idx = np.argsort(eigvals)[::-1]
    eigvals = eigvals[idx]
    eigvecs = eigvecs[:, idx]

    # --- Left: original data with eigenvector axes ---
    ax1.scatter(data[:, 0], data[:, 1], s=8, alpha=0.4, color=BLUE, edgecolors="none")

    colors = [RED, PURPLE]
    labels = [
        rf"$e_1$: $\lambda_1 = {eigvals[0]:.2f}$",
        rf"$e_2$: $\lambda_2 = {eigvals[1]:.2f}$",
    ]
    for i in range(2):
        vi = eigvecs[:, i]
        length = np.sqrt(eigvals[i])
        ax1.annotate(
            "",
            xy=mu + length * vi,
            xytext=mu,
            arrowprops=dict(arrowstyle="-|>", color=colors[i], lw=2.5),
        )
        # Label at arrow tip
        tip = mu + length * vi * 1.15
        ax1.text(tip[0], tip[1], labels[i], fontsize=10, color=colors[i], ha="center")

    # Draw ellipse (2 std deviations)
    angle = np.degrees(np.arctan2(eigvecs[1, 0], eigvecs[0, 0]))
    ell = Ellipse(
        xy=mu,
        width=4 * np.sqrt(eigvals[0]),
        height=4 * np.sqrt(eigvals[1]),
        angle=angle,
        edgecolor=SLATE,
        facecolor="none",
        linewidth=1.0,
        linestyle="--",
        alpha=0.6,
    )
    ax1.add_patch(ell)

    ax1.set_aspect("equal")
    ax1.set_xlabel(r"$x_1$")
    ax1.set_ylabel(r"$x_2$")
    ax1.set_title("Data with eigenvectors of $C$")
    lim = 6
    ax1.set_xlim(-lim, lim)
    ax1.set_ylim(-lim, lim)
    ax1.axhline(0, color="black", linewidth=0.3)
    ax1.axvline(0, color="black", linewidth=0.3)

    # --- Right: PCA-rotated data (diagonalized coordinates) ---
    X_rot = X @ eigvecs  # project onto eigenvectors
    ax2.scatter(X_rot[:, 0], X_rot[:, 1], s=8, alpha=0.4, color=BLUE, edgecolors="none")

    # In rotated frame, axes are aligned with coordinates
    for i in range(2):
        direction = np.zeros(2)
        direction[i] = np.sqrt(eigvals[i])
        ax2.annotate(
            "",
            xy=direction,
            xytext=(0, 0),
            arrowprops=dict(arrowstyle="-|>", color=colors[i], lw=2.5),
        )

    # Axis-aligned ellipse
    ell2 = Ellipse(
        xy=(0, 0),
        width=4 * np.sqrt(eigvals[0]),
        height=4 * np.sqrt(eigvals[1]),
        angle=0,
        edgecolor=SLATE,
        facecolor="none",
        linewidth=1.0,
        linestyle="--",
        alpha=0.6,
    )
    ax2.add_patch(ell2)

    ax2.set_aspect("equal")
    ax2.set_xlabel(r"PC$_1$")
    ax2.set_ylabel(r"PC$_2$")
    ax2.set_title("After PCA rotation (diagonalized)")
    ax2.set_xlim(-lim, lim)
    ax2.set_ylim(-lim, lim)
    ax2.axhline(0, color="black", linewidth=0.3)
    ax2.axvline(0, color="black", linewidth=0.3)

    fig.text(
        0.50,
        0.50,
        r"$\xrightarrow{\;V^T\;}$",
        fontsize=14,
        ha="center",
        va="center",
        transform=fig.transFigure,
    )

    fig.tight_layout(w_pad=3.0)
    save_figure(fig, "f23_pca_ellipse")


if __name__ == "__main__":
    generate()
