"""Subject support: what part of a contour belongs to the subject, and how
strongly an arc is backed by an image edge.

Contours here are raw marching-squares traces, ``(N, 2)`` arrays of
``(row, col)`` pixel coordinates; a closed trace repeats its first point last.

- :func:`subject_band` — the subject mask dilated by the bench bar's own
  boundary tolerance (1% of the image diagonal, at least 3 px).
- :func:`clip_to_subject` — cut a contour to its runs inside that band.  A
  contour is never kept or dropped whole by a majority vote: the off-subject
  part is removed and the on-subject part survives as open strokes.
- :func:`normalise_to_subject` — scale a field by its subject-pixel percentile
  rather than the global maximum, so a bright background edge cannot set the
  scale.
- :func:`subject_edge_field` — edge magnitude weighted by soft saliency, scaled
  to the subject.
- :func:`structure_gradient` / :func:`structure_edge_field` — the same edge
  seen at the *structure scale*: the CIELAB gradient after a Gaussian of
  ``STRUCTURE_SCALE_BANDS`` band half-widths.  Texture (fur, hair strands,
  engraving hatching, knit) is finer than that scale and averages away; the
  boundaries between regions (a face's outline against hair, a hairline, a
  brow, a jaw's shadow, a collar) survive it.
- :func:`arc_support` — the median of a subject-normalised edge field along an
  arc: near 0 for an iso-intensity line across a smooth region, near 1 for a
  line that follows a real edge.
- :func:`support_floor` — the relative bar a stroke must meet: a fraction of
  the silhouette's own median support in the same field, so the bar is
  normalised per image rather than a tuned absolute constant.
- :func:`supported_runs` — split an arc into its edge-supported runs: an
  iso-line that follows the jaw for a while and then wanders across a cheek
  keeps the jaw and loses the cheek.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray
from scipy import ndimage as ndi

from fourier_analysis.contours.image import LoadedImage

# The bench bar's boundary tolerance: 1% of the image diagonal, at least 3 px.
BAND_FRACTION = 0.01
MIN_BAND_PX = 3.0
# A stroke with more than this fraction of its length within the band of
# already-drawn ink repeats it (see ``InkCoverage``).
REDUNDANT_OVERLAP = 0.5
# Ink within this many px of the image frame is frame, not subject: a mask or
# iso-line edge that close to the border runs along it.
FRAME_MARGIN_PX = 3.0
# Edge fields are scaled by this subject-pixel percentile.
SUBJECT_PERCENTILE = 95.0
# The structure scale, in subject-band half-widths (see ``structure_gradient``).
STRUCTURE_SCALE_BANDS = 0.5
# CIELAB from the [0, 1]-scaled channels ``LoadedImage.lab`` holds: one unit
# of every channel is then one unit of colour difference (Delta E 1976).
_LAB_SCALE = (100.0, 256.0, 256.0)
# A kept stroke's support is at least this fraction of the silhouette's median
# support in the same field (see ``support_floor``).
RELATIVE_SUPPORT = 0.6


def band_px(shape: tuple[int, int]) -> float:
    """The subject band's half-width for an image of ``shape``."""
    return max(MIN_BAND_PX, BAND_FRACTION * float(np.hypot(*shape)))


def on_frame(rc: NDArray[np.floating], shape: tuple[int, int]) -> NDArray[np.bool_]:
    """Which ``(row, col)`` points lie within ``FRAME_MARGIN_PX`` of the frame."""
    h, w = shape
    m = FRAME_MARGIN_PX
    return (rc[:, 0] < m) | (rc[:, 0] > h - 1 - m) | (rc[:, 1] < m) | (rc[:, 1] > w - 1 - m)


def subject_band(mask: NDArray[np.bool_]) -> NDArray[np.bool_]:
    """The mask dilated by :func:`band_px` (a Euclidean distance band), less the
    frame margin: the frame is never subject ink."""
    if not np.any(mask):
        return np.zeros_like(mask, dtype=bool)
    band = ndi.distance_transform_edt(~mask) <= band_px(mask.shape)
    m = int(np.ceil(FRAME_MARGIN_PX))
    band[:m] = band[-m:] = False
    band[:, :m] = band[:, -m:] = False
    return np.asarray(band, dtype=bool)


