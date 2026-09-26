"""Subject support (F.CT CT-4): clip to the subject instead of voting."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

from fourier_analysis.contours.support import (
    FRAME_MARGIN_PX,
    InkCoverage,
    arc_support,
    band_px,
    clip_to_subject,
    is_closed_trace,
    normalise_to_subject,
    subject_band,
    subject_edge_field,
)

REFERENCE = Path(__file__).resolve().parents[1] / "bench" / "contours" / "reference"


def _public_mask(name: str = "portraits-euler") -> np.ndarray:
    """A public image's committed, eye-checked subject mask."""
    return np.asarray(Image.open(REFERENCE / f"{name}.png").convert("L")) > 127


def _length(rc: np.ndarray) -> float:
    return float(np.hypot(*np.diff(rc, axis=0).T).sum())


class TestClipToSubject:
    def test_half_inside_contour_returns_its_in_mask_run_only(self):
        mask = _public_mask()
        band = subject_band(mask)
        h, w = mask.shape
        row = int(np.argmax(mask.sum(axis=1)))  # the subject's widest row
        cols = np.flatnonzero(band[row])
        c0 = int(cols[len(cols) // 2])  # inside the subject
        # Walk right from inside the subject off into the background.
        off = np.flatnonzero(~band[row, c0:])
        assert off.size, "the widest row must leave the subject"
        stop = min(w - 1, c0 + int(off[0]) + 200)
        line = np.column_stack([np.full(stop - c0 + 1, float(row)), np.arange(c0, stop + 1.0)])

        runs = clip_to_subject(line, band, min_run_px=10)

        assert len(runs) == 1
        run = runs[0]
        assert not is_closed_trace(run)
        r = np.rint(run[:, 0]).astype(int)
        c = np.rint(run[:, 1]).astype(int)
        assert band[r, c].all()  # nothing off the subject survives
        # ... and the whole in-subject part does.
        assert run[0, 1] == c0
        assert _length(run) == np.count_nonzero(band[row, c0 : stop + 1]) - 1

    def test_contour_inside_is_returned_whole_and_closed(self):
        band = np.zeros((100, 100), dtype=bool)
        band[10:90, 10:90] = True
        t = np.linspace(0, 2 * np.pi, 200)
        loop = np.column_stack([50 + 20 * np.sin(t), 50 + 20 * np.cos(t)])
        loop[-1] = loop[0]
        (out,) = clip_to_subject(loop, band, min_run_px=5)
        assert out is loop and is_closed_trace(out)

    def test_closed_loop_crossing_the_edge_joins_across_its_seam(self):
        band = np.zeros((200, 200), dtype=bool)
        band[:, :100] = True  # the subject is the left half
        t = np.linspace(0, 2 * np.pi, 401)
        # The seam (t=0) sits at the leftmost point, well inside the subject.
        loop = np.column_stack([100 + 50 * np.sin(t), 100 - 50 * np.cos(t)])
        loop[-1] = loop[0]
        runs = clip_to_subject(loop, band, min_run_px=5)
        assert len(runs) == 1  # one arc, not two halves split at the seam
        assert np.all(runs[0][:, 1] < 100.5)

    def test_short_runs_and_outside_contours_are_dropped(self):
        band = np.zeros((50, 50), dtype=bool)
        band[:, :25] = True
        outside = np.column_stack([np.arange(10, 40.0), np.full(30, 40.0)])
        assert clip_to_subject(outside, band, min_run_px=5) == []
        grazing = np.column_stack([np.full(30, 20.0), np.arange(22, 52.0) - 0.0])
        assert clip_to_subject(grazing, band, min_run_px=5) == []

    def test_band_is_the_bar_tolerance_and_excludes_the_frame(self):
        mask = np.zeros((300, 400), dtype=bool)
        mask[:, :200] = True  # crosses three frame sides
        band = subject_band(mask)
        assert band_px(mask.shape) == max(3.0, 0.01 * np.hypot(300, 400))
        b = int(band_px(mask.shape))
        assert band[150, 199 + b] and not band[150, 199 + b + 1]
        m = int(np.ceil(FRAME_MARGIN_PX))
        assert not band[:m].any() and not band[-m:].any() and not band[:, :m].any()


class TestEdgeFields:
    def test_normalise_to_subject_ignores_background_edges(self):
        field = np.zeros((100, 100))
        mask = np.zeros((100, 100), dtype=bool)
        mask[20:80, 20:80] = True
        field[mask] = np.linspace(0, 1, mask.sum())
        field[0:5, 0:5] = 50.0  # a far brighter background edge
        out = normalise_to_subject(field, mask)
        assert np.isclose(np.percentile(out[mask], 95), 1.0)

    def test_subject_edge_field_fades_background(self):
        edge = np.ones((10, 10))
        saliency = np.zeros((10, 10))
        saliency[:, :5] = 1.0
        out = subject_edge_field(edge, saliency, saliency > 0.5)
        assert np.allclose(out[:, :5], 1.0) and np.allclose(out[:, 5:], 0.0)

    def test_arc_support_separates_an_edge_from_a_smooth_region(self):
        img = np.zeros((100, 100))
        img[:, 50:] = 1.0
        grad = np.abs(np.gradient(img, axis=1))
        field = normalise_to_subject(grad, grad > 0)
        along_edge = np.column_stack([np.arange(10, 90.0), np.full(80, 49.5)])
        smooth = np.column_stack([np.arange(10, 90.0), np.full(80, 20.0)])
        assert arc_support(along_edge, field) >= 0.9
        assert arc_support(smooth, field) == 0.0


class TestInkCoverage:
    def test_parallel_stroke_is_redundant_and_distant_one_is_not(self):
        cov = InkCoverage(radius=5.0)
        base = np.arange(0, 200.0) + 0j
        cov.add(base)
        assert cov.overlap(base + 3j) == 1.0
        assert cov.overlap(base + 30j) == 0.0
        half = np.concatenate([np.arange(100, 200.0) + 2j, 200 + 1j * np.arange(10, 110.0)])
        assert 0.4 < cov.overlap(half) < 0.6
