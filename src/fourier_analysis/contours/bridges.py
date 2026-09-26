"""Stage 4b: routed connectors — the tour's joins follow the subject's edges.

The tour (``shortest_tour``) joins the chosen strokes along the minimum
spanning tree of their minimum point distances.  A join longer than the
subject band is a straight chord drawn across the subject (a red jump in the
bench overlay: eye to nostril across the cheek, mouth corner to jaw, chin to
collar).  An artist drawing one continuous line does not jump; the pen travels
along a line that is there: the nose bridge, the cheek fold, the neck.

So every spanning-tree join longer than the band is **routed**: the
minimum-cost path between its two attachment points through the cost
``1 / (BRIDGE_EPS + field)``, where ``field`` is the saliency-weighted,
subject-normalised edge field (``subject_edge_field``) clipped to [0, 1].  The
path runs inside the subject mask only, never along ink already drawn (that
would double a stroke), and is accepted only when it is at most ``DETOUR``
times the straight gap (a long detour would draw a line that is not there),
an edge backs it (``ROUTE_SUPPORT``) and it is clean (``MAX_ROUTE_WIGGLE``: a
route threading fur or hatching is scribble); otherwise the join stays a
straight connector.  An accepted route is smoothed
along its length, keeps its endpoints on the two strokes, and becomes ink: it
is appended to the child stroke when it reaches that stroke's open end, and is
otherwise its own open stroke touching both, so the tour's spanning tree joins
through it at zero distance.
"""

from __future__ import annotations

import numpy as np
from numpy.typing import NDArray
from scipy import ndimage as ndi
from skimage.graph import MCP_Geometric

from fourier_analysis.contours.image import LoadedImage
from fourier_analysis.contours.isolation import SubjectIsolation
from fourier_analysis.contours.processing import _simplify_contour
from fourier_analysis.contours.assembly import stroke_wiggle
from fourier_analysis.contours.features import join_ridges
from fourier_analysis.contours.support import (
    RELATIVE_SUPPORT,
    arc_support,
    band_px,
    complex_to_rc,
    subject_edge_field,
    support_floor,
)
from fourier_analysis.shortest_tour import _root_index, _spanning_tree

# Cost floor: a path across a featureless region costs 1 / BRIDGE_EPS per px,
# one along a subject-scale edge about 1.
BRIDGE_EPS = 0.05
# A route longer than this many times the straight gap is not a line that is
# there; the join stays straight.
DETOUR = 2.0
# Drawn ink is off limits within this many px (the start and end excepted).
INK_CLEARANCE_PX = 2.0
# Routes are smoothed along their length by a Gaussian of this many px.
ROUTE_SMOOTH_PX = 4.0
# A route must be a line that is there and a clean one: its median edge
# support at least half a stroke's floor (``support_floor``), and its jags
# (``stroke_wiggle``) no more than a factor-of-two loss in the selection's
# ``clean`` term.  Otherwise the join stays a straight connector.
ROUTE_SUPPORT = 0.25 * RELATIVE_SUPPORT
MAX_ROUTE_WIGGLE = 0.035
# Stroke ends within this many band half-widths are one pen stroke
# (``chain_strokes``): the distance the selection already counts as touching.
CHAIN_GAP_BANDS = 1.0

_CLOSED_EPS = 1e-9


def _is_closed(z: NDArray[np.complex128]) -> bool:
    return len(z) > 2 and abs(z[0] - z[-1]) <= _CLOSED_EPS


def _rc_to_complex(rc: NDArray[np.floating], shape: tuple[int, int]) -> NDArray[np.complex128]:
    cy, cx = shape[0] / 2, shape[1] / 2
    return (rc[:, 1] - cx) + 1j * (cy - rc[:, 0])


def _smooth_route(rc: NDArray[np.float64]) -> NDArray[np.float64]:
    if len(rc) < 5:
        return rc
    out = ndi.gaussian_filter1d(rc, ROUTE_SMOOTH_PX, axis=0, mode="nearest")
    out[0], out[-1] = rc[0], rc[-1]
    return out


def route_connectors(
    contours: list[NDArray[np.complex128]],
    isolation: SubjectIsolation,
    image: LoadedImage,
) -> list[NDArray[np.complex128]]:
    """``contours`` with every long spanning-tree join routed along the subject's
    edges (see the module docstring).  The strokes keep their order; a route
    that cannot be appended to its child stroke is added after them."""
    mask = isolation.subject_mask
    if len(contours) < 2 or mask is None or not mask.any():
        return contours
    shape = image.grayscale.shape
    radius = band_px(shape)

    closed = [_is_closed(c) for c in contours]
    verts = [c[:-1] if is_closed else c for c, is_closed in zip(contours, closed)]
    adjacency, attach = _spanning_tree(verts)
    root = _root_index(verts, closed)

    field = np.clip(
        subject_edge_field(image.color_gradient, isolation.saliency_map, mask), 0.0, 1.0
    )
    cost = 1.0 / (BRIDGE_EPS + field)
    route_floor = support_floor(isolation.silhouettes, field, ROUTE_SUPPORT)
    flat_cost = 1.0 / BRIDGE_EPS
    ink = np.zeros(shape, dtype=bool)
    for c in contours:
        rc = np.rint(complex_to_rc(_dense(c), shape)).astype(int)
        rc[:, 0] = rc[:, 0].clip(0, shape[0] - 1)
        rc[:, 1] = rc[:, 1].clip(0, shape[1] - 1)
        ink[rc[:, 0], rc[:, 1]] = True
    near_ink = ndi.distance_transform_edt(~ink) <= INK_CLEARANCE_PX
    walkable = ndi.binary_dilation(mask, iterations=2)

    out = [c.copy() for c in contours]
    extra: list[NDArray[np.complex128]] = []
    order = [(root, -1)]
    seen = {root}
    while order:
        parent, _ = order.pop()
        for child in adjacency[parent]:
            if child in seen:
                continue
            seen.add(child)
            order.append((child, parent))
            vp, vc, gap = attach[(parent, child)]
            if gap <= radius:
                continue
            a = complex_to_rc(verts[parent][vp : vp + 1], shape)[0]
            b = complex_to_rc(verts[child][vc : vc + 1], shape)[0]
            route = _route(a, b, gap, cost, flat_cost, walkable, near_ink)
            if route is None:
                continue
            smooth = _smooth_route(route)
            if arc_support(smooth, field) < route_floor or stroke_wiggle(
                _rc_to_complex(smooth, shape)
            ) > MAX_ROUTE_WIGGLE:
                continue  # a line that is not there, or texture scribble
            z = _simplify_contour(_rc_to_complex(smooth, shape))
            z[0], z[-1] = verts[parent][vp], verts[child][vc]
            m = len(verts[child])
            if not closed[child] and vc == 0:
                out[child] = np.concatenate([z, out[child][1:]])
            elif not closed[child] and vc == m - 1:
                out[child] = np.concatenate([out[child][:-1], z[::-1]])
            else:
                extra.append(z)
    return out + extra


