#!/usr/bin/env python3
"""The fourier mark: an epicycle figure drawn from its own series, one drawing on
every surface (the browser tab, the home-screen icon, the share card and the app
dock's folded seat).

The built mark is "harmonics": the sawtooth (pi - x)/2 at one instant as four
nested circles and the tip. Its arms are the sawtooth's first four harmonics
(amplitudes 1, 1/2, 1/3, 1/4, read from the FFT of the sampled wave, not typed
in). Circle j is centred where arm j-1 ends and has the radius the rest of the
chain can still reach, so each lies inside the one before and touches it.

Three other figures are kept behind ``MARK``, each drawn from a real series:
"chain" (the sawtooth's first three circles with the curve their tip has drawn),
"ringing" (the square wave's partial sum S_7) and "letter" (a script F written
as one line by its own partial sum S_8).

Flat: fills and round-capped strokes in the site's own colours, no gradient, no
gloss. A favicon reads no CSS tokens, so the colours are literal here (glass
`--card`, `--viz-fourier`, `--foreground`, the site's `--viz-amber`, resolved);
the dock's seat reads the tokens themselves.

numpy and Pillow only.

Usage:
    python scripts/precompute_mark.py          # write every output
    python scripts/precompute_mark.py --check  # regenerate in memory; exit 1 if an output differs

Outputs:
    web/public/favicon.svg            both tiles, switched by prefers-color-scheme
    web/public/favicon-16.png, favicon-32.png, favicon.ico (16 and 32)
    web/public/apple-touch-icon.png   180 px, full-bleed (the system rounds it)
    web/public/og.png                 1200 x 630 share card, the figure on the cream ground
    web/src/components/layout/FourierMark.vue   the bare figure for the dock's seat
"""

from __future__ import annotations

import argparse
import io
import sys
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw

MARK = "harmonics"  # or "chain", "ringing", "letter"

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PUBLIC = PROJECT_ROOT / "web" / "public"
SEAT = PROJECT_ROOT / "web" / "src" / "components" / "layout" / "FourierMark.vue"

# The tile's corner, as a share of its side (1/phi^3; daraksha's tile has the same corner).
TILE_RADIUS = 23.6

TOK = {
    "light": {"tile": "#fdf5ec", "red": "#d73523", "amber": "#9d6515", "ink": "#1c1917"},
    "dark": {"tile": "#352a22", "red": "#eb7366", "amber": "#e8b96d", "ink": "#e9e6e2"},
}
# The seat's colours are the page's tokens, so it follows the theme with no second drawing.
SEAT_TOKENS = {"red": "var(--viz-fourier)", "amber": "var(--viz-amber)", "ink": "var(--foreground)"}


# ---------------------------------------------------------------------------
# The series
# ---------------------------------------------------------------------------


def coefficients(signal: np.ndarray) -> np.ndarray:
    """c_n = (1/N) sum_k f(k) exp(-2 pi i n k / N), in FFT order."""
    signal = np.asarray(signal, dtype=np.complex128)
    return np.fft.fft(signal) / len(signal)


def saw_phasors(n: int, samples: int = 4096) -> np.ndarray:
    """The sawtooth (pi - x)/2 on (0, 2 pi) as rotating arms: a_k = 2i c_k, so the tip's
    height Im(sum a_k e^{ikx}) is the wave's partial sum (c_k comes out as 1/(2ik))."""
    x = (np.arange(samples) + 0.5) / samples * 2 * np.pi
    c = coefficients((np.pi - x) / 2)
    return np.array([2j * complex(c[k]) for k in range(1, n + 1)])


def square_wave_partial(level_odd: int, x: np.ndarray, samples: int = 4096) -> np.ndarray:
    """S_N of the +-1 square wave, N the highest (odd) harmonic kept."""
    xs = (np.arange(samples) + 0.5) / samples
    c = coefficients(np.where(xs < 0.5, 1.0, -1.0))
    out = np.full_like(x, c[0].real, dtype=float)
    for k in range(1, level_odd + 1):
        out += 2 * (c[k] * np.exp(2j * np.pi * k * x)).real
    return out


class Series:
    """c_n of a closed curve sampled uniformly in its parameter, and its partial sums."""

    def __init__(self, z: np.ndarray):
        self.z = np.asarray(z, dtype=complex)
        self.c = coefficients(self.z)

    def coef(self, n: int) -> complex:
        return complex(self.c[n % len(self.z)])

    def partial(self, level: int, t: np.ndarray) -> np.ndarray:
        t = np.asarray(t, dtype=float)
        freqs = [0] + [m for k in range(1, level + 1) for m in (k, -k)]
        return sum(self.coef(n) * np.exp(2j * np.pi * n * t) for n in freqs)


