"""The line-drawing pipeline: photograph -> learned line drawing -> stroke graph.

1. **Subject** (``isolation.isolate_subject``): the saliency ensemble's mask.
2. **Line drawing** (``lines.predict_line_drawing``): Informative Drawings'
   contour style, shown the photograph with its background faded to paper by
   the subject's soft alpha, so it draws the subject and its outline only.
3. **Under the subject**: ink is kept on the subject mask grown by a couple of
   line widths (the outline sits on the mask's edge) and off the frame.
4. **Stroke graph** (``strokes.vectorise``): skeleton, junction nodes, spur
   pruning, gap bridging, per-stroke smoothing.  All scales are the drawing's
   own measured line width, or fractions of the image diagonal.
5. **Selection**: a connected part of the graph is one pen stroke-group; a
   part shorter than ``MIN_PART_FRACTION`` of the diagonal is a fleck.  The
   longest parts are kept up to ``config.max_contours`` parts (the ceiling
   counts what the pen must jump between).
6. **Tour** (``shortest_tour.build_contour_tour``, the postman walk).

The returned contours are the graph's edges; strokes that meet share their
end point exactly, which is how the tour recovers the junctions.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray
from scipy import ndimage as ndi

from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.isolation import SubjectIsolation, isolate_subject
from fourier_analysis.contours.lines import predict_line_drawing, soft_alpha
from fourier_analysis.contours.models import ContourConfig
from fourier_analysis.contours.strokes import StrokeGraph, edge_length, prune_to_budget, vectorise

# A part of the drawing shorter than this fraction of the diagonal is a fleck.
MIN_PART_FRACTION = 0.03
# Ink further than this many line widths outside the subject mask is background.
SUBJECT_MARGIN_WIDTHS = 2.0
# A stroke this close (line widths) to the outline along this much of its
# length is the outline drawn twice (``drop_parallel_strokes``).
PARALLEL_WIDTHS = 2.5
PARALLEL_FRACTION = 0.8
# Gaps up to this many line widths are bridged when a stroke end points across.
BRIDGE_WIDTHS = 6.0
# The drawing's ink budget, in image diagonals: 1024 tour samples and a few
# hundred harmonics carry a drawing about this long (retraces come on top).
INK_BUDGET_DIAGONALS = 8.0
# A stroke in the subject's face weighs this much more than one outside it.
FACE_WEIGHT = 4.0
# The scale (in line widths) at which strokes are counted side by side.
DENSITY_WIDTHS = 4.0
# The scale (in line widths) at which a stroke's wander is read.
WIGGLE_WIDTHS = 3.0
# A separate part must be at least this many times longer than the jump to it
# (a pupil or an eye is kept; a fleck across the subject is not).
PART_WORTH = 1.0
# Frame margin (px) where ink is the frame, not the subject.
FRAME_PX = 3


def line_width(ink: NDArray[np.float64]) -> float:
    """The drawing's typical stroke width: twice the median distance from a
    skeleton pixel to paper."""
    from skimage.morphology import skeletonize

    b = ink >= 0.5
    if not b.any():
        return 2.0
    skel = skeletonize(b)
    dist = ndi.distance_transform_edt(b)
    return float(max(1.5, 2.0 * np.median(dist[skel])))


def subject_ink(
    ink: NDArray[np.float64], isolation: SubjectIsolation, width: float
) -> tuple[NDArray[np.float64], NDArray[np.bool_] | None]:
    """The drawing under the subject, closed by the subject mask's outline.

    Ink off the subject (beyond ``SUBJECT_MARGIN_WIDTHS`` line widths) is
    background.  The mask's boundary, smoothed at the line scale, is drawn in
    one line wide, so the outline is closed even where the model left a
    low-contrast edge undrawn.  Where the model drew the same edge a little
    off the mask's (a saliency mask can stand a few pixels off the true
    edge), the two run side by side; ``drop_parallel_strokes`` keeps one.
    Returns the ink and the outline's pixels (``None`` without a mask), kept
    apart so the outline is laid over the drawing after its fills are
    resolved (merged first, an outline beside a model line reads as a fill).
    """
    out = ink.copy()
    ring = None
    mask = isolation.subject_mask
    if mask is not None and mask.any():
        near = ndi.distance_transform_edt(~mask) <= SUBJECT_MARGIN_WIDTHS * width
        out[~near] = 0.0
        smooth = ndi.gaussian_filter(mask.astype(np.float64), width) >= 0.5
        edge = smooth & ~ndi.binary_erosion(smooth, border_value=1)
        ring = ndi.distance_transform_edt(~edge) <= width / 2.0
        for a in (out, ring):
            a[:FRAME_PX] = a[-FRAME_PX:] = 0
            a[:, :FRAME_PX] = a[:, -FRAME_PX:] = 0
        return out, ring
    out[:FRAME_PX] = out[-FRAME_PX:] = 0.0
    out[:, :FRAME_PX] = out[:, -FRAME_PX:] = 0.0
    return out, ring


def drop_parallel_strokes(
    graph: StrokeGraph, reach: float, outline: NDArray[np.bool_] | None, width: float
) -> StrokeGraph:
    """Drop a stroke that doubles the subject's outline.

    The outline is drawn twice where the model's line and the mask's edge
    run side by side a few pixels apart.  An outline stroke with at least
    ``PARALLEL_FRACTION`` of its length within ``reach`` of the model's
    strokes (strokes it meets at a junction not counted) is that edge's
    second copy, and goes: the model's line sits on the true edge, the
    saliency mask's can stand a few pixels off it.  It runs after the budget
    pruning (which never drops the outline), so the outline gives way only to
    model lines that were kept.  Only outline doubles are judged: inside the
    subject, close parallel lines are the drawing (a lid and its crease, an
    iris in its eye).
    """
    from scipy.spatial import cKDTree

    from fourier_analysis.contours.strokes import compact, dissolve_degree_two

    if outline is None or len(graph.edges) < 2:
        return graph
    band = ndi.binary_dilation(outline, iterations=max(1, int(round(width))))
    dense = [_dense(p) for _, _, p in graph.edges]
    on_outline = []
    for d in dense:
        r = np.clip(np.round(d[:, 0]).astype(int), 0, band.shape[0] - 1)
        c = np.clip(np.round(d[:, 1]).astype(int), 0, band.shape[1] - 1)
        on_outline.append(bool(band[r, c].mean() >= PARALLEL_FRACTION))
    pts = np.vstack(dense)
    owner = np.concatenate([np.full(len(d), k) for k, d in enumerate(dense)])
    tree = cKDTree(pts)
    alive = np.ones(len(dense), dtype=bool)
    ends = [(a, b) for a, b, _ in graph.edges]
    for k in range(len(dense)):
        if not on_outline[k]:
            continue
        a, b = ends[k]
        own = {j for j, (c, d) in enumerate(ends) if {c, d} & {a, b}}
        hits = tree.query_ball_point(dense[k], reach)
        near = np.array(
            [
                any(
                    owner[q] not in own and not on_outline[owner[q]]
                    for q in h
                )
                for h in hits
            ]
        )
        if near.mean() >= PARALLEL_FRACTION:
            alive[k] = False
    kept = [e for k, e in enumerate(graph.edges) if alive[k]]
    return dissolve_degree_two(compact(StrokeGraph(graph.nodes, kept)))


def stroke_density(graph: StrokeGraph, shape: tuple[int, int], width: float) -> NDArray[np.float64]:
    """How many strokes run side by side around each pixel, at the scale of
    ``DENSITY_WIDTHS`` line widths: 1 along a lone line, 2 where two lines
    run close, many in hatching and fur.  A line in texture says little on
    its own, a lone line says a lot (a contour, a lid, a lip)."""
    canvas = np.zeros(shape, dtype=np.float64)
    for _, _, p in graph.edges:
        q = _dense(p)
        r = np.clip(np.round(q[:, 0]).astype(int), 0, shape[0] - 1)
        c = np.clip(np.round(q[:, 1]).astype(int), 0, shape[1] - 1)
        canvas[r, c] = 1.0
    sigma = DENSITY_WIDTHS * width
    return ndi.gaussian_filter(canvas, sigma) * np.sqrt(2.0 * np.pi) * sigma


def straightness(p: NDArray[np.float64], sigma: float) -> float:
    """Length after an arc-length Gaussian of ``sigma`` over length before:
    near 1 for a line that means to go somewhere, well below it for the lace
    a texture's edge makes."""
    q = _dense(p)
    raw = float(np.hypot(*np.diff(q, axis=0).T).sum())
    if raw <= 1e-9 or len(q) < 4:
        return 1.0
    closed = bool(np.allclose(q[0], q[-1]))
    step = 0.5
    sm = ndi.gaussian_filter1d(q, sigma / step, axis=0, mode="wrap" if closed else "nearest")
    return min(1.0, float(np.hypot(*np.diff(sm, axis=0).T).sum()) / raw)