def _sample(field: NDArray, rc: NDArray[np.floating]) -> NDArray:
    """Nearest-pixel samples of ``field`` at ``(row, col)`` points."""
    r = np.clip(np.rint(rc[:, 0]).astype(int), 0, field.shape[0] - 1)
    c = np.clip(np.rint(rc[:, 1]).astype(int), 0, field.shape[1] - 1)
    return field[r, c]


def _run_length(rc: NDArray[np.floating]) -> float:
    return float(np.hypot(*np.diff(rc, axis=0).T).sum()) if len(rc) > 1 else 0.0


def is_closed_trace(rc: NDArray[np.floating]) -> bool:
    """Marching squares closed this trace (its first point repeats last)."""
    return len(rc) > 2 and bool(np.array_equal(rc[0], rc[-1]))


def clip_to_subject(
    rc: NDArray[np.floating],
    band: NDArray[np.bool_],
    min_run_px: float,
) -> list[NDArray[np.floating]]:
    """The runs of ``rc`` that lie inside ``band``, each at least ``min_run_px`` long.

    A trace entirely inside comes back unchanged (a closed loop stays closed).
    Otherwise every maximal inside run is returned as an open stroke; for a
    closed trace the run that crosses its seam is joined across it.
    """
    if len(rc) < 2:
        return []
    inside = _sample(band, rc)
    if inside.all():
        return [rc]
    if not inside.any():
        return []

    closed = is_closed_trace(rc)
    pts, flags = (rc[:-1], inside[:-1]) if closed else (rc, inside)
    if closed:
        # Start at an outside point so no inside run wraps the seam.
        start = int(np.flatnonzero(~flags)[0])
        pts = np.roll(pts, -start, axis=0)
        flags = np.roll(flags, -start)

    padded = np.concatenate([[False], flags, [False]]).astype(np.int8)
    edges = np.diff(padded)
    starts = np.flatnonzero(edges == 1)
    ends = np.flatnonzero(edges == -1)
    runs = [pts[s:e] for s, e in zip(starts, ends)]
    return [r for r in runs if len(r) >= 2 and _run_length(r) >= min_run_px]


def normalise_to_subject(
    field: NDArray[np.floating],
    mask: NDArray[np.bool_] | None,
    percentile: float = SUBJECT_PERCENTILE,
) -> NDArray[np.float64]:
    """``field`` divided by its ``percentile`` over the subject's pixels.

    Falls back to the whole image when there is no subject, and to the maximum
    when the percentile is zero (a subject with almost no edges).
    """
    field = np.asarray(field, dtype=np.float64)
    pixels = field[mask] if mask is not None and np.any(mask) else field.ravel()
    scale = float(np.percentile(pixels, percentile)) if pixels.size else 0.0
    if scale <= 1e-12:
        scale = float(field.max())
    return field / scale if scale > 1e-12 else np.zeros_like(field)


def subject_edge_field(
    edge: NDArray[np.floating],
    saliency: NDArray[np.floating],
    mask: NDArray[np.bool_] | None,
) -> NDArray[np.float64]:
    """Edge magnitude weighted by soft saliency, scaled to the subject's percentile."""
    weighted = np.asarray(edge, dtype=np.float64) * np.clip(saliency, 0.0, 1.0)
    return normalise_to_subject(weighted, mask)


