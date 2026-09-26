"""Vectorise a line drawing into a stroke graph.

A raster line drawing (ink darkness in [0, 1]) becomes a planar graph whose
edges are the drawn strokes and whose nodes are where strokes end or meet:

1. **Binarise** the ink, and turn solid fills (a dog's nose, an open mouth)
   into their outline: a region thicker than a drawn line is drawn by its edge.
2. **Skeletonise** to one-pixel centre lines (Zhang-Suen via scikit-image).
3. **Trace** the skeleton into a pixel graph: a node is every end pixel and
   every cluster of junction pixels (merged to its centroid), an edge the
   chain of pixels between two nodes; a skeleton ring with no node is a
   closed loop.
4. **Prune** spurs: a dangling edge shorter than a line's width is a
   skeletonisation artefact (the corner of a thick stroke), not a stroke.
   Nodes left with two edges are dissolved, so a stroke is one edge.
5. **Bridge** small gaps: a stroke end that points at another stroke within
   a few line widths is joined to it, the way the eye reads a broken line.
6. **Smooth** each edge by an arc-length Gaussian with its ends pinned, so
   junctions stay exactly shared between the strokes that meet there.

Coordinates in and out are pixel ``(row, col)``; ``StrokeGraph.polylines``
converts to the pipeline's centred complex plane (x right, y up).
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
from numpy.typing import NDArray
from scipy import ndimage as ndi
from scipy.spatial import cKDTree

# A fill at least this compact is an object drawn by its outline; below it,
# shading left out (``binarise``).
FILL_COMPACTNESS = 0.3
# ... and small: a fill larger than this fraction of the image is a mass of
# shadow (dark hair, a black coat), whose edge is the subject's own outline or
# a shading boundary, not an object.
FILL_MAX_FRACTION = 0.01

_NEIGHBOURS = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


@dataclass
class StrokeGraph:
    """Nodes (``(row, col)`` float) and edges (polylines of ``(row, col)``
    whose first and last points are exactly their nodes' positions)."""

    nodes: list[NDArray[np.float64]] = field(default_factory=list)
    edges: list[tuple[int, int, NDArray[np.float64]]] = field(default_factory=list)

    def degree(self) -> NDArray[np.int64]:
        deg = np.zeros(len(self.nodes), dtype=np.int64)
        for a, b, _ in self.edges:
            deg[a] += 1
            deg[b] += 1
        return deg

    def components(self) -> list[list[int]]:
        """Edge indices grouped by connected component."""
        parent = list(range(len(self.nodes)))

        def find(i: int) -> int:
            while parent[i] != i:
                parent[i] = parent[parent[i]]
                i = parent[i]
            return i

        for a, b, _ in self.edges:
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb
        groups: dict[int, list[int]] = {}
        for k, (a, _, _) in enumerate(self.edges):
            groups.setdefault(find(a), []).append(k)
        return list(groups.values())

    def polylines(self, shape: tuple[int, int]) -> list[NDArray[np.complex128]]:
        cy, cx = shape[0] / 2, shape[1] / 2
        return [(p[:, 1] - cx) + 1j * (cy - p[:, 0]) for _, _, p in self.edges]


def edge_length(p: NDArray[np.float64]) -> float:
    return float(np.hypot(*np.diff(p, axis=0).T).sum()) if len(p) > 1 else 0.0


# ---------------------------------------------------------------------------
# Raster stages
# ---------------------------------------------------------------------------


def binarise(ink: NDArray[np.float64], line_width: float, level: float = 0.5) -> NDArray[np.bool_]:
    """Ink above ``level``, with fills (regions thicker than a line) resolved.

    A drawing model inks a dark region solid.  A compact, small fill (a dog's
    nose, a pupil, an open mouth), closed over its highlights, is drawn by its
    outline, one line wide.  A large one (``FILL_MAX_FRACTION``) or a ragged fill (the shading of dark fur, the
    stripes of a coat: compactness ``4 pi A / P^2`` below
    ``FILL_COMPACTNESS``) is tone, not a line, and is left out; its outline
    would be a lace of noise.
    """
    from skimage.measure import label, regionprops
    from skimage.morphology import disk, remove_small_holes

    b = ink >= level
    r = max(1, int(round(line_width)))
    fill = ndi.binary_opening(b, structure=disk(r))
    if not fill.any():
        return b
    closed = ndi.binary_closing(fill, structure=disk(2 * r))
    closed = remove_small_holes(closed, max_size=int((6 * r) ** 2))
    lab = label(closed)
    keep = np.zeros_like(closed)
    for reg in regionprops(lab):
        compact = 4.0 * np.pi * reg.area / max(reg.perimeter, 1.0) ** 2
        if compact >= FILL_COMPACTNESS and reg.area <= FILL_MAX_FRACTION * b.size:
            keep[lab == reg.label] = True
    tone = closed & ~keep
    b &= ~ndi.binary_dilation(tone, structure=disk(1))
    interior = ndi.binary_erosion(keep, structure=disk(r))
    return (b | keep) & ~interior


def skeleton(b: NDArray[np.bool_]) -> NDArray[np.bool_]:
    from skimage.morphology import skeletonize

    return np.asarray(skeletonize(b), dtype=bool)


def trace_graph(skel: NDArray[np.bool_]) -> StrokeGraph:
    """The skeleton's pixel graph (see module doc, step 3)."""
    h, w = skel.shape
    pad = np.pad(skel, 1)
    count = sum(
        np.roll(np.roll(pad, -dr, 0), -dc, 1) for dr, dc in _NEIGHBOURS
    )[1:-1, 1:-1] * skel
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

    # Chains leaving each node pixel.
    seen_steps: set[tuple[int, int, int, int]] = set()
    for r, c in zip(*np.nonzero(special)):
        a = int(node_of[r, c])
        for rr, cc in nbrs(int(r), int(c)):
            if node_of[rr, cc] == a:
                continue  # inside the same junction cluster
            if (int(r), int(c), rr, cc) in seen_steps:
                continue
            chain = [(int(r), int(c)), (rr, cc)]
            prev, cur = (int(r), int(c)), (rr, cc)
            end = int(node_of[rr, cc])
            while end < 0:
                visited[cur] = True
                nxt = [p for p in nbrs(*cur) if p != prev and p not in chain[-3:]]
                # Prefer a node pixel (a chain ends at the first node it meets).
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
            graph.edges.append((a, end, pts))

    # Rings with no node: closed loops.
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
            if p == start:
                break
            if p in chain:
                break
            prev, cur = cur, p
            chain.append(p)
        if len(chain) < 4:
            continue
        pts = np.asarray(chain + [start], dtype=np.float64)
        idx = len(graph.nodes)
        graph.nodes.append(pts[0].copy())
        graph.edges.append((idx, idx, pts))
    return compact(graph)


# ---------------------------------------------------------------------------
# Graph stages
# ---------------------------------------------------------------------------


def compact(graph: StrokeGraph) -> StrokeGraph:
    """Drop unused nodes; renumber."""
    used = sorted({a for a, _, _ in graph.edges} | {b for _, b, _ in graph.edges})
    remap = {old: new for new, old in enumerate(used)}
    return StrokeGraph(
        nodes=[graph.nodes[i] for i in used],
        edges=[(remap[a], remap[b], p) for a, b, p in graph.edges],
    )


def dissolve_degree_two(graph: StrokeGraph) -> StrokeGraph:
    """Merge the two edges at every node of degree two into one stroke."""
    edges: dict[int, tuple[int, int, NDArray[np.float64]]] = dict(enumerate(graph.edges))
    inc: dict[int, list[int]] = {}
    for k, (a, b, _) in edges.items():
        inc.setdefault(a, []).append(k)
        inc.setdefault(b, []).append(k)  # a self-loop is listed twice: degree 2
    stack = [n for n, ks in inc.items() if len(ks) == 2 and ks[0] != ks[1]]
    while stack:
        n = stack.pop()
        ks = inc.get(n, [])
        if len(ks) != 2 or ks[0] == ks[1]:
            continue
        i, j = ks
        ai, bi, pi = edges[i]
        aj, bj, pj = edges[j]
        if bi != n:
            ai, bi, pi = bi, ai, pi[::-1]
        if aj != n:
            aj, bj, pj = bj, aj, pj[::-1]
        edges[i] = (ai, bj, np.vstack([pi, pj[1:]]))
        del edges[j]
        inc[n] = []
        inc[bj] = [i if k == j else k for k in inc[bj]]
        if bj == ai and len(inc[ai]) == 2 and inc[ai][0] == inc[ai][1]:
            continue  # the chain closed into a ring on ai
        if len(inc[bj]) == 2 and inc[bj][0] != inc[bj][1]:
            stack.append(bj)
    return compact(StrokeGraph(graph.nodes, list(edges.values())))


def prune_spurs(graph: StrokeGraph, min_length: float, passes: int = 2) -> StrokeGraph:
    """Remove dangling edges shorter than ``min_length`` that hang off a
    junction (an isolated short stroke is kept here; the selection judges it)."""
    for _ in range(passes):
        deg = graph.degree()
        keep = []
        for a, b, p in graph.edges:
            dangling = (deg[a] == 1) != (deg[b] == 1)
            if dangling and edge_length(p) < min_length:
                continue
            keep.append((a, b, p))
        if len(keep) == len(graph.edges):
            break
        graph = dissolve_degree_two(compact(StrokeGraph(graph.nodes, keep)))
    return graph


def bridge_gaps(graph: StrokeGraph, max_gap: float, max_angle_deg: float = 40.0) -> StrokeGraph:
    """Join each stroke end to the stroke it points at, within ``max_gap``.

    The target is the nearest ink point inside a cone of ``max_angle_deg``
    about the end's outgoing tangent (read over half the gap) on another
    edge; that edge is split there and the bridge added as a straight edge.
    Ends pointing at nothing stay ends.  Every end is judged against the
    drawing as it was (one spatial index), so the result does not depend on
    the order the ends are visited in.
    """
    if not graph.edges:
        return graph
    deg = graph.degree()
    pts = np.vstack([p for _, _, p in graph.edges])
    owner = np.concatenate([np.full(len(p), k) for k, (_, _, p) in enumerate(graph.edges)])
    index = np.concatenate([np.arange(len(p)) for _, _, p in graph.edges])
    tree = cKDTree(pts)
    cos_max = np.cos(np.deg2rad(max_angle_deg))

    links: list[tuple[int, int, int]] = []  # (end node, target edge, target index)
    done: set[frozenset[int]] = set()
    for k, (a, b, p) in enumerate(graph.edges):
        for end, seq in ((a, p), (b, p[::-1])):
            if deg[end] != 1 or len(seq) < 2:
                continue
            look = min(len(seq) - 1, max(2, int(max_gap / 2)))
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
            ta, tb, tp = graph.edges[tk]
            target_node = ta if ti == 0 else tb if ti == len(tp) - 1 else None
            pair = frozenset((end, target_node if target_node is not None else -1 - tk))
            if target_node is not None and pair in done:
                continue  # two ends pointing at each other: one bridge
            done.add(pair)
            links.append((end, tk, ti))

    nodes = [n.copy() for n in graph.nodes]
    cuts: dict[int, set[int]] = {}
    for _, tk, ti in links:
        cuts.setdefault(tk, set()).add(ti)
    node_at: dict[tuple[int, int], int] = {}
    edges: list[tuple[int, int, NDArray[np.float64]]] = []
    for k, (a, b, p) in enumerate(graph.edges):
        node_at[(k, 0)] = a
        node_at[(k, len(p) - 1)] = b
        inner = sorted(i for i in cuts.get(k, ()) if 0 < i < len(p) - 1)
        prev_i, prev_n = 0, a
        for i in inner:
            nid = len(nodes)
            nodes.append(p[i].copy())
            node_at[(k, i)] = nid
            edges.append((prev_n, nid, p[prev_i : i + 1].copy()))
            prev_i, prev_n = i, nid
        edges.append((prev_n, b, p[prev_i:].copy()))
    for end, tk, ti in links:
        target = node_at[(tk, ti)]
        dist = float(np.hypot(*(nodes[target] - nodes[end])))
        seg = np.linspace(nodes[end], nodes[target], max(2, int(np.ceil(dist)) + 1))
        edges.append((end, target, seg))
    return dissolve_degree_two(StrokeGraph(nodes, edges))


def smooth_edges(graph: StrokeGraph, sigma: float) -> StrokeGraph:
    """Arc-length Gaussian per edge (resampled at 1 px), ends pinned; a
    closed ring is smoothed periodically, its seam pinned to its node."""
    out = []
    for a, b, p in graph.edges:
        q = _uniform(p, 1.0)
        if len(q) >= 5:
            if a == b and np.allclose(q[0], q[-1]):
                body = q[:-1]
                sm = ndi.gaussian_filter1d(body, sigma, axis=0, mode="wrap")
                q = np.vstack([sm, sm[:1]])
            else:
                k = min(len(q) - 1, int(np.ceil(3 * sigma)))
                padded = np.vstack([2 * q[0] - q[k:0:-1], q, 2 * q[-1] - q[-2 : -k - 2 : -1]])
                q = ndi.gaussian_filter1d(padded, sigma, axis=0, mode="nearest")[k : k + len(q)]
        q[0] = graph.nodes[a]
        q[-1] = graph.nodes[b]
        out.append((a, b, q))
    return StrokeGraph(graph.nodes, out)


def _uniform(p: NDArray[np.float64], step: float) -> NDArray[np.float64]:
    s = np.concatenate([[0.0], np.cumsum(np.hypot(*np.diff(p, axis=0).T))])
    if s[-1] <= 0:
        return p.copy()
    t = np.linspace(0.0, s[-1], max(2, int(np.ceil(s[-1] / step)) + 1))
    return np.column_stack([np.interp(t, s, p[:, 0]), np.interp(t, s, p[:, 1])])


def vectorise(
    ink: NDArray[np.float64],
    line_width: float,
    *,
    bridge: float,
    smooth_sigma: float,
    lines: NDArray[np.bool_] | None = None,
) -> StrokeGraph:
    """Line drawing -> stroke graph (module doc, steps 1-6).  ``lines`` are
    pixels drawn as line after the fills are resolved (an outline laid over
    the drawing must not merge with it into a "fill")."""
    b = binarise(ink, line_width)
    if lines is not None:
        b |= lines
    g = trace_graph(skeleton(b))
    g = dissolve_degree_two(g)
    g = prune_spurs(g, 2.5 * line_width)
    g = bridge_gaps(g, bridge)
    return smooth_edges(g, smooth_sigma)


def _bridges(graph: StrokeGraph) -> set[int]:
    """Edges whose removal disconnects their part (parallel edges never do)."""
    import networkx as nx

    g = nx.Graph()
    seen: dict[tuple[int, int], int] = {}
    parallel: set[tuple[int, int]] = set()
    for k, (a, b, _) in enumerate(graph.edges):
        if a == b:
            continue
        key = (min(a, b), max(a, b))
        if key in seen:
            parallel.add(key)
        seen[key] = k
        g.add_edge(*key)
    return {seen[(min(u, v), max(u, v))] for u, v in nx.bridges(g) if (min(u, v), max(u, v)) not in parallel}


def prune_to_budget(
    graph: StrokeGraph,
    budget: float,
    salience,
    batch_fraction: float = 0.05,
) -> StrokeGraph:
    """Drop the least salient strokes until the ink fits ``budget``.

    A stroke may go when dropping it leaves the rest of its part connected: a
    dangling stroke (a twig), a stroke on a cycle, or a whole isolated stroke.
    Each round drops the least salient few (``batch_fraction`` of the
    candidates; two strokes of one cycle dropped together may cut a part in
    two, and the pieces are then judged on their own) and dissolves the junctions left with two strokes: the survivors grow into
    the long lines they belong to, and a line's salience is read on the whole
    line.  The drawing is simplified coarse to fine, as an artist leaves out
    detail.
    """
    while graph.edges:
        lengths = np.array([edge_length(p) for _, _, p in graph.edges])
        excess = float(lengths.sum()) - budget
        if excess <= 0:
            break
        deg = graph.degree()
        bridges = _bridges(graph)
        scored = []
        for k, (a, b, p) in enumerate(graph.edges):
            dangling = bool(deg[a] == 1 or deg[b] == 1)
            if dangling or k not in bridges:
                scored.append((salience(p, float(lengths[k])), k, dangling))
        if not scored:
            break
        scored.sort()
        quota = max(1, int(batch_fraction * len(scored)))
        drop: set[int] = set()
        freed = 0.0
        for _, k, _ in scored:
            if len(drop) >= quota or freed >= excess:
                break
            drop.add(k)
            freed += float(lengths[k])
        graph = dissolve_degree_two(
            compact(StrokeGraph(graph.nodes, [e for k, e in enumerate(graph.edges) if k not in drop]))
        )
    return graph