def chain_strokes(
    contours: list[NDArray[np.complex128]],
    gap_px: float,
) -> list[NDArray[np.complex128]]:
    """``contours`` with open strokes whose ends meet chained into one stroke.

    Two strokes that end within ``gap_px`` of each other are one pen stroke
    the extraction happened to break: an eye's upper and lower lid meeting at
    its corners, a smile's lip line and its teeth, a jaw ridge and the chin
    arc.  Drawn apart, the tour lifts the pen between them (or retraces one
    to reach the other); drawn chained, the eye is one closed lid shape and
    the smile one stroke.  Ends are paired nearest first at any angle (a
    corner is a join), each end at most once; a chain that returns to its own
    start closes.  Closed strokes pass through unchanged.  A chain keeps the
    position of its first member, so the silhouettes stay first.
    """
    if gap_px <= 0 or len(contours) < 2:
        return list(contours)
    lines = [np.column_stack([c.real, c.imag]) for c in contours]
    # join_ridges returns the chains in the order of their first-walked member.
    joined = join_ridges(lines, gap_px, max_turn_deg=180.0)
    if len(joined) == len(lines):
        return list(contours)
    order = {tuple(ln[0]): i for i, ln in enumerate(lines)}

    def first_member(chain: NDArray[np.float64]) -> int:
        hits = [order.get(tuple(p)) for p in chain]
        return min(h for h in hits if h is not None)

    joined.sort(key=first_member)
    return [np.asarray(ln[:, 0] + 1j * ln[:, 1], dtype=np.complex128) for ln in joined]


def _dense(z: NDArray[np.complex128]) -> NDArray[np.complex128]:
    if len(z) < 2:
        return z
    s = np.concatenate([[0.0], np.cumsum(np.abs(np.diff(z)))])
    t = np.linspace(0.0, s[-1], max(2, int(np.ceil(s[-1])) + 1))
    return np.interp(t, s, z.real) + 1j * np.interp(t, s, z.imag)


def _route(
    a: NDArray[np.float64],
    b: NDArray[np.float64],
    gap: float,
    cost: NDArray[np.float64],
    flat_cost: float,
    walkable: NDArray[np.bool_],
    near_ink: NDArray[np.bool_],
) -> NDArray[np.float64] | None:
    """The minimum-cost pixel path from ``a`` to ``b`` (``(row, col)``), or
    ``None`` when there is none within ``DETOUR`` x ``gap``."""
    h, w = cost.shape
    pa = np.clip(np.rint(a).astype(int), 0, [h - 1, w - 1])
    pb = np.clip(np.rint(b).astype(int), 0, [h - 1, w - 1])
    # The window a DETOUR-bounded path can reach: the ellipse's bounding box.
    reach = int(np.ceil(DETOUR * gap / 2)) + 2
    mid = (pa + pb) // 2
    r0, r1 = max(0, mid[0] - reach), min(h, mid[0] + reach + 1)
    c0, c1 = max(0, mid[1] - reach), min(w, mid[1] + reach + 1)
    local = cost[r0:r1, c0:c1].copy()
    ink = near_ink[r0:r1, c0:c1].copy()
    rr, cc = np.ogrid[r0:r1, c0:c1]
    for p in (pa, pb):
        ink &= (rr - p[0]) ** 2 + (cc - p[1]) ** 2 > (INK_CLEARANCE_PX + 2) ** 2
    local[ink] = flat_cost * 4.0
    local[~walkable[r0:r1, c0:c1]] = np.inf
    sa, sb = (int(pa[0] - r0), int(pa[1] - c0)), (int(pb[0] - r0), int(pb[1] - c0))
    local[sa] = local[sb] = 1.0
    mcp = MCP_Geometric(local, fully_connected=True)
    costs, _ = mcp.find_costs([sa], [sb])
    if not np.isfinite(costs[sb]):
        return None
    path = np.asarray(mcp.traceback(sb), dtype=np.float64) + [r0, c0]
    length = float(np.hypot(*np.diff(path, axis=0).T).sum())
    if length > DETOUR * max(gap, 1.0):
        return None
    path[0], path[-1] = a, b
    return path
