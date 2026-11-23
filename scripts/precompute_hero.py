#!/usr/bin/env python3
"""Pre-compute the site's own drawings for the visualizer's resting stage (the hero).

The hero (``web/src/components/visualization/RestDrawing.vue``) draws a family of closed
curves in circles. Most are generated in the page (roses, Lissajous figures, superformula
shapes, hypotrochoids, a heart, stars); the site's own drawings are here, as spectra, so the
page never loads the drawings' point files (the sun and moon alone are ~200 kB):

* the sun and the moon (the theme seat's drawings, ``fourier-paths/{sun,moon}.json``);
* the five section outlines (``fourier-paths/{gallery,visualize,paper,equation,morph}.json``,
  from ``precompute_nav_icons.py``).

Each outline is resampled evenly along its length, y turned up, and its coefficients c_k
for |k| <= 48 written in the package's flat frequency order (0, +1, -1, +2, -2, ...),
centred and scaled to unit reach. The page normalises them with the generated shapes
(counter-clockwise, unit radius at the shape's own number of terms).

Usage:
    uv run python scripts/precompute_hero.py

Output:
    web/src/assets/hero-spectra.json
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PATHS = PROJECT_ROOT / "web" / "src" / "assets" / "fourier-paths"
OUT = PROJECT_ROOT / "web" / "src" / "assets" / "hero-spectra.json"

TOP = 48
SAMPLES = 1024

#: Each drawing and what it is called on the stage (the drawing's accessible name).
DRAWINGS = {
    "sun": "the sun, the theme seat's own drawing",
    "moon": "the moon, the theme seat's own drawing",
    "gallery": "the gallery's grid",
    "visualize": "an eye, the visualizer's own",
    "paper": "a page, the paper's own",
    "equation": "a sigma, the equation's own",
    "morph": "an infinity sign",
}


def resample(x: np.ndarray, y: np.ndarray, n: int) -> np.ndarray:
    """The closed outline at ``n`` points evenly along its length, as complex z = x + iy."""
    px, py = np.append(x, x[0]), np.append(y, y[0])
    cum = np.concatenate([[0.0], np.cumsum(np.hypot(np.diff(px), np.diff(py)))])
    at = np.linspace(0.0, cum[-1], n, endpoint=False)
    return np.interp(at, cum, px) + 1j * np.interp(at, cum, py)


def spectrum(name: str) -> list[float]:
    src = json.loads((PATHS / f"{name}.json").read_text())["original"]
    z = resample(np.asarray(src["x"], float), -np.asarray(src["y"], float), SAMPLES)
    z = z - z.mean()
    z = z / np.abs(z).max()
    c = np.fft.fft(z) / SAMPLES
    flat: list[float] = [0.0, 0.0]
    for k in range(1, TOP + 1):
        for ck in (c[k], c[-k]):
            flat += [round(float(ck.real), 5), round(float(ck.imag), 5)]
    return flat


def main() -> None:
    out = {name: {"label": label, "c": spectrum(name)} for name, label in DRAWINGS.items()}
    OUT.write_text(json.dumps(out, separators=(",", ":")) + "\n")
    print(f"{OUT.relative_to(PROJECT_ROOT)}: {OUT.stat().st_size} bytes, {len(out)} drawings, |k| <= {TOP}")


if __name__ == "__main__":
    main()
