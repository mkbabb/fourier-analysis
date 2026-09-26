"""Contour ordering: one closed, minimum-retrace walk over the stroke graph.

The epicycle series draws a single closed curve, so a drawing must become one
path.  A drawing is a graph (a hairline meets the silhouette, an iris arc ends
on a lid), and the shortest closed walk that draws every stroke is a Chinese
postman tour (the rural-postman heuristic of Frederickson, since the strokes
may be disconnected):

1. **The graph.**  Stroke vertices shared exactly by two strokes, or repeated
   within one, are junction nodes, as are the ends of open strokes; the
   strokes are split there into edges.
2. **Connectors.**  Disconnected components are joined along the minimum
   spanning tree of their closest-point distances (a KDTree query per pair):
   each connector is the shortest straight jump between two components, from
   and to wherever on their ink it is shortest (the ink is split there).
3. **Parity.**  An Euler circuit exists once every node has even degree.  The
   odd nodes are paired by a minimum-weight perfect matching, where pairing
   ``a`` with ``b`` costs the shortest along-graph path between them (its
   edges are then drawn twice: a retrace that lies exactly on its stroke) or
   ``JUMP_PENALTY`` times their straight distance (a new visible jump),
   whichever is less.
4. **The walk.**  Hierholzer's algorithm, leaving each node along the unused
   edge that turns least (ink before jumps), so the pen follows strokes
   through junctions rather than zig-zagging.

``ContourTour.ordered_contours`` holds the pieces of ink between jumps, in
traversal order, ``gap_lengths`` the jump between piece *i* and *i+1*, and
``path`` their concatenation, which ends exactly where it starts.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray
from scipy.sparse import coo_matrix  # type: ignore[import-untyped]
from scipy.sparse.csgraph import dijkstra, minimum_spanning_tree  # type: ignore[import-untyped]
from scipy.spatial import KDTree  # type: ignore[import-untyped]

TOUR_METHODS = ("postman",)

_CLOSED_EPS = 1e-9
# Components closer than this (px) touch: they are joined, not jumped.
_TOUCH_EPS = 1e-6
# A pairing drawn as a new straight jump costs this multiple of its length
# against a retrace along the strokes: a retrace is invisible (it lies on
# ink), a jump is a line the drawing does not have.
JUMP_PENALTY = 3.0
# Above this many odd nodes, each is offered only its nearest candidates in
# the matching (the complete graph's blossom is cubic).
_DENSE_MATCHING_MAX = 120
_SPARSE_NEIGHBOURS = 12
# The pen's heading at a node is read over this much arc (px).
_HEADING_REACH = 6.0
# scipy reads a zero weight as "no edge".
_WEIGHT_OFFSET = 1e-6


@dataclass(frozen=True)
class ContourTour:
    """Result of walking the stroke graph.

    Attributes
    ----------
    ordered_contours : tuple of NDArray[complex128]
        The pieces of ink between jumps, in traversal order.
    gap_lengths : tuple of float
        Jump length between the end of piece *i* and the start of *i+1*.
    path : NDArray[complex128]
        Single concatenated path (the main output).
    """

    ordered_contours: tuple[NDArray[np.complex128], ...]
    gap_lengths: tuple[float, ...]
    path: NDArray[np.complex128]


@dataclass
class _Edge:
    u: int
    v: int
    pts: NDArray[np.complex128]  # pts[0] at node u, pts[-1] at node v
    jump: bool = False

    @property
    def length(self) -> float:
        return float(np.abs(np.diff(self.pts)).sum())


def build_contour_tour(
    contours: list[NDArray[np.complex128]],
    *,
    method: str = "postman",
) -> ContourTour:
    """Walk every contour once (plus the fewest retraces and jumps) in one
    closed path.

    Parameters
    ----------
    contours : list of NDArray[complex128]
        Strokes: closed loops (first point repeated last) or open strokes.
        Strokes that meet share the junction vertex exactly.
    method : str
        ``"postman"`` (the only method).
    """
    if method not in TOUR_METHODS:
        raise ValueError(f"Unknown method: {method!r}")

    contours = [np.asarray(c, dtype=np.complex128) for c in contours if len(c) > 0]
    if not contours:
        return ContourTour((), (), np.array([], dtype=np.complex128))
    if len(contours) == 1 and len(contours[0]) < 2:
        c = contours[0].copy()
        return ContourTour((c,), (), c)

    nodes, edges = _stroke_graph(contours)
    if not edges:
        c = contours[0].copy()
        return ContourTour((c,), (), c)
    _connect_components(nodes, edges)
    _fix_parity(nodes, edges)
    walk = _euler_circuit(nodes, edges)
    return _pieces(edges, walk)


# ---------------------------------------------------------------------------
# 1. The graph
# ---------------------------------------------------------------------------


def _stroke_graph(contours: list[NDArray[np.complex128]]) -> tuple[list[complex], list[_Edge]]:
    closed = [len(c) > 2 and abs(c[0] - c[-1]) <= _CLOSED_EPS for c in contours]
    verts = [c[:-1] if is_closed else c for c, is_closed in zip(contours, closed)]
    count: dict[complex, int] = {}
    for v in verts:
        for z in v.tolist():
            count[z] = count.get(z, 0) + 1
    node_of: dict[complex, int] = {}
    nodes: list[complex] = []

    def node(z: complex) -> int:
        if z not in node_of:
            node_of[z] = len(nodes)
            nodes.append(z)
        return node_of[z]

    edges: list[_Edge] = []
    for v, is_closed in zip(verts, closed):
        pts = v.tolist()
        marks = [i for i, z in enumerate(pts) if count[z] > 1]
        if is_closed:
            start = marks[0] if marks else 0
            pts = pts[start:] + pts[:start] + [pts[start]]
            cuts = [0] + [i for i, z in enumerate(pts[:-1]) if i > 0 and count[z] > 1] + [len(pts) - 1]
        else:
            if len(pts) < 2:
                continue
            cuts = sorted({0, len(pts) - 1, *marks})
        for a, b in zip(cuts[:-1], cuts[1:]):
            seg = np.asarray(pts[a: b + 1], dtype=np.complex128)
            if len(seg) < 2 or (np.abs(np.diff(seg)).sum() <= 0):
                continue
            edges.append(_Edge(node(pts[a]), node(pts[b]), seg))
    return nodes, edges


def _split_many(
    nodes: list[complex], edges: list[_Edge], ei: int, ks: set[int]
) -> dict[int, int]:
    """Split edge ``ei`` at point indices ``ks``; returns index -> node."""
    e = edges[ei]
    last = len(e.pts) - 1
    out = {k: (e.u if k <= 0 else e.v) for k in ks if k <= 0 or k >= last}
    cuts = sorted(k for k in ks if 0 < k < last)
    if not cuts:
        return out
    ids = [e.u]
    for k in cuts:
        out[k] = len(nodes)
        ids.append(len(nodes))
        nodes.append(complex(e.pts[k]))
    ids.append(e.v)
    bounds = [0, *cuts, last]
    pieces = [_Edge(ids[j], ids[j + 1], e.pts[bounds[j]: bounds[j + 1] + 1].copy())
              for j in range(len(bounds) - 1)]
    edges[ei] = pieces[0]
    edges.extend(pieces[1:])
    return out


# ---------------------------------------------------------------------------
# 2. Connectors
# ---------------------------------------------------------------------------


def _components(n: int, edges: list[_Edge]) -> NDArray[np.int64]:
    parent = list(range(n))

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for e in edges:
        parent[find(e.u)] = find(e.v)
    roots = [find(i) for i in range(n)]
    _, lab = np.unique(roots, return_inverse=True)
    return lab.astype(np.int64)


def _connect_components(nodes: list[complex], edges: list[_Edge]) -> None:
    lab = _components(len(nodes), edges)
    k = int(lab.max()) + 1 if len(lab) else 0
    if k <= 1:
        return
    # Every ink point of every component, with the edge and index it sits on.
    comp_pts: list[list[tuple[int, int, complex]]] = [[] for _ in range(k)]
    for ei, e in enumerate(edges):
        c = int(lab[e.u])
        for j, z in enumerate(e.pts.tolist()):
            comp_pts[c].append((ei, j, z))
    arrays = [np.array([[z.real, z.imag] for _, _, z in cp]) for cp in comp_pts]
    trees = [KDTree(a) for a in arrays]
    w = np.zeros((k, k))
    best: dict[tuple[int, int], tuple[int, int, float]] = {}
    for a in range(k):
        for b in range(a + 1, k):
            small, big = (a, b) if len(arrays[a]) <= len(arrays[b]) else (b, a)
            dist, near = trees[big].query(arrays[small])
            i = int(np.argmin(dist))
            best[(small, big)] = (i, int(near[i]), float(dist[i]))
            w[a, b] = w[b, a] = float(dist[i]) + _WEIGHT_OFFSET
    mst = minimum_spanning_tree(w).tocoo()
    requests: list[tuple[tuple[int, int], tuple[int, int]]] = []
    for a, b in zip(mst.row.tolist(), mst.col.tolist()):
        key = (a, b) if (a, b) in best else (b, a)
        ia, ib, _ = best[key]
        pa, pb = comp_pts[key[0]][ia], comp_pts[key[1]][ib]
        requests.append(((pa[0], pa[1]), (pb[0], pb[1])))
    by_edge: dict[int, set[int]] = {}
    for ra, rb in requests:
        for ei, j in (ra, rb):
            by_edge.setdefault(ei, set()).add(j)
    node_at: dict[tuple[int, int], int] = {}
    for ei, js in by_edge.items():
        for j, n in _split_many(nodes, edges, ei, js).items():
            node_at[(ei, j)] = n
    for ra, rb in requests:
        u, v = node_at[ra], node_at[rb]
        if abs(nodes[u] - nodes[v]) <= _TOUCH_EPS:
            # Touching components share the point: one node, no jump.
            for e in edges:
                if e.u == v:
                    e.u = u
                    e.pts = e.pts.copy()
                    e.pts[0] = nodes[u]
                if e.v == v:
                    e.v = u
                    e.pts = e.pts.copy()
                    e.pts[-1] = nodes[u]
            continue
        edges.append(_Edge(u, v, np.array([nodes[u], nodes[v]]), jump=True))


# ---------------------------------------------------------------------------
# 3. Parity
# ---------------------------------------------------------------------------


def _fix_parity(nodes: list[complex], edges: list[_Edge]) -> None:
    n = len(nodes)
    deg = np.zeros(n, dtype=np.int64)
    for e in edges:
        deg[e.u] += 1
        deg[e.v] += 1
    odd = np.flatnonzero(deg % 2 == 1)
    if len(odd) == 0:
        return
    # The cheapest edge between each node pair carries the shortest paths.
    cheapest: dict[tuple[int, int], int] = {}
    for i, e in enumerate(edges):
        if e.u == e.v:
            continue
        key = (min(e.u, e.v), max(e.u, e.v))
        if key not in cheapest or e.length < edges[cheapest[key]].length:
            cheapest[key] = i
    rows = [a for a, _ in cheapest] + [b for _, b in cheapest]
    cols = [b for _, b in cheapest] + [a for a, _ in cheapest]
    wts = [edges[i].length + _WEIGHT_OFFSET for i in cheapest.values()] * 2
    g = coo_matrix((wts, (rows, cols)), shape=(n, n)).tocsr()
    dist, pred = dijkstra(g, directed=False, indices=odd, return_predecessors=True)

    xy = np.array([[nodes[i].real, nodes[i].imag] for i in odd])
    straight = np.hypot(xy[:, None, 0] - xy[None, :, 0], xy[:, None, 1] - xy[None, :, 1])
    along = dist[:, odd]
    cost = np.minimum(along, JUMP_PENALTY * straight)

    for a, b in _min_weight_pairs(cost):
        if along[a, b] <= JUMP_PENALTY * straight[a, b] and np.isfinite(along[a, b]):
            # Retrace the shortest path from odd[b] back to odd[a].
            cur = int(odd[b])
            while cur != int(odd[a]):
                prev = int(pred[a, cur])
                e = edges[cheapest[(min(prev, cur), max(prev, cur))]]
                edges.append(_Edge(e.u, e.v, e.pts, e.jump))
                cur = prev
        else:
            u, v = int(odd[a]), int(odd[b])
            edges.append(_Edge(u, v, np.array([nodes[u], nodes[v]]), jump=True))


def _min_weight_pairs(cost: NDArray[np.float64]) -> list[tuple[int, int]]:
    """A minimum-weight perfect matching over ``cost`` (an even-sized square)."""
    import networkx as nx

    k = len(cost)
    g = nx.Graph()
    if k <= _DENSE_MATCHING_MAX:
        for i in range(k):
            for j in range(i + 1, k):
                g.add_edge(i, j, weight=float(cost[i, j]))
    else:
        for i in range(k):
            for j in np.argsort(cost[i])[1: _SPARSE_NEIGHBOURS + 1].tolist():
                g.add_edge(i, int(j), weight=float(cost[i, j]))
    pairs = [tuple(sorted(p)) for p in nx.min_weight_matching(g)]
    matched = {i for p in pairs for i in p}
    left = [i for i in range(k) if i not in matched]
    while left:  # greedy for any the sparse graph could not pair
        i = left.pop(0)
        j = min(left, key=lambda x: cost[i, x])
        left.remove(j)
        pairs.append((i, j))
    return [(int(a), int(b)) for a, b in pairs]


# ---------------------------------------------------------------------------
# 4. The walk
# ---------------------------------------------------------------------------


def _heading(pts: NDArray[np.complex128], reverse: bool) -> complex:
    """Unit direction of travel leaving the first point of ``pts`` (or of its
    reverse), read over ``_HEADING_REACH`` of arc."""
    p = pts[::-1] if reverse else pts
    d = np.cumsum(np.abs(np.diff(p)))
    k = int(min(len(p) - 1, np.searchsorted(d, _HEADING_REACH) + 1))
    v = complex(p[k] - p[0])
    return v / abs(v) if abs(v) > 1e-12 else 0j


def _euler_circuit(nodes: list[complex], edges: list[_Edge]) -> list[tuple[int, bool]]:
    """Hierholzer's circuit as ``(edge, forward)``; the pen leaves each node
    along the unused edge that turns least, ink before jumps."""
    inc: list[list[int]] = [[] for _ in nodes]
    for i, e in enumerate(edges):
        inc[e.u].append(i)
        if e.v != e.u:
            inc[e.v].append(i)
    leave = [(_heading(e.pts, False), _heading(e.pts, True)) for e in edges]
    used = [False] * len(edges)

    ink = [i for i, e in enumerate(edges) if not e.jump]
    first = max(ink or range(len(edges)), key=lambda i: edges[i].length)
    start = edges[first].u

    def pick(v: int, arrive: complex) -> tuple[int, bool] | None:
        best: tuple[float, int, bool] | None = None
        for i in inc[v]:
            if used[i]:
                continue
            e = edges[i]
            for fwd in ((True, False) if e.u == e.v else ((e.u == v),)):
                out = leave[i][0] if fwd else leave[i][1]
                score = (arrive.conjugate() * out).real if arrive else 0.0
                score -= 4.0 if e.jump else 0.0
                if best is None or score > best[0]:
                    best = (score, i, fwd)
        return None if best is None else (best[1], best[2])

    stack: list[tuple[int, int, bool, complex]] = [(start, -1, True, 0j)]
    circuit: list[tuple[int, bool]] = []
    while stack:
        v, e_in, fwd_in, arrive = stack[-1]
        nxt = pick(v, arrive)
        if nxt is None:
            stack.pop()
            if e_in >= 0:
                circuit.append((e_in, fwd_in))
            continue
        i, fwd = nxt
        used[i] = True
        e = edges[i]
        w = e.v if fwd else e.u
        # Arriving at w, the pen heads opposite to leaving w along this edge.
        arr = -(leave[i][1] if fwd else leave[i][0])
        stack.append((w, i, fwd, arr))
    circuit.reverse()
    return circuit


def _pieces(edges: list[_Edge], walk: list[tuple[int, bool]]) -> ContourTour:
    # Rotate the circuit to begin between two ink edges, so the path closes
    # exactly (failing that, just after a jump, so the closing gap is one).
    if walk:
        jump = [edges[i].jump for i, _ in walk]
        m = len(walk)
        starts = [k for k in range(m) if not jump[k] and not jump[k - 1]]
        starts = starts or [k for k in range(m) if not jump[k]]
        if starts:
            walk = walk[starts[0]:] + walk[: starts[0]]
    pieces: list[list[complex]] = [[]]
    for i, fwd in walk:
        e = edges[i]
        pts = e.pts if fwd else e.pts[::-1]
        if e.jump:
            if pieces[-1]:
                pieces.append([])
            continue
        seq = pts.tolist()
        if pieces[-1] and pieces[-1][-1] == seq[0]:
            seq = seq[1:]
        pieces[-1].extend(seq)
    if not pieces[-1]:
        pieces.pop()
    arrays = tuple(np.asarray(p, dtype=np.complex128) for p in pieces)
    gaps = [float(abs(arrays[k][-1] - arrays[k + 1][0])) for k in range(len(arrays) - 1)]
    path = np.concatenate(arrays) if arrays else np.array([], dtype=np.complex128)
    return ContourTour(arrays, tuple(gaps), path)
