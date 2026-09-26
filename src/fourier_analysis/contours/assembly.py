"""Stage 4: greedy marginal-value selection of the strokes the tour draws.

The silhouettes (the subject mask's true boundary, CT-3) are always drawn and
are chosen first.  Every other candidate — the edge-supported structure runs
(CT-5) and feature ridges (CT-6) — competes on one scale, its *marginal gain*
given the strokes already chosen::

    gain = coverage x support x share x clean - connector

- ``coverage``: the new ink the stroke adds — its length lying farther than
  the subject band's half-width ``r`` from every chosen stroke — taken as the
  geometric mean ``sqrt(new_ink * r)`` with the band: coverage has
  diminishing returns, so a short defining stroke (an eye, a nostril) is not
  outranked by a long one merely for its length.  It only shrinks as the
  selection grows.
- ``support``: how strongly an edge backs the stroke — its median
  subject-normalised edge strength (``arc_support`` in ``subject_edge_field``)
  times its median *local contrast*, the edge over its own surround (the field
  Gaussian-averaged over ``SURROUND_BANDS`` band widths).  A defining line
  stands out from what is around it; a hatching or fur line sits in a field of
  equal edges and scores near 1.
- ``share``: the fraction of the stroke on the subject mask.
- ``clean``: ``exp(-w / WIGGLE_SCALE)``, where ``w`` is the length the stroke
  loses *to jags* under a ``WIGGLE_SIGMA_PX`` arc-length Gaussian (the
  staircase / spur measure the bench bar reads, less the share every pass
  takes from curvature, see ``stroke_wiggle``).  Jagged iso-texture scribble
  scores near 0; a small round eyelid or a short straight stroke does not.
- ``connector``: the stroke's minimum point distance to the chosen set — the
  metric the tour's spanning tree (``shortest_tour``) joins it by — beyond
  ``r`` (a stroke touching drawn ink costs nothing).  A stroke opens its
  neighbourhood: every live stroke nearer to it than it is to the drawing
  would join the tree through it, so it pays the connector only in proportion
  to its share of that group's value.  A cluster of small features (eyes,
  nose, mouth) far from the silhouette is reachable; a lone far stroke is not.

Selection is greedy: the best candidate is taken and the rest re-scored, until
the best remaining gain falls below ``STOP_FRACTION`` of the first
non-silhouette pick's gain.  ``max_contours`` is a ceiling, not a target.  The
recorded gain of each pick is the level the greedy admitted it at: the running
minimum of the best gains (a pick that shortens another stroke's connector can
raise that stroke's gain; it is admitted at the level of the pick that
unlocked it), so the curve the stop reads is non-increasing.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray
from scipy import ndimage as ndi
from scipy.spatial import cKDTree

from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.isolation import SubjectIsolation
from fourier_analysis.contours.support import (
    _sample,
    arc_support,
    band_px,
    complex_to_rc,
    densify,
    subject_edge_field,
)

# The greedy stops when the best remaining gain falls below this fraction of
# the first non-silhouette pick's gain.
STOP_FRACTION = 0.05
# Local contrast: an edge over its surround, averaged over this many band widths.
SURROUND_BANDS = 4.0
# The staircase measure: length lost under a Gaussian of this many px along
# the arc (the bench's wiggle scale), and the loss that costs a factor of e.
WIGGLE_SIGMA_PX = 4.0
WIGGLE_SCALE = 0.05
# Connector sharing looks this many band widths around each stroke.
NEIGHBOUR_BANDS = 8.0


@dataclass(frozen=True)
class StrokeSelection:
    """The chosen strokes (silhouettes first) and each non-silhouette pick's gain."""

    contours: list[NDArray[np.complex128]]
    silhouette_count: int
    gains: tuple[float, ...]


