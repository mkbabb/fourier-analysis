"""The drawing: every line source composed into one stroke graph.

Layers, in priority order (``strokes.SILHOUETTE`` < ``PARTS`` < ``LINES``
< ``CONNECT``):

1. **The silhouette**: the subject mask's edge (``isolation.subject_mask``),
   cut to the person where a face is confirmed (``contours.person``).
2. **Part boundaries**: where the face parser's material parts meet
   (``parts``): the jaw, the brows, the lids and irises, the lips and the
   teeth.  Both come from one label map as crack chains
   (``strokes.boundary_graph``).  The nose is skin, so its outline is drawn
   only where the image marks it (``marked_runs``: the shadowed side of its
   bridge, and its wings and base whole; never the bridge's root between the
   brows, which would run on into a brow).
3. **Learned lines** (``lines.line_maps``): the line drawing, where it
   persists across two scales, plus the fine drawing's long single lines
   the coarse one cannot resolve (``lone_lines``: a necklace, a whisker),
   under the subject and off the face's material parts.  On the skin it
   speaks for the nose only (``form_lines``: its wings, nostrils and the
   creases from it).  It is what draws a faceless subject's interior and the
   hair and clothes around a face.
4. **Connectors** (``route_connectors``): the drawing's separate pieces
   joined by the cheapest pen paths along the image's lines, each leaving
   a piece at a free end or a corner (``entry_points``), pulled taut
   (``pull_string``) and never across the face's midline above the nose
   (``glabella``), so the tour walks one figure and never jumps between
   pieces.

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
    if parts.faces:
        graph = drop_faint_twigs(graph, lab, width)
    graph = drop_line_flecks(graph, MIN_PART_FRACTION * diag)
    reach = mask & ~frame_band(shape, width) & ~glabella(parts.nose)
    path_strength = connector_strength(strength, parts.form | parts.face_core)
    graph = route_connectors(graph, path_strength, reach, barred=brow_roots(parts.labels, parts.faces))
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
    barred: NDArray[np.bool_] | None = None,
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
    the tour walks it there and back, the return exactly on top.  No piece
    is entered on a ``barred`` pixel (``brow_roots``) while it has another
    entry."""
    from skimage.graph import MCP_Geometric

    parts = graph.components()
    if len(parts) <= 1:
        return graph
    shape = subject.shape
    h, w = shape
    comp_of_edge = np.empty(len(graph.edges), dtype=np.int64)
    for ci, p in enumerate(parts):
        comp_of_edge[p] = ci

    # Seeds: every stroke point the pen may enter its piece at
    # (``entry_points``), tagged with its edge and point index.
    entry = entry_points(graph, parts, barred)
    seed_edge = np.full(shape, -1, dtype=np.int64)
    seed_index = np.full(shape, -1, dtype=np.int64)
    closed = np.zeros(shape, bool)  # a piece's stroke away from its entries
    for k, e in enumerate(graph.edges):
        r = np.clip(np.round(e.pts[:, 0]).astype(int), 0, h - 1)
        c = np.clip(np.round(e.pts[:, 1]).astype(int), 0, w - 1)
        free = (seed_edge[r, c] < 0) & entry[k]
        seed_edge[r[free], c[free]] = k
        seed_index[r[free], c[free]] = np.flatnonzero(free)
        closed[r[~entry[k]], c[~entry[k]]] = True
    seeds = np.argwhere(seed_edge >= 0)

    cost = 1.0 / (CONNECT_FLOOR + np.clip(strength, 0.0, 1.0))
    cost = np.where(subject, cost, OFF_SUBJECT_COST / CONNECT_FLOOR)
    # A connector does not run along a piece to reach its entry (it would
    # leave the piece from the middle after all), nor slip across its stroke.
    if closed.any():
        closed = ndi.binary_dilation(closed) & ~ndi.binary_dilation(seed_edge >= 0)
        cost = np.where(closed, OFF_SUBJECT_COST / CONNECT_FLOOR, cost)
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
        pts = pull_string(np.column_stack(np.divmod(np.asarray(path), w)).astype(np.float64), cost)
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


ENTRY_FRACTION = 0.15
"""A closed piece is entered within this fraction of its length (along its
long axis) of a corner."""
END_ENTRY_PX = 1.5
"""An open piece is entered at a free end, within this distance of it."""


