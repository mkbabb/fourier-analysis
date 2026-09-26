"""The F.CT contour bench harness runs and yields sane metrics (not the bar).

Public images only: the private sample is never read by committed tests.
"""

from __future__ import annotations

from pathlib import Path

import pytest

pytest.importorskip("onnxruntime")

from bench.contours.harness import (  # noqa: E402
    EPI_NS,
    PRIVATE_ROOT,
    BenchImage,
    bench_image,
    guard_private_path,
    image_set,
)

SAMPLES = ("portraits-daraksha", "portraits-euler", "animals-golden-retriever", "animals-sun")


@pytest.fixture(scope="module")
def public_images() -> dict[str, BenchImage]:
    imgs = {i.name: i for i in image_set(include_private=False)}
    assert all(not i.private for i in imgs.values())
    return imgs


@pytest.mark.parametrize("name", SAMPLES)
def test_bench_metrics_are_sane(name: str, public_images, tmp_path: Path) -> None:
    m = bench_image(public_images[name], tmp_path)

    assert (tmp_path / f"{name}.png").is_file()
    assert m.reference == "stored"  # the eye-checked reference is committed
    assert 1 <= m.contour_count <= 24
    for v in (m.precision, m.recall, m.background_fraction, m.frame_fraction, m.wiggle):
        assert 0.0 <= v <= 1.0
    assert m.tour_length >= m.ink_length > 0
    assert m.median_step > 0
    assert 0 <= m.chord_count <= m.jump_count <= m.contour_count + m.chord_count
    assert 0.0 <= m.chord_length <= m.ink_length
    assert 0.0 <= m.jump_length <= m.tour_length - m.ink_length + m.chord_length + 1e-6
    errs = [m.epi_err[str(n)] for n in EPI_NS]
    assert all(e >= 0 for e in errs)
    assert errs == sorted(errs, reverse=True)  # more harmonics, less error
    assert m.runtime_s > 0
    # A subject-dominated public image: most ink is on the subject.
    assert m.precision > 0.5


def test_private_outputs_are_confined() -> None:
    with pytest.raises(PermissionError):
        guard_private_path(Path(__file__).parent / "leak.png", private=True)
    guard_private_path(PRIVATE_ROOT / "evidence" / "x.png", private=True)
    guard_private_path(Path(__file__).parent / "ok.png", private=False)


def test_wiggle_reads_jags_not_stroke_ends() -> None:
    """A clean straight open stroke has no staircase: the edge-padded measure
    charged it for its two ends (about 0.8 sigma of length); the
    point-reflected one reads it as clean and still reads a staircase."""
    import numpy as np

    from bench.contours.harness import BAR, ink_wiggle

    straight = np.linspace(0, 60, 61) + 0j
    assert ink_wiggle([straight], reflect=False) > BAR["wiggle"][1]
    assert ink_wiggle([straight]) < 1e-3
    k = np.arange(80)
    stair = 6.0 * ((k + 1) // 2) + 1j * 6.0 * (k // 2)  # 6 px steps along a diagonal
    assert ink_wiggle([stair]) > BAR["wiggle"][1]