def structure_gradient(
    image: LoadedImage,
) -> tuple[NDArray[np.float64], NDArray[np.float64], NDArray[np.float64]]:
    """The structure-scale edge: ``(magnitude, d/drow, d/dcol)``.

    Each CIELAB channel (the grey image when there is no colour) is smoothed
    by a Gaussian of ``STRUCTURE_SCALE_BANDS`` band half-widths and
    differentiated; every pixel takes the channel with the largest gradient,
    with that channel's direction (for non-maximum suppression).
    """
    shape = image.grayscale.shape
    sigma = STRUCTURE_SCALE_BANDS * band_px(shape)
    if image.lab is not None:
        channels = [image.lab[:, :, k] * _LAB_SCALE[k] for k in range(3)]
    else:
        channels = [np.asarray(image.grayscale, dtype=np.float64) * _LAB_SCALE[0]]
    mag = np.zeros(shape)
    gr = np.zeros(shape)
    gc = np.zeros(shape)
    for ch in channels:
        smooth = ndi.gaussian_filter(ch, sigma)
        dr, dc = ndi.sobel(smooth, axis=0), ndi.sobel(smooth, axis=1)
        m = np.hypot(dr, dc)
        stronger = m > mag
        mag = np.where(stronger, m, mag)
        gr = np.where(stronger, dr, gr)
        gc = np.where(stronger, dc, gc)
    return mag, gr, gc


def structure_edge_field(
    image: LoadedImage,
    saliency: NDArray[np.floating],
    mask: NDArray[np.bool_] | None,
) -> NDArray[np.float64]:
    """:func:`subject_edge_field` of the structure-scale gradient."""
    return subject_edge_field(structure_gradient(image)[0], saliency, mask)


def densify(rc: NDArray[np.floating], step: float = 1.0) -> NDArray[np.float64]:
    """Resample a ``(row, col)`` polyline at about ``step`` px along its length."""
    rc = np.asarray(rc, dtype=np.float64)
    if len(rc) < 2:
        return rc
    seg = np.hypot(*np.diff(rc, axis=0).T)
    s = np.concatenate([[0.0], np.cumsum(seg)])
    if s[-1] <= 0:
        return rc[:1]
    t = np.linspace(0.0, s[-1], max(2, int(np.ceil(s[-1] / step)) + 1))
    return np.column_stack([np.interp(t, s, rc[:, 0]), np.interp(t, s, rc[:, 1])])


def arc_support(rc: NDArray[np.floating], field: NDArray[np.floating]) -> float:
    """Median of a subject-normalised edge field along the arc ``rc``, sampled
    evenly by length (a simplified polyline's vertices are not even); 0 for an
    empty arc."""
    if len(rc) == 0:
        return 0.0
    return float(np.median(_sample(field, densify(rc))))


def complex_to_rc(z: NDArray[np.complex128], shape: tuple[int, int]) -> NDArray[np.float64]:
    """Centred complex contour coordinates (y up) -> ``(row, col)`` pixels."""
    cy, cx = shape[0] / 2, shape[1] / 2
    return np.column_stack([cy - z.imag, z.real + cx])


class InkCoverage:
    """The ink already drawn, for asking how much of a new stroke repeats it.

    A stroke is redundant when most of it lies within ``radius`` px of drawn
    ink: it adds nothing a viewer can see (a parallel iso-line hugging the
    silhouette, a second trace of the same edge).  Works in the contours'
    centred complex coordinates.
    """

    def __init__(self, radius: float) -> None:
        self.radius = radius
        self._points: list[NDArray[np.float64]] = []
        self._tree = None

    @staticmethod
    def _samples(z: NDArray[np.complex128]) -> NDArray[np.float64]:
        return densify(np.column_stack([z.real, z.imag]))

    def add(self, z: NDArray[np.complex128]) -> None:
        self._points.append(self._samples(z))
        self._tree = None

    def overlap(self, z: NDArray[np.complex128]) -> float:
        """Fraction of ``z`` (by length) within ``radius`` of drawn ink."""
        if not self._points or len(z) < 2:
            return 0.0
        if self._tree is None:
            from scipy.spatial import cKDTree

            self._tree = cKDTree(np.concatenate(self._points))
        dist, _ = self._tree.query(self._samples(z), distance_upper_bound=self.radius)
        return float(np.mean(np.isfinite(dist)))