def select_strokes(
    isolation: SubjectIsolation,
    candidates: list[tuple[NDArray[np.complex128], float]],
    max_contours: int | None,
    image: LoadedImage,
) -> StrokeSelection:
    """The silhouettes, then greedy marginal-value picks from ``candidates``.

    See the module docstring.  ``candidates`` are ``(contour, area)`` pairs in
    centred complex coordinates, in any order.  ``max_contours`` (``None``: no
    ceiling) bounds the total, silhouettes included; the silhouettes are never
    dropped.
    """
    shape = image.grayscale.shape
    radius = band_px(shape)
    chosen = [np.asarray(s, dtype=np.complex128) for s in isolation.silhouettes]
    n_sil = len(chosen)
    zs = [np.asarray(c, dtype=np.complex128) for c, _ in candidates if len(c) > 1]
    ceiling = max_contours if max_contours is not None else n_sil + len(zs)
    remaining = max(0, ceiling - n_sil)
    if remaining == 0 or not zs:
        return StrokeSelection(chosen, n_sil, ())

    weight = _stroke_weights(zs, isolation, image, radius)

    # All candidate samples (~1 px apart) with their owner and arc length, and
    # each sample's running state against the drawing: covered (within the
    # band of drawn ink) and its distance to drawn ink.
    pts = [_samples(z) for z in zs]
    n = len(zs)
    owner = np.concatenate([np.full(len(p), i) for i, p in enumerate(pts)])
    flat = np.concatenate(pts)
    step = np.concatenate([_step_lengths(p) for p in pts])
    covered = np.zeros(len(flat), dtype=bool)
    nearest = np.full(len(flat), np.inf)

    def draw(z: NDArray[np.complex128]) -> None:
        dist, _ = cKDTree(_samples(z)).query(flat)
        np.minimum(nearest, dist, out=nearest)
        covered[:] |= dist <= radius

    for s in chosen:
        draw(s)
    pair = _pair_distances(flat, owner, n, NEIGHBOUR_BANDS * radius)
    np.fill_diagonal(pair, np.inf)

    alive = np.ones(n, dtype=bool)
    gains: list[float] = []
    first: float | None = None
    while alive.any() and len(gains) < remaining:
        new_ink = np.bincount(owner, weights=step * ~covered, minlength=n)
        own = np.sqrt(new_ink * radius) * weight
        gain = own - _shared_connector(own, owner, nearest, pair, alive, radius, bool(chosen))
        gain[~alive] = -np.inf
        best = int(np.argmax(gain))
        level = float(gain[best]) if not gains else min(gains[-1], float(gain[best]))
        if first is None:
            first = level
        if level <= 0 or level < STOP_FRACTION * first:
            break
        gains.append(level)
        chosen.append(zs[best])
        alive[best] = False
        draw(zs[best])

    return StrokeSelection(chosen, n_sil, tuple(gains))


def assemble_contours(
    isolation: SubjectIsolation,
    candidates: list[tuple[NDArray[np.complex128], float]],
    max_contours: int | None,
    image: LoadedImage,
) -> list[NDArray[np.complex128]]:
    """The strokes :func:`select_strokes` chooses, silhouettes first."""
    return select_strokes(isolation, candidates, max_contours, image).contours


def _stroke_weights(
    zs: list[NDArray[np.complex128]],
    isolation: SubjectIsolation,
    image: LoadedImage,
    radius: float,
) -> NDArray[np.float64]:
    """Each stroke's fixed weight: support x local contrast x share x clean."""
    shape = image.grayscale.shape
    field = subject_edge_field(image.color_gradient, isolation.saliency_map, isolation.subject_mask)
    surround = ndi.gaussian_filter(field, SURROUND_BANDS * radius)
    contrast = field / np.maximum(surround, 1e-6)
    mask = isolation.subject_mask
    member = mask if mask is not None and mask.any() else np.ones(shape, dtype=bool)
    weight = np.empty(len(zs))
    for i, z in enumerate(zs):
        rc = complex_to_rc(z, shape)
        support = arc_support(rc, field) * arc_support(rc, contrast)
        share = float(np.mean(_sample(member, rc)))
        clean = float(np.exp(-stroke_wiggle(z) / WIGGLE_SCALE))
        weight[i] = support * share * clean
    return weight


