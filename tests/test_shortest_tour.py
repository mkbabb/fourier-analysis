"""Tests for fourier_analysis.shortest_tour: the MST-spliced tour (``method="mst"``)
and the minimum-retrace postman tour over a stroke graph (the default)."""

import numpy as np
import pytest

from fourier_analysis.shortest_tour import ContourTour, build_contour_tour


def _circle(center: complex, radius: float, n: int = 64, phase: float = 0.0) -> np.ndarray:
    t = np.linspace(0, 2 * np.pi, n, endpoint=False) + phase
    z = center + radius * np.exp(1j * t)
    return np.append(z, z[0]).astype(np.complex128)


def _connectors(tour: ContourTour) -> list[tuple[complex, complex]]:
    pieces = tour.ordered_contours
    return [(pieces[i][-1], pieces[i + 1][0]) for i in range(len(pieces) - 1)]


def _undirected(segments):
    return {tuple(sorted(((a.real, a.imag), (b.real, b.imag)))) for a, b in segments}


def _mst_max_edge(contours) -> float:
    """Kruskal over the brute-force minimum inter-contour distances."""
    n = len(contours)
    edges = sorted(
        (float(np.min(np.abs(contours[i][:, None] - contours[j][None, :]))), i, j)
        for i in range(n)
        for j in range(i + 1, n)
    )
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    longest = 0.0
    for w, i, j in edges:
        ri, rj = find(i), find(j)
        if ri != rj:
            parent[ri] = rj
            longest = max(longest, w)
    return longest


def _face() -> list[np.ndarray]:
    """A silhouette with nested features (eyes, mouth) plus an open stroke."""
    return [
        _circle(0, 100, 256),
        _circle(-35 + 30j, 12, 48, phase=2.0),
        _circle(35 + 30j, 12, 48, phase=4.0),
        _circle(-35 + 30j, 4, 24, phase=1.0),  # a pupil inside an eye
        np.linspace(-40 - 40j, 40 - 40j, 30).astype(np.complex128),  # an open mouth line
        _circle(0 - 5j, 6, 24, phase=3.0),
    ]


class TestBuildContourTour:
    def test_empty_contours_returns_empty(self):
        tour = build_contour_tour([])
        assert len(tour.path) == 0
        assert tour.path.dtype == np.complex128
        assert tour.ordered_contours == ()
        assert tour.gap_lengths == ()

    def test_single_contour_returned_as_is(self):
        contour = np.array([0, 1, 2, 3], dtype=np.complex128)
        tour = build_contour_tour([contour])
        np.testing.assert_array_equal(tour.path, contour)
        assert len(tour.ordered_contours) == 1
        assert tour.gap_lengths == ()

    def test_unknown_method_raises(self):
        with pytest.raises(ValueError, match="Unknown method"):
            build_contour_tour([np.array([0, 1], dtype=np.complex128)], method="nearest_2opt")

    def test_contour_tour_is_frozen(self):
        tour = build_contour_tour([np.array([0, 1], dtype=np.complex128)])
        with pytest.raises(AttributeError):
            tour.path = np.array([])  # type: ignore[misc]

    def test_tour_is_exactly_closed(self):
        tour = build_contour_tour(_face())
        assert tour.path[0] == tour.path[-1]

    def test_path_is_pieces_concatenated(self):
        tour = build_contour_tour(_face())
        np.testing.assert_array_equal(tour.path, np.concatenate(tour.ordered_contours))
        assert len(tour.gap_lengths) == len(tour.ordered_contours) - 1
        for (a, b), g in zip(_connectors(tour), tour.gap_lengths):
            assert g == pytest.approx(abs(a - b))

    def test_every_loop_visited_once(self):
        contours = _face()
        tour = build_contour_tour(contours, method="mst")
        path_pts = set(tour.path.tolist())
        for c in contours:
            assert set(c.tolist()) <= path_pts
        # Each closed loop is traced exactly once around: every vertex of a
        # loop appears once, except the entry vertex, which the walk revisits
        # once per child it leaves from plus once to close.
        ink = sum(float(np.abs(np.diff(p)).sum()) for p in tour.ordered_contours)
        loops = sum(float(np.abs(np.diff(c)).sum()) for c in contours[:4] + contours[5:])
        stroke = float(np.abs(np.diff(contours[4])).sum())
        assert ink == pytest.approx(loops + 2 * stroke)  # the open stroke is out and back

    def test_connectors_are_mst_edges(self):
        contours = _face()
        tour = build_contour_tour(contours, method="mst")
        distinct = _undirected(_connectors(tour))
        assert len(distinct) <= len(contours) - 1
        assert len(tour.gap_lengths) == 2 * (len(contours) - 1)  # each edge out and back
        longest = _mst_max_edge(contours)
        assert max(tour.gap_lengths) <= longest + 1e-9

    def test_children_enter_at_nearest_vertex(self):
        """A child loop is entered at its point nearest the parent, not its seam."""
        outer = _circle(0, 100, 360)
        inner = _circle(0, 90, 360, phase=np.pi)  # seam on the far side
        tour = build_contour_tour([outer, inner], method="mst")
        assert max(tour.gap_lengths) == pytest.approx(10.0, abs=0.5)

    def test_open_strokes_retrace_not_jump(self):
        """Open strokes join at their nearest vertex and come back along themselves."""
        a = np.linspace(0, 10, 11).astype(np.complex128)
        b = np.linspace(12 + 5j, 12 + 50j, 20).astype(np.complex128)
        tour = build_contour_tour([a, b])
        assert tour.path[0] == tour.path[-1]
        assert max(tour.gap_lengths) == pytest.approx(abs(10 - (12 + 5j)))

    def test_children_follow_arc_order(self):
        """Several children on one loop are visited in arc order along it."""
        outer = _circle(0, 100, 360)
        angles = [0.3, 2.5, 1.2, 4.0, 5.5]
        kids = [_circle(80 * np.exp(1j * a), 5, 32) for a in angles]
        tour = build_contour_tour([outer, *kids], method="mst")
        first_hits = []
        for k in kids:
            first_hits.append(min(tour.path.tolist().index(p) for p in k.tolist()))
        visit_order = [angles[i] for i in np.argsort(first_hits)]
        start_angle = np.angle(tour.path[0]) % (2 * np.pi)
        rel = [(a - start_angle) % (2 * np.pi) for a in visit_order]
        assert rel == sorted(rel)

    def test_touching_contours_join_with_zero_connector(self):
        a = _circle(0, 10, 32)
        b = _circle(20, 10, 32, phase=np.pi)  # touches a at z=10
        tour = build_contour_tour([a, b], method="mst")
        assert min(tour.gap_lengths) == pytest.approx(0.0, abs=1e-9)
        assert tour.path[0] == tour.path[-1]


