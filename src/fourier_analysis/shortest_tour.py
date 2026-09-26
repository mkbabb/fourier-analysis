"""Contour ordering: one closed minimum-retrace walk over the stroke graph.

The epicycle series draws a single closed curve, so a set of strokes must
become one path.  The strokes are treated as the edges of a graph and the
path is a Chinese-postman walk over it:

1. **The stroke graph.**  Every stroke is an edge between its two end nodes
   (a closed loop is an edge from its seam node back to itself).  End points
   closer than ``SNAP_PX`` are one node, so strokes that share a junction
   (the part boundaries of ``contours.strokes``) meet there.
2. **Connecting the components.**  Components that share no node are joined
   by the minimum spanning tree over their closest point pairs.  A connector
   attaches at the nearest points of the two strokes, which are split there,
   and is a straight *jump*: the only ink the walk draws that is not a stroke.
3. **Minimum retrace.**  A closed walk that uses every edge exists once every
   node has even degree.  The odd nodes are paired by a minimum-weight perfect
   matching, each pair costing its shortest path along the graph (retracing a
   jump is charged ``JUMP_PENALTY`` times its length) or, when that is cheaper
   still, a direct jump at ``JUMP_PENALTY`` times its length.  Every pair's
   path is added as a copy of the edges it runs along, so a retrace is drawn
   exactly on top of its stroke and never reads as a second strand.
4. **The walk.**  Hierholzer's algorithm over the augmented multigraph, which
   at every node leaves along the unused edge that turns least, so the walk
   follows strokes through junctions instead of zigzagging.

``ContourTour.ordered_contours`` holds the runs of ink between jumps in
traversal order, ``gap_lengths`` the jump between run *i* and *i+1*, and
``path`` their concatenation, which ends exactly where it starts.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from numpy.typing import NDArray
from scipy.sparse import csr_matrix  # type: ignore[import-untyped]
from scipy.sparse.csgraph import dijkstra, minimum_spanning_tree  # type: ignore[import-untyped]
from scipy.spatial import KDTree  # type: ignore[import-untyped]

TOUR_METHODS = ("postman",)

SNAP_PX = 0.75
"""Stroke end points closer than this are one graph node."""

JUMP_PENALTY = 8.0
"""A straight jump (or a retrace of one) is charged this many times its
length against a retrace along ink: a retrace lies on its stroke, a jump is a
new line across the drawing."""

ATTACH_SNAP_FRACTION = 0.25
"""A connector attaches at an existing node when one lies within this
fraction of the connector's length (plus ``SNAP_PX``) of its nearest point,
instead of splitting the stroke next to it."""

# scipy reads a zero weight as "no edge"; a constant offset on every
# inter-component weight leaves the spanning tree unchanged.
_WEIGHT_OFFSET = 1.0
# Direction at a node is read over this much arc length of the edge.
_DIRECTION_ARC_PX = 4.0
# Above this many odd nodes the matching runs on each node's nearest partners
# (a sparse candidate graph) instead of on every pair.
_DENSE_MATCHING_LIMIT = 120
_SPARSE_PARTNERS = 12


@dataclass(frozen=True)
class ContourTour:
    """Result of walking the stroke graph as one closed path.

    Attributes
    ----------
    ordered_contours : tuple of NDArray[complex128]
        The runs of ink between jumps, in traversal order.
    gap_lengths : tuple of float
        Jump length between the end of run *i* and the start of *i+1*.
    path : NDArray[complex128]
        Single concatenated path (the main output), closed.
    retrace_length : float
        Ink drawn a second time along its own stroke.
    """

    ordered_contours: tuple[NDArray[np.complex128], ...]
    gap_lengths: tuple[float, ...]
    path: NDArray[np.complex128]
    retrace_length: float = 0.0


def build_contour_tour(
    contours: list[NDArray[np.complex128]],
    *,
    method: str = "postman",
) -> ContourTour:
    """Walk every stroke in one closed path with the least retrace.

    Parameters
    ----------
    contours : list of NDArray[complex128]
        Strokes: closed loops (first point repeated last) or open polylines.
        Strokes that meet share an end point (within ``SNAP_PX``).
    method : str
        ``"postman"`` (the only method).

    Returns
    -------
    ContourTour
        Runs of ink between jumps, the jump lengths, and the concatenated
        closed path.
    """
    if method not in TOUR_METHODS:
        raise ValueError(f"Unknown method: {method!r}")

    graph = _StrokeGraph.from_strokes(contours)
    if not graph.edges:
        return ContourTour(ordered_contours=(), gap_lengths=(), path=np.array([], dtype=np.complex128))

    graph.connect_components()
    retrace = graph.make_eulerian()
    walk = graph.euler_circuit()
    pieces, gaps = graph.assemble(walk)
    path = np.concatenate(pieces) if pieces else np.array([], dtype=np.complex128)
    return ContourTour(
        ordered_contours=tuple(pieces),
        gap_lengths=tuple(gaps),
        path=path,
        retrace_length=retrace,
    )


# ---------------------------------------------------------------------------
# The stroke graph
# ---------------------------------------------------------------------------


@dataclass
class _Edge:
    u: int
    v: int
    poly: NDArray[np.complex128]  # from node u to node v
    jump: bool = False

    @property
    def length(self) -> float:
        return float(np.abs(np.diff(self.poly)).sum())


@dataclass
class _StrokeGraph:
    nodes: list[complex] = field(default_factory=list)
    edges: list[_Edge] = field(default_factory=list)

    # -- construction -----------------------------------------------------

    @classmethod
    def from_strokes(cls, strokes: list[NDArray[np.complex128]]) -> _StrokeGraph:
        polys: list[NDArray[np.complex128]] = []
        for s in strokes:
            z = np.asarray(s, dtype=np.complex128)
            if len(z) < 2:
                continue
            keep = np.concatenate([[True], np.abs(np.diff(z)) > 1e-9])
            z = z[keep]
            if len(z) >= 2:
                polys.append(z)
        g = cls()
        if not polys:
            return g

        ends = np.array([[p[0], p[-1]] for p in polys]).ravel()
        parent = list(range(len(ends)))

        def find(x: int) -> int:
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        tree = KDTree(np.column_stack([ends.real, ends.imag]))
        for a, b in tree.query_pairs(SNAP_PX):
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb
        node_of: dict[int, int] = {}
        end_node = np.empty(len(ends), dtype=int)
        for i in range(len(ends)):
            r = find(i)
            if r not in node_of:
                node_of[r] = len(g.nodes)
                g.nodes.append(complex(ends[r]))
            end_node[i] = node_of[r]

        for k, p in enumerate(polys):
            u, v = int(end_node[2 * k]), int(end_node[2 * k + 1])
            p = p.copy()
            p[0], p[-1] = g.nodes[u], g.nodes[v]
            if len(p) == 2 and u == v:
                continue  # a degenerate loop
            g.edges.append(_Edge(u, v, p))
        return g

    def incidence(self) -> list[list[int]]:
        inc: list[list[int]] = [[] for _ in self.nodes]
        for i, e in enumerate(self.edges):
            inc[e.u].append(i)
            if e.v != e.u:
                inc[e.v].append(i)
            else:
                inc[e.u].append(i)  # a loop meets its node twice
        return inc

    def components(self) -> NDArray[np.int_]:
        parent = list(range(len(self.nodes)))

        def find(x: int) -> int:
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for e in self.edges:
            ru, rv = find(e.u), find(e.v)
            if ru != rv:
                parent[ru] = rv
        roots = np.array([find(i) for i in range(len(self.nodes))])
        used = np.zeros(len(self.nodes), dtype=bool)
        for e in self.edges:
            used[e.u] = used[e.v] = True
        _, comp = np.unique(roots, return_inverse=True)
        comp[~used] = -1
        return comp

    # -- 2. connecting the components -------------------------------------

    def connect_components(self) -> None:
        comp = self.components()
        labels = sorted(set(comp.tolist()) - {-1})
        if len(labels) <= 1:
            return
        index = {c: k for k, c in enumerate(labels)}
        # Every stroke point, tagged with its edge and vertex index.
        pts_by: list[list[tuple[int, int]]] = [[] for _ in labels]
        xy_by: list[list[complex]] = [[] for _ in labels]
        for ei, e in enumerate(self.edges):
            k = index[int(comp[e.u])]
            for vi, z in enumerate(e.poly):
                pts_by[k].append((ei, vi))
                xy_by[k].append(complex(z))
        arrays = [np.column_stack([np.real(x), np.imag(x)]) for x in xy_by]
        trees = [KDTree(a) for a in arrays]
        n = len(labels)
        weights = np.zeros((n, n))
        attach: dict[tuple[int, int], tuple[tuple[int, int], tuple[int, int], float]] = {}
        for i in range(n):
            for j in range(i + 1, n):
                a, b = (i, j) if len(arrays[i]) <= len(arrays[j]) else (j, i)
                dist, nearest = trees[b].query(arrays[a])
                k = int(np.argmin(dist))
                d = float(dist[k])
                attach[(a, b)] = (pts_by[a][k], pts_by[b][int(nearest[k])], d)
                attach[(b, a)] = (pts_by[b][int(nearest[k])], pts_by[a][k], d)
                weights[i, j] = weights[j, i] = d + _WEIGHT_OFFSET
        mst = minimum_spanning_tree(weights).tocoo()

        # Resolve every attachment to a node, splitting strokes where needed.
        splits: dict[int, set[int]] = {}
        wanted: list[tuple[tuple[int, int], tuple[int, int], float]] = []
        for i, j in zip(mst.row.tolist(), mst.col.tolist()):
            pa, pb, d = attach[(i, j)]
            pa = self._snap_to_node(pa, d)
            pb = self._snap_to_node(pb, d)
            wanted.append((pa, pb, d))
            for ei, vi in (pa, pb):
                if 0 < vi < len(self.edges[ei].poly) - 1:
                    splits.setdefault(ei, set()).add(vi)
        where = self._split_edges(splits)
        for pa, pb, _ in wanted:
            u, v = where(pa), where(pb)
            if u != v:
                self.edges.append(
                    _Edge(u, v, np.array([self.nodes[u], self.nodes[v]]), jump=True)
                )

    def _snap_to_node(self, p: tuple[int, int], d: float) -> tuple[int, int]:
        """Move an attachment vertex to its edge's end when one is close."""
        ei, vi = p
        poly = self.edges[ei].poly
        arc = np.concatenate([[0.0], np.cumsum(np.abs(np.diff(poly)))])
        reach = ATTACH_SNAP_FRACTION * d + SNAP_PX
        if arc[vi] <= reach:
            return (ei, 0)
        if arc[-1] - arc[vi] <= reach:
            return (ei, len(poly) - 1)
        return p

    def _split_edges(self, splits: dict[int, set[int]]):
        """Split edges at interior vertices; return a map (edge, vertex) -> node."""
        mapping: dict[tuple[int, int], int] = {}
        ends = [(e.u, e.v) for e in self.edges]
        for ei, cuts in splits.items():
            e = self.edges[ei]
            order = sorted(cuts)
            new_nodes = []
            for vi in order:
                mapping[(ei, vi)] = len(self.nodes)
                new_nodes.append(len(self.nodes))
                self.nodes.append(complex(e.poly[vi]))
            bounds = [0, *order, len(e.poly) - 1]
            ids = [e.u, *new_nodes, e.v]
            pieces = [
                _Edge(ids[k], ids[k + 1], e.poly[bounds[k] : bounds[k + 1] + 1].copy())
                for k in range(len(bounds) - 1)
            ]
            self.edges[ei] = pieces[0]
            self.edges.extend(pieces[1:])

        def where(p: tuple[int, int]) -> int:
            ei, vi = p
            if (ei, vi) in mapping:
                return mapping[(ei, vi)]
            # An end vertex: the original edge's end node.
            return ends[ei][0] if vi == 0 else ends[ei][1]

        return where

    # -- 3. minimum retrace ------------------------------------------------

    def make_eulerian(self) -> float:
        """Pair the odd nodes along the graph; return the ink length retraced."""
        degree = np.zeros(len(self.nodes), dtype=int)
        for e in self.edges:
            degree[e.u] += 1
            degree[e.v] += 1
        odd = np.flatnonzero(degree % 2 == 1)
        if odd.size == 0:
            return 0.0

        n = len(self.nodes)
        best: dict[tuple[int, int], tuple[float, int]] = {}
        for ei, e in enumerate(self.edges):
            if e.u == e.v:
                continue
            w = e.length * (JUMP_PENALTY if e.jump else 1.0)
            key = (min(e.u, e.v), max(e.u, e.v))
            if key not in best or w < best[key][0]:
                best[key] = (max(w, 1e-9), ei)
        rows = [k[0] for k in best] + [k[1] for k in best]
        cols = [k[1] for k in best] + [k[0] for k in best]
        vals = [v[0] for v in best.values()] * 2
        csr = csr_matrix((vals, (rows, cols)), shape=(n, n))
        dist, pred = dijkstra(csr, directed=False, indices=odd, return_predecessors=True)

        pos = np.array([self.nodes[i] for i in odd])
        euclid = np.abs(pos[:, None] - pos[None, :])
        along = dist[:, odd]
        cost = np.minimum(along, JUMP_PENALTY * euclid)
        pairs = _min_weight_perfect_matching(cost)

        retrace = 0.0
        for a, b in pairs:
            u, v = int(odd[a]), int(odd[b])
            if along[a, b] <= JUMP_PENALTY * euclid[a, b] and np.isfinite(along[a, b]):
                x = v
                while x != u:
                    p = int(pred[a, x])
                    ei = best[(min(p, x), max(p, x))][1]
                    e = self.edges[ei]
                    self.edges.append(_Edge(e.u, e.v, e.poly, jump=e.jump))
                    if not e.jump:
                        retrace += e.length
                    x = p
            else:
                self.edges.append(
                    _Edge(u, v, np.array([self.nodes[u], self.nodes[v]]), jump=True)
                )
        return retrace

    # -- 4. the walk -------------------------------------------------------

    def _oriented(self, ei: int, frm: int) -> NDArray[np.complex128]:
        e = self.edges[ei]
        return e.poly if e.u == frm else e.poly[::-1]

    @staticmethod
    def _heading(poly: NDArray[np.complex128], at_end: bool) -> complex:
        """Unit direction of travel leaving ``poly[0]`` (or arriving at ``poly[-1]``)."""
        seq = poly[::-1] if at_end else poly
        steps = np.abs(np.diff(seq))
        arc = np.cumsum(steps)
        k = int(np.searchsorted(arc, _DIRECTION_ARC_PX)) + 1
        k = min(k, len(seq) - 1)
        d = seq[k] - seq[0]
        if abs(d) < 1e-12:
            return 0j
        d = d / abs(d)
        return -d if at_end else d

    def euler_circuit(self) -> list[tuple[int, int]]:
        """Hierholzer's walk as (edge, from-node) steps, turning least at nodes."""
        inc = self.incidence()
        used = np.zeros(len(self.edges), dtype=bool)
        ptr = [list(x) for x in inc]
        # Start on the longest ink edge's first node.
        start_edge = max(
            range(len(self.edges)),
            key=lambda i: (not self.edges[i].jump, self.edges[i].length),
        )
        start = self.edges[start_edge].u
        stack: list[tuple[int, int, int, complex]] = [(start, -1, -1, 0j)]  # node, edge, from, heading
        out: list[tuple[int, int]] = []
        while stack:
            v, e_in, frm, heading = stack[-1]
            cand = [ei for ei in ptr[v] if not used[ei]]
            ptr[v] = cand
            if cand:
                if heading == 0j:
                    choice = cand[0] if e_in != -1 else start_edge if start_edge in cand else cand[0]
                else:
                    choice = max(
                        cand,
                        key=lambda ei: (
                            (self._heading(self._oriented(ei, v), False) * np.conj(heading)).real
                            - (1.0 if self.edges[ei].jump else 0.0)
                        ),
                    )
                used[choice] = True
                poly = self._oriented(choice, v)
                e = self.edges[choice]
                other = e.v if e.u == v else e.u
                if e.u == e.v:
                    other = v
                stack.append((other, choice, v, self._heading(poly, True)))
            else:
                stack.pop()
                if e_in != -1:
                    out.append((e_in, frm))
        out.reverse()
        return out

    def assemble(
        self, walk: list[tuple[int, int]]
    ) -> tuple[list[NDArray[np.complex128]], list[float]]:
        """Runs of ink between jumps, and the jumps' lengths."""
        if not walk:
            return [], []
        # Rotate so the walk starts on ink right after a jump (when it has one),
        # so no run of ink is split across the seam.
        jumps = [k for k, (ei, _) in enumerate(walk) if self.edges[ei].jump]
        if jumps and len(jumps) < len(walk):
            k = jumps[-1] + 1
            walk = walk[k:] + walk[:k]
        pieces: list[NDArray[np.complex128]] = []
        gaps: list[float] = []
        run: list[NDArray[np.complex128]] = []
        first = self._oriented(*walk[0])[0]
        for ei, frm in walk:
            poly = self._oriented(ei, frm)
            if self.edges[ei].jump:
                # A run ends here; consecutive jumps leave a one-point run.
                pieces.append(np.concatenate(run) if run else poly[:1].copy())
                run = []
                gaps.append(float(abs(poly[-1] - poly[0])))
            else:
                run.append(poly if not run else poly[1:])
        # The closing jump (if any) lands back on the start.
        pieces.append(np.concatenate(run) if run else np.array([first]))
        return pieces, gaps