def _shared_connector(
    own: NDArray[np.float64],
    owner: NDArray[np.int_],
    nearest: NDArray[np.float64],
    pair: NDArray[np.float64],
    alive: NDArray[np.bool_],
    radius: float,
    anything_drawn: bool,
) -> NDArray[np.float64]:
    """Each stroke's connector beyond the band, shared with the live strokes
    nearer to it than it is to the drawing, in proportion to value."""
    n = len(own)
    if not anything_drawn:
        return np.zeros(n)
    gap = np.full(n, np.inf)
    np.minimum.at(gap, owner, nearest)
    connector = np.maximum(0.0, gap - radius)
    near = (pair < gap[:, None]) & alive[None, :]
    group = own + near.astype(np.float64) @ np.maximum(own, 0.0)
    share = np.where(group > 0, own / np.maximum(group, 1e-12), 1.0)
    return connector * np.clip(share, 0.0, 1.0)


def _pair_distances(
    flat: NDArray[np.float64],
    owner: NDArray[np.int_],
    n: int,
    reach: float,
) -> NDArray[np.float64]:
    """Minimum distance between every pair of strokes (``inf`` beyond ``reach``)."""
    out = np.full((n, n), np.inf)
    tree = cKDTree(flat)
    pairs = tree.sparse_distance_matrix(tree, reach, output_type="ndarray")
    np.minimum.at(out, (owner[pairs["i"]], owner[pairs["j"]]), pairs["v"])
    return out


def stroke_wiggle(z: NDArray[np.complex128], sigma: float = WIGGLE_SIGMA_PX) -> float:
    """The arc length a stroke loses to jaggedness under a ``sigma`` px
    arc-length Gaussian: near 0 for a clean stroke, large for staircase,
    spurs or scribble.

    Smoothing shortens a curve for two reasons: jags (staircase, spurs,
    scribble), which the first pass removes, and curvature, which every pass
    shortens by about the same fraction (``sigma**2 / 2R**2`` for radius R).
    The measure is the first pass's fractional loss less the second's, so a
    small round feature (an eyelid, a lens) is not scored as jagged for being
    round, and an open stroke's ends are point-reflected so it is not scored
    as jagged for being short.
    """
    p = _samples(z)
    if len(p) < 4:
        return 0.0
    closed = bool(np.allclose(p[0], p[-1]))
    q = p[:-1] if closed else p
    once = _smooth_stroke(q, sigma, closed)
    twice = _smooth_stroke(once, sigma, closed)
    lengths = [_stroke_length(x, closed) for x in (q, once, twice)]
    if lengths[0] <= 0 or lengths[1] <= 0:
        return 0.0
    first = 1.0 - lengths[1] / lengths[0]
    second = 1.0 - lengths[2] / lengths[1]
    return max(0.0, first - max(0.0, second))


def _smooth_stroke(q: NDArray[np.float64], sigma: float, closed: bool) -> NDArray[np.float64]:
    """Gaussian along the stroke's samples: periodic when closed; an open
    stroke's ends point-reflected (``x[-k] = 2 x[0] - x[k]``), so a straight
    end stays put (edge padding would pull both ends in by about 0.4 sigma)."""
    if closed:
        return ndi.gaussian_filter1d(q, sigma, axis=0, mode="wrap")
    k = min(len(q) - 1, int(np.ceil(4 * sigma)))
    padded = np.vstack([2 * q[0] - q[k:0:-1], q, 2 * q[-1] - q[-2 : -k - 2 : -1]])
    return ndi.gaussian_filter1d(padded, sigma, axis=0, mode="nearest")[k : k + len(q)]


def _stroke_length(q: NDArray[np.float64], closed: bool) -> float:
    pts = np.vstack([q, q[:1]]) if closed else q
    return float(np.hypot(*np.diff(pts, axis=0).T).sum())


def _samples(z: NDArray[np.complex128]) -> NDArray[np.float64]:
    """A stroke as ``(x, y)`` points about 1 px apart (centred coordinates)."""
    return densify(np.column_stack([z.real, z.imag]))


def _step_lengths(p: NDArray[np.float64]) -> NDArray[np.float64]:
    """Arc length each sample stands for (half of each adjoining segment)."""
    if len(p) < 2:
        return np.zeros(len(p))
    seg = np.hypot(*np.diff(p, axis=0).T)
    out = np.zeros(len(p))
    out[:-1] += seg / 2
    out[1:] += seg / 2
    return out
