"""Contour-quality bench harness (F.CT).

Runs the production contour pipeline exactly as the API's extract route does
(``ContourSettings`` defaults -> ``extract_contours`` -> ``build_contour_tour``
-> ``resample_arc_length(path, n_points)``) and scores each image against a
reference subject mask.

Metrics (all lengths in pipeline pixels, i.e. the image resized so its
longest side is ``ContourSettings.resize``):

- ``precision``: fraction of contour ink (each contour sampled at ~1 px) that
  lies on the subject (inside the reference mask dilated by ``tol_px``).
- ``recall``: fraction of the reference mask's boundary that has contour ink
  within ``tol_px`` (boundary within ``tol_px`` of the frame excluded: at the
  bar's own tolerance it cannot be told from the frame, and frame ink is forbidden).
- ``contour_count``, ``ink_length``, ``tour_length`` (ink + connectors,
  closed back to the start, as the Fourier series sees it).
- ``jump_count`` / ``jump_length``: connectors (inter-contour gaps plus the
  closing gap) longer than ``JUMP_K`` x the median step of the API's resampled
  tour (tour_length / n_points), plus ``chord_count`` / ``chord_length``.
- ``chord_count`` / ``chord_length``: straight segments *inside* the ink,
  longer than the same threshold, that no image edge backs (median
  subject-normalised gradient along them below ``CHORD_SUPPORT``).  A jump
  absorbed into a contour (a force-closed loop's closing chord, a frame run)
  is a jump on the canvas; a long machined edge is not.
- ``background_fraction``: fraction of the resampled tour (by arc length,
  connectors included) that lies off the subject.
- ``frame_fraction``: fraction of contour ink lying on the image frame (2 px).
- ``wiggle``: 1 - smoothed/raw ink length at a 4 px arc-length Gaussian (ink
  resampled uniformly at 1 px, so the kernel is 4 px whatever the trace's point
  density; open ends point-reflected, see ``ink_wiggle``); the
  staircase/noise-spur measure.
- ``epi_err_N`` for N in 50/100/200: mean |reconstruction - tour| over the
  resampled tour, as a percentage of the image diagonal (the API's epicycle
  route: resample to n_points, ``EpicycleChain.from_signal(n_harmonics=N)``).
- ``runtime_s``: wall time of extraction + tour.  The subject models' sessions
  are opened once before the first image (``load_subject_sessions``), as a
  long-lived server holds them: a model load is a per-process cost, not a
  per-extraction one, and must not be charged to whichever image runs first.

Reference masks: an ML subject model (ISNet general-use, deliberately stronger
than the pipeline's own U2-Net-lite so the pipeline is not graded by itself)
thresholded at 0.5, intersected with a meaningful
alpha channel, reduced to its significant connected components with holes
filled.  Public references live in ``bench/contours/reference/`` and are
committed only after an eye check; the private reference lives in
``~/.fourier-samples/reference/`` and is never committed.

PRIVACY: the private sample and every derivative (overlays, masks, metrics
JSON) are written under ``~/.fourier-samples/`` only.  The harness refuses to
write private output anywhere else.
"""

from __future__ import annotations

import json
import math
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

import numpy as np
from numpy.typing import NDArray
from PIL import Image, ImageDraw, ImageOps
from scipy import ndimage as ndi

REPO_ROOT = Path(__file__).resolve().parents[2]
PRIVATE_ROOT = Path.home() / ".fourier-samples"
PRIVATE_SAMPLE = PRIVATE_ROOT / "daraksha.jpeg"
PRIVATE_NAME = "private-sample"
PUBLIC_REFERENCE_DIR = Path(__file__).resolve().parent / "reference"
PRIVATE_REFERENCE_DIR = PRIVATE_ROOT / "reference"
PUBLIC_DIRS = ("assets/portraits", "assets/animals")
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"}

JUMP_K = 4.0
CHORD_SUPPORT = 0.1
EPI_NS = (50, 100, 200)
TOL_FRACTION = 0.01  # boundary tolerance as a fraction of the image diagonal
MIN_TOL_PX = 3.0


# ---------------------------------------------------------------------------
# Image set
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class BenchImage:
    name: str
    path: Path
    private: bool


