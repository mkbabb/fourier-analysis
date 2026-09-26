"""The stroke graph: every source of lines composed into one planar drawing.

A drawing is a graph, not a bag of curves: a hairline meets the silhouette, an
iris arc ends on the lids, the nose bridge runs into the nose.  Each source
(the silhouette, the landmark feature lines, the parser's region boundaries,
the learned line drawing) is a *layer* of thin raster ink, in priority order.

1. :func:`compose_layers` -- layers are laid down in priority order; ink of a
   later layer within ``suppress_px`` of ink already down repeats it and is
   dropped (the parser's hair edge running beside the silhouette, the line
   drawing's outline of the whole subject).
2. :func:`skeleton_graph` -- the ink is thinned to a one-pixel skeleton and
   read as a graph: junction clusters and ends are nodes, the pixel chains
   between them edges.
3. Clean-up, all structural: spurs shorter than ``spur_px`` hanging off a
   junction are pruned; degree-2 nodes are merged away; a free end that stops
   within ``snap_px`` of other ink, heading towards it, is joined to it (what
   suppression cut at a crossing, or a boundary that stops a hair short of the
   silhouette); components shorter than their layer's minimum are dropped.
4. :func:`smooth_graph` -- each edge is smoothed along its arc length with its
   end nodes pinned, so junctions stay exactly shared.
5. :func:`graph_trails` -- the edges chained into pen strokes (straightest
   continuation through a junction), the contours the pipeline returns.
   Every junction is a vertex the strokes share exactly, so
   ``shortest_tour.build_contour_tour`` recovers the same graph.

Coordinates are ``(row, col)`` pixels throughout.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from numpy.typing import NDArray
from scipy import ndimage as ndi
from scipy.spatial import KDTree  # type: ignore[import-untyped]
from skimage.draw import line as draw_line
from skimage.morphology import skeletonize

_OFFSETS = ((-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1))


@dataclass
class Layer:
    """One source of ink.  ``min_component_px``: a graph component whose best
    layer is this one and whose total length is below it is dropped."""

    name: str
    ink: NDArray[np.bool_]
    min_component_px: float = 0.0


@dataclass
class Edge:
    u: int
    v: int
    pts: NDArray[np.float64]  # (n, 2) row/col, pts[0] at node u, pts[-1] at node v
    layer: int
    rank: float = 0.0  # within a layer, lower is drawn first (see graph_trails)

    @property
    def length(self) -> float:
        return float(np.hypot(*np.diff(self.pts, axis=0).T).sum())


@dataclass
class StrokeGraph:
    nodes: list[NDArray[np.float64]] = field(default_factory=list)
    edges: list[Edge] = field(default_factory=list)

    def add_node(self, p: NDArray[np.float64]) -> int:
        self.nodes.append(np.asarray(p, dtype=np.float64))
        return len(self.nodes) - 1

    def degrees(self) -> NDArray[np.int64]:
        deg = np.zeros(len(self.nodes), dtype=np.int64)
        for e in self.edges:
            deg[e.u] += 1
            deg[e.v] += 1
        return deg

    def incident(self) -> list[list[int]]:
        inc: list[list[int]] = [[] for _ in self.nodes]
        for i, e in enumerate(self.edges):
            inc[e.u].append(i)
            if e.v != e.u:
                inc[e.v].append(i)
        return inc


# ---------------------------------------------------------------------------
# Rasterising
# ---------------------------------------------------------------------------


def rasterize(polylines: list[NDArray[np.float64]], shape: tuple[int, int]) -> NDArray[np.bool_]:
    """Thin (8-connected) raster of ``(row, col)`` polylines, clipped to ``shape``."""
    out = np.zeros(shape, dtype=bool)
    h, w = shape
    for pts in polylines:
        if len(pts) < 2:
            continue
        q = np.round(pts).astype(np.int64)
        for (r0, c0), (r1, c1) in zip(q[:-1], q[1:]):
            rr, cc = draw_line(int(r0), int(c0), int(r1), int(c1))
            ok = (rr >= 0) & (rr < h) & (cc >= 0) & (cc < w)
            out[rr[ok], cc[ok]] = True
    return out


def compose_layers(layers: list[Layer], shape: tuple[int, int], suppress_px: float) -> NDArray[np.int16]:
    """Per-pixel layer index (-1 = no ink).  A later layer's ink within
    ``suppress_px`` of earlier ink is dropped as a repeat of it."""
    canvas = np.full(shape, -1, dtype=np.int16)
    for i, layer in enumerate(layers):
        ink = layer.ink & (canvas < 0)
        if not ink.any():
            continue
        if (canvas >= 0).any():
            ink &= ndi.distance_transform_edt(canvas < 0) > suppress_px
        canvas[ink] = i
    return canvas


# ---------------------------------------------------------------------------
# Skeleton -> graph
# ---------------------------------------------------------------------------


def skeleton_graph(canvas: NDArray[np.int16]) -> StrokeGraph:
    """Thin the ink to a skeleton and read it as a graph (see module doc)."""
    ink = canvas >= 0
    graph = StrokeGraph()
    if not ink.any():
        return graph
    # Close the diagonal gaps a thin raster leaves where strokes cross.
    sk = skeletonize(ndi.binary_dilation(ink, structure=np.ones((3, 3), bool)))
    # Each skeleton pixel takes the layer of the nearest composed ink.
    _, (ir, ic) = ndi.distance_transform_edt(~ink, return_indices=True)
    layer_of = canvas[ir, ic]

    h, w = sk.shape
    padded = np.pad(sk, 1)
    count = sum(
        np.roll(np.roll(padded, -dr, 0), -dc, 1) for dr, dc in _OFFSETS
    )[1:-1, 1:-1] * sk
    is_node = sk & (count != 2)
    node_lab, n_nodes = ndi.label(is_node, structure=np.ones((3, 3), bool))
    if n_nodes:
        cents = ndi.center_of_mass(is_node, node_lab, index=np.arange(1, n_nodes + 1))
        for c in cents:
            graph.add_node(np.array(c))

    visited = np.zeros_like(sk)

    def neighbours(r: int, c: int) -> list[tuple[int, int]]:
        out = []
        for dr, dc in _OFFSETS:
            rr, cc = r + dr, c + dc
            if 0 <= rr < h and 0 <= cc < w and sk[rr, cc]:
                out.append((rr, cc))
        return out

    def trace(start_node: int, first: tuple[int, int], prev: tuple[int, int]) -> None:
        chain = [first]
        visited[first] = True
        cur = first
        end_node = -1
        while True:
            nxt = [p for p in neighbours(*cur) if p != prev and not (visited[p] and not is_node[p])]
            nodes_next = [p for p in nxt if is_node[p]]
            if nodes_next:
                end_node = int(node_lab[nodes_next[0]]) - 1
                break
            nxt = [p for p in nxt if not visited[p]]
            if not nxt:
                break
            prev, cur = cur, nxt[0]
            visited[cur] = True
            chain.append(cur)
        if end_node < 0:  # a dead chain (cannot happen in a clean skeleton): end it here
            end_node = graph.add_node(np.array(chain[-1], dtype=np.float64))
            chain = chain[:-1] or chain
        pts = np.vstack([graph.nodes[start_node], np.array(chain, dtype=np.float64),
                         graph.nodes[end_node]])
        layers = layer_of[tuple(np.array(chain).T)]
        graph.edges.append(Edge(start_node, end_node, pts, int(np.bincount(layers).argmax())))

    node_pixels = np.argwhere(is_node)
    for r, c in node_pixels:
        u = int(node_lab[r, c]) - 1
        for q in neighbours(int(r), int(c)):
            if is_node[q]:
                continue
            if not visited[q]:
                trace(u, q, (int(r), int(c)))

    # Pure cycles (no node pixel): make one pixel a node and trace around.
    rest = sk & ~visited & ~is_node
    while rest.any():
        r, c = (int(x) for x in np.argwhere(rest)[0])
        u = graph.add_node(np.array([r, c], dtype=np.float64))
        visited[r, c] = True
        nb = [p for p in neighbours(r, c) if not visited[p]]
        if nb:
            chain = [(r, c)]
            cur, prev = nb[0], (r, c)
            while True:
                visited[cur] = True
                chain.append(cur)
                nxt = [p for p in neighbours(*cur) if p != prev and not visited[p]]
                if not nxt:
                    break
                prev, cur = cur, nxt[0]
            pts = np.vstack([np.array(chain, dtype=np.float64), graph.nodes[u]])
            layers = layer_of[tuple(np.array(chain).T)]
            graph.edges.append(Edge(u, u, pts, int(np.bincount(layers).argmax())))
        rest = sk & ~visited & ~is_node
    return graph


# ---------------------------------------------------------------------------
# Clean-up
# ---------------------------------------------------------------------------


def _compact(graph: StrokeGraph) -> StrokeGraph:
    """Drop nodes no edge uses and renumber."""
    used = sorted({e.u for e in graph.edges} | {e.v for e in graph.edges})
    remap = {old: new for new, old in enumerate(used)}
    return StrokeGraph(
        nodes=[graph.nodes[i] for i in used],
        edges=[Edge(remap[e.u], remap[e.v], e.pts, e.layer, e.rank) for e in graph.edges],
    )


def prune_spurs(graph: StrokeGraph, spur_px: float) -> StrokeGraph:
    """Remove short dead-end edges hanging off junctions and tiny self-loops,
    then merge degree-2 nodes; repeated until stable."""
    while True:
        deg = graph.degrees()
        keep = []
        changed = False
        for e in graph.edges:
            if e.u == e.v and e.length < 2 * spur_px and deg[e.u] > 2:
                changed = True
                continue
            leaf = (deg[e.u] == 1 and deg[e.v] >= 3) or (deg[e.v] == 1 and deg[e.u] >= 3)
            if leaf and e.length < spur_px:
                changed = True
                continue
            keep.append(e)
        graph.edges = keep
        merged = merge_degree_two(graph)
        if not changed and not merged:
            return _compact(graph)


def merge_degree_two(graph: StrokeGraph) -> bool:
    """Join the two edges at every degree-2 node (not a self-loop's)."""
    merged_any = False
    while True:
        inc = graph.incident()
        target = -1
        for n, es in enumerate(inc):
            if len(es) == 2 and es[0] != es[1]:
                a, b = graph.edges[es[0]], graph.edges[es[1]]
                if a.u == a.v or b.u == b.v:
                    continue
                target = n
                break
        if target < 0:
            return merged_any
        i, j = inc[target]
        a, b = graph.edges[i], graph.edges[j]
        pa = a.pts if a.v == target else a.pts[::-1]
        ua = a.u if a.v == target else a.v
        pb = b.pts if b.u == target else b.pts[::-1]
        vb = b.v if b.u == target else b.u
        la, lb = a.length, b.length
        new = Edge(ua, vb, np.vstack([pa, pb[1:]]), a.layer if la >= lb else b.layer,
                   min(a.rank, b.rank))
        graph.edges = [e for k, e in enumerate(graph.edges) if k not in (i, j)] + [new]
        merged_any = True


def _end_tangent(pts: NDArray[np.float64], at_start: bool, reach: float) -> NDArray[np.float64]:
    """Unit vector pointing *out of* the edge at one end, over ``reach`` px of arc."""
    p = pts if at_start else pts[::-1]
    d = np.concatenate([[0.0], np.cumsum(np.hypot(*np.diff(p, axis=0).T))])
    k = int(min(len(p) - 1, np.searchsorted(d, reach)))
    v = p[0] - p[k]
    n = float(np.hypot(*v))
    return v / n if n > 1e-9 else np.zeros(2)


def split_edge(graph: StrokeGraph, ei: int, cuts: list[int]) -> dict[int, int]:
    """Split edge ``ei`` at interior point indices ``cuts``; returns index->node."""
    e = graph.edges[ei]
    cuts = sorted({c for c in cuts if 0 < c < len(e.pts) - 1})
    out = {0: e.u, len(e.pts) - 1: e.v}
    if not cuts:
        return out
    bounds = [0, *cuts, len(e.pts) - 1]
    ids = [e.u] + [graph.add_node(e.pts[c].copy()) for c in cuts] + [e.v]
    for c, n in zip(cuts, ids[1:-1]):
        out[c] = n
    pieces = [Edge(ids[k], ids[k + 1], e.pts[bounds[k]: bounds[k + 1] + 1].copy(), e.layer, e.rank)
              for k in range(len(bounds) - 1)]
    graph.edges[ei] = pieces[0]
    graph.edges.extend(pieces[1:])
    return out


def snap_ends(graph: StrokeGraph, snap_px: float, max_turn_deg: float = 75.0) -> StrokeGraph:
    """Join each free end to the nearest other ink within ``snap_px`` that lies
    ahead of it (within ``max_turn_deg`` of its heading)."""
    deg = graph.degrees()
    ends = [n for n in range(len(graph.nodes)) if deg[n] == 1]
    if not ends or not graph.edges:
        return graph
    owner = {}
    for i, e in enumerate(graph.edges):
        if deg[e.u] == 1:
            owner[e.u] = (i, True)
        if deg[e.v] == 1:
            owner[e.v] = (i, False)
    pts = np.vstack([e.pts for e in graph.edges])
    eid = np.concatenate([np.full(len(e.pts), i) for i, e in enumerate(graph.edges)])
    idx = np.concatenate([np.arange(len(e.pts)) for e in graph.edges])
    tree = KDTree(pts)
    cos_lim = np.cos(np.radians(max_turn_deg))
    requests: list[tuple[int, int, int]] = []  # (end node, edge, point index)
    for n in ends:
        ei, at_start = owner[n]
        heading = _end_tangent(graph.edges[ei].pts, at_start, snap_px)
        p = graph.nodes[n]
        best = None
        for k in tree.query_ball_point(p, snap_px):
            if eid[k] == ei:
                continue
            v = pts[k] - p
            d = float(np.hypot(*v))
            if d < 1e-9 or float(v @ heading) / d < cos_lim:
                continue
            if best is None or d < best[0]:
                best = (d, int(eid[k]), int(idx[k]))
        if best is not None:
            requests.append((n, best[1], best[2]))
    if not requests:
        return graph
    # Mutual snaps between two free ends join once.
    seen: set[tuple[int, int]] = set()
    by_edge: dict[int, list[int]] = {}
    final: list[tuple[int, int, int]] = []
    for n, ei, k in requests:
        e = graph.edges[ei]
        target_node = e.u if k == 0 else e.v if k == len(e.pts) - 1 else -1
        if target_node >= 0:
            key = (min(n, target_node), max(n, target_node))
            if key in seen:
                continue
            seen.add(key)
        final.append((n, ei, k))
        by_edge.setdefault(ei, []).append(k)
    node_at = {ei: split_edge(graph, ei, ks) for ei, ks in by_edge.items()}
    for n, ei, k in final:
        m = node_at[ei][k]
        if m == n:
            continue
        src = graph.edges[owner[n][0]]
        graph.edges.append(Edge(n, m, np.vstack([graph.nodes[n], graph.nodes[m]]), src.layer, src.rank))
    merge_degree_two(graph)
    return _compact(graph)


def drop_small_components(graph: StrokeGraph, min_px_by_layer: list[float]) -> StrokeGraph:
    """Drop each component shorter than the minimum of its best (lowest) layer."""
    n = len(graph.nodes)
    parent = list(range(n))

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for e in graph.edges:
        parent[find(e.u)] = find(e.v)
    length: dict[int, float] = {}
    best: dict[int, int] = {}
    for e in graph.edges:
        r = find(e.u)
        length[r] = length.get(r, 0.0) + e.length
        best[r] = min(best.get(r, e.layer), e.layer)
    graph.edges = [
        e for e in graph.edges
        if length[find(e.u)] >= min_px_by_layer[best[find(e.u)]]
    ]
    return _compact(graph)


# ---------------------------------------------------------------------------
# Smoothing and pen strokes
# ---------------------------------------------------------------------------


def _resample_uniform(p: NDArray[np.float64], step: float = 1.0) -> NDArray[np.float64]:
    d = np.concatenate([[0.0], np.cumsum(np.hypot(*np.diff(p, axis=0).T))])
    if d[-1] <= step:
        return p
    t = np.linspace(0.0, d[-1], max(2, int(np.ceil(d[-1] / step)) + 1))
    return np.column_stack([np.interp(t, d, p[:, 0]), np.interp(t, d, p[:, 1])])


def smooth_graph(graph: StrokeGraph, sigma_px: float) -> StrokeGraph:
    """Gaussian-smooth each edge along its arc (1 px samples), ends pinned:
    an open edge is point-reflected at its ends, a self-loop wraps."""
    from fourier_analysis.contours.processing import _douglas_peucker

    for e in graph.edges:
        p = _resample_uniform(e.pts)
        if len(p) >= 5:
            if e.u == e.v:
                q = ndi.gaussian_filter1d(p[:-1], sigma_px, axis=0, mode="wrap")
                p = np.vstack([q, q[:1]])
            else:
                k = min(len(p) - 1, int(np.ceil(3 * sigma_px)))
                pad = np.vstack([2 * p[0] - p[k:0:-1], p, 2 * p[-1] - p[-2: -k - 2: -1]])
                p = ndi.gaussian_filter1d(pad, sigma_px, axis=0, mode="nearest")[k: k + len(p)]
        p[0] = graph.nodes[e.u]
        p[-1] = graph.nodes[e.v]
        z = p[:, 1] + 1j * p[:, 0]
        if len(z) > 3 and e.u != e.v:
            p = p[_douglas_peucker(z, 0.2)]
        elif len(z) > 4:
            far = int(np.argmax(np.abs(z - z[0])))
            keep = np.zeros(len(z), dtype=bool)
            keep[: far + 1] |= _douglas_peucker(z[: far + 1], 0.2)
            keep[far:] |= _douglas_peucker(z[far:], 0.2)
            p = p[keep]
        e.pts = p
    return graph


@dataclass(frozen=True)
class Trail:
    pts: NDArray[np.float64]  # row/col; closed trails repeat the first point last
    layer: int
    length: float
    rank: float = 0.0


def graph_trails(graph: StrokeGraph, max_turn_deg: float = 180.0) -> list[Trail]:
    """Chain edges into pen strokes: from the most important unused edge
    (lowest layer, then lowest rank, then longest), extend both ways through each node along the
    straightest unused edge turning less than ``max_turn_deg`` (by default
    any: the pen never lifts where it need not, so a connected drawing is as
    few strokes as its odd junctions allow)."""
    inc = graph.incident()
    used = [False] * len(graph.edges)
    order = sorted(range(len(graph.edges)),
                   key=lambda i: (graph.edges[i].layer, graph.edges[i].rank, -graph.edges[i].length))
    cos_lim = np.cos(np.radians(max_turn_deg)) - 1e-9

    def oriented(i: int, from_node: int) -> NDArray[np.float64]:
        e = graph.edges[i]
        return e.pts if e.u == from_node else e.pts[::-1]

    def extend(pts: NDArray[np.float64], node: int) -> tuple[NDArray[np.float64], int]:
        while True:
            heading = -_end_tangent(pts, False, 6.0)  # direction of travel at the end
            best, best_cos = -1, cos_lim
            for j in inc[node]:
                if used[j]:
                    continue
                q = oriented(j, node)
                out = -_end_tangent(q, True, 6.0)  # direction leaving the node
                c = float(heading @ out)
                if c > best_cos:
                    best, best_cos = j, c
            if best < 0:
                return pts, node
            used[best] = True
            q = oriented(best, node)
            e = graph.edges[best]
            node = e.v if e.u == node else e.u
            pts = np.vstack([pts, q[1:]])

    trails = []
    for i in order:
        if used[i]:
            continue
        used[i] = True
        e = graph.edges[i]
        pts, end = extend(e.pts, e.v)
        if end != e.u:  # not closed: extend backwards from the start too
            back, _ = extend(pts[::-1], e.u)
            pts = back[::-1]
        length = float(np.hypot(*np.diff(pts, axis=0).T).sum())
        trails.append(Trail(pts, e.layer, length, e.rank))
    return trails


def edge_values(graph: StrokeGraph, field_: NDArray[np.float64]) -> list[float]:
    """Mean of ``field_`` sampled along each edge (1 px steps)."""
    h, w = field_.shape
    out = []
    for e in graph.edges:
        p = np.round(_resample_uniform(e.pts)).astype(np.int64)
        r, c = np.clip(p[:, 0], 0, h - 1), np.clip(p[:, 1], 0, w - 1)
        out.append(float(field_[r, c].mean()))
    return out


def select_layer_edges(
    graph: StrokeGraph,
    layer: int,
    score: list[float],
    budget_px: float,
    seed: float,
    grow: float,
) -> StrokeGraph:
    """Hysteresis over ``layer``'s edges (junction to junction): an edge
    scoring at least ``seed`` starts a line, and the line grows through its
    junctions into edges scoring at least ``grow`` -- a line that fades along
    part of its length (a lid into shadow) is kept whole, while faint texture
    touching nothing strong is not.  Seeds are taken strongest first, and
    growth is best-first, while the kept length stays within ``budget_px``.
    Each kept edge's ``rank`` is its negated score, so pen strokes are ordered
    by salience too (``graph_trails``).  Other layers are untouched."""
    import heapq

    inc = graph.incident()
    cand = {i for i, e in enumerate(graph.edges) if e.layer == layer and score[i] >= grow}
    keep: set[int] = set()
    used = 0.0
    seeds = sorted((i for i in cand if score[i] >= seed), key=lambda i: -score[i])
    for s0 in seeds:
        if s0 in keep:
            continue
        heap = [(-score[s0], s0)]
        while heap:
            _, i = heapq.heappop(heap)
            if i in keep:
                continue
            length = graph.edges[i].length
            if used + length > budget_px:
                continue
            keep.add(i)
            used += length
            graph.edges[i].rank = -score[i]
            e = graph.edges[i]
            for n in (e.u, e.v):
                for j in inc[n]:
                    if j in cand and j not in keep:
                        heapq.heappush(heap, (-score[j], j))
    graph.edges = [e for i, e in enumerate(graph.edges) if e.layer != layer or i in keep]
    merge_degree_two(graph)
    return _compact(graph)


def keep_components(graph: StrokeGraph, ceiling: int) -> StrokeGraph:
    """Keep at most ``ceiling`` connected components (the pieces drawn between
    pen lifts), the most important first: lowest layer, then lowest rank,
    then longest."""
    n = len(graph.nodes)
    parent = list(range(n))

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for e in graph.edges:
        parent[find(e.u)] = find(e.v)
    key: dict[int, list[float]] = {}
    for e in graph.edges:
        r = find(e.u)
        k = key.setdefault(r, [float(e.layer), e.rank, 0.0])
        k[0] = min(k[0], e.layer)
        k[1] = min(k[1], e.rank)
        k[2] -= e.length
    if len(key) <= ceiling:
        return graph
    kept = set(sorted(key, key=lambda r: tuple(key[r]))[:ceiling])
    graph.edges = [e for e in graph.edges if find(e.u) in kept]
    return _compact(graph)