def entry_points(
    graph: StrokeGraph, parts: list[list[int]], barred: NDArray[np.bool_] | None = None
) -> list[NDArray[np.bool_]]:
    """Per edge, the points at which a connector may join its piece.

    A pen joins a separate piece (a brow, an eye, a crease) where the piece
    can be read as carrying the line on: at a free end of a stroke, exactly
    there (``END_ENTRY_PX``: it continues into the connector, leaving no tip
    behind as a hook) and at the two extremes of the piece's
    long axis (the ends of a brow, an eye's corners, where its lids meet and
    a crease runs out).  A connector dropped onto the middle of a brow, or
    onto a lid over the iris, is a spur across the face.  This holds for the
    parsed features (a piece with a ``PARTS`` stroke); the largest piece (the
    figure the others hang on) and the line drawing's own fragments (fur,
    folds: texture, where the shortest join is the least ink) are joined
    anywhere.  A feature is entered within ``ENTRY_FRACTION`` of its
    long-axis extent of an extreme that is not already a free end's."""
    out = [np.ones(len(e.pts), bool) for e in graph.edges]
    if len(parts) <= 1:
        return out
    lengths = [sum(graph.edges[k].length for k in p) for p in parts]
    main = int(np.argmax(lengths))
    deg = graph.degree()
    for i, p in enumerate(parts):
        if i == main or all(graph.edges[k].layer != PARTS for k in p):
            continue
        pts = np.vstack([graph.edges[k].pts for k in p])
        centre = pts.mean(axis=0)
        if len(pts) < 3:
            continue
        evals, evecs = np.linalg.eigh(np.cov((pts - centre).T))
        axis = evecs[:, -1]
        s = (pts - centre) @ axis
        extent = float(s.max() - s.min())
        reach = max(2.0, ENTRY_FRACTION * extent)
        ends = np.array([graph.nodes[n] for k in p for n in (graph.edges[k].u, graph.edges[k].v) if deg[n] == 1])
        corners = np.vstack([pts[int(np.argmin(s))], pts[int(np.argmax(s))]])
        if len(ends):
            # An open stroke is carried on from its very end: a connector
            # leaving short of it leaves the tip behind as a hook.  So an
            # extreme near a free end is entered at the end itself.
            near_end = cKDTree(ends).query(corners)[0] <= reach
            corners = corners[~near_end]
        for k in p:
            q = graph.edges[k].pts
            ok = np.zeros(len(q), bool)
            if len(ends):
                ok |= cKDTree(ends).query(q)[0] <= END_ENTRY_PX
            if len(corners):
                ok |= cKDTree(corners).query(q)[0] <= reach
            out[k] = ok
        if barred is not None and barred.any():
            h, w = barred.shape
            off = []
            for k in p:
                q = graph.edges[k].pts
                r = np.clip(np.round(q[:, 0]).astype(int), 0, h - 1)
                c = np.clip(np.round(q[:, 1]).astype(int), 0, w - 1)
                off.append(out[k] & ~barred[r, c])
            if any(o.any() for o in off):
                for k, o in zip(p, off):
                    out[k] = o
    return out


BROW_ROOT_PX = 2
"""A brow's root is grown this far, so its stroke's end (a pixel or two off
the label) lies on it."""


def brow_roots(labels: NDArray[np.int32], faces: tuple[Face, ...]) -> NDArray[np.bool_]:
    """The inner half of each brow: its pixels nearer the face's midline (the
    perpendicular bisector of the two eyes' landmarks) than the brow's centre.

    A pen leaves a brow at its tail, carrying the arch on to the temple; a
    connector from its root runs down beside the nose (a scowl) or down to
    the eye's inner corner (a box round the eye)."""
    from fourier_analysis.contours.parts import BROWS

    out = np.zeros(labels.shape, bool)
    brows = np.isin(labels, BROWS)
    if not brows.any() or not faces:
        return out
    comp, n = ndi.label(brows)
    for k in range(1, n + 1):
        pix = np.argwhere(comp == k).astype(np.float64)
        centre = pix.mean(axis=0)
        face = min(
            (f for f in faces if len(f.landmarks) >= 2),
            key=lambda f: float(np.hypot(*(np.mean(f.landmarks[:2], axis=0)[::-1] - centre))),
            default=None,
        )
        if face is None:
            continue
        e0, e1 = (np.asarray(face.landmarks[i], np.float64)[::-1] for i in (0, 1))  # (row, col)
        axis = e1 - e0
        if float(np.hypot(*axis)) < 1.0:
            continue
        axis /= np.hypot(*axis)
        mid = 0.5 * (e0 + e1)
        d = np.abs((pix - mid) @ axis)
        root = pix[d < abs(float((centre - mid) @ axis))].astype(int)
        out[root[:, 0], root[:, 1]] = True
    return ndi.binary_dilation(out, iterations=BROW_ROOT_PX) if out.any() else out


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
        pts = pull_string(np.asarray(path, dtype=np.float64), cost)
        if len(pts) < 2:
            continue
        pts[0], pts[-1] = nodes[ends[0]], nodes[ends[1]]
        out.edges.append(Edge(ends[0], ends[1], pts, CONNECT))
    return smooth_edges(out, CONNECT_SMOOTH_PX, layers=(CONNECT,))