PRIMARY_NAME = "portraits-daraksha"  # the owner's standard sample (F-CT addendum b)


def image_set(include_private: bool = True) -> list[BenchImage]:
    """The public set, the primary sample (``PRIMARY_NAME``) first, after the
    raw private original when it is present."""
    images: list[BenchImage] = []
    if include_private and PRIVATE_SAMPLE.is_file():
        images.append(BenchImage(PRIVATE_NAME, PRIVATE_SAMPLE, True))
    for rel in PUBLIC_DIRS:
        d = REPO_ROOT / rel
        for p in sorted(d.iterdir()):
            if p.suffix.lower() in IMAGE_EXTS:
                images.append(BenchImage(f"{d.name}-{p.stem.lower()}", p, False))
    images.sort(key=lambda i: (not i.private, i.name != PRIMARY_NAME))  # stable
    return images


# ---------------------------------------------------------------------------
# The production pipeline, as the API runs it
# ---------------------------------------------------------------------------


def api_settings():
    """The API's default ``ContourSettings`` (api/models/shared.py)."""
    from api.models.shared import ContourSettings

    return ContourSettings()


@dataclass
class PipelineRun:
    contours: list[NDArray[np.complex128]]
    ordered: list[NDArray[np.complex128]]
    gaps: list[float]  # inter-contour gaps + the closing gap (last)
    tour: NDArray[np.complex128]  # the API's resampled tour
    shape: tuple[int, int]  # (h, w) pipeline resolution
    runtime_s: float


def run_pipeline(path: Path) -> PipelineRun:
    """extract-contour route: extract_contours -> build_contour_tour -> resample."""
    from fourier_analysis.contours import extract_contours, resample_arc_length
    from fourier_analysis.shortest_tour import build_contour_tour

    cs = api_settings()
    config = cs.to_contour_config()
    t0 = time.perf_counter()
    contours = extract_contours(path, config)
    tour = build_contour_tour(contours) if contours else None
    runtime = time.perf_counter() - t0

    shape = pipeline_shape(path, config.resize)
    if tour is None or len(tour.path) < 2:
        return PipelineRun(contours, [], [], np.array([], np.complex128), shape, runtime)
    ordered = list(tour.ordered_contours)
    gaps = list(tour.gap_lengths) + [float(abs(tour.path[-1] - tour.path[0]))]
    resampled = resample_arc_length(tour.path, cs.n_points)
    return PipelineRun(contours, ordered, gaps, resampled, shape, runtime)


def pipeline_shape(path: Path, resize: int | None) -> tuple[int, int]:
    img = ImageOps.exif_transpose(Image.open(path))
    w, h = img.size
    if resize:
        r = resize / max(w, h)
        w, h = int(w * r), int(h * r)
    return h, w


def load_rgb(path: Path, shape: tuple[int, int]) -> NDArray[np.uint8]:
    img = ImageOps.exif_transpose(Image.open(path))
    if img.mode in ("RGBA", "LA", "PA", "P"):
        rgba = img.convert("RGBA")
        bg = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
        img = Image.alpha_composite(bg, rgba)
    img = img.convert("RGB").resize((shape[1], shape[0]), Image.Resampling.LANCZOS)
    return np.asarray(img)


def to_pixels(z: NDArray[np.complex128], shape: tuple[int, int]) -> NDArray[np.float64]:
    """Pipeline coords (centred, y up) -> (row, col) pixel coords."""
    cy, cx = shape[0] / 2, shape[1] / 2
    return np.stack([cy - z.imag, z.real + cx], axis=-1)


# ---------------------------------------------------------------------------
# Reference masks
# ---------------------------------------------------------------------------


REFERENCE_MODEL_URL = (
    "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx"
)
REFERENCE_MODEL_SHA256 = "60920e99c45464f2ba57bee2ad08c919a52bbf852739e96947fbb4358c0d964a"
REFERENCE_MODEL_PATH = (
    Path.home() / ".cache" / "fourier-analysis" / "models" / "reference" / "isnet-general-use.onnx"
)
_reference_session = None


