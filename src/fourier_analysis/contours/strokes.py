"""Part boundaries as a stroke graph: every shared boundary drawn once.

The boundary between two parts is traced on the pixel *cracks* (the edges
between pixel corners) of the part map, so a boundary two parts share is one
crack chain, never two parallel traces.  Crack corners where three or more
parts meet (or where a drawn boundary meets an undrawn one) are the graph's
nodes; the chains between them are its edges, and every chain starts and ends
exactly on its nodes, so ``shortest_tour`` can walk the graph.

Clean-up, all in units of the image diagonal (no per-image constants):

1. Chains shorter than ``CONTRACT_PX`` between two nodes are contracted (two
   junctions a pixel apart are one junction).
2. Spurs (a chain with a free end) shorter than ``SPUR_FRACTION`` of the
   diagonal are pruned, and chains meeting at a node of degree two are joined.
3. Isolated loops shorter than ``LOOP_FRACTION`` of the diagonal are dropped.
4. Each chain is smoothed by an arc-length Gaussian of ``SMOOTH_FRACTION`` of
   the diagonal (the crack staircase is half a pixel deep), its ends pinned to
   their nodes, and resampled every ``STEP_PX``.
"""

from __future__ import annotations

import math

import numpy as np
from numpy.typing import NDArray
from scipy import ndimage as ndi

CONTRACT_PX = 3.0
SPUR_FRACTION = 0.012
LOOP_FRACTION = 0.02
SMOOTH_FRACTION = 0.002
MIN_SMOOTH_PX = 1.5
STEP_PX = 1.5


def boundary_strokes(
    labels: NDArray[np.integer],
    drawn: NDArray[np.bool_],
) -> list[NDArray[np.complex128]]:
    """The drawn part boundaries of ``labels`` as strokes in pipeline
    coordinates (centred, y up); strokes meeting at a junction share its
    end point exactly."""
    h, w = labels.shape
    diag = float(math.hypot(h, w))
    chains = _crack_chains(labels, drawn)
    if not chains:
        return []
    chains = _clean(chains, spur=SPUR_FRACTION * diag, loop=LOOP_FRACTION * diag)
    sigma = max(MIN_SMOOTH_PX, SMOOTH_FRACTION * diag)
    out = []
    for c in chains:
        z = (c.pts.real - 0.5 - w / 2) + 1j * (h / 2 - (c.pts.imag - 0.5))
        out.append(_smooth_resample(z, sigma, closed_free=c.free))
    return out


# ---------------------------------------------------------------------------
# Crack chains (pixel-corner coordinates: real = column, imag = row)
# ---------------------------------------------------------------------------


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


# ---------------------------------------------------------------------------
# Graph clean-up
# ---------------------------------------------------------------------------


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
    # Node positions: the mean of every contracted member's chain ends.
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
        pa = a.pts if si == 1 else a.pts[::-1]  # ends at node
        pb = b.pts if sj == 0 else b.pts[::-1]  # starts at node
        ua = a.u if si == 1 else a.v
        vb = b.v if sj == 0 else b.u
        merged = _Chain(ua, vb, np.concatenate([pa, pb[1:]]))
        chains = [c for k, c in enumerate(chains) if k not in (i, j)] + [merged]


# ---------------------------------------------------------------------------
# Smoothing
# ---------------------------------------------------------------------------


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
        # Pin the ends exactly on their nodes (a linear ramp of the residual).
        t = np.linspace(0.0, 1.0, len(sm))[:, None]
        sm = sm - (1 - t) * (sm[0] - q[0]) - t * (sm[-1] - q[-1])
    out = sm[:, 0] + 1j * sm[:, 1]
    return _densify(out, STEP_PX)