def connector_strength(strength: NDArray[np.float64], face: NDArray[np.bool_]) -> NDArray[np.float64]:
    """The line strength a connector is led along.

    On a face's skin the line model's faint strength is shading (a brow
    ridge, a lid fold, a cheek's turn), not a line (``form_lines``): a
    connector led along it draws a rule across the face, a brow run on into
    its fellow or the face's edge.  On the parsed features (a brow, a lip)
    the strength is the feature itself, already drawn by its spine or
    outline: a connector led along it doubles the stroke.  On all of the
    ``face`` a connector is the shortest pen step between the features it
    joins."""
    return np.where(face, 0.0, strength) if face.any() else strength


def pull_string(pts: NDArray[np.float64], cost: NDArray[np.float64]) -> NDArray[np.float64]:
    """A grid geodesic pulled taut: each run of the pixel path is replaced by
    the straight segment between its ends wherever the segment costs no more
    (``cost`` integrated along it) than the run.  An 8-connected path over
    even cost is a staircase of straight and diagonal steps (a pen stroke
    with a jog in it); pulled taut it is the straight line, and over uneven
    cost it still bends where the cheap line does."""
    if len(pts) < 3:
        return pts
    h, w = cost.shape

    def seg_cost(a: NDArray[np.float64], b: NDArray[np.float64]) -> float:
        n = max(2, int(np.ceil(np.hypot(*(b - a)) / 0.5)) + 1)
        t = np.linspace(0.0, 1.0, n)[:, None]
        q = a + t * (b - a)
        r = np.clip(np.round(q[:, 0]).astype(int), 0, h - 1)
        c = np.clip(np.round(q[:, 1]).astype(int), 0, w - 1)
        v = cost[r, c]
        return float(0.5 * (v[1:] + v[:-1]).sum() * np.hypot(*(b - a)) / (n - 1))

    steps = np.array([seg_cost(pts[i], pts[i + 1]) for i in range(len(pts) - 1)])
    run = np.concatenate([[0.0], np.cumsum(steps)])
    out = [pts[0]]
    i = 0
    while i < len(pts) - 1:
        j = i + 1
        while j + 1 < len(pts) and seg_cost(pts[i], pts[j + 1]) <= (run[j + 1] - run[i]) * (1.0 + 1e-9):
            j += 1
        out.append(pts[j])
        i = j
    out = np.asarray(out)
    return uniform(out, 1.0) if len(out) >= 2 else out


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
            on = bridge_side(q, prof, nose, on)
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