# ---------------------------------------------------------------------------
# Matching
# ---------------------------------------------------------------------------


def _min_weight_perfect_matching(cost: NDArray[np.float64]) -> list[tuple[int, int]]:
    """Minimum-weight perfect matching on an even number of nodes (blossom)."""
    import networkx as nx

    k = cost.shape[0]
    if k == 0:
        return []
    finite = np.where(np.isfinite(cost), cost, np.inf)
    g = nx.Graph()
    g.add_nodes_from(range(k))
    if k <= _DENSE_MATCHING_LIMIT:
        pairs = [(i, j) for i in range(k) for j in range(i + 1, k)]
    else:
        order = np.argsort(finite + np.diag(np.full(k, np.inf)), axis=1)[:, :_SPARSE_PARTNERS]
        pairs = sorted({(min(i, int(j)), max(i, int(j))) for i in range(k) for j in order[i]})
    for i, j in pairs:
        if np.isfinite(finite[i, j]):
            g.add_edge(i, j, weight=float(finite[i, j]))
    m = nx.min_weight_matching(g)
    if 2 * len(m) < k:  # the sparse graph had no perfect matching: go dense
        g = nx.Graph()
        for i in range(k):
            for j in range(i + 1, k):
                g.add_edge(i, j, weight=float(finite[i, j]) if np.isfinite(finite[i, j]) else 1e12)
        m = nx.min_weight_matching(g)
    return [(int(a), int(b)) for a, b in m]
