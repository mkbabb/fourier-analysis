"""Minimum-retrace closed walk over a stroke graph (a Chinese-postman tour).

The epicycle series draws one closed curve.  A line drawing is a graph of
strokes that meet at junctions, and a closed walk that draws every stroke
must repeat some of them unless every junction has even degree (Euler).  The
repeats are the price: each one is drawn twice, and anything that is not a
stroke (a straight jump) shows as a line across the drawing.  This module
pays the least of it:

1. **The graph.**  Every contour is an edge between the nodes at its two ends
   (ends that coincide are one node, so strokes that meet at a junction share
   it); a closed loop is an edge from its seam node to itself.
2. **Components.**  Disconnected parts are joined by straight connectors
   along the minimum spanning tree over the components, each connector the
   shortest segment between the two parts (an edge is split where a
   connector lands on it).  These are the only jumps the drawing is forced to.
3. **Parity.**  The odd-degree nodes are paired by a minimum-weight perfect
   matching (blossom, ``networkx``).  A pair is joined either by retracing
   the shortest path between them *along the strokes* (cost: its length) or,
   when the strokes wander far, by a straight jump (cost: ``JUMP_WEIGHT``
   times its length), whichever is cheaper.  A retrace coincides with the
   stroke it repeats, so it is invisible in the drawing.
4. **The walk.**  Hierholzer's algorithm on the now-Eulerian multigraph,
   leaving every node by the unused edge that turns least from the way the pen
   arrived, so the walk follows strokes through junctions instead of zig-zagging.

``ContourTour.ordered_contours`` are the runs of ink between connectors
(retraces included, they are ink), ``gap_lengths`` the connectors between
them, and ``path`` their concatenation, which ends where it starts.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import dijkstra, minimum_spanning_tree
from scipy.spatial import cKDTree

# A straight jump is charged this many times its length against a retrace of
# the same length: a retrace is invisible, a jump is a line across the drawing.
JUMP_WEIGHT = 3.0
# Candidate partners per odd node offered to the matching (nearest by cost).
MATCH_NEIGHBOURS = 12
# Ends closer than this (relative to the drawing's extent) are one node.
_MERGE_REL = 1e-9
# Tangents are read this many points into an edge.
_TANGENT_REACH = 6


@dataclass
class _Edge:
    a: int
    b: int
    pts: NDArray[np.complex128]
    connector: bool = False

    @property
    def length(self) -> float:
        return float(np.abs(np.diff(self.pts)).sum()) if len(self.pts) > 1 else 0.0


def postman_tour(contours: list[NDArray[np.complex128]]):  # -> ContourTour
    from fourier_analysis.shortest_tour import ContourTour

    nodes, edges = _build_graph(contours)
    _connect_components(nodes, edges)
    _make_even(nodes, edges)
    walk = _euler_circuit(nodes, edges)
    pieces, gaps = _assemble(nodes, edges, walk)
    path = np.concatenate(pieces) if pieces else np.array([], dtype=np.complex128)
    return ContourTour(
        ordered_contours=tuple(pieces),
        gap_lengths=tuple(gaps),
        path=path.astype(np.complex128),
    )


# ---------------------------------------------------------------------------
# 1. Graph
# ---------------------------------------------------------------------------


def _build_graph(contours: list[NDArray[np.complex128]]) -> tuple[list[complex], list[_Edge]]:
    ends = np.array([p for c in contours for p in (c[0], c[-1])], dtype=np.complex128)
    extent = float(np.ptp(ends.real) + np.ptp(ends.imag)) if len(ends) else 0.0
    eps = max(1e-9, _MERGE_REL * max(extent, 1.0))
    tree = cKDTree(np.column_stack([ends.real, ends.imag]))
    parent = list(range(len(ends)))

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for i, j in tree.query_pairs(eps):
        parent[find(i)] = find(j)
    node_of: dict[int, int] = {}
    nodes: list[complex] = []
    ids = []
    for i in range(len(ends)):
        r = find(i)
        if r not in node_of:
            node_of[r] = len(nodes)
            nodes.append(complex(ends[r]))
        ids.append(node_of[r])
    edges = []
    for k, c in enumerate(contours):
        a, b = ids[2 * k], ids[2 * k + 1]
        pts = np.asarray(c, dtype=np.complex128).copy()
        pts[0], pts[-1] = nodes[a], nodes[b]
        edges.append(_Edge(a, b, pts))
    return nodes, edges


def _components(n: int, edges: list[_Edge]) -> NDArray[np.int64]:
    parent = list(range(n))

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for e in edges:
        ra, rb = find(e.a), find(e.b)
        if ra != rb:
            parent[ra] = rb
    roots = [find(i) for i in range(n)]
    _, label = np.unique(roots, return_inverse=True)
    return label


# ---------------------------------------------------------------------------
# 2. Connect components (MST of straight connectors)
# ---------------------------------------------------------------------------


def _connect_components(nodes: list[complex], edges: list[_Edge]) -> None:
    label = _components(len(nodes), edges)
    n_comp = int(label.max()) + 1 if len(label) else 0
    if n_comp <= 1:
        return
    # Every ink point, tagged with its edge and index.
    comp_pts: list[list[tuple[complex, int, int]]] = [[] for _ in range(n_comp)]
    for k, e in enumerate(edges):
        for i, p in enumerate(e.pts):
            comp_pts[label[e.a]].append((complex(p), k, i))
    arrays = [np.array([p for p, _, _ in cp]) for cp in comp_pts]
    trees = [cKDTree(np.column_stack([a.real, a.imag])) for a in arrays]

    w = np.zeros((n_comp, n_comp))
    attach: dict[tuple[int, int], tuple[int, int]] = {}
    for i in range(n_comp):
        for j in range(i + 1, n_comp):
            small, big = (i, j) if len(arrays[i]) <= len(arrays[j]) else (j, i)
            q = arrays[small]
            d, nn = trees[big].query(np.column_stack([q.real, q.imag]))
            s = int(np.argmin(d))
            attach[(small, big)] = (s, int(nn[s]))
            attach[(big, small)] = (int(nn[s]), s)
            w[i, j] = w[j, i] = float(d[s]) + 1.0  # offset: a zero weight is "no edge"
    mst = minimum_spanning_tree(w).tocoo()

    # Collect landing points per edge, then split each edge once at all of them.
    landings: dict[int, set[int]] = {}
    links: list[tuple[tuple[int, int], tuple[int, int]]] = []
    for i, j in zip(mst.row.tolist(), mst.col.tolist()):
        si, sj = attach[(i, j)]
        _, ki, ii = comp_pts[i][si]
        _, kj, ij = comp_pts[j][sj]
        landings.setdefault(ki, set()).add(ii)
        landings.setdefault(kj, set()).add(ij)
        links.append(((ki, ii), (kj, ij)))

    node_at: dict[tuple[int, int], int] = {}
    new_edges: list[_Edge] = []
    for k, e in enumerate(edges):
        cuts = sorted(i for i in landings.get(k, ()) if 0 < i < len(e.pts) - 1)
        node_at[(k, 0)] = e.a
        node_at[(k, len(e.pts) - 1)] = e.b
        if not cuts:
            new_edges.append(e)
            continue
        prev_i, prev_n = 0, e.a
        for c in cuts:
            nid = len(nodes)
            nodes.append(complex(e.pts[c]))
            node_at[(k, c)] = nid
            new_edges.append(_Edge(prev_n, nid, e.pts[prev_i : c + 1].copy(), e.connector))
            prev_i, prev_n = c, nid
        new_edges.append(_Edge(prev_n, e.b, e.pts[prev_i:].copy(), e.connector))
    for (ka, ia), (kb, ib) in links:
        u, v = node_at[(ka, ia)], node_at[(kb, ib)]
        new_edges.append(_Edge(u, v, np.array([nodes[u], nodes[v]]), connector=True))
    edges[:] = new_edges


def _retrace_cost(e: _Edge) -> float:
    """Repeating an edge costs its length, a connector's included: the second
    pass coincides with the first, so it adds samples but no new line."""
    return e.length


# ---------------------------------------------------------------------------
# 3. Parity (minimum-weight perfect matching of odd nodes)
# ---------------------------------------------------------------------------


def _make_even(nodes: list[complex], edges: list[_Edge]) -> None:
    import networkx as nx

    deg = np.zeros(len(nodes), dtype=np.int64)
    for e in edges:
        deg[e.a] += 1
        deg[e.b] += 1
    odd = np.flatnonzero(deg % 2 == 1)
    if odd.size == 0:
        return

    # Shortest along-graph paths (the cheapest parallel edge per node pair).
    best: dict[tuple[int, int], int] = {}
    for k, e in enumerate(edges):
        if e.a == e.b:
            continue
        key = (min(e.a, e.b), max(e.a, e.b))
        if key not in best or _retrace_cost(e) < _retrace_cost(edges[best[key]]):
            best[key] = k
    rows, cols, vals = [], [], []
    for (u, v), k in best.items():
        length = max(_retrace_cost(edges[k]), 1e-9)
        rows += [u, v]
        cols += [v, u]
        vals += [length, length]
    graph = coo_matrix((vals, (rows, cols)), shape=(len(nodes), len(nodes))).tocsr()
    dist, pred = dijkstra(graph, indices=odd, return_predecessors=True)

    pos = np.array([[nodes[i].real, nodes[i].imag] for i in odd])
    euclid = np.hypot(pos[:, None, 0] - pos[None, :, 0], pos[:, None, 1] - pos[None, :, 1])
    retrace = dist[:, odd]
    cost = np.minimum(retrace, JUMP_WEIGHT * euclid)
    np.fill_diagonal(cost, np.inf)

    g = nx.Graph()
    g.add_nodes_from(range(len(odd)))
    k_nb = min(MATCH_NEIGHBOURS, len(odd) - 1)
    for i in range(len(odd)):
        for j in np.argsort(cost[i])[:k_nb]:
            if np.isfinite(cost[i, j]):
                g.add_edge(i, int(j), weight=float(cost[i, j]))
    matching = nx.min_weight_matching(g)
    matched = {x for pair in matching for x in pair}
    rest = [i for i in range(len(odd)) if i not in matched]
    pairs = [tuple(p) for p in matching]
    while rest:  # a sparse candidate set can leave a few unpaired
        i = rest.pop(0)
        j = min(rest, key=lambda r: cost[i, r])
        rest.remove(j)
        pairs.append((i, j))

    for i, j in pairs:
        u, v = int(odd[i]), int(odd[j])
        if retrace[i, j] <= JUMP_WEIGHT * euclid[i, j] and np.isfinite(retrace[i, j]):
            x = v
            while x != u:
                p = int(pred[i, x])
                k = best[(min(p, x), max(p, x))]
                e = edges[k]
                edges.append(_Edge(e.a, e.b, e.pts.copy(), e.connector))
                x = p
        else:
            edges.append(_Edge(u, v, np.array([nodes[u], nodes[v]]), connector=True))


# ---------------------------------------------------------------------------
# 4. Euler circuit, turning least at every node
# ---------------------------------------------------------------------------


def _unit(z: complex) -> complex:
    m = abs(z)
    return z / m if m > 1e-12 else 0j


def _euler_circuit(nodes: list[complex], edges: list[_Edge]) -> list[tuple[int, bool]]:
    """The circuit as ``(edge, forward)`` steps."""
    if not edges:
        return []
    incident: list[list[int]] = [[] for _ in nodes]
    for k, e in enumerate(edges):
        incident[e.a].append(k)
        if e.b != e.a:
            incident[e.b].append(k)
    used = [False] * len(edges)

    def leave(k: int, at: int) -> tuple[bool, complex]:
        e = edges[k]
        forward = e.a == at
        pts = e.pts if forward else e.pts[::-1]
        r = min(len(pts) - 1, _TANGENT_REACH)
        return forward, _unit(complex(pts[r] - pts[0]))

    def arrive_dir(k: int, forward: bool) -> complex:
        pts = edges[k].pts if forward else edges[k].pts[::-1]
        r = min(len(pts) - 1, _TANGENT_REACH)
        return _unit(complex(pts[-1] - pts[-1 - r]))

    # Start at an end of the longest stroke.
    start_edge = max(range(len(edges)), key=lambda k: (not edges[k].connector, edges[k].length))
    start = edges[start_edge].a
    stack: list[tuple[int, int, bool]] = [(start, -1, True)]
    circuit: list[tuple[int, bool]] = []
    ptr = [0] * len(nodes)
    while stack:
        v, k_in, fwd_in = stack[-1]
        while ptr[v] < len(incident[v]) and used[incident[v][ptr[v]]]:
            ptr[v] += 1
        if ptr[v] < len(incident[v]):
            heading = arrive_dir(k_in, fwd_in) if k_in >= 0 else 0j
            best_k, best_score, best_fwd = -1, np.inf, True
            for k in incident[v][ptr[v]:]:
                if used[k]:
                    continue
                fwd, d = leave(k, v)
                # Turn angle (0 = straight on); connectors after any stroke.
                score = -(d * heading.conjugate()).real if heading else 0.0
                score += 10.0 if edges[k].connector else 0.0
                if score < best_score:
                    best_k, best_score, best_fwd = k, score, fwd
            used[best_k] = True
            e = edges[best_k]
            stack.append((e.b if best_fwd else e.a, best_k, best_fwd))
        else:
            stack.pop()
            if k_in >= 0:
                circuit.append((k_in, fwd_in))
    circuit.reverse()
    return circuit


def _assemble(
    nodes: list[complex], edges: list[_Edge], walk: list[tuple[int, bool]]
) -> tuple[list[NDArray[np.complex128]], list[float]]:
    pieces: list[NDArray[np.complex128]] = []
    gaps: list[float] = []
    run: list[NDArray[np.complex128]] = []
    for k, fwd in walk:
        e = edges[k]
        pts = e.pts if fwd else e.pts[::-1]
        if e.connector:
            if not run:
                run = [pts[:1]]
            pieces.append(np.concatenate(run))
            gaps.append(float(abs(pts[-1] - pts[0])))
            run = [pts[-1:]]
        else:
            run.append(pts if not run else pts[1:])
    if run:
        pieces.append(np.concatenate(run))
    return pieces, gaps
