"""The stroke graph: strokes are edges, the points where they end or meet are
nodes, and every stroke starts and ends exactly on its nodes' positions, so
``shortest_tour`` recovers the same graph from the polylines.

Coordinates are pixel ``(row, col)`` (pixel centres at integers) until
``StrokeGraph.polylines`` converts to the pipeline's centred complex plane
(x right, y up).  Every edge carries the *layer* it came from
(``SILHOUETTE`` < ``PARTS`` < ``LINES`` < ``CONNECT``, the priority order
of ``contours.drawing``); edges of different layers are never merged into
one.

Two ways in:

**Part boundaries** (``boundary_graph``).  The boundary between two parts of a
label map is traced on the pixel *cracks* (the edges between pixel corners),
so a boundary two parts share is one crack chain, never two parallel traces.
Crack corners where three or more parts meet are the nodes.  Clean-up, in
units of the image diagonal: chains shorter than ``CONTRACT_PX`` between two
nodes are contracted; spurs shorter than ``SPUR_FRACTION`` are pruned; free
loops shorter than ``LOOP_FRACTION`` are dropped; each chain is smoothed by an
arc-length Gaussian of ``SMOOTH_FRACTION`` (the crack staircase is half a pixel
deep), its ends pinned, and resampled every ``STEP_PX``.  A chain along the
subject's edge (against ``background``) is the silhouette.

**A raster line drawing** (``vectorise``).  Ink is binarised with its fills
resolved (``binarise``: a small compact fill is drawn by its outline, a large
or ragged one is tone and left out), skeletonised, and traced into a pixel
graph (``trace_graph``); spurs shorter than a few line widths are pruned
(``prune_spurs``) and each stroke end that points at other ink within a gap
is bridged to it along its own direction (``bridge_gaps``).
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Callable

import numpy as np
from numpy.typing import NDArray
from scipy import ndimage as ndi
from scipy.spatial import cKDTree

SILHOUETTE, PARTS, LINES, CONNECT = 0, 1, 2, 3

CONTRACT_PX = 3.0
SPUR_FRACTION = 0.012
LOOP_FRACTION = 0.02
SMOOTH_FRACTION = 0.002
MIN_SMOOTH_PX = 1.5
STEP_PX = 1.5

FILL_COMPACTNESS = 0.3
"""A fill at least this compact (``4 pi A / P^2``) is an object drawn by its
outline; a raggeder one is tone."""
FILL_MAX_FRACTION = 0.01
"""A fill larger than this fraction of the image is a mass of shadow (dark
hair, a black coat), not an object: tone."""

_NEIGHBOURS = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


# ---------------------------------------------------------------------------
# The graph
# ---------------------------------------------------------------------------


@dataclass
class Edge:
    u: int
    v: int
    pts: NDArray[np.float64]  # (n, 2) row/col; pts[0] at node u, pts[-1] at node v
    layer: int

    @property
    def length(self) -> float:
        return edge_length(self.pts)


@dataclass
class StrokeGraph:
    nodes: list[NDArray[np.float64]] = field(default_factory=list)
    edges: list[Edge] = field(default_factory=list)

    def add_node(self, p: NDArray[np.float64]) -> int:
        self.nodes.append(np.asarray(p, dtype=np.float64).copy())
        return len(self.nodes) - 1

    def degree(self) -> NDArray[np.int64]:
        deg = np.zeros(len(self.nodes), dtype=np.int64)
        for e in self.edges:
            deg[e.u] += 1
            deg[e.v] += 1
        return deg

    def components(self) -> list[list[int]]:
        """Edge indices grouped by connected component."""
        parent = list(range(len(self.nodes)))

        def find(i: int) -> int:
            while parent[i] != i:
                parent[i] = parent[parent[i]]
                i = parent[i]
            return i

        for e in self.edges:
            ra, rb = find(e.u), find(e.v)
            if ra != rb:
                parent[ra] = rb
        groups: dict[int, list[int]] = {}
        for k, e in enumerate(self.edges):
            groups.setdefault(find(e.u), []).append(k)
        return list(groups.values())

    def subgraph(self, keep: list[int] | set[int]) -> StrokeGraph:
        return compact(StrokeGraph(self.nodes, [self.edges[k] for k in sorted(keep)]))

    def merged(self, other: StrokeGraph) -> StrokeGraph:
        """Both graphs' edges on one node list (no nodes are shared yet)."""
        off = len(self.nodes)
        return StrokeGraph(
            self.nodes + other.nodes,
            self.edges + [Edge(e.u + off, e.v + off, e.pts, e.layer) for e in other.edges],
        )

    def polylines(self, shape: tuple[int, int]) -> list[NDArray[np.complex128]]:
        """Edges in pipeline coordinates (centred, y up)."""
        cy, cx = shape[0] / 2, shape[1] / 2
        return [(e.pts[:, 1] - cx) + 1j * (cy - e.pts[:, 0]) for e in self.edges]