def catmull(points, per: int = 24, alpha: float = 0.5) -> np.ndarray:
    """Centripetal Catmull-Rom through the points (open), as complex samples."""
    p = np.array([complex(*q) for q in points])
    p = np.concatenate([[2 * p[0] - p[1]], p, [2 * p[-1] - p[-2]]])
    out = []
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        t0 = 0.0
        t1 = t0 + abs(p1 - p0) ** alpha
        t2 = t1 + abs(p2 - p1) ** alpha
        t3 = t2 + abs(p3 - p2) ** alpha
        for t in np.linspace(t1, t2, per, endpoint=False):
            a1 = (t1 - t) / (t1 - t0) * p0 + (t - t0) / (t1 - t0) * p1
            a2 = (t2 - t) / (t2 - t1) * p1 + (t - t1) / (t2 - t1) * p2
            a3 = (t3 - t) / (t3 - t2) * p2 + (t - t2) / (t3 - t2) * p3
            b1 = (t2 - t) / (t2 - t0) * a1 + (t - t0) / (t2 - t0) * a2
            b2 = (t3 - t) / (t3 - t1) * a2 + (t - t1) / (t3 - t1) * a3
            out.append((t2 - t) / (t2 - t1) * b1 + (t - t1) / (t2 - t1) * b2)
    out.append(p[-2])
    return np.array(out)


def closed_tour(*legs: np.ndarray) -> np.ndarray:
    """Join polyline legs end to start into one closed curve."""
    out = [legs[0]]
    for leg in legs[1:]:
        out.append(leg[1:] if abs(leg[0] - out[-1][-1]) < 1e-9 else leg)
    z = np.concatenate(out)
    return z[:-1] if abs(z[0] - z[-1]) < 1e-9 else z


def resample_even(z: np.ndarray, n: int) -> np.ndarray:
    """A closed polyline resampled to n points evenly spaced in arc length."""
    zz = np.append(z, z[0])
    s = np.concatenate([[0.0], np.cumsum(np.abs(np.diff(zz)))])
    u = np.linspace(0.0, s[-1], n, endpoint=False)
    return np.interp(u, s, zz.real) + 1j * np.interp(u, s, zz.imag)


# ---------------------------------------------------------------------------
# Drawing: one list of flat items, written as SVG and rasterised
# ---------------------------------------------------------------------------


@dataclass
class Item:
    kind: str  # stroke | ring | dot
    color: str  # a key of TOK
    width: float = 0.0
    opacity: float = 1.0
    pts: np.ndarray | None = None
    closed: bool = False
    c: complex = 0j
    r: float = 0.0


@dataclass
class Fig:
    items: list[Item] = field(default_factory=list)

    def stroke(self, pts, color, width, opacity=1.0, closed=False):
        self.items.append(Item("stroke", color, width, opacity, np.asarray(pts, dtype=complex), closed))

    def ring(self, c, r, color, width, opacity=1.0):
        self.items.append(Item("ring", color, width, opacity, c=complex(c), r=float(r)))

    def dot(self, c, r, color):
        self.items.append(Item("dot", color, c=complex(c), r=float(r)))

    def place(self, box: tuple[float, float, float, float], side: float) -> float:
        """Scale and centre on `box` so its larger side is `side` units of the 100-unit tile."""
        x0, y0, x1, y1 = box
        k = side / max(x1 - x0, y1 - y0)
        mid = complex((x0 + x1) / 2, (y0 + y1) / 2)
        for it in self.items:
            if it.kind == "stroke":
                it.pts = (it.pts - mid) * k + 50 + 50j
            else:
                it.c = (it.c - mid) * k + 50 + 50j
                it.r *= k
            it.width *= k
        return k


def ink_box_of_curve(z: np.ndarray, width: float) -> tuple[float, float, float, float]:
    h = width / 2
    return z.real.min() - h, z.imag.min() - h, z.real.max() + h, z.imag.max() + h


