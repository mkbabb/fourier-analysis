"""F22: SVD geometric interpretation — unit circle to ellipse.

Referenced in Ch 6 (Eigentheory). Shows how a linear map A sends the
unit circle to an ellipse whose axes are the singular vectors and whose
semi-axis lengths are the singular values.
"""

from __future__ import annotations

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


def generate() -> None:
    setup_style()
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.5))

    # A concrete 2x2 matrix with distinct singular values
    A = np.array([[2.0, 1.0], [0.5, 1.5]])
    U, s, Vt = np.linalg.svd(A)
    V = Vt.T

    theta = np.linspace(0, 2 * np.pi, 300)
    circle = np.column_stack([np.cos(theta), np.sin(theta)])  # (300, 2)

    # --- Left: unit circle with right singular vectors ---
    ax1.plot(circle[:, 0], circle[:, 1], color=BLUE, linewidth=1.5)

    # Right singular vectors v1, v2
    for i, (color, name) in enumerate([(RED, r"$v_1$"), (PURPLE, r"$v_2$")]):
        vi = V[:, i]
        ax1.annotate(
            "",
            xy=vi,
            xytext=(0, 0),
            arrowprops=dict(arrowstyle="-|>", color=color, lw=2),
        )
        offset = vi * 1.25
        ax1.text(offset[0], offset[1], name, fontsize=13, color=color, ha="center", va="center")

    ax1.set_xlim(-1.8, 1.8)
    ax1.set_ylim(-1.8, 1.8)
    ax1.set_aspect("equal")
    ax1.axhline(0, color="black", linewidth=0.3)
    ax1.axvline(0, color="black", linewidth=0.3)
    ax1.set_xlabel(r"$x_1$")
    ax1.set_ylabel(r"$x_2$")
    ax1.set_title(r"Unit circle, $\|x\| = 1$")

    # --- Right: image ellipse with left singular vectors ---
    ellipse = circle @ A.T  # (300, 2)
    ax2.plot(ellipse[:, 0], ellipse[:, 1], color=BLUE, linewidth=1.5)

    # Left singular vectors u1, u2 scaled by singular values
    for i, (color, vname, uname) in enumerate(
        [(RED, r"$v_1$", r"$\sigma_1 u_1$"), (PURPLE, r"$v_2$", r"$\sigma_2 u_2$")]
    ):
        ui_scaled = s[i] * U[:, i]
        ax2.annotate(
            "",
            xy=ui_scaled,
            xytext=(0, 0),
            arrowprops=dict(arrowstyle="-|>", color=color, lw=2),
        )
        offset = ui_scaled * 1.15
        ax2.text(offset[0], offset[1], uname, fontsize=12, color=color, ha="center", va="center")

    # Dashed axes of the ellipse extended
    for i, color in enumerate([RED, PURPLE]):
        ui = U[:, i]
        extent = s[i] * 1.1
        ax2.plot(
            [-extent * ui[0], extent * ui[0]],
            [-extent * ui[1], extent * ui[1]],
            "--",
            color=color,
            linewidth=0.7,
            alpha=0.4,
        )

    lim = max(s) * 1.5
    ax2.set_xlim(-lim, lim)
    ax2.set_ylim(-lim, lim)
    ax2.set_aspect("equal")
    ax2.axhline(0, color="black", linewidth=0.3)
    ax2.axvline(0, color="black", linewidth=0.3)
    ax2.set_xlabel(r"$y_1$")
    ax2.set_ylabel(r"$y_2$")
    ax2.set_title(r"Image ellipse, $y = Ax$")

    # Connecting arrow between panels
    fig.text(
        0.50,
        0.50,
        r"$\xrightarrow{\;A = U\Sigma V^T\;}$",
        fontsize=14,
        ha="center",
        va="center",
        transform=fig.transFigure,
    )

    fig.tight_layout(w_pad=3.0)
    save_figure(fig, "f22_svd_ellipsoid")


if __name__ == "__main__":
    generate()