def edge_length(p: NDArray[np.float64]) -> float:
    return float(np.hypot(*np.diff(p, axis=0).T).sum()) if len(p) > 1 else 0.0


def compact(graph: StrokeGraph) -> StrokeGraph:
    """Drop unused nodes; renumber."""
    used = sorted({e.u for e in graph.edges} | {e.v for e in graph.edges})
    remap = {old: new for new, old in enumerate(used)}
    return StrokeGraph(
        nodes=[graph.nodes[i] for i in used],
        edges=[Edge(remap[e.u], remap[e.v], e.pts, e.layer) for e in graph.edges],
    )


def dissolve_degree_two(graph: StrokeGraph) -> StrokeGraph:
    """Merge the two edges at every node of degree two into one stroke, when
    both are of one layer (a layer's strokes stay its own)."""
    edges: dict[int, Edge] = dict(enumerate(graph.edges))
    inc: dict[int, list[int]] = {}
    for k, e in edges.items():
        inc.setdefault(e.u, []).append(k)
        inc.setdefault(e.v, []).append(k)  # a self-loop is listed twice

    def mergeable(n: int) -> bool:
        ks = inc.get(n, [])
        return len(ks) == 2 and ks[0] != ks[1] and edges[ks[0]].layer == edges[ks[1]].layer

    stack = [n for n in inc if mergeable(n)]
    while stack:
        n = stack.pop()
        if not mergeable(n):
            continue
        i, j = inc[n]
        a, b = edges[i], edges[j]
        ai, bi, pi = (a.u, a.v, a.pts) if a.v == n else (a.v, a.u, a.pts[::-1])
        aj, bj, pj = (b.u, b.v, b.pts) if b.u == n else (b.v, b.u, b.pts[::-1])
        edges[i] = Edge(ai, bj, np.vstack([pi, pj[1:]]), a.layer)
        del edges[j]
        inc[n] = []
        inc[bj] = [i if k == j else k for k in inc[bj]]
        if mergeable(bj):
            stack.append(bj)
    return compact(StrokeGraph(graph.nodes, list(edges.values())))


def rasterize(graph: StrokeGraph, shape: tuple[int, int]) -> NDArray[np.bool_]:
    """The graph's ink, one pixel wide (sampled every half pixel)."""
    out = np.zeros(shape, dtype=bool)
    for e in graph.edges:
        q = uniform(e.pts, 0.5)
        r = np.clip(np.round(q[:, 0]).astype(int), 0, shape[0] - 1)
        c = np.clip(np.round(q[:, 1]).astype(int), 0, shape[1] - 1)
        out[r, c] = True
    return out


def uniform(p: NDArray[np.float64], step: float) -> NDArray[np.float64]:
    s = np.concatenate([[0.0], np.cumsum(np.hypot(*np.diff(p, axis=0).T))])
    if s[-1] <= 0:
        return p.copy()
    t = np.linspace(0.0, s[-1], max(2, int(np.ceil(s[-1] / step)) + 1))
    return np.column_stack([np.interp(t, s, p[:, 0]), np.interp(t, s, p[:, 1])])


# ---------------------------------------------------------------------------
# Part boundaries (crack chains; corner coordinates: real = column, imag = row)
# ---------------------------------------------------------------------------


def boundary_graph(
    labels: NDArray[np.integer],
    drawn: NDArray[np.bool_],
    background: int = 0,
) -> StrokeGraph:
    """The drawn part boundaries of ``labels`` as a stroke graph (module
    docstring); a chain along ``background`` is ``SILHOUETTE``, any other
    ``PARTS``."""
    h, w = labels.shape
    diag = float(math.hypot(h, w))
    chains = _crack_chains(labels, drawn)
    graph = StrokeGraph()
    if not chains:
        return graph
    chains = _clean(chains, spur=SPUR_FRACTION * diag, loop=LOOP_FRACTION * diag)
    sigma = max(MIN_SMOOTH_PX, SMOOTH_FRACTION * diag)
    near_bg = ndi.binary_dilation(labels == background)
    node_of: dict[int, int] = {}
    for c in chains:
        z = _smooth_resample(c.pts, sigma, closed_free=c.free)
        rc = np.column_stack([z.imag - 0.5, z.real - 0.5])
        if len(rc) < 2:
            continue
        r = np.clip(np.round(rc[:, 0]).astype(int), 0, h - 1)
        cc = np.clip(np.round(rc[:, 1]).astype(int), 0, w - 1)
        layer = SILHOUETTE if near_bg[r, cc].mean() >= 0.5 else PARTS
        if c.free:
            u = v = graph.add_node(rc[0])
        else:
            for key, p in ((c.u, rc[0]), (c.v, rc[-1])):
                if key not in node_of:
                    node_of[key] = graph.add_node(p)
            u, v = node_of[c.u], node_of[c.v]
        rc[0], rc[-1] = graph.nodes[u], graph.nodes[v]
        graph.edges.append(Edge(u, v, rc, layer))
    return compact(graph)