def _reference_model():
    """ISNet (general use) — a stronger subject model than the pipeline's U2-Net-lite,
    so the reference is not the pipeline grading itself."""
    global _reference_session
    if _reference_session is not None:
        return _reference_session
    import hashlib
    import urllib.request

    import onnxruntime as ort

    p = REFERENCE_MODEL_PATH
    if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest() != REFERENCE_MODEL_SHA256:
        p.parent.mkdir(parents=True, exist_ok=True)
        tmp = p.with_suffix(".tmp")
        urllib.request.urlretrieve(REFERENCE_MODEL_URL, tmp)  # noqa: S310
        if hashlib.sha256(tmp.read_bytes()).hexdigest() != REFERENCE_MODEL_SHA256:
            tmp.unlink(missing_ok=True)
            raise RuntimeError("SHA-256 mismatch for isnet-general-use.onnx")
        tmp.rename(p)
    _reference_session = ort.InferenceSession(str(p), providers=["CPUExecutionProvider"])
    return _reference_session


def reference_probability(path: Path, shape: tuple[int, int]) -> NDArray[np.float64]:
    session = _reference_model()
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    im = im.resize((1024, 1024), Image.Resampling.LANCZOS)
    x = np.asarray(im, dtype=np.float32) / 255.0
    x = x / max(float(x.max()), 1e-6) - 0.5
    x = x.transpose(2, 0, 1)[None].astype(np.float32)
    o = session.run(None, {session.get_inputs()[0].name: x})[0].squeeze()
    o = (o - o.min()) / (o.max() - o.min() + 1e-9)
    o_img = Image.fromarray((o * 255).astype(np.uint8)).resize(
        (shape[1], shape[0]), Image.Resampling.BILINEAR
    )
    return np.asarray(o_img, dtype=np.float64) / 255.0


def derive_reference_mask(path: Path) -> NDArray[np.bool_]:
    """The ML subject mask, refined: alpha-intersected, whisker-thin strands opened
    away, significant components kept, holes filled."""
    config = api_settings().to_contour_config().normalized()
    shape = pipeline_shape(path, config.resize)
    mask = reference_probability(path, shape) >= 0.5
    img = ImageOps.exif_transpose(Image.open(path))
    if img.mode in ("RGBA", "LA", "PA"):
        alpha = np.asarray(
            img.split()[-1].resize((shape[1], shape[0]), Image.Resampling.LANCZOS)
        ) > 127
        if 0.05 < float(alpha.mean()) < 0.98 and float((alpha & mask).mean()) > 0.05:
            mask &= alpha
    r = max(1, round(max(shape) / 512))
    mask = ndi.binary_opening(mask, structure=np.ones((2 * r + 1, 2 * r + 1)))
    labels, n = ndi.label(mask)
    if n > 1:
        sizes = ndi.sum(mask, labels, index=np.arange(1, n + 1))
        keep = np.flatnonzero(sizes >= 0.05 * sizes.max()) + 1
        mask = np.isin(labels, keep)
    mask = ndi.binary_fill_holes(mask)
    return np.asarray(mask, dtype=bool)


def reference_path(img: BenchImage) -> Path:
    base = PRIVATE_REFERENCE_DIR if img.private else PUBLIC_REFERENCE_DIR
    return base / f"{img.name}.png"


def load_reference(img: BenchImage, shape: tuple[int, int]) -> tuple[NDArray[np.bool_], str]:
    """The stored reference if present (checked by eye), else a fresh derivation."""
    p = reference_path(img)
    if p.is_file():
        m = np.asarray(Image.open(p).convert("L")) > 127
        if m.shape == shape:
            return m, "stored"
    return derive_reference_mask(img.path), "derived"


def save_reference(img: BenchImage, mask: NDArray[np.bool_]) -> Path:
    p = reference_path(img)
    guard_private_path(p, img.private)
    p.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(mask.astype(np.uint8) * 255).convert("1").save(p, optimize=True)
    return p


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------