def _walk_length(tour: ContourTour) -> float:
    return float(np.abs(np.diff(tour.path)).sum())


def _edge_multiset(path: np.ndarray) -> dict:
    out: dict = {}
    for a, b in zip(path[:-1], path[1:]):
        if a == b:
            continue
        key = tuple(sorted(((a.real, a.imag), (b.real, b.imag))))
        out[key] = out.get(key, 0) + 1
    return out


class TestPostmanTour:
    def test_eulerian_graph_is_walked_without_retrace(self):
        """Two loops sharing a node (a figure eight) are drawn once each."""
        a = _circle(0, 10, 32)  # seam at z = 10
        b = _circle(20, 10, 32, phase=np.pi)  # seam at z = 10 too
        tour = build_contour_tour([a, b])
        assert tour.gap_lengths == ()
        assert tour.path[0] == tour.path[-1]
        ink = sum(float(np.abs(np.diff(c)).sum()) for c in (a, b))
        assert _walk_length(tour) == pytest.approx(ink)

    def test_t_junction_retraces_the_minimum(self):
        """A T: three strokes at one junction; the walk repeats the shortest
        pairing of its four odd nodes, along the strokes, never a jump."""
        left = np.linspace(0, 5, 6).astype(np.complex128)
        right = np.linspace(5, 10, 6).astype(np.complex128)
        stem = np.linspace(5, 5 + 8j, 9).astype(np.complex128)
        tour = build_contour_tour([left, right, stem])
        assert tour.gap_lengths == ()
        assert tour.path[0] == tour.path[-1]
        # Ink 18; the four odd nodes pair at a cost of 18 (e.g. 0-5 and 10-5-5+8j).
        assert _walk_length(tour) == pytest.approx(36.0)
        # Every step of the walk lies on a stroke (retraces coincide with ink).
        ink = _edge_multiset(np.concatenate([left, right, stem]))
        for key in _edge_multiset(tour.path):
            assert key in ink or tuple(reversed(key)) in ink

    def test_every_stroke_is_drawn(self):
        contours = _face()
        tour = build_contour_tour(contours)
        pts = set(tour.path.tolist())
        for c in contours:
            assert set(c.tolist()) <= pts
        assert tour.path[0] == tour.path[-1]

    def test_path_is_pieces_concatenated(self):
        tour = build_contour_tour(_face())
        np.testing.assert_array_equal(tour.path, np.concatenate(tour.ordered_contours))
        assert len(tour.gap_lengths) == len(tour.ordered_contours) - 1

    def test_components_join_by_mst_connectors(self):
        """Separate closed loops are joined by their shortest connectors only
        (each drawn out and back: a repeated jump coincides with itself)."""
        contours = [c for c in _face() if c[0] == c[-1]]
        tour = build_contour_tour(contours)
        assert max(tour.gap_lengths) <= _mst_max_edge(contours) + 1e-9

    def test_walk_goes_straight_through_a_crossing(self):
        """At an X the pen leaves by the stroke that turns least."""
        h = np.linspace(-10, 10, 21).astype(np.complex128)
        v = (1j * np.linspace(-10, 10, 21)).astype(np.complex128)
        arms = [h[:11], h[10:], v[:11], v[10:]]
        tour = build_contour_tour(arms)
        path = tour.path
        centre = [i for i in range(1, len(path) - 1) if path[i] == 0]
        for i in centre:
            turn = (path[i + 1] - path[i]) * np.conj(path[i] - path[i - 1])
            assert turn.real >= 0  # straight on or a turn, never a reversal