def band_window(band: NDArray[np.bool_] | None, shape: tuple[int, int]) -> tuple[slice, slice]:
    """The band's bounding box grown by one pixel (clamped to the image).

    Tracing iso-lines only inside this window finds every run
    :func:`clip_to_subject` would keep, at a fraction of the cost: the window's
    one-pixel rim is off the band, so a trace cut there is cut off-subject.
    """
    if band is None or not band.any():
        return slice(0, shape[0]), slice(0, shape[1])
    rows = np.flatnonzero(band.any(axis=1))
    cols = np.flatnonzero(band.any(axis=0))
    return (
        slice(max(0, int(rows[0]) - 1), min(shape[0], int(rows[-1]) + 2)),
        slice(max(0, int(cols[0]) - 1), min(shape[1], int(cols[-1]) + 2)),
    )


def silhouette_support(
    silhouettes: tuple[NDArray[np.complex128], ...] | list[NDArray[np.complex128]],
    field: NDArray[np.floating],
) -> float:
    """Median of ``field`` along every silhouette together, sampled by length;
    0 when there is no silhouette."""
    shape = field.shape
    samples = [
        _sample(field, densify(complex_to_rc(z, shape))) for z in silhouettes if len(z) > 1
    ]
    return float(np.median(np.concatenate(samples))) if samples else 0.0


def support_floor(
    silhouettes: tuple[NDArray[np.complex128], ...] | list[NDArray[np.complex128]],
    field: NDArray[np.floating],
    fraction: float = RELATIVE_SUPPORT,
) -> float:
    """The support a stroke must reach: ``fraction`` of the silhouette's median
    support in ``field``.  Without a silhouette the subject has no edge of its
    own to measure against, and the floor is the field's subject scale (1.0 for
    a subject-normalised field) times ``fraction``."""
    reference = silhouette_support(silhouettes, field)
    return fraction * (reference if reference > 0 else 1.0)


def supported_runs(
    rc: NDArray[np.floating],
    field: NDArray[np.floating],
    floor: float,
    min_run_px: float,
    window_px: float | None = None,
) -> list[NDArray[np.float64]]:
    """The spans of ``rc`` an edge supports, each at least ``min_run_px`` long.

    The trace is resampled at 1 px and ``field`` sampled along it; the samples
    are median-filtered over ``window_px`` (default: the subject band's width,
    so a pixel-scale dip in an edge does not split it) and every maximal span
    at or above ``floor`` is a candidate.  A span whose own median support
    (:func:`arc_support`) is below ``floor`` is dropped.  A closed trace whose
    every span is supported comes back closed; otherwise the runs are open
    (the one across the seam is joined).
    """
    rc = np.asarray(rc, dtype=np.float64)
    if len(rc) < 2:
        return []
    closed = is_closed_trace(rc)
    dense = densify(rc)
    if closed and len(dense) > 2:
        dense = dense[:-1]
    raw = _sample(field, dense)
    size = max(1, int(round(window_px if window_px is not None else band_px(field.shape))))
    size += 1 - size % 2
    smooth = ndi.median_filter(raw, size=min(size, len(raw)) or 1, mode="wrap" if closed else "nearest")
    flags = smooth >= floor
    if flags.all():
        whole = np.vstack([dense, dense[:1]]) if closed else dense
        return [whole] if arc_support(whole, field) >= floor and _run_length(whole) >= min_run_px else []
    if not flags.any():
        return []
    pts = dense
    if closed:
        start = int(np.flatnonzero(~flags)[0])
        pts = np.roll(pts, -start, axis=0)
        flags = np.roll(flags, -start)
    padded = np.diff(np.concatenate([[0], flags.astype(np.int8), [0]]))
    runs = [pts[a:b] for a, b in zip(np.flatnonzero(padded == 1), np.flatnonzero(padded == -1))]
    return [
        r for r in runs
        if len(r) >= 2 and _run_length(r) >= min_run_px and arc_support(r, field) >= floor
    ]
