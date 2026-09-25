"""Contour ordering: one closed tour spliced along a minimum spanning tree.

The epicycle series draws a single closed curve, so a set of contours must
become one path.  Ordering whole contours end-to-start (a TSP over seam
endpoints) forces a jump wherever a closed loop's arbitrary seam lies far
from the next loop, and those jumps cross the subject.  Instead:

1. Build the complete graph over contours, each edge weighted by the minimum
   point-to-point distance between the two contours (a KDTree query that also
   records the attachment-vertex pair).
2. Take its minimum spanning tree, rooted at the largest-area closed loop
   (the silhouette).
3. Walk the tree depth-first.  At each attachment vertex on a parent the walk
   goes out along the connector, traces the child fully from its own
   attachment vertex back to that vertex (recursively), comes back along the
   same connector, and continues along the parent.  Children on one parent are
   met in arc order along it, so the tour stays stroke-local.

A closed loop (``c[0] == c[-1]``) is traced once around.  A genuinely open
stroke joins the tree at whichever of its vertices is nearest and is traversed
out and back (a retrace, never a jump).  The root returns to its own start,
so the tour is exactly closed: every connector is an MST edge, travelled once
out and once back, and none is longer than the longest MST edge.

``ContourTour.ordered_contours`` holds the pieces of ink between connectors in
traversal order, ``gap_lengths`` the connector between piece *i* and *i+1*,
and ``path`` their concatenation.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from numpy.typing import NDArray
from scipy.sparse.csgraph import minimum_spanning_tree  # type: ignore[import-untyped]
from scipy.spatial import KDTree  # type: ignore[import-untyped]

TOUR_METHODS = ("mst",)

_CLOSED_EPS = 1e-9
# scipy reads a (near-)zero weight as "no edge".  Every spanning tree of the
# complete graph has n-1 edges, so a constant offset leaves the MST unchanged
# while keeping touching contours joined.
_WEIGHT_OFFSET = 1.0


@dataclass(frozen=True)
class ContourTour:
    """Result of splicing contours into one closed tour.

    Attributes
    ----------
    ordered_contours : tuple of NDArray[complex128]
        The pieces of ink between connectors, in traversal order.
    gap_lengths : tuple of float
        Connector length between the end of piece *i* and the start of *i+1*.
    path : NDArray[complex128]
        Single concatenated path (the main output).
    """

    ordered_contours: tuple[NDArray[np.complex128], ...]
    gap_lengths: tuple[float, ...]
    path: NDArray[np.complex128]


def build_contour_tour(
    contours: list[NDArray[np.complex128]],
    *,
    method: str = "mst",
) -> ContourTour:
    """Splice contours into one closed tour along their minimum spanning tree.

    Parameters
    ----------
    contours : list of NDArray[complex128]
        Individual contours: closed loops (first point repeated last) or open
        strokes.
    method : str
        ``"mst"`` (the only method).

    Returns
    -------
    ContourTour
        Pieces between connectors, connector lengths, and the concatenated
        path.  With two or more contours the path ends where it starts.  A
        single contour comes back unchanged.
    """
    if method not in TOUR_METHODS:
        raise ValueError(f"Unknown method: {method!r}")

    contours = [np.asarray(c, dtype=np.complex128) for c in contours if len(c) > 0]
    if not contours:
        return ContourTour(
            ordered_contours=(),
            gap_lengths=(),
            path=np.array([], dtype=np.complex128),
        )

    if len(contours) == 1:
        c = contours[0].copy()
        return ContourTour(ordered_contours=(c,), gap_lengths=(), path=c)

    closed = [len(c) > 2 and abs(c[0] - c[-1]) <= _CLOSED_EPS for c in contours]
    verts = [c[:-1] if is_closed else c for c, is_closed in zip(contours, closed)]

    tree_edges, attach = _spanning_tree(verts)
    root = _root_index(verts, closed)
    flat, breaks = _splice(verts, closed, tree_edges, attach, root)

    pieces = [np.asarray(p, dtype=np.complex128) for p in np.split(np.asarray(flat), breaks)]
    gaps = tuple(float(abs(pieces[i][-1] - pieces[i + 1][0])) for i in range(len(pieces) - 1))
    return ContourTour(
        ordered_contours=tuple(pieces),
        gap_lengths=gaps,
        path=np.asarray(flat, dtype=np.complex128),
    )


def _spanning_tree(
    verts: list[NDArray[np.complex128]],
) -> tuple[list[list[int]], dict[tuple[int, int], tuple[int, int, float]]]:
    """MST over the complete contour graph weighted by minimum point distance.

    Returns the adjacency lists and, for every ordered pair (i, j), the
    attachment vertex on i, the attachment vertex on j, and their distance.
    """
    n = len(verts)
    pts = [np.column_stack([v.real, v.imag]) for v in verts]
    trees = [KDTree(p) for p in pts]
    weights = np.zeros((n, n))
    attach: dict[tuple[int, int], tuple[int, int, float]] = {}
    for i in range(n):
        for j in range(i + 1, n):
            # Query the smaller point set against the larger one's tree.
            a, b = (i, j) if len(pts[i]) <= len(pts[j]) else (j, i)
            dist, nearest = trees[b].query(pts[a])
            k = int(np.argmin(dist))
            d = float(dist[k])
            va, vb = k, int(nearest[k])
            attach[(a, b)] = (va, vb, d)
            attach[(b, a)] = (vb, va, d)
            weights[i, j] = weights[j, i] = d + _WEIGHT_OFFSET

    mst = minimum_spanning_tree(weights).tocoo()
    adjacency: list[list[int]] = [[] for _ in range(n)]
    for i, j in zip(mst.row.tolist(), mst.col.tolist()):
        adjacency[i].append(j)
        adjacency[j].append(i)
    return adjacency, attach


def _root_index(verts: list[NDArray[np.complex128]], closed: list[bool]) -> int:
    """The largest-area closed loop (the silhouette); else the longest stroke."""
    loops = [i for i, is_closed in enumerate(closed) if is_closed]
    if loops:
        return max(loops, key=lambda i: _shoelace_area(verts[i]))
    return max(range(len(verts)), key=lambda i: float(np.abs(np.diff(verts[i])).sum()))


def _shoelace_area(v: NDArray[np.complex128]) -> float:
    x, y = v.real, v.imag
    return 0.5 * abs(float(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1))))


def _vertex_sequence(m: int, entry: int, is_closed: bool) -> list[int]:
    """Vertex order that starts and ends at ``entry``.

    A closed loop goes once around.  An open stroke goes out to its end, back
    to its start, and forward to the entry again (a retrace, never a jump).
    """
    if is_closed:
        return [(entry + s) % m for s in range(m + 1)]
    if m == 1:
        return [0]
    return list(range(entry, m)) + list(range(m - 2, -1, -1)) + list(range(1, entry + 1))


def _splice(
    verts: list[NDArray[np.complex128]],
    closed: list[bool],
    adjacency: list[list[int]],
    attach: dict[tuple[int, int], tuple[int, int, float]],
    root: int,
) -> tuple[list[complex], list[int]]:
    """Depth-first walk of the tree (iterative).  Returns the flat point list
    and the indices where a connector begins a new piece."""
    flat: list[complex] = []
    breaks: list[int] = []

    def children_by_vertex(u: int, parent: int) -> dict[int, list[int]]:
        kids: dict[int, list[int]] = {}
        for v in adjacency[u]:
            if v != parent:
                kids.setdefault(attach[(u, v)][0], []).append(v)
        for group in kids.values():
            group.sort(key=lambda v: attach[(u, v)][2])
        return kids

    def frame(u: int, parent: int, entry: int) -> dict:
        return {
            "u": u,
            "seq": _vertex_sequence(len(verts[u]), entry, closed[u]),
            "pos": 0,
            "kids": children_by_vertex(u, parent),
            "pending": [],
            "at": entry,
        }

    stack = [frame(root, -1, 0)]
    while stack:
        f = stack[-1]
        u = f["u"]
        if f["pending"]:
            v = f["pending"].pop(0)
            breaks.append(len(flat))
            stack.append(frame(v, u, attach[(v, u)][0]))
            continue
        if f["pos"] < len(f["seq"]):
            idx = f["seq"][f["pos"]]
            f["pos"] += 1
            flat.append(complex(verts[u][idx]))
            f["at"] = idx
            if idx in f["kids"]:
                f["pending"] = f["kids"].pop(idx)
            continue
        stack.pop()
        if stack:
            parent = stack[-1]
            breaks.append(len(flat))
            flat.append(complex(verts[parent["u"]][parent["at"]]))
    return flat, breaks