def densify(z: NDArray[np.complex128], step: float = 1.0) -> NDArray[np.complex128]:
    """Sample a polyline uniformly by arc length, ~``step`` px apart (linear, no
    smoothing).  Uniform, not merely subdivided: a trace whose points are denser
    than ``step`` is thinned too, so every per-sample measure (precision, the
    wiggle's arc-length Gaussian) weighs ink by length, whatever the point
    density a stage happened to emit."""
    if len(z) < 2:
        return z
    s = np.concatenate([[0.0], np.cumsum(np.abs(np.diff(z)))])
    if s[-1] <= 0:
        return z[:1]
    t = np.linspace(0.0, s[-1], max(2, int(math.ceil(s[-1] / step)) + 1))
    return np.interp(t, s, z.real) + 1j * np.interp(t, s, z.imag)


def inside(mask: NDArray[np.bool_], rc: NDArray[np.float64]) -> NDArray[np.bool_]:
    r = np.clip(np.round(rc[:, 0]).astype(int), 0, mask.shape[0] - 1)
    c = np.clip(np.round(rc[:, 1]).astype(int), 0, mask.shape[1] - 1)
    return mask[r, c]


@dataclass
class Metrics:
    name: str
    private: bool
    width: int
    height: int
    reference: str
    tol_px: float
    precision: float
    recall: float
    contour_count: int
    ink_length: float
    tour_length: float
    median_step: float
    jump_count: int
    jump_length: float
    max_jump: float
    chord_count: int
    chord_length: float
    background_fraction: float
    frame_fraction: float
    wiggle: float
    epi_err: dict[str, float] = field(default_factory=dict)
    runtime_s: float = 0.0
    wiggle_edge_padded: float = 0.0  # ink_wiggle(reflect=False), for comparison only

    @property
    def jump_fraction(self) -> float:
        return self.jump_length / self.tour_length if self.tour_length > 0 else 1.0

    def as_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["jump_fraction"] = self.jump_fraction
        d["bar_failures"] = bar_failures(self)
        return d


# THE BAR (F.CT, proposed 2026-09-25 from the baseline).  Every image must meet
# every line in the same run, twice in a row; the judge panel and the portrait
# landmark checklist sit on top (metrics are necessary, not sufficient).
BAR: dict[str, tuple[str, float]] = {
    "precision": (">=", 0.97),
    "recall": (">=", 0.90),
    "background_fraction": ("<=", 0.02),
    "frame_fraction": ("<=", 0.005),
    "jump_count": ("<=", 3),
    "jump_fraction": ("<=", 0.03),
    "wiggle": ("<=", 0.025),
    "epi_err_50": ("<=", 1.5),
    "epi_err_100": ("<=", 0.6),
    "epi_err_200": ("<=", 0.25),
    "runtime_s": ("<=", 8.0),  # load-sensitive: confirm a FAIL with a solo rerun
}


def bar_failures(m: Metrics) -> list[str]:
    out = []
    for key, (op, limit) in BAR.items():
        v = m.epi_err[key.rsplit("_", 1)[1]] if key.startswith("epi_err_") else getattr(m, key)
        ok = v >= limit if op == ">=" else v <= limit
        if not ok:
            out.append(f"{key}={v:.3g}{'<' if op == '>=' else '>'}{limit:g}")
    return out


def ink_wiggle(
    contours: list[NDArray[np.complex128]], sigma_px: float = 4.0, reflect: bool = True
) -> float:
    """Staircase/spur measure: 1 - (length after a sigma_px arc-length Gaussian
    smoothing) / (raw length), pooled over all contours.  A clean stroke loses
    little length when smoothed; jagged, spurred or staircase ink loses a lot.

    An open stroke's ends are point-reflected (``x[-k] = 2 x[0] - x[k]``), as
    the selection's ``stroke_wiggle`` does: edge padding ("nearest") pulls
    each end of even a perfectly straight stroke in by about 0.4 sigma, so a
    clean straight 60 px stroke read as 5% jagged and the measure charged a
    drawing for its number of stroke ends, not its jags.  ``reflect=False``
    is the edge-padded measure (the bench's rounds 1-7), kept for comparison
    (``Metrics.wiggle_edge_padded``)."""
    raw = smooth = 0.0
    for c in contours:
        d = densify(c)
        if len(d) < 8:
            continue
        closed = abs(d[0] - d[-1]) < 1e-6
        q = np.column_stack([d.real, d.imag])
        if closed:
            sm = ndi.gaussian_filter1d(q, sigma_px, axis=0, mode="wrap")
        elif reflect:
            k = min(len(q) - 1, int(math.ceil(4 * sigma_px)))
            padded = np.vstack([2 * q[0] - q[k:0:-1], q, 2 * q[-1] - q[-2 : -k - 2 : -1]])
            sm = ndi.gaussian_filter1d(padded, sigma_px, axis=0, mode="nearest")[k : k + len(q)]
        else:
            sm = ndi.gaussian_filter1d(q, sigma_px, axis=0, mode="nearest")
        raw += float(np.hypot(*np.diff(q, axis=0).T).sum())
        smooth += float(np.hypot(*np.diff(sm, axis=0).T).sum())
    return float(1.0 - smooth / raw) if raw > 0 else 0.0