def _dense(p: NDArray[np.float64]) -> NDArray[np.float64]:
    s = np.concatenate([[0.0], np.cumsum(np.hypot(*np.diff(p, axis=0).T))])
    t = np.arange(0.0, s[-1] + 0.5, 0.5) if s[-1] > 0 else np.zeros(1)
    return np.column_stack([np.interp(t, s, p[:, 0]), np.interp(t, s, p[:, 1])])


def select_parts(graph: StrokeGraph, diagonal: float, ceiling: int | None) -> StrokeGraph:
    parts = graph.components()
    lengths = [sum(edge_length(graph.edges[k][2]) for k in part) for part in parts]
    order = [i for i in np.argsort(lengths)[::-1] if lengths[i] >= MIN_PART_FRACTION * diagonal]
    if not order and parts:
        order = [int(np.argmax(lengths))]
    if ceiling is not None:
        order = order[:ceiling]
    keep = sorted(k for i in order for k in parts[i])
    from fourier_analysis.contours.strokes import compact

    return compact(StrokeGraph(graph.nodes, [graph.edges[k] for k in keep]))


def drop_remote_parts(graph: StrokeGraph, worth: float) -> StrokeGraph:
    """Leave out a part that costs more jump than it brings ink.

    The pen reaches a separate part by a straight connector drawn out and
    back.  A part shorter than ``worth`` times its distance to the nearest
    other part is a fleck the drawing does not need at that price.  Repeated
    until stable (dropping one part can strand another); the longest part is
    always kept.
    """
    from scipy.spatial import cKDTree

    from fourier_analysis.contours.strokes import compact

    while True:
        parts = graph.components()
        if len(parts) <= 1:
            return graph
        pts = [np.vstack([graph.edges[k][2] for k in part]) for part in parts]
        lengths = [sum(edge_length(graph.edges[k][2]) for k in part) for part in parts]
        trees = [cKDTree(p) for p in pts]
        longest = int(np.argmax(lengths))
        drop = set()
        for i in range(len(parts)):
            if i == longest:
                continue
            d = min(
                float(trees[j].query(pts[i])[0].min()) for j in range(len(parts)) if j != i
            )
            if lengths[i] < worth * d:
                drop.add(i)
        if not drop:
            return graph
        # Drop the worst offender first: its removal may change the others.
        worst = min(drop, key=lambda i: lengths[i])
        keep = [k for i, part in enumerate(parts) if i != worst for k in part]
        graph = compact(StrokeGraph(graph.nodes, [graph.edges[k] for k in sorted(keep)]))