def spine_graph(
    labels: NDArray[np.integer], classes: tuple[int, ...], layer: int = PARTS
) -> StrokeGraph:
    """Each component of ``classes`` drawn by its spine: the longest path of
    its skeleton (the skeleton's geodesic diameter), carried on along its end
    directions to the part's own tips, and smoothed over the part's width so
    the skeleton's pixel steps and corner twigs do not show."""
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import dijkstra
    from skimage.morphology import skeletonize

    graph = StrokeGraph()
    for k in classes:
        comp, _ = ndi.label(labels == k)
        for i, sl in enumerate(ndi.find_objects(comp), start=1):
            if sl is None:
                continue
            m = comp[sl] == i
            px = np.argwhere(skeletonize(m))
            if len(px) < 3:
                continue
            a, b = cKDTree(px).query_pairs(1.5, output_type="ndarray").T
            wts = np.hypot(*(px[a] - px[b]).T)
            adj = coo_matrix((np.r_[wts, wts], (np.r_[a, b], np.r_[b, a])), shape=(len(px), len(px))).tocsr()
            d0 = dijkstra(adj, indices=0)
            start = int(np.argmax(np.where(np.isfinite(d0), d0, -1)))
            d1, pred = dijkstra(adj, indices=start, return_predecessors=True)
            end = int(np.argmax(np.where(np.isfinite(d1), d1, -1)))
            path = [end]
            while path[-1] != start and pred[path[-1]] >= 0:
                path.append(int(pred[path[-1]]))
            p = px[path].astype(np.float64)
            if len(p) < 3:
                continue
            width = float(m.sum()) / max(1.0, d1[end])
            p = np.vstack([_to_tip(p[::-1], m, width)[::-1], p[1:-1], _to_tip(p, m, width)])
            q = uniform(p, 1.0)
            if len(q) >= 5:
                sig = max(MIN_SMOOTH_PX, 0.5 * width)
                kk = min(len(q) - 1, int(np.ceil(3 * sig)))
                padded = np.vstack([2 * q[0] - q[kk:0:-1], q, 2 * q[-1] - q[-2 : -kk - 2 : -1]])
                q = ndi.gaussian_filter1d(padded, sig, axis=0, mode="nearest")[kk : kk + len(q)]
            q = q + np.array([sl[0].start, sl[1].start], dtype=np.float64)
            u, v = graph.add_node(q[0]), graph.add_node(q[-1])
            graph.edges.append(Edge(u, v, q, layer))
    return graph


def _to_tip(p: NDArray[np.float64], m: NDArray[np.bool_], width: float) -> NDArray[np.float64]:
    """The spine ``p`` carried on from its last point along its direction
    there (read over a part's width) until it leaves the part ``m``: a
    skeleton stops half a width short of a tapering tip.  Returns the points
    from ``p[-1]`` to the tip."""
    s = np.concatenate([[0.0], np.cumsum(np.hypot(*np.diff(p, axis=0).T))])
    back = int(np.searchsorted(s, s[-1] - max(2.0, width)))
    d = p[-1] - p[min(back, len(p) - 2)]
    n = float(np.hypot(*d))
    out = [p[-1]]
    if n < 1e-9:
        return np.asarray(out)
    d /= n
    h, w = m.shape
    x = p[-1].copy()
    for _ in range(int(np.ceil(2 * width)) + 2):
        x = x + d
        r, c = int(round(x[0])), int(round(x[1]))
        if not (0 <= r < h and 0 <= c < w and m[r, c]):
            break
        out.append(x.copy())
    return np.asarray(out)


class _Chain:
    __slots__ = ("u", "v", "pts", "free")

    def __init__(self, u: int, v: int, pts: NDArray[np.complex128], free: bool = False):
        self.u, self.v, self.pts, self.free = u, v, pts, free

    @property
    def length(self) -> float:
        return float(np.abs(np.diff(self.pts)).sum())