def epicycle_error(tour: NDArray[np.complex128], n: int, diagonal: float) -> float:
    """Mean |chain - tour| over the tour samples, % of the image diagonal."""
    from fourier_analysis.epicycles import EpicycleChain

    chain = EpicycleChain.from_signal(tour, n_harmonics=n)
    ts = np.arange(len(tour)) / len(tour)
    trace = chain.evaluate(ts)
    return float(np.mean(np.abs(trace - tour)) / diagonal * 100.0)


def find_chords(
    img: BenchImage, run: PipelineRun, ref: NDArray[np.bool_], threshold: float
) -> list[float]:
    """Lengths of the unsupported straight segments inside the ink (see module doc)."""
    from skimage import filters

    long = [
        (a, b) for c in run.contours for a, b in zip(c[:-1], c[1:]) if abs(b - a) > threshold
    ]
    if not long:
        return []
    gray = load_rgb(img.path, run.shape).astype(np.float64).mean(axis=2) / 255.0
    grad = filters.sobel(gray)
    scale = float(np.percentile(grad[ref], 95)) if ref.any() else float(grad.max())
    grad = grad / max(scale, 1e-12)
    out = []
    for a, b in long:
        rc = to_pixels(densify(np.array([a, b])), run.shape)
        r = np.clip(np.round(rc[:, 0]).astype(int), 0, run.shape[0] - 1)
        c = np.clip(np.round(rc[:, 1]).astype(int), 0, run.shape[1] - 1)
        if float(np.median(grad[r, c])) < CHORD_SUPPORT:
            out.append(float(abs(b - a)))
    return out