def harmonics(n: int = 4, theta: float = 0.17, w: float = 6.5, side: float = 82.0) -> Fig:
    cs = saw_phasors(n)
    joints = [0j]
    for k, c in enumerate(cs, start=1):
        joints.append(joints[-1] + c * np.exp(2j * np.pi * k * theta))
    joints = np.conj(np.array(joints))  # y down
    r = [abs(c) for c in cs]
    unit = sum(r) / 40.0
    f = Fig()
    for j in range(len(cs)):
        f.ring(joints[j], sum(r[j:]), "red", w * unit)
    f.dot(joints[-1], w * unit * 0.62, "ink")
    reach = sum(r) + w * unit / 2
    f.place((-reach, -reach, reach, reach), side)
    return f


def chain(n: int = 3, t: float = 0.07, span: float = 0.90, w: float = 8.2, w_ring: float = 3.1,
          side: float = 82.0) -> Fig:
    cs = saw_phasors(n)
    ks = np.arange(1, len(cs) + 1)

    def path(tt):
        return np.conj(sum(c * np.exp(2j * np.pi * k * np.asarray(tt)) for k, c in zip(ks, cs)))

    unit = abs(cs[0]) / 30.0
    joints = [0j]
    for k, c in zip(ks, cs):
        joints.append(joints[-1] + c * np.exp(2j * np.pi * k * t))
    joints = np.conj(np.array(joints))
    f = Fig()
    for j, c in enumerate(cs):
        f.ring(joints[j], abs(c), "ink", w_ring * unit, 0.45)
    f.stroke(path(np.linspace(t - span, t, int(720 * span))), "red", w * unit)
    f.stroke(joints, "ink", w_ring * unit, 0.92)
    f.dot(joints[-1], w * unit * 0.78, "red")
    f.place(ink_box_of_curve(path(np.linspace(0, 1, 721)), w * unit), side)
    return f


def ringing(level: int = 7, w: float = 8.2, amp: float = 23.5, width: float = 78.0,
            win: tuple[float, float] = (-0.19, 0.69)) -> Fig:
    x = np.linspace(win[0], win[1], 600)
    y = square_wave_partial(level, x)
    z = (x - win[0]) / (win[1] - win[0]) * width + 1j * (-y * amp)
    f = Fig()
    f.stroke(z, "red", w)
    x0, y0, x1, y1 = ink_box_of_curve(z, w)
    f.items[0].pts = z - complex((x0 + x1) / 2, (y0 + y1) / 2) + 50 + 50j
    return f


# The script F as three pen strokes in a 100-unit box (y down): the top flourish, the
# stem with its foot curl, the cross stroke. One closed tour walks them out and back.
_F_BAR = [(50, 30), (46, 40), (36, 47), (26, 46), (19, 38), (20, 28), (29, 20), (43, 17), (58, 20), (72, 24), (83, 23), (92, 18)]
_F_STEM = [(71, 24), (62, 37), (54, 50), (48, 56), (46, 63), (39, 73), (28, 80), (17, 81), (10, 76), (9, 69), (14, 67)]
_F_CROSS_L = [(48, 56), (38, 59), (28, 66)]
_F_CROSS_R = [(48, 56), (60, 52), (72, 50), (79, 45)]


def letter(level: int = 8, w: float = 8.8, side: float = 80.0) -> Fig:
    bar, stem, cl, cr = (catmull(p) for p in (_F_BAR, _F_STEM, _F_CROSS_L, _F_CROSS_R))
    jb = int(np.argmin(np.abs(bar - stem[0])))
    stem[0] = bar[jb]
    jx = int(np.argmin(np.abs(stem - cl[0])))
    cl[0] = cr[0] = stem[jx]
    legs = [bar, bar[jb:][::-1], stem, stem[jx:][::-1], cl, cl[::-1], cr, cr[::-1], stem[: jx + 1][::-1], bar[: jb + 1][::-1]]
    series = Series(resample_even(closed_tour(*legs), 2048))
    curve = series.partial(level, np.linspace(0, 1, 721))
    f = Fig()
    f.stroke(curve[:-1], "amber", w, closed=True)
    k = f.place(ink_box_of_curve(curve, w), side)
    for it in f.items:
        it.width /= k  # the pen keeps its weight in tile units whatever the scale
    return f


FIGURES = {"harmonics": harmonics, "chain": chain, "ringing": ringing, "letter": letter}


# ---------------------------------------------------------------------------
# Writers
# ---------------------------------------------------------------------------


def _path_d(z: np.ndarray, closed: bool) -> str:
    return "M" + "L".join(f"{p.real:.2f} {p.imag:.2f}" for p in z) + ("Z" if closed else "")