def bridge_side(
    q: NDArray[np.float64], prof: NDArray[np.float64], nose: NDArray[np.bool_], marked: NDArray[np.bool_]
) -> NDArray[np.bool_]:
    """The points of a stroke ``q`` (along the nose's outline) an artist
    draws: the side of the bridge, its wings and base (``wing_end``), and
    the rest of it below the root where the image ``marked`` it; never the
    bridge's root (``lower_nose``).  A stroke off the nose's rim keeps
    ``marked``.

    The nose is skin, and its front is unmarked; its form is told by one side
    of the bridge, down to the wing: the shadowed side, which the image
    marks more (the larger mean ``prof``).  A side point lies
    on the nose's rim and runs along the nose's long axis (its tangent nearer
    the axis than across it: the top and the base run across); of the two
    sides' points, those of the more marked side are returned."""
    h, w = nose.shape
    r = np.clip(np.round(q[:, 0]).astype(int), 0, h - 1)
    c = np.clip(np.round(q[:, 1]).astype(int), 0, w - 1)
    rim = ndi.binary_dilation(nose, iterations=2)[r, c] & ~ndi.binary_erosion(nose, iterations=2)[r, c]
    if rim.mean() < 0.5:
        return marked
    comp, _ = ndi.label(nose)
    k = np.bincount(comp[r, c][rim]).argmax() if (comp[r, c][rim] > 0).any() else 0
    pix = np.argwhere(comp == k) if k else np.argwhere(nose)
    centre = pix.mean(axis=0)
    evals, evecs = np.linalg.eigh(np.cov((pix - centre).T))
    axis = evecs[:, -1]
    across = np.array([-axis[1], axis[0]])
    t = np.gradient(q, axis=0)
    t /= np.maximum(np.hypot(t[:, 0], t[:, 1]), 1e-9)[:, None]
    lower = lower_nose(q, pix, centre, axis, across)
    along = rim & (np.abs(t @ axis) >= 0.5) & lower
    s = (q - centre) @ across
    sides = [along & (s < 0), along & (s > 0)]
    marks = [float(prof[m].mean()) if m.any() else -np.inf for m in sides]
    drawn = sides[int(np.argmax(marks))] | (rim & wing_end(q, pix, centre, axis, across))
    return drawn | (marked & (lower | ~rim))


BRIDGE_DRAWN_FRACTION = 0.8
"""Of the nose's length, the share at its wide end along which the bridge's
side is drawn: from the wing up to the level of the eyes' inner corners, the
line by which a drawing tells a nose from a cheek.  Its root, the top fifth,
lies between the brows: drawn there, the side runs on into a brow as one
stroke (a scowl), and an artist leaves the gap."""


GLABELLA_REACH = 0.6
"""How far above the nose's narrow end (in nose lengths) its midline runs on
between the brows."""


def glabella(nose: NDArray[np.bool_]) -> NDArray[np.bool_]:
    """The face's midline above the drawn nose: from the top of the nose's
    drawn part (``lower_nose``) up its axis, through the bridge and on between
    the brows (``GLABELLA_REACH``), three pixels wide.

    The two sides of a face are joined through the nose, never straight
    across its bridge: a connector from brow to brow over the glabella is a
    unibrow, and from a brow down the bridge's root a scowl.  A connector may
    cross this line only at the cost of leaving the subject."""
    out = np.zeros_like(nose)
    comp, n = ndi.label(nose)
    h, w = nose.shape
    for k in range(1, n + 1):
        pix = np.argwhere(comp == k)
        if len(pix) < 3:
            continue
        centre = pix.mean(axis=0)
        axis = np.linalg.eigh(np.cov((pix - centre).T))[1][:, -1]
        across = np.array([-axis[1], axis[0]])
        a = (pix - centre) @ axis
        b = (pix - centre) @ across
        lo, hi = float(a.min()), float(a.max())
        span = hi - lo
        if span <= 1e-9:
            continue
        probe = WING_FRACTION * span
        wide_hi = np.ptp(b[a >= hi - probe]) >= np.ptp(b[a <= lo + probe])
        # Walk up from the drawn part's top to past the narrow end.
        start = hi - BRIDGE_DRAWN_FRACTION * span if wide_hi else lo + BRIDGE_DRAWN_FRACTION * span
        end = lo - GLABELLA_REACH * span if wide_hi else hi + GLABELLA_REACH * span
        t = np.linspace(start, end, int(abs(end - start)) * 2 + 2)
        pts = centre + t[:, None] * axis
        r = np.round(pts[:, 0]).astype(int)
        c = np.round(pts[:, 1]).astype(int)
        ok = (r >= 0) & (r < h) & (c >= 0) & (c < w)
        out[r[ok], c[ok]] = True
    return ndi.binary_dilation(out) if out.any() else out


def upper_nose(nose: NDArray[np.bool_]) -> NDArray[np.bool_]:
    """The pixels of each nose (a component of ``nose``) off its drawn part
    (``lower_nose``): the bridge's root, between the brows."""
    out = np.zeros_like(nose)
    comp, n = ndi.label(nose)
    for k in range(1, n + 1):
        pix = np.argwhere(comp == k)
        if len(pix) < 3:
            continue
        centre = pix.mean(axis=0)
        evecs = np.linalg.eigh(np.cov((pix - centre).T))[1]
        axis = evecs[:, -1]
        across = np.array([-axis[1], axis[0]])
        lower = lower_nose(pix.astype(np.float64), pix, centre, axis, across)
        out[pix[~lower, 0], pix[~lower, 1]] = True
    return out


