#!/usr/bin/env python3
"""Pre-compute Fourier decompositions from browser-extracted SVG contours.

Reads multi-contour shape data extracted by FourierShapeExtractor.vue
(via Playwright), stitches contours together using order_contours(),
resamples to uniform arc-length, then runs the Fourier decomposition
pipeline. Outputs JSON files that the frontend imports as static assets.

Usage:
    # First: extract contours via the browser (FourierShapeExtractor.vue)
    # Then:
    python scripts/precompute_svg_fourier.py

Inputs:
    scripts/raw-contours.json  (from browser extraction)

Outputs:
    web/src/assets/fourier-paths/sun.json
    web/src/assets/fourier-paths/moon.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from fourier_analysis.bases import (
    _serialize_decomposition,
    evaluate_partial_sum,
    fourier_decomposition,
)
from fourier_analysis.contours import resample_arc_length
from fourier_analysis.shortest_tour import order_contours


def contours_from_point_arrays(
    point_arrays: list[list[list[float]]],
) -> list[np.ndarray]:
    """Convert browser-extracted [[x,y],...] contour arrays to complex arrays."""
    contours = []
    for pts in point_arrays:
        arr = np.array(pts, dtype=np.float64)
        z = arr[:, 0] + 1j * arr[:, 1]
        contours.append(z)
    return contours


def build_fourier_from_contours(
    contours: list[np.ndarray],
    n_harmonics: int = 100,
    n_samples: int = 512,
    n_eval: int = 512,
    levels: list[int] | None = None,
) -> dict:
    """Stitch multi-contour shape → Fourier decomposition + partial sums.

    Parameters
    ----------
    contours : list of complex arrays
        Individual contour segments (from browser extraction).
    n_harmonics : int
        Number of Fourier harmonics to compute.
    n_samples : int
        Number of uniform arc-length samples for the stitched path.
    n_eval : int
        Number of evaluation points for partial sum curves.
    levels : list[int], optional
        Harmonic counts at which to pre-compute partial sums.
    """
    if levels is None:
        levels = [1, 2, 3, 5, 8, 12, 18, 25, 35, 50, 75, 100]

    # Stitch contours into a single path using nearest-neighbor + 2-opt
    stitched = order_contours(contours)

    # Resample to uniform arc-length spacing
    contour = resample_arc_length(stitched, n_samples)

    # Fourier decomposition
    decomp = fourier_decomposition(contour, n_harmonics=n_harmonics)

    # Pre-compute partial sums at each level
    partial_sums: dict[int, dict[str, list[float]]] = {}
    for n in levels:
        if n > n_harmonics:
            continue
        vals = evaluate_partial_sum(decomp, n, n_eval)
        partial_sums[n] = {
            "x": vals.real.tolist(),
            "y": vals.imag.tolist(),
        }

    return {
        "original": {
            "x": contour.real.tolist(),
            "y": contour.imag.tolist(),
        },
        "decomposition": _serialize_decomposition(decomp),
        "partial_sums": partial_sums,
        "eval_points": np.linspace(0, 1, n_eval, endpoint=False).tolist(),
        "levels": [n for n in levels if n <= n_harmonics],
        "n_harmonics": n_harmonics,
        "n_samples": n_samples,
        "n_eval": n_eval,
    }


def main() -> None:
    raw_path = PROJECT_ROOT / "scripts" / "raw-contours.json"
    if not raw_path.exists():
        print(f"Error: {raw_path} not found.")
        print("Run the FourierShapeExtractor in the browser first.")
        sys.exit(1)

    with open(raw_path) as f:
        raw_data = json.load(f)

    out_dir = PROJECT_ROOT / "web" / "src" / "assets" / "fourier-paths"
    out_dir.mkdir(parents=True, exist_ok=True)

    for name in ("sun", "moon"):
        print(f"Computing Fourier decomposition for {name}...")

        point_arrays = raw_data[name]
        contours = contours_from_point_arrays(point_arrays)

        print(f"  {len(contours)} contours, "
              f"total {sum(len(c) for c in contours)} points")

        data = build_fourier_from_contours(
            contours,
            n_harmonics=100,
            n_samples=512,
            n_eval=512,
            levels=[1, 2, 3, 5, 8, 12, 18, 25, 35, 50, 75, 100],
        )

        out_path = out_dir / f"{name}.json"
        with open(out_path, "w") as f:
            json.dump(data, f, separators=(",", ":"))

        n_components = len(data["decomposition"]["components"])
        n_levels = len(data["levels"])
        size_kb = out_path.stat().st_size / 1024
        print(f"  → {out_path} ({n_components} components, "
              f"{n_levels} levels, {size_kb:.1f} KB)")

    print("Done.")


if __name__ == "__main__":
    main()