def svg_items(f: Fig, paint) -> str:
    """The figure's elements; `paint(kind, color)` returns the paint attributes."""
    out = []
    for it in f.items:
        op = "" if it.opacity >= 0.999 else f' opacity="{it.opacity:g}"'
        if it.kind == "stroke":
            out.append(
                f'<path {paint("stroke", it.color)} stroke-width="{it.width:.2f}" stroke-linecap="round" '
                f'stroke-linejoin="round"{op} d="{_path_d(it.pts, it.closed)}"/>'
            )
        elif it.kind == "ring":
            out.append(
                f'<circle cx="{it.c.real:.2f}" cy="{it.c.imag:.2f}" r="{it.r:.2f}" {paint("stroke", it.color)} '
                f'stroke-width="{it.width:.2f}"{op}/>'
            )
        else:
            out.append(f'<circle cx="{it.c.real:.2f}" cy="{it.c.imag:.2f}" r="{it.r:.2f}" {paint("fill", it.color)}/>')
    return "".join(out)


def favicon_svg(f: Fig) -> str:
    """Both tiles in one file, switched by the reader's colour scheme."""
    used = sorted({("fill" if it.kind == "dot" else "stroke", it.color) for it in f.items})

    def rules(theme: str) -> str:
        t = TOK[theme]
        return f".t{{fill:{t['tile']}}}" + "".join(f".{k[0]}-{c}{{{k}:{t[c]}}}" for k, c in used)

    def paint(kind: str, color: str) -> str:
        return f'fill="none" class="s-{color}"' if kind == "stroke" else f'class="f-{color}"'

    style = f"<style>{rules('light')}@media (prefers-color-scheme:dark){{{rules('dark')}}}</style>"
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
        f'{style}<rect class="t" width="100" height="100" rx="{TILE_RADIUS:g}"/>{svg_items(f, paint)}</svg>\n'
    )


def seat_sfc(f: Fig) -> str:
    used = sorted({("fill" if it.kind == "dot" else "stroke", it.color) for it in f.items})
    inks = "\n".join(
        f".{k[0]}-{c} {{\n    {'fill: none;' + chr(10) + '    ' if k == 'stroke' else ''}{k}: {SEAT_TOKENS[c]};\n}}"
        for k, c in used
    )

    def paint(kind: str, color: str) -> str:
        return f'class="s-{color}"' if kind == "stroke" else f'class="f-{color}"'

    return f"""<!-- Generated by scripts/precompute_mark.py (MARK = "{MARK}"); do not edit by hand. -->
<script setup lang="ts">
/**
 * The fourier mark, bare, for a seat whose plate is its tile (the app dock's
 * folded seal): the same drawing as the tab icon, the touch icon and the
 * share card, in the page's own tokens, so it follows the theme. Its
 * 100-unit box is 0.74 of the plate's diameter.
 */
</script>

<template>
    <svg class="fourier-mark" data-mark="{MARK}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">{svg_items(f, paint)}</svg>
</template>

<style scoped>
.fourier-mark {{
    display: block;
    inline-size: calc(var(--dock-h) * 0.74);
    block-size: calc(var(--dock-h) * 0.74);
    flex: none;
}}
{inks}
</style>
"""


def _rgb(hex_: str) -> tuple[int, int, int]:
    h = hex_.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def _stamp(dr: ImageDraw.ImageDraw, z: np.ndarray, r: float) -> None:
    """A round-capped, round-joined stroke as the union of discs along the path."""
    if len(z) == 1:
        z = np.append(z, z[0])
    s = np.concatenate([[0.0], np.cumsum(np.abs(np.diff(z)))])
    step = max(0.35, r / 6)
    u = np.linspace(0, s[-1], max(2, int(s[-1] / step) + 1))
    zz = np.interp(u, s, z.real) + 1j * np.interp(u, s, z.imag)
    dr.line([(p.real, p.imag) for p in z], fill=255, width=max(1, int(round(2 * r))))
    for p in zz:
        dr.ellipse([p.real - r, p.imag - r, p.real + r, p.imag + r], fill=255)