def draw_subject(
    image: LoadedImage,
    config: ContourConfig,
    isolation: SubjectIsolation | None = None,
) -> tuple[list[NDArray[np.complex128]], SubjectIsolation]:
    """The subject's line drawing as stroke-graph edges (pipeline coords)."""
    if isolation is None:
        isolation = isolate_subject(image, config)
    alpha = None
    if isolation.subject_mask is not None:
        alpha = soft_alpha(isolation.saliency_map, isolation.subject_mask)
    ink = predict_line_drawing(image, alpha)
    width = line_width(ink)
    ink, outline = subject_ink(ink, isolation, width)
    graph = vectorise(
        ink,
        width,
        bridge=BRIDGE_WIDTHS * width,
        smooth_sigma=max(1.5, width),
        lines=outline,
    )
    graph = select_parts(graph, image.diagonal, None)
    face = isolation.face_region
    density = stroke_density(graph, ink.shape, width)

    band = (
        ndi.binary_dilation(outline, iterations=max(1, int(round(width))))
        if outline is not None
        else np.zeros(ink.shape, dtype=bool)
    )

    def salience(p: NDArray[np.float64], length: float) -> float:
        r = np.clip(np.round(p[:, 0]).astype(int), 0, ink.shape[0] - 1)
        c = np.clip(np.round(p[:, 1]).astype(int), 0, ink.shape[1] - 1)
        if band[r, c].mean() >= 0.5:
            return np.inf  # the silhouette is never simplified away
        weight = 1.0 / max(1.0, float(density[r, c].mean()))
        weight *= straightness(p, WIGGLE_WIDTHS * width) ** 2
        if face is not None:
            weight *= 1.0 + (FACE_WEIGHT - 1.0) * float(face[r, c].mean())
        return length * weight

    graph = prune_to_budget(graph, INK_BUDGET_DIAGONALS * image.diagonal, salience)
    graph = drop_parallel_strokes(graph, PARALLEL_WIDTHS * width, outline, width)
    graph = drop_remote_parts(graph, PART_WORTH)
    graph = select_parts(graph, image.diagonal, config.max_contours)
    return graph.polylines(image.grayscale.shape), isolation
