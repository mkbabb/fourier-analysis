"""Tests for fourier_analysis.shortest_tour (the minimum-retrace stroke-graph walk)."""

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

    def test_single_open_stroke_is_drawn_out_and_back(self):
        contour = np.array([0, 1, 2, 3], dtype=np.complex128)
        tour = build_contour_tour([contour])
        np.testing.assert_array_equal(tour.path, np.array([0, 1, 2, 3, 2, 1, 0], dtype=np.complex128))
        assert tour.gap_lengths == ()
        assert tour.retrace_length == pytest.approx(3.0)

    def test_single_loop_is_traced_once(self):
        loop = _circle(0, 10, 16)
        tour = build_contour_tour([loop])
        assert len(tour.path) == len(loop)
        assert tour.retrace_length == 0.0
        assert set(tour.path.tolist()) == set(loop.tolist())

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

    def test_every_stroke_is_drawn(self):
        contours = _face()
        tour = build_contour_tour(contours)
        path_pts = set(tour.path.tolist())
        for c in contours:
            assert set(c.tolist()) <= path_pts
        # Loops are traced once; the open stroke's odd ends are paired along it
        # (a retrace, cheaper than a jump) or by jumps.
        ink = sum(float(np.abs(np.diff(p)).sum()) for p in tour.ordered_contours)
        drawn = sum(float(np.abs(np.diff(c)).sum()) for c in contours)
        assert ink == pytest.approx(drawn + tour.retrace_length)

    def test_jumps_stay_short(self):
        """Separate figures are joined along their minimum spanning tree, and an
        odd end is paired by a straight jump only when retracing to its partner
        costs ``JUMP_PENALTY`` times more: jumps stay on the order of the tree's
        longest edge, and every jump starts and ends on ink."""
        contours = _face()
        tour = build_contour_tour(contours)
        assert max(tour.gap_lengths) <= 2 * _mst_max_edge(contours)
        ink = np.concatenate(contours)
        for a, b in _connectors(tour):
            assert np.min(np.abs(ink - a)) < 1e-6 and np.min(np.abs(ink - b)) < 1e-6

    def test_children_enter_at_nearest_vertex(self):
        """A child loop is entered at its point nearest the parent, not its seam."""
        outer = _circle(0, 100, 360)
        inner = _circle(0, 90, 360, phase=np.pi)  # seam on the far side
        tour = build_contour_tour([outer, inner])
        assert max(tour.gap_lengths) == pytest.approx(10.0, abs=0.5)

    def test_shared_junctions_need_no_jump(self):
        """A theta graph (two arcs and a chord meeting at two junctions) is one
        figure: the walk never jumps, and it retraces only the cheapest path
        pairing its two odd junctions (the chord)."""
        t = np.linspace(0, np.pi, 50)
        top = 100 * np.exp(1j * t)
        bottom = 100 * np.exp(-1j * t)
        chord = np.linspace(100, -100, 40).astype(np.complex128)
        tour = build_contour_tour([top, bottom, chord])
        assert tour.gap_lengths == ()
        assert tour.path[0] == tour.path[-1]
        assert tour.retrace_length == pytest.approx(200.0)

    def test_retrace_coincides_with_its_stroke(self):
        """A spur off a loop is drawn out and back along itself: every point of
        the path lies on a stroke."""
        loop = _circle(0, 50, 64)
        spur = np.linspace(50, 120, 15).astype(np.complex128)  # starts on the loop's seam
        tour = build_contour_tour([loop, spur])
        assert tour.gap_lengths == ()
        ink = set(loop.tolist()) | set(spur.tolist())
        assert set(tour.path.tolist()) <= ink

    def test_touching_contours_join_without_a_jump(self):
        a = _circle(0, 10, 32)
        b = _circle(20, 10, 32, phase=np.pi)  # starts where a starts: z=10
        tour = build_contour_tour([a, b])
        assert tour.gap_lengths == ()
        assert tour.path[0] == tour.path[-1]