def raster(f: Fig, px: int, theme: str = "light", rounded: bool = True, box: float = 100.0,
           size: tuple[int, int] | None = None) -> Image.Image:
    """The figure on its tile, supersampled and box-filtered down. `box` is the side, in
    output pixels, of the figure's 100-unit square, centred on a canvas of `size`."""
    w, h = size or (px, px)
    ss = max(4, min(16, 2048 // max(w, h)))
    W, H = w * ss, h * ss
    k = box * ss / 100.0
    off = complex((W - 100 * k) / 2, (H - 100 * k) / 2)
    t = TOK[theme]
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    mask = Image.new("L", (W, H), 0)
    if rounded:
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, W - 1, H - 1], radius=TILE_RADIUS / 100 * min(W, H), fill=255)
    else:
        mask.paste(255, (0, 0, W, H))
    img.paste(Image.new("RGBA", (W, H), (*_rgb(t["tile"]), 255)), (0, 0), mask)
    for it in f.items:
        m = Image.new("L", (W, H), 0)
        dr = ImageDraw.Draw(m)
        if it.kind == "stroke":
            z = it.pts * k + off
            if it.closed:
                z = np.append(z, z[0])
            _stamp(dr, z, it.width * k / 2)
        elif it.kind == "ring":
            th = np.linspace(0, 2 * np.pi, max(64, int(2 * np.pi * it.r * k)) + 1)
            _stamp(dr, (it.c + it.r * np.exp(1j * th)) * k + off, it.width * k / 2)
        else:
            c, r = it.c * k + off, it.r * k
            dr.ellipse([c.real - r, c.imag - r, c.real + r, c.imag + r], fill=255)
        if it.opacity < 0.999:
            m = m.point(lambda v, o=it.opacity: int(v * o))
        m = ImageChops.multiply(m, mask)
        img.alpha_composite(Image.merge("RGBA", (*Image.new("RGB", (W, H), _rgb(t[it.color])).split(), m)))
    return img.resize((w, h), Image.BOX)


def png_bytes(img: Image.Image, fmt: str = "PNG", **kw) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format=fmt, optimize=fmt == "PNG", **kw)
    return buf.getvalue()


def outputs() -> dict[Path, bytes]:
    f = FIGURES[MARK]()
    icon16, icon32 = raster(f, 16, box=16), raster(f, 32, box=32)
    ico = io.BytesIO()
    icon32.save(ico, format="ICO", sizes=[(16, 16), (32, 32)], append_images=[icon16])
    return {
        PUBLIC / "favicon.svg": favicon_svg(f).encode(),
        PUBLIC / "favicon-16.png": png_bytes(icon16),
        PUBLIC / "favicon-32.png": png_bytes(icon32),
        PUBLIC / "favicon.ico": ico.getvalue(),
        PUBLIC / "apple-touch-icon.png": png_bytes(raster(f, 180, rounded=False, box=180).convert("RGB")),
        PUBLIC / "og.png": png_bytes(raster(f, 0, rounded=False, box=504, size=(1200, 630)).convert("RGB")),
        SEAT: seat_sfc(f).encode(),
    }


def same(path: Path, data: bytes) -> bool:
    """Text outputs by bytes; images by their decoded pixels (an encoder may pack the same
    pixels differently)."""
    if not path.exists():
        return False
    if path.suffix in (".svg", ".vue"):
        return path.read_bytes() == data
    try:
        a, b = Image.open(path), Image.open(io.BytesIO(data))
    except OSError:
        return False
    frames_a = getattr(a, "n_frames", 1) if path.suffix != ".ico" else len(a.info.get("sizes", [a.size]))
    frames_b = getattr(b, "n_frames", 1) if path.suffix != ".ico" else len(b.info.get("sizes", [b.size]))
    if frames_a != frames_b or a.size != b.size:
        return False
    if path.suffix == ".ico":
        sizes = sorted(a.info.get("sizes", [a.size]))
        if sizes != sorted(b.info.get("sizes", [b.size])):
            return False
        for s in sizes:
            a.size, b.size = s, s
            if a.convert("RGBA").tobytes() != b.convert("RGBA").tobytes():
                return False
        return True
    return a.convert("RGBA").tobytes() == b.convert("RGBA").tobytes()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="compare, write nothing; exit 1 on a difference")
    args = parser.parse_args()
    stale = []
    for path, data in outputs().items():
        rel = path.relative_to(PROJECT_ROOT)
        if args.check:
            if not same(path, data):
                stale.append(str(rel))
        else:
            path.write_bytes(data)
            print(f"wrote {rel} ({len(data)} B)")
    if stale:
        print("the mark's outputs differ from the generator (run scripts/precompute_mark.py):", *stale, sep="\n  ")
        return 1
    if args.check:
        print("the mark's outputs are current")
    return 0


if __name__ == "__main__":
    sys.exit(main())