def lower_nose(
    q: NDArray[np.float64],
    pix: NDArray[np.int_],
    centre: NDArray[np.float64],
    axis: NDArray[np.float64],
    across: NDArray[np.float64],
) -> NDArray[np.bool_]:
    """The points of ``q`` on the nose's drawn part (``BRIDGE_DRAWN_FRACTION``
    of its length from the wings)."""
    return _wide_end(q, pix, centre, axis, across, BRIDGE_DRAWN_FRACTION)


WING_FRACTION = 0.3
"""The wings and base of a nose: this fraction of its length at its wide end."""


def wing_end(
    q: NDArray[np.float64],
    pix: NDArray[np.int_],
    centre: NDArray[np.float64],
    axis: NDArray[np.float64],
    across: NDArray[np.float64],
) -> NDArray[np.bool_]:
    """The points of ``q`` on the nose's wide end (``WING_FRACTION`` of its
    length): its wings and base, which an artist draws whole whatever the
    light (the bridge is narrow, the wings flare), read from the nose's own
    shape, so the face's orientation does not matter."""
    return _wide_end(q, pix, centre, axis, across, WING_FRACTION)


def _wide_end(
    q: NDArray[np.float64],
    pix: NDArray[np.int_],
    centre: NDArray[np.float64],
    axis: NDArray[np.float64],
    across: NDArray[np.float64],
    fraction: float,
) -> NDArray[np.bool_]:
    """The points of ``q`` within ``fraction`` of the nose's length of its
    wide end (the wings: the bridge is narrow), read from the nose's own
    shape, so the face's orientation does not matter."""
    a = (pix - centre) @ axis
    b = (pix - centre) @ across
    lo, hi = float(a.min()), float(a.max())
    span = hi - lo
    if span <= 1e-9:
        return np.zeros(len(q), bool)
    probe = WING_FRACTION * span
    top, bottom = a <= lo + probe, a >= hi - probe
    width_top = float(np.ptp(b[top])) if top.any() else 0.0
    width_bottom = float(np.ptp(b[bottom])) if bottom.any() else 0.0
    cut = fraction * span
    s = (q - centre) @ axis
    return s >= hi - cut if width_bottom >= width_top else s <= lo + cut


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
    the parser did not label, drawn by its lid line instead), nor on the
    bridge's root (``upper_nose``: the bridge's shade there runs up into
    the brows); off the skin (hair, clothes, a faceless subject) all of it
    is."""
    if not form.any():
        return ink
    on_form = ink & form
    if missed is not None:
        on_form &= ~missed
    if nose.any():
        on_form &= ~ndi.binary_dilation(upper_nose(nose), iterations=max(1, int(round(width))))
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


def drop_faint_twigs(graph: StrokeGraph, lab: NDArray[np.float64], width: float) -> StrokeGraph:
    """Drop the learned lines that end in the open and that the image barely
    marks (``line_contrast`` under ``CONTRAST_DELTA_E``), to a fixed point.

    Around a person (a confirmed face) the learned lines draw the hair and
    the clothes, whose edges against each other and the skin the parser and
    the silhouette already draw.  A line an artist draws there to a free end
    (a seam running out, a necklace) is one the image marks; a faint stroke
    that hangs off the drawing and stops nowhere is a fold's shading or a
    strand's sheen, and reads as a spur.  A closed stroke, and a stroke
    between two junctions, carries the drawing on and is kept.  On a faceless
    subject the learned lines are its only interior and part of its edge
    (grey fur on a grey cushion is as faint as a fold), so it is not applied
    there."""
    while True:
        deg = graph.degree()
        drop = {
            k
            for k, e in enumerate(graph.edges)
            if e.layer == LINES
            and e.u != e.v
            and (deg[e.u] == 1 or deg[e.v] == 1)
            and line_contrast(e.pts, lab, width) < CONTRAST_DELTA_E
        }
        if not drop:
            return graph
        keep = [k for k in range(len(graph.edges)) if k not in drop]
        graph = dissolve_degree_two(compact(StrokeGraph(graph.nodes, [graph.edges[k] for k in keep])))


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