def _crack_chains(labels: NDArray[np.integer], drawn: NDArray[np.bool_]) -> list[_Chain]:
    h, w = labels.shape
    w1 = w + 1
    lab = labels.astype(np.int64)
    n = drawn.shape[0]
    lab = np.clip(lab, 0, n - 1)
    edges = []
    m = drawn[lab[:, :-1], lab[:, 1:]]
    r, c = np.nonzero(m)  # pixels (r, c) | (r, c+1): corners (r, c+1)-(r+1, c+1)
    edges.append(np.stack([r * w1 + c + 1, (r + 1) * w1 + c + 1], 1))
    m = drawn[lab[:-1, :], lab[1:, :]]
    r, c = np.nonzero(m)  # pixels (r, c) / (r+1, c): corners (r+1, c)-(r+1, c+1)
    edges.append(np.stack([(r + 1) * w1 + c, (r + 1) * w1 + c + 1], 1))
    e = np.concatenate(edges)
    if len(e) == 0:
        return []
    ids, inv = np.unique(e, return_inverse=True)
    e = inv.reshape(-1, 2)
    nv = len(ids)
    deg = np.bincount(e.ravel(), minlength=nv)
    ends = e.ravel()
    order = np.argsort(ends, kind="stable")
    start = np.searchsorted(ends[order], np.arange(nv + 1))
    inc_edge = (order // 2).tolist()
    start_l = start.tolist()
    e_l = e.tolist()
    deg_l = deg.tolist()
    rows, cols = np.divmod(ids, w1)
    pos = (cols + 1j * rows).astype(np.complex128)

    visited = [False] * len(e_l)

    def walk(v0: int, e0: int) -> tuple[list[int], int]:
        path = [v0]
        v, ei = v0, e0
        while True:
            visited[ei] = True
            a, b = e_l[ei]
            x = b if a == v else a
            path.append(x)
            if deg_l[x] != 2:
                return path, x
            i0 = start_l[x]
            e1, e2 = inc_edge[i0], inc_edge[i0 + 1]
            nxt = e2 if e1 == ei else e1
            if visited[nxt]:
                return path, x
            v, ei = x, nxt

    chains: list[_Chain] = []
    for v in np.flatnonzero(deg != 2).tolist():
        for k in range(start_l[v], start_l[v + 1]):
            ei = inc_edge[k]
            if not visited[ei]:
                path, end = walk(v, ei)
                chains.append(_Chain(v, end, pos[path]))
    for ei in range(len(e_l)):
        if not visited[ei]:
            v0 = e_l[ei][0]
            path, end = walk(v0, ei)
            chains.append(_Chain(v0, end, pos[path], free=True))
    return chains


def _clean(chains: list[_Chain], spur: float, loop: float) -> list[_Chain]:
    # 1. contract short inter-node chains.
    parent: dict[int, int] = {}

    def find(x: int) -> int:
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    kept = []
    for c in chains:
        if not c.free and c.u != c.v and c.length < CONTRACT_PX:
            ru, rv = find(c.u), find(c.v)
            if ru != rv:
                parent[ru] = rv
            continue
        kept.append(c)
    acc: dict[int, list[complex]] = {}
    for c in kept:
        if c.free:
            continue
        acc.setdefault(find(c.u), []).append(complex(c.pts[0]))
        acc.setdefault(find(c.v), []).append(complex(c.pts[-1]))
    where = {k: complex(np.mean(v)) for k, v in acc.items()}
    for c in kept:
        if c.free:
            continue
        c.u, c.v = find(c.u), find(c.v)
        c.pts = c.pts.copy()
        c.pts[0], c.pts[-1] = where[c.u], where[c.v]

    # 2. prune short spurs, join at degree-two nodes; repeat to a fixed point.
    changed = True
    while changed:
        changed = False
        deg: dict[int, int] = {}
        for c in kept:
            if c.free:
                continue
            deg[c.u] = deg.get(c.u, 0) + 1
            deg[c.v] = deg.get(c.v, 0) + 1
        nxt = []
        for c in kept:
            if not c.free and c.u != c.v and (deg[c.u] == 1 or deg[c.v] == 1) and c.length < spur:
                changed = True
                continue
            nxt.append(c)
        kept = _join_degree_two(nxt)
        if len(kept) != len(nxt):
            changed = True

    # 3. drop small isolated loops.
    deg = {}
    for c in kept:
        if not c.free:
            deg[c.u] = deg.get(c.u, 0) + 1
            deg[c.v] = deg.get(c.v, 0) + 1
    out = []
    for c in kept:
        isolated_loop = c.free or (c.u == c.v and deg.get(c.u, 0) == 2)
        if isolated_loop and c.length < loop:
            continue
        out.append(c)
    return out


def _join_degree_two(chains: list[_Chain]) -> list[_Chain]:
    """Join chains through nodes where exactly two chain ends meet."""
    chains = list(chains)
    while True:
        ends: dict[int, list[tuple[int, int]]] = {}
        for i, c in enumerate(chains):
            if not c.free:
                ends.setdefault(c.u, []).append((i, 0))
                ends.setdefault(c.v, []).append((i, 1))
        pick = next(((node, lst) for node, lst in ends.items() if len(lst) == 2), None)
        if pick is None:
            return chains
        node, ((i, si), (j, sj)) = pick
        if i == j:  # a loop through a node of degree two is a free loop
            chains[i] = _Chain(node, node, chains[i].pts, free=True)
            continue
        a, b = chains[i], chains[j]
        pa = a.pts if si == 1 else a.pts[::-1]
        pb = b.pts if sj == 0 else b.pts[::-1]
        ua = a.u if si == 1 else a.v
        vb = b.v if sj == 0 else b.u
        merged = _Chain(ua, vb, np.concatenate([pa, pb[1:]]))
        chains = [c for k, c in enumerate(chains) if k not in (i, j)] + [merged]


def _densify(z: NDArray[np.complex128], step: float) -> NDArray[np.complex128]:
    s = np.concatenate([[0.0], np.cumsum(np.abs(np.diff(z)))])
    if s[-1] <= 0:
        return z[:1]
    t = np.linspace(0.0, s[-1], max(2, int(math.ceil(s[-1] / step)) + 1))
    return np.interp(t, s, z.real) + 1j * np.interp(t, s, z.imag)


def _smooth_resample(z: NDArray[np.complex128], sigma: float, closed_free: bool) -> NDArray[np.complex128]:
    """Arc-length Gaussian (1 px samples), ends pinned unless the chain is a
    free loop; then resampled every ``STEP_PX`` (ends kept)."""
    d = _densify(z, 1.0)
    if len(d) < 4:
        return d
    q = np.column_stack([d.real, d.imag])
    if closed_free:
        body = q[:-1]
        sm = ndi.gaussian_filter1d(body, sigma, axis=0, mode="wrap")
        sm = np.vstack([sm, sm[:1]])
    else:
        k = min(len(q) - 1, int(math.ceil(4 * sigma)))
        padded = np.vstack([2 * q[0] - q[k:0:-1], q, 2 * q[-1] - q[-2 : -k - 2 : -1]])
        sm = ndi.gaussian_filter1d(padded, sigma, axis=0, mode="nearest")[k : k + len(q)]
        t = np.linspace(0.0, 1.0, len(sm))[:, None]
        sm = sm - (1 - t) * (sm[0] - q[0]) - t * (sm[-1] - q[-1])
    out = sm[:, 0] + 1j * sm[:, 1]
    return _densify(out, STEP_PX)


# ---------------------------------------------------------------------------
# A raster line drawing
# ---------------------------------------------------------------------------


def line_width(ink: NDArray[np.bool_]) -> float:
    """The drawing's typical stroke width: twice the median distance from a
    skeleton pixel to paper."""
    from skimage.morphology import skeletonize

    if not ink.any():
        return 2.0
    skel = skeletonize(ink)
    dist = ndi.distance_transform_edt(ink)
    return float(max(1.5, 2.0 * np.median(dist[skel])))


def binarise(ink: NDArray[np.bool_], width: float) -> NDArray[np.bool_]:
    """Ink with its fills (regions thicker than a line) resolved.

    A compact, small fill (a nose, a pupil, an open mouth), closed over its
    highlights, is drawn by its outline, one line wide.  A large fill
    (``FILL_MAX_FRACTION``) or a ragged one (compactness below
    ``FILL_COMPACTNESS``: the shading of dark fur, the patches of a coat) is
    tone, not a line, and is left out.
    """
    from skimage.measure import label, regionprops
    from skimage.morphology import disk, remove_small_holes

    b = ink.copy()
    r = max(1, int(round(width)))
    fill = ndi.binary_opening(b, structure=disk(r))
    if not fill.any():
        return b
    closed = ndi.binary_closing(fill, structure=disk(2 * r))
    closed = remove_small_holes(closed, max_size=int((6 * r) ** 2))
    lab = label(closed)
    keep = np.zeros_like(closed)
    for reg in regionprops(lab):
        compactness = 4.0 * np.pi * reg.area / max(reg.perimeter, 1.0) ** 2
        if compactness >= FILL_COMPACTNESS and reg.area <= FILL_MAX_FRACTION * b.size:
            keep[lab == reg.label] = True
    tone = closed & ~keep
    b &= ~ndi.binary_dilation(tone, structure=disk(1))
    interior = ndi.binary_erosion(keep, structure=disk(r))
    return (b | keep) & ~interior


def trace_graph(skel: NDArray[np.bool_], layer: int = LINES) -> StrokeGraph:
    """A one-pixel skeleton's graph: a node is every end pixel and every
    cluster of junction pixels (at its centroid), an edge the pixel chain
    between two nodes; a ring with no node is a closed loop."""
    h, w = skel.shape
    pad = np.pad(skel, 1)
    count = sum(np.roll(np.roll(pad, -dr, 0), -dc, 1) for dr, dc in _NEIGHBOURS)[1:-1, 1:-1] * skel
    special = skel & (count != 2)
    labels, n = ndi.label(special, structure=np.ones((3, 3)))
    graph = StrokeGraph()
    node_of = np.full(skel.shape, -1, dtype=np.int64)
    if n:
        centres = ndi.center_of_mass(special, labels, index=np.arange(1, n + 1))
        graph.nodes = [np.asarray(c, dtype=np.float64) for c in centres]
        node_of[special] = labels[special] - 1

    visited = np.zeros(skel.shape, dtype=bool)

    def nbrs(r: int, c: int) -> list[tuple[int, int]]:
        out = []
        for dr, dc in _NEIGHBOURS:
            rr, cc = r + dr, c + dc
            if 0 <= rr < h and 0 <= cc < w and skel[rr, cc]:
                out.append((rr, cc))
        return out

    seen_steps: set[tuple[int, int, int, int]] = set()
    for r, c in zip(*np.nonzero(special)):
        a = int(node_of[r, c])
        for rr, cc in nbrs(int(r), int(c)):
            if node_of[rr, cc] == a or (int(r), int(c), rr, cc) in seen_steps:
                continue
            chain = [(int(r), int(c)), (rr, cc)]
            prev, cur = (int(r), int(c)), (rr, cc)
            end = int(node_of[rr, cc])
            while end < 0:
                visited[cur] = True
                nxt = [p for p in nbrs(*cur) if p != prev and p not in chain[-3:]]
                nodes_next = [p for p in nxt if node_of[p] >= 0]
                if nodes_next:
                    p = nodes_next[0]
                elif nxt:
                    p = nxt[0]
                else:
                    break
                prev, cur = cur, p
                chain.append(p)
                end = int(node_of[p])
                if visited[p] and end < 0:
                    break
            if end < 0:
                continue
            seen_steps.add((chain[-1][0], chain[-1][1], chain[-2][0], chain[-2][1]))
            pts = np.asarray(chain, dtype=np.float64)
            pts[0] = graph.nodes[a]
            pts[-1] = graph.nodes[end]
            if end == a and len(pts) <= 3:
                continue
            graph.edges.append(Edge(a, end, pts, layer))

    rest = skel & ~special & ~visited
    ring_labels, m = ndi.label(rest, structure=np.ones((3, 3)))
    for k in range(1, m + 1):
        rr, cc = np.nonzero(ring_labels == k)
        start = (int(rr[0]), int(cc[0]))
        chain = [start]
        prev, cur = None, start
        while True:
            nxt = [p for p in nbrs(*cur) if p != prev and ring_labels[p] == k]
            nxt = [p for p in nxt if p not in chain[-2:]] or nxt
            if not nxt:
                break
            p = nxt[0]
            if p == start or p in chain:
                break
            prev, cur = cur, p
            chain.append(p)
        if len(chain) < 4:
            continue
        pts = np.asarray(chain + [start], dtype=np.float64)
        idx = graph.add_node(pts[0])
        graph.edges.append(Edge(idx, idx, pts, layer))
    return compact(graph)


def prune_spurs(graph: StrokeGraph, min_length: float, layers: tuple[int, ...] = (LINES,)) -> StrokeGraph:
    """Remove dangling edges of ``layers`` shorter than ``min_length`` that
    hang off a junction (a skeleton's corner artefacts), to a fixed point."""
    while True:
        deg = graph.degree()
        keep = [
            e for e in graph.edges
            if not (e.layer in layers and (deg[e.u] == 1) != (deg[e.v] == 1) and e.length < min_length)
        ]
        if len(keep) == len(graph.edges):
            return graph
        graph = dissolve_degree_two(compact(StrokeGraph(graph.nodes, keep)))


def split_edges(graph: StrokeGraph, cuts: dict[int, set[int]]) -> tuple[StrokeGraph, dict[tuple[int, int], int]]:
    """Split edges at interior point indices; returns the new graph and the
    node at every ``(edge, index)`` cut (and at each edge's two ends)."""
    nodes = [n.copy() for n in graph.nodes]
    node_at: dict[tuple[int, int], int] = {}
    edges: list[Edge] = []
    for k, e in enumerate(graph.edges):
        node_at[(k, 0)] = e.u
        node_at[(k, len(e.pts) - 1)] = e.v
        inner = sorted(i for i in cuts.get(k, ()) if 0 < i < len(e.pts) - 1)
        prev_i, prev_n = 0, e.u
        for i in inner:
            nid = len(nodes)
            nodes.append(e.pts[i].copy())
            node_at[(k, i)] = nid
            edges.append(Edge(prev_n, nid, e.pts[prev_i : i + 1].copy(), e.layer))
            prev_i, prev_n = i, nid
        edges.append(Edge(prev_n, e.v, e.pts[prev_i:].copy(), e.layer))
    return StrokeGraph(nodes, edges), node_at


def bridge_gaps(
    graph: StrokeGraph,
    max_gap: float,
    from_layers: tuple[int, ...] = (LINES,),
    max_angle_deg: float = 40.0,
) -> StrokeGraph:
    """Join each free end of a ``from_layers`` stroke to the ink it points at.

    The target is the nearest ink point on another edge within ``max_gap``,
    inside a cone of ``max_angle_deg`` about the end's outgoing direction
    (read over half the gap); that edge is split there and the bridge added
    as a straight edge of the end's layer.  Every end is judged against the
    drawing as it was (one spatial index), so the result does not depend on
    the order the ends are visited in.
    """
    if not graph.edges:
        return graph
    deg = graph.degree()
    pts = np.vstack([e.pts for e in graph.edges])
    owner = np.concatenate([np.full(len(e.pts), k) for k, e in enumerate(graph.edges)])
    index = np.concatenate([np.arange(len(e.pts)) for e in graph.edges])
    tree = cKDTree(pts)
    cos_max = np.cos(np.deg2rad(max_angle_deg))

    links: list[tuple[int, int, int, int]] = []  # (end node, target edge, target index, layer)
    done: set[frozenset[int]] = set()
    for k, e in enumerate(graph.edges):
        if e.layer not in from_layers:
            continue
        for end, seq in ((e.u, e.pts), (e.v, e.pts[::-1])):
            if deg[end] != 1 or len(seq) < 2:
                continue
            s = np.concatenate([[0.0], np.cumsum(np.hypot(*np.diff(seq, axis=0).T))])
            look = int(min(len(seq) - 1, max(1, np.searchsorted(s, max_gap / 2))))
            tangent = seq[0] - seq[look]
            norm = float(np.hypot(*tangent))
            if norm < 1e-9:
                continue
            tangent = tangent / norm
            best = None
            for q in tree.query_ball_point(seq[0], max_gap):
                if owner[q] == k:
                    continue
                d = pts[q] - seq[0]
                dist = float(np.hypot(*d))
                if dist < 1e-9 or float(np.dot(d / dist, tangent)) < cos_max:
                    continue
                if best is None or dist < best[0]:
                    best = (dist, int(owner[q]), int(index[q]))
            if best is None:
                continue
            _, tk, ti = best
            t = graph.edges[tk]
            target_node = t.u if ti == 0 else t.v if ti == len(t.pts) - 1 else None
            pair = frozenset((end, target_node if target_node is not None else -1 - tk))
            if target_node is not None and pair in done:
                continue  # two ends pointing at each other: one bridge
            done.add(pair)
            links.append((end, tk, ti, e.layer))
    if not links:
        return graph
    cuts: dict[int, set[int]] = {}
    for _, tk, ti, _ in links:
        cuts.setdefault(tk, set()).add(ti)
    out, node_at = split_edges(graph, cuts)
    for end, tk, ti, layer in links:
        target = node_at[(tk, ti)]
        if target == end:
            continue
        a, b = out.nodes[end], out.nodes[target]
        dist = float(np.hypot(*(b - a)))
        seg = np.linspace(a, b, max(2, int(np.ceil(dist)) + 1))
        out.edges.append(Edge(end, target, seg, layer))
    return dissolve_degree_two(out)


def smooth_edges(graph: StrokeGraph, sigma: float, layers: tuple[int, ...] = (LINES,)) -> StrokeGraph:
    """Arc-length Gaussian on each edge of ``layers`` (1 px samples), ends
    pinned; a closed ring is smoothed periodically."""
    out = []
    for e in graph.edges:
        if e.layer not in layers:
            out.append(e)
            continue
        q = uniform(e.pts, 1.0)
        if len(q) >= 5:
            if e.u == e.v and np.allclose(q[0], q[-1]):
                sm = ndi.gaussian_filter1d(q[:-1], sigma, axis=0, mode="wrap")
                q = np.vstack([sm, sm[:1]])
            else:
                k = min(len(q) - 1, int(np.ceil(3 * sigma)))
                padded = np.vstack([2 * q[0] - q[k:0:-1], q, 2 * q[-1] - q[-2 : -k - 2 : -1]])
                q = ndi.gaussian_filter1d(padded, sigma, axis=0, mode="nearest")[k : k + len(q)]
        q[0] = graph.nodes[e.u]
        q[-1] = graph.nodes[e.v]
        out.append(Edge(e.u, e.v, q, e.layer))
    return StrokeGraph(graph.nodes, out)


def vectorise(ink: NDArray[np.bool_], width: float, *, bridge: float) -> StrokeGraph:
    """Raster line drawing -> ``LINES`` stroke graph: fills resolved, twin
    lines merged, skeleton, traced, spurs pruned, gaps bridged (module
    docstring).

    A drawing model inks a narrow groove or band (a lattice seam, a stitched
    edge) as its two edges, about a line width apart; drawn as they are, they
    read as a doubled strand.  Closing the ink by half a line width merges
    such a pair into one band, whose skeleton is the single line between them,
    while lines further apart (an eye's lid and its pupil, two teeth) stay
    separate.  Where the pair is merged only in places, the skeleton is left
    with small bubbles, which ``merge_twins`` collapses."""
    from skimage.morphology import disk, skeletonize

    b = binarise(ink, width)
    b = ndi.binary_closing(b, structure=disk(max(1, int(round(width / 2)))), border_value=0) | b
    g = dissolve_degree_two(trace_graph(np.asarray(skeletonize(b), dtype=bool)))
    g = merge_twins(g, width)
    g = prune_spurs(g, 2.5 * width)
    return bridge_gaps(g, bridge)


def merge_twins(graph: StrokeGraph, width: float) -> StrokeGraph:
    """Collapse the bubbles of a doubled strand, to a fixed point: of two
    strokes joining the same two nodes and never more than ``1.5 width`` apart
    (one line drawn twice), the longer goes; a loop on one node enclosing less
    than a line's own width (``pi width^2``) goes."""
    while True:
        pairs: dict[tuple[int, int], list[int]] = {}
        drop: set[int] = set()
        for k, e in enumerate(graph.edges):
            if e.u == e.v:
                if len(e.pts) > 2 and abs(_shoelace(e.pts)) < np.pi * width**2:
                    drop.add(k)
                continue
            pairs.setdefault((min(e.u, e.v), max(e.u, e.v)), []).append(k)
        for ks in pairs.values():
            if len(ks) < 2:
                continue
            ks = sorted(ks, key=lambda k: graph.edges[k].length)
            short = graph.edges[ks[0]].pts
            tree = cKDTree(uniform(short, 0.5))
            for k in ks[1:]:
                if tree.query(uniform(graph.edges[k].pts, 1.0))[0].max() <= 1.5 * width:
                    drop.add(k)
        if not drop:
            return graph
        graph = dissolve_degree_two(compact(StrokeGraph(graph.nodes, [e for k, e in enumerate(graph.edges) if k not in drop])))


def _shoelace(p: NDArray[np.float64]) -> float:
    return 0.5 * float(np.dot(p[:-1, 0], p[1:, 1]) - np.dot(p[1:, 0], p[:-1, 1]))


# ---------------------------------------------------------------------------
# Selection
# ---------------------------------------------------------------------------


def _cut_edges(graph: StrokeGraph) -> set[int]:
    """Edges whose removal disconnects their component (parallel edges never do)."""
    import networkx as nx

    g = nx.Graph()
    seen: dict[tuple[int, int], int] = {}
    parallel: set[tuple[int, int]] = set()
    for k, e in enumerate(graph.edges):
        if e.u == e.v:
            continue
        key = (min(e.u, e.v), max(e.u, e.v))
        if key in seen:
            parallel.add(key)
        seen[key] = k
        g.add_edge(*key)
    return {
        seen[(min(u, v), max(u, v))]
        for u, v in nx.bridges(g)
        if (min(u, v), max(u, v)) not in parallel
    }


def prune_to_budget(
    graph: StrokeGraph,
    budget: float,
    salience: Callable[[Edge], float],
    floor: float = 0.0,
    batch_fraction: float = 0.05,
) -> StrokeGraph:
    """Drop the least salient strokes until the ink fits ``budget`` and every
    stroke that may go has a salience of at least ``floor``, coarse to fine.

    A stroke may go when dropping it leaves the rest of its component
    connected: a twig (a dangling stroke), a stroke on a cycle, or a whole
    isolated stroke.  Each round drops the least salient few
    (``batch_fraction`` of the candidates) and dissolves the junctions left
    with two strokes, so the survivors grow into the long lines they belong
    to and a line's salience is read on the whole line.  A stroke of infinite
    salience (the silhouette, a part boundary) is never dropped.
    """
    while graph.edges:
        lengths = np.array([e.length for e in graph.edges])
        excess = float(lengths.sum()) - budget
        deg = graph.degree()
        cut = _cut_edges(graph)
        scored = []
        for k, e in enumerate(graph.edges):
            if deg[e.u] == 1 or deg[e.v] == 1 or k not in cut:
                s = salience(e)
                if np.isfinite(s):
                    scored.append((s, k))
        scored.sort()
        if not scored or (excess <= 0 and scored[0][0] >= floor):
            break
        quota = max(1, int(batch_fraction * len(scored)))
        drop: set[int] = set()
        freed = 0.0
        for s_k, k in scored:
            if len(drop) >= quota or (freed >= excess and s_k >= floor):
                break
            drop.add(k)
            freed += float(lengths[k])
        graph = dissolve_degree_two(
            compact(StrokeGraph(graph.nodes, [e for k, e in enumerate(graph.edges) if k not in drop]))
        )
    return graph
