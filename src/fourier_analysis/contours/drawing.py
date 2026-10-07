"""The drawing: every line source composed into one stroke graph.

Layers, in priority order (``strokes.SILHOUETTE`` < ``PARTS`` < ``LINES``):

1. **The silhouette**: the subject mask's edge (``isolation.subject_mask``),
   cut to the person where a face is confirmed (``contours.person``).
2. **Part boundaries**: where the face parser's parts meet (``parts``): the
   jaw, the brows, the lids and irises, the nose, the lips.  Both come from
   one label map as crack chains (``strokes.boundary_graph``).
3. **Learned lines** (``lines.persistent_lines``): the line drawing, where
   it persists across two scales, under the subject and off the face core
   (the parser draws the face in full).  It is what draws a faceless
   subject's interior and the hair and clothes around a face.

A later layer's ink within ``SUPPRESS_FRACTION`` of the diagonal (half the
bench's boundary tolerance) of earlier ink repeats it and is dropped before
it is vectorised, so the line model never doubles a parser boundary or the
silhouette; a vectorised line that still runs beside earlier ink along most of
its length (``DOUBLE_FRACTION`` within ``DOUBLE_REACH_FRACTION``) is the same
edge drawn twice, a little off, and goes too.  Line ends that point at other
ink are bridged to it (``strokes.bridge_gaps``), so junctions are shared
vertices and the tour sees one graph.  The line layer is then pruned to an
ink budget coarse to fine (``strokes.prune_to_budget``), the silhouette and
part boundaries protected.  All scales are fractions of the image diagonal or
the drawing's own measured line width.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray
from scipy import ndimage as ndi
from scipy.spatial import cKDTree

from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.isolation import subject_mask
from fourier_analysis.contours.lines import persistent_lines, soft_alpha
from fourier_analysis.contours.models import ContourConfig
from fourier_analysis.contours.parts import Face, part_labels
from fourier_analysis.contours.strokes import (
    LINES,
    Edge,
    StrokeGraph,
    boundary_graph,
    bridge_gaps,
    compact,
    dissolve_degree_two,
    edge_length,
    line_width,
    prune_to_budget,
    rasterize,
    smooth_edges,
    uniform,
    vectorise,
)

INK_LEVEL = 0.5
"""Line strength at which the drawing is ink."""
SUPPRESS_FRACTION = 0.005
"""Later-layer ink this close (of the diagonal) to earlier ink is a repeat."""
DOUBLE_REACH_FRACTION = 0.01
DOUBLE_FRACTION = 0.8
SUBJECT_MARGIN_WIDTHS = 2.0
"""Line ink this many line widths off the subject mask is background."""
BRIDGE_WIDTHS = 6.0
"""Gaps up to this many line widths are bridged when a stroke end points across."""
INK_BUDGET_DIAGONALS = 8.0
"""The drawing's ink budget: 1024 tour samples and a few hundred harmonics
carry a drawing about this long."""
MIN_PART_FRACTION = 0.03
"""A separate part of the line layer shorter than this (of the diagonal) is a fleck."""
DENSITY_FRACTION = 0.015
"""Strokes are counted side by side over this fraction of the diagonal: the
cell size of a texture's mesh (fur, hatching, crackle), not a line's width."""
WIGGLE_WIDTHS = 3.0
CONTRAST_DELTA_E = 20.0
"""A line the image marks by this colour difference (CIE76 delta E: ink on
paper, a seam, an eye against fleece) stands out of any mesh around it; the
crease of a fur or hatching texture marks far less."""
FRAME_PX = 3


@dataclass(frozen=True)
class Drawing:
    graph: StrokeGraph
    subject: NDArray[np.bool_]  # the mask the silhouette was drawn on
    source: str
    faces: tuple[Face, ...]

    @property
    def shape(self) -> tuple[int, int]:
        return self.subject.shape

    @property
    def strokes(self) -> list[NDArray[np.complex128]]:
        return self.graph.polylines(self.shape)


def draw_subject(image: LoadedImage, config: ContourConfig) -> Drawing | None:
    """The subject's drawing as a stroke graph (module docstring); ``None``
    when there is no subject."""
    shape = image.grayscale.shape
    mask, saliency = subject_mask(image, config)
    if not mask.any():
        return None
    parts = part_labels(image, mask)
    mask = parts.subject
    base = boundary_graph(parts.labels, parts.drawn)
    diag = float(np.hypot(*shape))

    strength = persistent_lines(image, soft_alpha(saliency, mask))
    ink = strength >= INK_LEVEL
    width = line_width(ink)
    ink &= line_region(mask, parts.face_core, width)
    earlier = rasterize(base, shape)
    if earlier.any():
        ink &= ndi.distance_transform_edt(~earlier) > SUPPRESS_FRACTION * diag
    lines = vectorise(ink, width, bridge=BRIDGE_WIDTHS * width)
    lines = drop_doubles(lines, earlier, DOUBLE_REACH_FRACTION * diag)

    graph = bridge_gaps(base.merged(lines), BRIDGE_WIDTHS * width)
    graph = smooth_edges(graph, max(1.5, width))
    graph = drop_line_flecks(graph, MIN_PART_FRACTION * diag)
    sigma = DENSITY_FRACTION * diag
    lab = cielab(image)
    density = stroke_density(graph, shape, sigma)
    # Keyed by the stroke's point array, which the entry keeps alive so its
    # id is never reused by a later stroke.
    cache: dict[int, tuple[NDArray[np.float64], float]] = {}

    def salience(e: Edge) -> float:
        if e.layer != LINES:
            return np.inf
        hit = cache.get(id(e.pts))
        if hit is None or hit[0] is not e.pts:
            r, c = _pixels(e.pts, shape)
            others = max(0.0, float(density[r, c].mean()) - self_density(e.pts, sigma))
            marked = min(1.0, line_contrast(e.pts, lab, width) / CONTRAST_DELTA_E)
            weight = straightness(e.pts, WIGGLE_WIDTHS * width) ** 2 / (1.0 + others * (1.0 - marked))
            hit = cache[id(e.pts)] = (e.pts, e.length * weight)
        return hit[1]

    graph = prune_to_budget(graph, INK_BUDGET_DIAGONALS * diag, salience, floor=MIN_PART_FRACTION * diag)
    graph = drop_line_flecks(graph, MIN_PART_FRACTION * diag)
    return Drawing(graph, mask, parts.source, parts.faces)


def line_region(mask: NDArray[np.bool_], face_core: NDArray[np.bool_], width: float) -> NDArray[np.bool_]:
    """Where learned lines may be drawn: on the subject (grown by
    ``SUBJECT_MARGIN_WIDTHS``: the outline sits on the mask's edge), off the
    face core the parser draws, off the frame."""
    region = ndi.distance_transform_edt(~mask) <= SUBJECT_MARGIN_WIDTHS * width
    if face_core.any():
        region &= ~ndi.binary_dilation(face_core, iterations=max(1, int(round(width))))
    region[:FRAME_PX] = region[-FRAME_PX:] = False
    region[:, :FRAME_PX] = region[:, -FRAME_PX:] = False
    return region


def drop_doubles(lines: StrokeGraph, earlier: NDArray[np.bool_], reach: float) -> StrokeGraph:
    """Drop a line that runs within ``reach`` of earlier ink along
    ``DOUBLE_FRACTION`` of its length: the same edge drawn a second time."""
    if not lines.edges or not earlier.any():
        return lines
    near = ndi.distance_transform_edt(~earlier) <= reach
    keep = []
    for k, e in enumerate(lines.edges):
        r, c = _pixels(e.pts, earlier.shape)
        if near[r, c].mean() < DOUBLE_FRACTION:
            keep.append(k)
    return dissolve_degree_two(lines.subgraph(keep))


def drop_line_flecks(graph: StrokeGraph, min_length: float) -> StrokeGraph:
    """Drop a component made only of learned lines that is shorter than
    ``min_length``, or shorter than its distance to the rest of the drawing
    (the pen would jump further to it than it draws there).  An isolated
    feature that draws more than its gap (a pupil in a face, an eye on a
    flank) is kept: it is worth its two connectors."""
    while True:
        parts = graph.components()
        if len(parts) <= 1:
            return graph
        only_lines = [all(graph.edges[k].layer == LINES for k in p) for p in parts]
        lengths = [sum(graph.edges[k].length for k in p) for p in parts]
        pts = [np.vstack([graph.edges[k].pts for k in p]) for p in parts]
        trees = [cKDTree(p) for p in pts]
        worst, worst_len = -1, np.inf
        for i, p in enumerate(parts):
            if not only_lines[i]:
                continue
            gap = min(float(trees[j].query(pts[i])[0].min()) for j in range(len(parts)) if j != i)
            if (lengths[i] < min_length or lengths[i] < gap) and lengths[i] < worst_len:
                worst, worst_len = i, lengths[i]
        if worst < 0:
            return graph
        keep = [k for i, p in enumerate(parts) if i != worst for k in p]
        graph = compact(StrokeGraph(graph.nodes, [graph.edges[k] for k in sorted(keep)]))


def stroke_density(graph: StrokeGraph, shape: tuple[int, int], sigma: float) -> NDArray[np.float64]:
    """How many strokes run side by side around each pixel at the scale
    ``sigma``: 1 along a lone line, several in the mesh a texture's edges
    make (fur, hatching).  A line in texture says little on its own; a lone
    line says a lot."""
    canvas = rasterize(graph, shape).astype(np.float64)
    return ndi.gaussian_filter(canvas, sigma) * np.sqrt(2.0 * np.pi) * sigma


def cielab(image: LoadedImage) -> NDArray[np.float64]:
    """The image in CIELAB units (L 0..100, a and b about -128..128), lightly
    blurred so a line's colour is read over its width, not one pixel."""
    assert image.lab is not None
    lab = np.empty_like(image.lab)
    lab[..., 0] = image.lab[..., 0] * 100.0
    lab[..., 1:] = image.lab[..., 1:] * 256.0 - 128.0
    return ndi.gaussian_filter(lab, (1.0, 1.0, 0.0))


def line_contrast(p: NDArray[np.float64], lab: NDArray[np.float64], width: float) -> float:
    """How strongly the image marks a stroke: the median, along it, of the
    larger of the colour step across it (an edge) and the colour difference
    between the stroke and its two sides (a line), each read a few line widths
    out and at the best placement within a line width (a vectorised line sits
    a pixel or two off the image's own)."""
    q = uniform(p, 2.0)
    if len(q) < 2:
        return 0.0
    t = np.gradient(q, axis=0)
    t /= np.maximum(np.hypot(t[:, 0], t[:, 1]), 1e-9)[:, None]
    n = np.column_stack([-t[:, 1], t[:, 0]])
    reach = 2.0 * width
    h, w = lab.shape[:2]

    def at(x: NDArray[np.float64]) -> NDArray[np.float64]:
        r = np.clip(np.round(x[:, 0]).astype(int), 0, h - 1)
        c = np.clip(np.round(x[:, 1]).astype(int), 0, w - 1)
        return lab[r, c]

    best = np.zeros(len(q))
    for o in np.arange(-np.ceil(width), np.ceil(width) + 1):
        m = q + o * n
        left, mid, right = at(m - reach * n), at(m), at(m + reach * n)
        edge = np.linalg.norm(left - right, axis=1)
        line = np.linalg.norm(mid - 0.5 * (left + right), axis=1)
        best = np.maximum(best, np.maximum(edge, line))
    return float(np.median(best))


def self_density(p: NDArray[np.float64], sigma: float) -> float:
    """A stroke's own share of ``stroke_density`` along it (1 for a straight
    line, more where it bends back on itself), so a small closed loop (an eye)
    is not read as a mesh of its own."""
    q = uniform(p, max(1.0, sigma / 4.0))
    if len(q) < 2:
        return 1.0
    ds = edge_length(p) / (len(q) - 1)
    d2 = ((q[:, None, :] - q[None, :, :]) ** 2).sum(-1)
    own = np.exp(-d2 / (2.0 * sigma**2)).sum(1) * ds / (np.sqrt(2.0 * np.pi) * sigma)
    return float(own.mean())


def straightness(p: NDArray[np.float64], sigma: float) -> float:
    """Length after an arc-length Gaussian of ``sigma`` over length before:
    near 1 for a line that means to go somewhere, well below it for the lace
    a texture's edge makes."""
    s = np.concatenate([[0.0], np.cumsum(np.hypot(*np.diff(p, axis=0).T))])
    if s[-1] <= 1e-9:
        return 1.0
    t = np.arange(0.0, s[-1] + 0.5, 0.5)
    q = np.column_stack([np.interp(t, s, p[:, 0]), np.interp(t, s, p[:, 1])])
    if len(q) < 4:
        return 1.0
    raw = float(np.hypot(*np.diff(q, axis=0).T).sum())
    closed = bool(np.allclose(q[0], q[-1]))
    sm = ndi.gaussian_filter1d(q, sigma / 0.5, axis=0, mode="wrap" if closed else "nearest")
    return min(1.0, float(np.hypot(*np.diff(sm, axis=0).T).sum()) / max(raw, 1e-9))


def _pixels(pts: NDArray[np.float64], shape: tuple[int, int]) -> tuple[NDArray[np.int_], NDArray[np.int_]]:
    r = np.clip(np.round(pts[:, 0]).astype(int), 0, shape[0] - 1)
    c = np.clip(np.round(pts[:, 1]).astype(int), 0, shape[1] - 1)
    return r, c
