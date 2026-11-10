#!/usr/bin/env python3
"""Pre-compute the Sun shape the theme toggle and /morph draw.

The Sun is one closed outline: a disc with eight rounded rays, written in
polar form so the curve can never cross itself. The earlier asset stitched the
separate strokes of a sun icon into one path, which drew a scribble.

Usage:
    uv run python scripts/precompute_sun.py

Output:
    web/src/assets/fourier-paths/sun.json  (FourierPathData, levels up to 50,
    the levels moon.json carries, so the two shapes morph point for point)
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from fourier_analysis.bases_evaluation import _serialize_decomposition, evaluate_partial_sum
from fourier_analysis.bases_fitting import fourier_decomposition
from fourier_analysis.contours import resample_arc_length

CENTER = (94.0, 94.0)
BODY_R = 52.0
TIP_R = 76.0
RAYS = 8
RAY_HALF_WIDTH = np.pi / RAYS * 0.7

N_HARMONICS = 50
N_SAMPLES = 512
N_EVAL = 512
LEVELS = [1, 2, 3, 5, 8, 12, 18, 25, 35, 50]


def sun_outline(n: int = 4096) -> np.ndarray:
    """The outline, counter-clockwise from the top ray, as complex points."""
    theta = -np.pi / 2 - np.linspace(0, 2 * np.pi, n, endpoint=False)
    period = 2 * np.pi / RAYS
    # Distance from the nearest ray's centre line, in radians; each ray is a
    # raised-cosine swell, so no partial sum loops at a sharp tip.
    off = np.abs(((theta + np.pi / 2) + period / 2) % period - period / 2)
    rise = 0.5 + 0.5 * np.cos(np.pi * np.clip(off / RAY_HALF_WIDTH, 0, 1))
    r = BODY_R + (TIP_R - BODY_R) * rise
    return (CENTER[0] + r * np.cos(theta)) + 1j * (CENTER[1] + r * np.sin(theta))


def main() -> None:
    contour = resample_arc_length(sun_outline(), N_SAMPLES)
    decomp = fourier_decomposition(contour, n_harmonics=N_HARMONICS)
    def xy(z: np.ndarray) -> dict[str, list[float]]:
        # Three decimals in a 200-unit box: the bytes the boot parses, not
        # precision a stroke can show (the moon asset is written the same way).
        return {"x": np.round(z.real, 3).tolist(), "y": np.round(z.imag, 3).tolist()}

    partial_sums = {level: xy(evaluate_partial_sum(decomp, level, N_EVAL)) for level in LEVELS}
    data = {
        "original": xy(contour),
        "decomposition": _serialize_decomposition(decomp),
        "partial_sums": partial_sums,
        "eval_points": np.linspace(0, 1, N_EVAL, endpoint=False).tolist(),
        "levels": LEVELS,
        "n_harmonics": N_HARMONICS,
        "n_samples": N_SAMPLES,
        "n_eval": N_EVAL,
    }
    out = PROJECT_ROOT / "web" / "src" / "assets" / "fourier-paths" / "sun.json"
    out.write_text(json.dumps(data, separators=(",", ":")))
    print(f"{out.relative_to(PROJECT_ROOT)}: {len(data['decomposition']['components'])} components")


if __name__ == "__main__":
    main()
