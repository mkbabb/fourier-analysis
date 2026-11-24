"""FORTY-SIXTH G: the sketch a job streams while its drawing is found
(``computation.sketch_lines``): each line resampled by arc length, short lines
dropped, the whole under the point budget, in the contour's own frame."""

import numpy as np

from api.services.computation import SKETCH_MAX_POINTS, SKETCH_SPACING, sketch_lines


def _xy(flat: list[float]) -> np.ndarray:
    return np.array(flat).reshape(-1, 2)


def test_a_line_is_resampled_along_its_length_and_keeps_its_ends():
    line = np.array([0 + 0j, 30 + 0j, 30 + 40j])
    (out,) = sketch_lines([line])
    xy = _xy(out)
    assert xy[0].tolist() == [0.0, 0.0] and xy[-1].tolist() == [30.0, 40.0]
    steps = np.hypot(*np.diff(xy, axis=0).T)
    assert steps.max() <= SKETCH_SPACING + 1e-6
    # The corner is kept within one step: the points follow the line, not its chord.
    assert np.min(np.hypot(xy[:, 0] - 30, xy[:, 1])) <= SKETCH_SPACING / 2 + 1e-6


def test_short_lines_and_single_points_are_dropped():
    assert sketch_lines([np.array([0 + 0j, 5 + 0j]), np.array([3 + 3j])]) == []


def test_a_long_drawing_is_held_under_the_point_budget():
    t = np.linspace(0, 2 * np.pi, 2000)
    rings = [r * np.exp(1j * t) for r in range(50, 450, 10)]
    out = sketch_lines(rings)
    assert len(out) == len(rings)
    assert sum(len(f) // 2 for f in out) <= SKETCH_MAX_POINTS + 2 * len(rings)


def test_points_are_in_the_contours_frame_at_one_decimal():
    (out,) = sketch_lines([np.array([-12.345 + 7.891j, 10.0 + 7.891j])])
    xy = _xy(out)
    assert xy[0].tolist() == [-12.3, 7.9]
    assert all(round(v, 1) == v for v in out)