def compute_metrics(
    img: BenchImage, run: PipelineRun, ref: NDArray[np.bool_], ref_source: str
) -> Metrics:
    h, w = run.shape
    diagonal = float(math.hypot(h, w))
    tol = max(MIN_TOL_PX, TOL_FRACTION * diagonal)
    band = ndi.distance_transform_edt(~ref) <= tol  # subject + tolerance band

    if not run.ordered:
        return Metrics(img.name, img.private, w, h, ref_source, tol, 0.0, 0.0, 0,
                       0.0, 0.0, 0.0, 0, 0.0, 0.0, 0, 0.0, 1.0, 0.0, 0.0, {str(n): float("nan") for n in EPI_NS},
                       run.runtime_s)

    ink = np.concatenate([densify(c) for c in run.ordered])
    ink_rc = to_pixels(ink, run.shape)
    precision = float(inside(band, ink_rc).mean())

    # Recall: reference boundary pixels with ink within tol.
    boundary = ref & ~ndi.binary_erosion(ref, border_value=1)  # frame is not an edge
    # ... nor is a reference edge hugging it: within tol of the frame it can only
    # be drawn as ink the bar reads as the frame, which frame_fraction forbids.
    fe = int(math.ceil(tol))
    boundary[:fe] = boundary[-fe:] = False
    boundary[:, :fe] = boundary[:, -fe:] = False
    ink_img = np.zeros(run.shape, dtype=bool)
    r = np.clip(np.round(ink_rc[:, 0]).astype(int), 0, h - 1)
    c = np.clip(np.round(ink_rc[:, 1]).astype(int), 0, w - 1)
    ink_img[r, c] = True
    near_ink = ndi.distance_transform_edt(~ink_img) <= tol
    recall = float(near_ink[boundary].mean()) if boundary.any() else 0.0

    ink_length = float(sum(np.abs(np.diff(c)).sum() for c in run.ordered))
    gaps = np.asarray(run.gaps, dtype=np.float64)
    tour_length = ink_length + float(gaps.sum())
    steps = np.abs(np.diff(np.append(run.tour, run.tour[0])))
    median_step = float(np.median(steps))
    jumps = gaps[gaps > JUMP_K * median_step]
    chords = find_chords(img, run, ref, JUMP_K * median_step)

    tour_rc = to_pixels(run.tour, run.shape)
    background = float(1.0 - inside(band, tour_rc).mean())

    # Ink hugging the image frame (a frame-rectangle artefact, not the subject).
    edge = 2.0
    on_frame = (
        (ink_rc[:, 0] <= edge) | (ink_rc[:, 1] <= edge)
        | (ink_rc[:, 0] >= h - 1 - edge) | (ink_rc[:, 1] >= w - 1 - edge)
    )
    frame_fraction = float(on_frame.mean())

    wiggle = ink_wiggle(run.contours)  # the contours, not the tour's pieces between connectors
    epi = {str(n): epicycle_error(run.tour, n, diagonal) for n in EPI_NS}
    return Metrics(
        name=img.name,
        private=img.private,
        width=w,
        height=h,
        reference=ref_source,
        tol_px=tol,
        precision=precision,
        recall=recall,
        contour_count=len(run.contours),
        ink_length=ink_length,
        tour_length=tour_length,
        median_step=median_step,
        jump_count=int(jumps.size) + len(chords),
        jump_length=float(jumps.sum()) + float(sum(chords)),
        max_jump=max([float(gaps.max()) if gaps.size else 0.0, *chords]),
        chord_count=len(chords),
        chord_length=float(sum(chords)),
        background_fraction=background,
        frame_fraction=frame_fraction,
        wiggle=wiggle,
        epi_err=epi,
        runtime_s=run.runtime_s,
        wiggle_edge_padded=ink_wiggle(run.contours, reflect=False),
    )


# ---------------------------------------------------------------------------
# Overlay
# ---------------------------------------------------------------------------

INK = (80, 220, 255)
CONNECTOR = (170, 170, 170)
JUMP = (255, 40, 60)
REF = (90, 255, 120)
EPI = (255, 200, 60)


def _xy(rc: NDArray[np.float64]) -> list[tuple[float, float]]:
    return [(float(p[1]), float(p[0])) for p in rc]


def render_overlay(
    img: BenchImage, run: PipelineRun, ref: NDArray[np.bool_], m: Metrics, out: Path
) -> Path:
    """Left: the tour over the dimmed image (jumps red, reference outline green).
    Right: the epicycle reconstruction at N=100 on black."""
    guard_private_path(out, img.private)
    h, w = run.shape
    rgb = load_rgb(img.path, run.shape).astype(np.float32) * 0.35
    left = Image.fromarray(rgb.astype(np.uint8))
    d = ImageDraw.Draw(left)
    lw = max(1, round(max(h, w) / 700))

    boundary = ref & ~ndi.binary_erosion(ref, iterations=lw)
    ov = np.asarray(left).copy()
    ov[boundary] = (0.55 * ov[boundary] + 0.45 * np.array(REF)).astype(np.uint8)
    left = Image.fromarray(ov)
    d = ImageDraw.Draw(left)

    threshold = JUMP_K * m.median_step
    for i, c in enumerate(run.ordered):
        d.line(_xy(to_pixels(c, run.shape)), fill=INK, width=lw + 1)
    for i, gap in enumerate(run.gaps):
        a = run.ordered[i][-1]
        b = run.ordered[(i + 1) % len(run.ordered)][0]
        pts = _xy(to_pixels(np.array([a, b]), run.shape))
        if gap > threshold:
            d.line(pts, fill=JUMP, width=lw + 2)
        else:
            d.line(pts, fill=CONNECTOR, width=lw)
    if run.ordered:
        s = _xy(to_pixels(run.ordered[0][:1], run.shape))[0]
        r0 = 3 * lw + 2
        d.ellipse((s[0] - r0, s[1] - r0, s[0] + r0, s[1] + r0), outline=(255, 255, 255), width=lw)

    right = Image.new("RGB", (w, h), (0, 0, 0))
    if len(run.tour) > 2:
        from fourier_analysis.epicycles import EpicycleChain

        chain = EpicycleChain.from_signal(run.tour, n_harmonics=100)
        trace = chain.evaluate(np.linspace(0, 1, 4000, endpoint=False))
        dr = ImageDraw.Draw(right)
        pts = _xy(to_pixels(np.append(trace, trace[0]), run.shape))
        dr.line(pts, fill=EPI, width=lw + 1)

    band_h = max(18, h // 40)
    canvas = Image.new("RGB", (2 * w, h + band_h), (16, 16, 16))
    canvas.paste(left, (0, band_h))
    canvas.paste(right, (w, band_h))
    text = (
        f"{m.name}  P={m.precision:.3f} R={m.recall:.3f} bg={m.background_fraction:.3f} "
        f"frame={m.frame_fraction:.3f} wig={m.wiggle:.3f} "
        f"n={m.contour_count} jumps={m.jump_count} ({m.jump_length:.0f}px, chords {m.chord_count}) "
        f"epi50/100/200={m.epi_err['50']:.2f}/{m.epi_err['100']:.2f}/{m.epi_err['200']:.2f}%  "
        f"{m.runtime_s:.1f}s   right: N=100"
    )
    ImageDraw.Draw(canvas).text((6, 3), text, fill=(235, 235, 235))
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out)
    return out


