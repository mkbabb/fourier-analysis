"""The drawing: every line source composed into one stroke graph.

Layers, in priority order (``strokes.SILHOUETTE`` < ``PARTS`` < ``LINES``
< ``CONNECT``):

1. **The silhouette**: the subject mask's edge (``isolation.subject_mask``),
   cut to the person where a face is confirmed (``contours.person``).
2. **Part boundaries**: where the face parser's material parts meet
   (``parts``): the jaw, the brows, the lids and irises, the lips and the
   teeth.  Both come from one label map as crack chains
   (``strokes.boundary_graph``).  The nose is skin, so its outline is drawn
   only where the image marks it (``marked_runs``: its shadowed side and its
   base, not the front of the bridge).
3. **Learned lines** (``lines.line_maps``): the line drawing, where it
   persists across two scales, plus the fine drawing's long single lines
   the coarse one cannot resolve (``lone_lines``: a necklace, a whisker),
   under the subject and off the face's material parts.  On the skin it
   speaks for the nose only (``form_lines``: its wings, nostrils and the
   creases from it).  It is what draws a faceless subject's interior and the
   hair and clothes around a face.
4. **Connectors** (``route_connectors``): the drawing's separate pieces
   joined by the cheapest pen paths along the image's lines, so the tour
   walks one figure and never jumps between pieces.

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
from fourier_analysis.contours.lines import line_maps, soft_alpha
from fourier_analysis.contours.models import ContourConfig
from fourier_analysis.contours.parts import Face, part_labels
from fourier_analysis.contours.strokes import (
    CONNECT,
    FILL_COMPACTNESS,
    LINES,
    PARTS,
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
    spine_graph,
    split_edges,
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
FRAME_WIDTHS = 2.0


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
    diag = float(np.hypot(*shape))
    lab = cielab(image)

    fine, strength = line_maps(image, soft_alpha(saliency, mask))
    ink = strength >= INK_LEVEL
    width = line_width(ink)
    ink |= lone_lines(fine >= INK_LEVEL, ink, width, MIN_PART_FRACTION * diag)
    base = boundary_graph(parts.labels, parts.drawn)
    if parts.marked.any():
        marked = boundary_graph(parts.labels, parts.marked)
        base = base.merged(marked_runs(marked, lab, width, MIN_PART_FRACTION * diag, parts.nose))
    if parts.spined:
        base = base.merged(spine_graph(parts.labels, parts.spined))
    if parts.feature_lines:
        base = base.merged(polyline_graph(parts.feature_lines, max(1.5, width)))
    ink &= line_region(mask, parts.face_core, width)
    ink = form_lines(ink, parts.form, parts.nose, width, parts.missed, parts.eyes)
    earlier = rasterize(base, shape)
    if earlier.any():
        ink &= ndi.distance_transform_edt(~earlier) > SUPPRESS_FRACTION * diag
    lines = vectorise(ink, width, bridge=BRIDGE_WIDTHS * width)
    lines = drop_doubles(lines, earlier, DOUBLE_REACH_FRACTION * diag)

    graph = bridge_gaps(base.merged(lines), BRIDGE_WIDTHS * width)
    graph = smooth_edges(graph, max(1.5, width))
    graph = drop_line_flecks(graph, MIN_PART_FRACTION * diag)
    sigma = DENSITY_FRACTION * diag
    density = stroke_density(graph, shape, sigma)
    # Keyed by the stroke's point array, which the entry keeps alive so its
    # id is never reused by a later stroke.
    cache: dict[int, tuple[NDArray[np.float64], float]] = {}
    shapes = shape_strokes(graph)

    def salience(e: Edge) -> float:
        if e.layer != LINES:
            return np.inf
        hit = cache.get(id(e.pts))
        if hit is None or hit[0] is not e.pts:
            r, c = _pixels(e.pts, shape)
            others = max(0.0, float(density[r, c].mean()) - self_density(e.pts, sigma))
            marked = min(1.0, line_contrast(e.pts, lab, width) / CONTRAST_DELTA_E)
            weight = straightness(e.pts, WIGGLE_WIDTHS * width) ** 2 / (1.0 + others * (1.0 - marked))
            value = e.length * weight
            if shapes.get(id(e.pts)) is e.pts or is_shape(e):
                value = max(value, floor)
            hit = cache[id(e.pts)] = (e.pts, value)
        return hit[1]

    floor = MIN_PART_FRACTION * diag
    graph = prune_to_budget(graph, INK_BUDGET_DIAGONALS * diag, salience, floor=floor)
    graph = drop_line_flecks(graph, MIN_PART_FRACTION * diag)
    reach = mask & ~frame_band(shape, width)
    path_strength = connector_strength(strength, parts.form)
    graph = route_connectors(graph, path_strength, reach)
    graph = route_jumps(graph, path_strength, reach)
    return Drawing(graph, mask, parts.source, parts.faces)


CONNECT_FLOOR = 0.1
"""A connector's cost per pixel is ``1 / (CONNECT_FLOOR + line strength)``:
along a line the drawing model sees (faint or not) a pen step costs up to
``1 / CONNECT_FLOOR`` times less than across blank paper."""
OFF_SUBJECT_COST = 10.0
"""Off the subject a connector step costs this many times the blank-paper cost."""


def route_connectors(
    graph: StrokeGraph,
    strength: NDArray[np.float64],
    subject: NDArray[np.bool_],
) -> StrokeGraph:
    """Join the drawing's separate pieces along the lines of the image.

    The tour must reach every piece (an eye, a brow, the nose), and a straight
    connector between two pieces is a line the image does not have: a crease
    across a cheek.  Here each pair of pieces is joined by the cheapest pen
    path over the image, a step costing ``1 / (CONNECT_FLOOR + s)`` where
    ``s`` is the line drawing's strength (the faint lines below the ink
    level included), and ``OFF_SUBJECT_COST`` times blank paper off the
    subject (``subject`` is where a connector may run: the subject off the
    frame band).  So a connector follows a line the image has (a lid fold, a
    cheek crease, a garment seam) where there is one, and is the shortest
    pen stroke on the subject where there is none.  The pieces are joined by
    the minimum spanning tree of those path costs (one geodesic front from
    all pieces at once; adjacent fronts of two pieces meet on their geodesic
    Voronoi boundary).  Each path is a ``CONNECT`` edge from ink to ink;
    the tour walks it there and back, the return exactly on top."""
    from skimage.graph import MCP_Geometric

    parts = graph.components()
    if len(parts) <= 1:
        return graph
    shape = subject.shape
    h, w = shape
    comp_of_edge = np.empty(len(graph.edges), dtype=np.int64)
    for ci, p in enumerate(parts):
        comp_of_edge[p] = ci

    # Seeds: every stroke point, tagged with its edge and point index.
    seed_edge = np.full(shape, -1, dtype=np.int64)
    seed_index = np.full(shape, -1, dtype=np.int64)
    for k, e in enumerate(graph.edges):
        r = np.clip(np.round(e.pts[:, 0]).astype(int), 0, h - 1)
        c = np.clip(np.round(e.pts[:, 1]).astype(int), 0, w - 1)
        free = seed_edge[r, c] < 0
        seed_edge[r[free], c[free]] = k
        seed_index[r[free], c[free]] = np.flatnonzero(free)
    seeds = np.argwhere(seed_edge >= 0)

    cost = 1.0 / (CONNECT_FLOOR + np.clip(strength, 0.0, 1.0))
    cost = np.where(subject, cost, OFF_SUBJECT_COST / CONNECT_FLOOR)
    mcp = MCP_Geometric(cost)
    total, tb = mcp.find_costs([tuple(s) for s in seeds])
    offsets = np.asarray(mcp.offsets)

    # Each pixel's predecessor (flat index), and by pointer doubling its seed.
    flat = np.arange(h * w)
    tbf = tb.ravel()
    rr, cc = np.divmod(flat, w)
    step = offsets[np.clip(tbf, 0, len(offsets) - 1)]
    pred = (rr - step[:, 0]) * w + (cc - step[:, 1])
    pred = np.where(tbf < 0, flat, pred)
    root = pred.copy()
    for _ in range(64):
        nxt = root[root]
        if np.array_equal(nxt, root):
            break
        root = nxt
    owner_edge = seed_edge.ravel()[root]
    reached = owner_edge >= 0
    owner = np.where(reached, comp_of_edge[np.clip(owner_edge, 0, None)], -1).reshape(shape)
    tot = total.ravel()

    # Where two pieces' fronts touch: the cheapest crossing per pair.
    best: dict[tuple[int, int], tuple[float, int, int]] = {}
    o = owner.ravel()
    grid = flat.reshape(shape)
    cands = []
    for dr, dc in ((0, 1), (1, 0), (1, 1), (1, -1)):
        a = grid[: h - dr, max(0, -dc) : w - max(0, dc)].ravel()
        b = a + dr * w + dc
        m = (o[a] != o[b]) & (o[a] >= 0) & (o[b] >= 0)
        a, b = a[m], b[m]
        link = np.hypot(dr, dc) * 0.5 * (cost.ravel()[a] + cost.ravel()[b])
        cands.append((tot[a] + tot[b] + link, a, b))
    val = np.concatenate([c[0] for c in cands])
    a_all = np.concatenate([c[1] for c in cands])
    b_all = np.concatenate([c[2] for c in cands])
    lo = np.minimum(o[a_all], o[b_all])
    hi = np.maximum(o[a_all], o[b_all])
    order = np.lexsort((val, hi, lo))
    key = lo[order] * len(parts) + hi[order]
    first = order[np.concatenate([[True], key[1:] != key[:-1]])] if key.size else order
    for i in first:
        best[(int(lo[i]), int(hi[i]))] = (float(val[i]), int(a_all[i]), int(b_all[i]))
    if not best:
        return graph

    # Minimum spanning tree over the pieces (Kruskal).
    parent = list(range(len(parts)))

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    chosen = []
    for key, (val, a, b) in sorted(best.items(), key=lambda kv: kv[1][0]):
        ra, rb = find(key[0]), find(key[1])
        if ra != rb:
            parent[ra] = rb
            chosen.append((a, b))

    def trace(x: int) -> list[int]:
        path = [x]
        while pred[x] != x:
            x = int(pred[x])
            path.append(x)
        return path

    links = []
    for a, b in chosen:
        pa, pb = trace(a), trace(b)
        path = pa[::-1] + pb  # seed of a ... a, b ... seed of b
        ends = []
        for f in (path[0], path[-1]):
            ends.append((int(seed_edge.ravel()[f]), int(seed_index.ravel()[f])))
        pts = np.column_stack(np.divmod(np.asarray(path), w)).astype(np.float64)
        links.append((ends[0], ends[1], pts))

    cuts: dict[int, set[int]] = {}
    for (ka, ia), (kb, ib), _ in links:
        cuts.setdefault(ka, set()).add(ia)
        cuts.setdefault(kb, set()).add(ib)
    out, node_at = split_edges(graph, cuts)
    for (ka, ia), (kb, ib), pts in links:
        u, v = node_at[(ka, ia)], node_at[(kb, ib)]
        pts = pts.copy()
        pts[0], pts[-1] = out.nodes[u], out.nodes[v]
        out.edges.append(Edge(u, v, pts, CONNECT))
    out = smooth_edges(out, CONNECT_SMOOTH_PX, layers=(CONNECT,))
    return dissolve_degree_two(out)


def route_jumps(graph: StrokeGraph, strength: NDArray[np.float64], subject: NDArray[np.bool_]) -> StrokeGraph:
    """Draw the tour's pen jumps as routed strokes.

    The tour (``shortest_tour``) pairs the drawing's odd nodes, and where a
    pair's retrace along the ink would be far longer than the gap it jumps
    straight across: a chord over the subject that no image line has.  Here
    each pair the tour would jump is joined instead by the cheapest pen path
    over the image (the cost of ``route_connectors``), added to the drawing as
    a ``CONNECT`` stroke between the two nodes.  Both nodes are then even,
    so the tour walks the stroke once in place of the jump."""
    from skimage.graph import route_through_array

    from fourier_analysis.shortest_tour import _StrokeGraph

    if not graph.edges:
        return graph
    shape = subject.shape
    h, w = shape
    cy, cx = h / 2, w / 2
    tour = _StrokeGraph.from_strokes(graph.polylines(shape))
    tour.connect_components()
    n_edges = len(tour.edges)
    tour.make_eulerian()
    jumps = [e for e in tour.edges[n_edges:] if e.jump and len(e.poly) == 2]
    if not jumps:
        return graph
    nodes = np.asarray(graph.nodes)
    tree = cKDTree(nodes)
    cost = 1.0 / (CONNECT_FLOOR + np.clip(strength, 0.0, 1.0))
    cost = np.where(subject, cost, OFF_SUBJECT_COST / CONNECT_FLOOR)
    out = StrokeGraph(list(graph.nodes), list(graph.edges))
    for e in jumps:
        ends = []
        for z in (e.poly[0], e.poly[-1]):
            d, k = tree.query([cy - z.imag, z.real + cx])
            ends.append(int(k) if d <= 1.0 else -1)
        if min(ends) < 0 or ends[0] == ends[1]:
            continue
        a, b = (tuple(np.clip(np.round(nodes[k]).astype(int), 0, [h - 1, w - 1])) for k in ends)
        path, _ = route_through_array(cost, a, b, fully_connected=True, geometric=True)
        pts = np.asarray(path, dtype=np.float64)
        if len(pts) < 2:
            continue
        pts[0], pts[-1] = nodes[ends[0]], nodes[ends[1]]
        out.edges.append(Edge(ends[0], ends[1], pts, CONNECT))
    return smooth_edges(out, CONNECT_SMOOTH_PX, layers=(CONNECT,))


def connector_strength(strength: NDArray[np.float64], form: NDArray[np.bool_]) -> NDArray[np.float64]:
    """The line strength a connector is led along.

    On a face's skin the line model's faint strength is shading (a brow
    ridge, a lid fold, a cheek's turn), not a line (``form_lines``): a
    connector led along it draws a rule across the face, a brow run on into
    its fellow or the face's edge.  There a connector is the shortest pen
    step between the features it joins."""
    return np.where(form, 0.0, strength) if form.any() else strength


CONNECT_SMOOTH_PX = 2.0
"""A connector's pixel path is smoothed this much (arc length) so it reads
as a pen stroke, not a grid walk."""


def shape_strokes(graph: StrokeGraph) -> dict[int, NDArray[np.float64]]:
    """The point arrays (keyed by ``id``, held so the id is not reused) of the line strokes that close a shape in
    pairs: two strokes joining the same two nodes (an eye's upper and lower
    lid, meeting at its corners) whose loop is as compact as a drawn object
    (``is_shape``).  A self-loop is judged on its own by ``is_shape``."""
    pairs: dict[tuple[int, int], list[Edge]] = {}
    for e in graph.edges:
        if e.layer == LINES and e.u != e.v:
            pairs.setdefault((min(e.u, e.v), max(e.u, e.v)), []).append(e)
    out: dict[int, NDArray[np.float64]] = {}
    for es in pairs.values():
        for i, a in enumerate(es):
            for b in es[i + 1 :]:
                tail = b.pts[::-1] if b.u == a.u else b.pts
                loop = Edge(a.u, a.u, np.vstack([a.pts, tail[1:]]), LINES)
                if is_shape(loop):
                    out[id(a.pts)], out[id(b.pts)] = a.pts, b.pts
    return out


def is_shape(e: Edge) -> bool:
    """A closed stroke as compact as a drawn object (``4 pi A / P^2`` at least
    ``strokes.FILL_COMPACTNESS``: an eye, a pupil, a nostril, a button) is an
    outline, not texture: texture leaves open twigs and lace.  However short,
    it is worth the pruning floor; only the ink budget can take it."""
    if e.u != e.v or len(e.pts) < 4:
        return False
    p = e.pts
    area = 0.5 * abs(float(np.dot(p[:-1, 0], p[1:, 1]) - np.dot(p[1:, 0], p[:-1, 1])))
    return 4.0 * np.pi * area / max(e.length, 1e-9) ** 2 >= FILL_COMPACTNESS


def line_region(mask: NDArray[np.bool_], face_core: NDArray[np.bool_], width: float) -> NDArray[np.bool_]:
    """Where learned lines may be drawn: on the subject (grown by
    ``SUBJECT_MARGIN_WIDTHS``: the outline sits on the mask's edge), off the
    face core the parser draws, off the frame (``FRAME_WIDTHS`` line widths
    of it)."""
    region = ndi.distance_transform_edt(~mask) <= SUBJECT_MARGIN_WIDTHS * width
    if face_core.any():
        region &= ~ndi.binary_dilation(face_core, iterations=max(1, int(round(width))))
    # The model draws the frame itself where the image meets its paper
    # padding (dark hair against white): a line one line width wide, lying
    # along the frame.  Two line widths in from it nothing is drawn.
    return region & ~frame_band(mask.shape, width)


def frame_band(shape: tuple[int, int], width: float) -> NDArray[np.bool_]:
    """The ``FRAME_WIDTHS`` line widths along the image frame (at least
    ``FRAME_PX``), where the line model's ink is the frame's, not the
    subject's."""
    f = max(FRAME_PX, int(np.ceil(FRAME_WIDTHS * width)))
    band = np.zeros(shape, dtype=bool)
    band[:f] = band[-f:] = True
    band[:, :f] = band[:, -f:] = True
    return band


def marked_runs(
    graph: StrokeGraph,
    lab: NDArray[np.float64],
    width: float,
    min_length: float,
    nose: NDArray[np.bool_] | None = None,
) -> StrokeGraph:
    """The runs of each stroke along which the image marks a line
    (``contrast_profile`` at least ``CONTRAST_DELTA_E``, read over a line
    width of arc), at least ``min_length`` long; the rest is cut away.  On
    the ``nose``'s outline the bridge is drawn whole on its shadowed side
    (``bridge_side``)."""
    out = StrokeGraph(list(graph.nodes), [])
    for e in graph.edges:
        q = uniform(e.pts, 1.0)
        if len(q) < 3:
            continue
        prof = ndi.gaussian_filter1d(contrast_profile(q, lab, width), max(1.0, width))
        on = prof >= CONTRAST_DELTA_E
        if nose is not None and nose.any():
            on |= bridge_side(q, prof, nose)
        if not on.any():
            continue
        edges = np.flatnonzero(np.diff(np.concatenate([[0], on.astype(np.int8), [0]])))
        for a, b in zip(edges[::2], edges[1::2]):
            seg = q[a:b]
            if len(seg) < 2 or edge_length(seg) < min_length:
                continue
            seg = seg.copy()
            closed = e.u == e.v and a == 0 and b == len(q)
            u = e.u if a == 0 else out.add_node(seg[0])
            v = u if closed else (e.v if b == len(q) else out.add_node(seg[-1]))
            seg[0], seg[-1] = out.nodes[u], out.nodes[v]
            out.edges.append(Edge(u, v, seg, e.layer))
    return compact(out) if out.edges else StrokeGraph()


def polyline_graph(lines: tuple[NDArray[np.float64], ...], sigma: float) -> StrokeGraph:
    """Pixel paths as ``PARTS`` strokes, smoothed by ``sigma`` (ends kept)."""
    g = StrokeGraph()
    for p in lines:
        if len(p) < 2:
            continue
        u, v = g.add_node(p[0]), g.add_node(p[-1])
        g.edges.append(Edge(u, v, p.copy(), PARTS))
    return smooth_edges(g, sigma, layers=(PARTS,))


def bridge_side(q: NDArray[np.float64], prof: NDArray[np.float64], nose: NDArray[np.bool_]) -> NDArray[np.bool_]:
    """The points of a stroke ``q`` (along the nose's outline) on the side of
    the bridge an artist draws.

    The nose is skin, and its front is unmarked; its form is told by one side
    of the bridge, from between the eyes down to the wing: the shadowed side,
    which the image marks more (the larger mean ``prof``).  A side point lies
    on the nose's rim and runs along the nose's long axis (its tangent nearer
    the axis than across it: the top and the base run across); of the two
    sides' points, those of the more marked side are returned."""
    h, w = nose.shape
    r = np.clip(np.round(q[:, 0]).astype(int), 0, h - 1)
    c = np.clip(np.round(q[:, 1]).astype(int), 0, w - 1)
    rim = ndi.binary_dilation(nose, iterations=2)[r, c] & ~ndi.binary_erosion(nose, iterations=2)[r, c]
    none = np.zeros(len(q), bool)
    if rim.mean() < 0.5:
        return none
    comp, _ = ndi.label(nose)
    k = np.bincount(comp[r, c][rim]).argmax() if (comp[r, c][rim] > 0).any() else 0
    pix = np.argwhere(comp == k) if k else np.argwhere(nose)
    centre = pix.mean(axis=0)
    evals, evecs = np.linalg.eigh(np.cov((pix - centre).T))
    axis = evecs[:, -1]
    across = np.array([-axis[1], axis[0]])
    t = np.gradient(q, axis=0)
    t /= np.maximum(np.hypot(t[:, 0], t[:, 1]), 1e-9)[:, None]
    along = rim & (np.abs(t @ axis) >= 0.5)
    s = (q - centre) @ across
    sides = [along & (s < 0), along & (s > 0)]
    marks = [float(prof[m].mean()) if m.any() else -np.inf for m in sides]
    return sides[int(np.argmax(marks))]


LONE_LINE_WIDTHS = 1.5
"""A fine-scale piece of ink no wider than this many line widths, on average
over its length, is a single drawn line (not a blot or a mesh)."""


def lone_lines(
    fine_ink: NDArray[np.bool_], ink: NDArray[np.bool_], width: float, min_length: float
) -> NDArray[np.bool_]:
    """The fine drawing's long single lines that the coarse drawing cannot
    resolve: a necklace chain, a whisker, a hair-thin seam.

    Persistence across scales (``lines.persistent_lines``) drops texture
    because it is finer than the coarse drawing; it drops a thin line for the
    same reason.  A thin line differs from texture in being one long,
    unbranched stroke: a piece of the fine ink (not touching the persistent
    ink, which already speaks there) whose skeleton is at least
    ``min_length`` long, with no more ends than a line has (two, or none on a
    loop), and whose area is that of one line of the drawing's width
    (``LONE_LINE_WIDTHS``).  Texture is a mesh of short, branching pieces."""
    from skimage.morphology import skeletonize

    cand = fine_ink & ~ndi.binary_dilation(ink, iterations=max(1, int(round(width))))
    pieces, n = ndi.label(cand, structure=np.ones((3, 3)))
    if n == 0:
        return np.zeros_like(ink)
    skel = skeletonize(cand)
    nbrs = ndi.convolve(skel.astype(np.int32), np.ones((3, 3), np.int32), mode="constant") - 1
    ends = skel & (nbrs == 1)
    idx = np.arange(1, n + 1)
    length = ndi.sum(skel, pieces, idx)
    n_ends = ndi.sum(ends, pieces, idx)
    area = ndi.sum(cand, pieces, idx)
    ok = (length >= min_length) & (n_ends <= 2) & (area <= LONE_LINE_WIDTHS * width * np.maximum(length, 1.0))
    return np.isin(pieces, idx[ok])


def form_lines(
    ink: NDArray[np.bool_],
    form: NDArray[np.bool_],
    nose: NDArray[np.bool_],
    width: float,
    missed: NDArray[np.bool_] | None = None,
    eyes: NDArray[np.bool_] | None = None,
) -> NDArray[np.bool_]:
    """On the face's skin, the learned drawing speaks for the nose only.

    The parser draws every material part of a face (brows, lids, irises,
    lips, teeth) but not the nose, which is skin: its wings, its base and the
    creases that run from it into the cheeks are the drawing's.  Elsewhere on
    the skin the line model draws shading (an eye bag, a lid fold beside the
    parser's lid, a dimple, a shadowed socket as a box) that doubles or
    stands in for a feature.  So on the skin a piece of ink is kept only
    when it reaches the nose (grown by a line width) and does not reach an
    ``eyes`` part (an eye or a brow, grown alike: a line from the nose into
    the eye is the socket's shade or a lid fold the parser's lid already
    draws), and never inside ``missed`` (``parts.missed_features``: an eye
    the parser did not label, drawn by its lid line instead); off the skin
    (hair, clothes, a faceless subject) all of it is."""
    if not form.any():
        return ink
    on_form = ink & form
    if missed is not None:
        on_form &= ~missed
    keep = np.zeros_like(ink)
    if nose.any():
        pieces, n = ndi.label(on_form, structure=np.ones((3, 3)))
        if n:
            near_nose = ndi.binary_dilation(nose, iterations=max(1, int(round(width))))
            reach = np.unique(pieces[near_nose & on_form])
            if eyes is not None and eyes.any():
                near_eye = ndi.binary_dilation(eyes, iterations=max(1, int(round(width))))
                reach = np.setdiff1d(reach, np.unique(pieces[near_eye & on_form]))
            keep = np.isin(pieces, reach[reach > 0])
    return (ink & ~form) | keep


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
    feature that draws more than its gap (a pupil in an eye, an eye on a
    flank) is kept, however short when it is a closed shape (``is_shape``):
    it is worth its two connectors."""
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
            short = lengths[i] < min_length and not all(is_shape(graph.edges[k]) for k in p)
            if (short or lengths[i] < gap) and lengths[i] < worst_len:
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
    """How strongly the image marks a stroke: the median of
    ``contrast_profile`` along it."""
    q = uniform(p, 2.0)
    if len(q) < 2:
        return 0.0
    return float(np.median(contrast_profile(q, lab, width)))


def contrast_profile(q: NDArray[np.float64], lab: NDArray[np.float64], width: float) -> NDArray[np.float64]:
    """At each point of a stroke, the larger of the colour step across it (an
    edge) and the colour difference between the stroke and its two sides (a
    line), each read a few line widths out and at the best placement within
    a line width (a vectorised line sits a pixel or two off the image's own)."""
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
    return best


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