# ---------------------------------------------------------------------------
# Privacy guard + driver
# ---------------------------------------------------------------------------


def guard_private_path(p: Path, private: bool) -> None:
    """Private derivatives may only be written under ~/.fourier-samples/."""
    if not private:
        return
    resolved = p.expanduser().resolve()
    root = PRIVATE_ROOT.resolve()
    if resolved != root and root not in resolved.parents:
        raise PermissionError(
            f"refusing to write a private-sample derivative outside {root}: {resolved}"
        )


def bench_image(img: BenchImage, out_dir: Path | None) -> Metrics:
    run = run_pipeline(img.path)
    ref, source = load_reference(img, run.shape)
    m = compute_metrics(img, run, ref, source)
    if out_dir is not None:
        render_overlay(img, run, ref, m, out_dir / f"{img.name}.png")
    return m


def run_bench(
    out_root: Path,
    tag: str,
    include_private: bool = True,
    only: list[str] | None = None,
    overlays: bool = True,
) -> list[Metrics]:
    out_dir = out_root.expanduser() / tag
    images = image_set(include_private)
    if only:
        images = [i for i in images if any(o in i.name for o in only)]
    if any(i.private for i in images):
        guard_private_path(out_dir, True)
    from fourier_analysis.contours.ml import load_subject_sessions

    load_subject_sessions()
    results: list[Metrics] = []
    for img in images:
        results.append(bench_image(img, out_dir if overlays else None))
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "metrics.json").write_text(
        json.dumps({"tag": tag, "images": [m.as_dict() for m in results]}, indent=2)
    )
    return results


def format_table(results: list[Metrics]) -> str:
    head = (
        f"{'image':28} {'P':>5} {'R':>5} {'bg':>5} {'n':>3} {'tour':>7} "
        f"{'jmp':>3} {'jmpLen':>7} {'frame':>5} {'wig':>5} {'e50':>5} {'e100':>5} {'e200':>5} {'sec':>5}"
    )
    rows = [head]
    for m in results:
        rows.append(
            f"{m.name:28} {m.precision:5.3f} {m.recall:5.3f} {m.background_fraction:5.3f} "
            f"{m.contour_count:3d} {m.tour_length:7.0f} {m.jump_count:3d} {m.jump_length:7.0f} "
            f"{m.frame_fraction:5.3f} {m.wiggle:5.3f} "
            f"{m.epi_err['50']:5.2f} {m.epi_err['100']:5.2f} {m.epi_err['200']:5.2f} "
            f"{m.runtime_s:5.1f} "
            + ("PASS" if not bar_failures(m) else f"FAIL {len(bar_failures(m))}")
        )
    return "\n".join(rows)
