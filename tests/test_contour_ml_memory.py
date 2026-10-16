"""The contour models' memory bound (F.REL ``.mem``/``.mem2``, COHESION §0ew, §0ey).

Production runs the API under ``memory: 2G``; one default extraction must peak
at or below 1.6 GB (``bench.contours.memory`` reads it, every model on every
harness image; ``scripts/model-smoke.sh`` extracts under the cap).  These
tests hold the three choices that bound it:

- every ONNX session releases its activations after each run (no CPU arena,
  no memory pattern, which otherwise keep a run's peak resident for the life
  of the process);
- the subject ensemble's sessions, the heaviest weights, are opened for one
  run and released after it, while the other models' sessions are held;
- no subject model runs at a megapixel input (BiRefNet-lite's published
  exports are static at 1024: about 5.5 GB for one inference on its own).
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pytest
from PIL import Image

from fourier_analysis.contours import ml


class _Recorder:
    """Stands in for ``onnxruntime.InferenceSession``: records how each one is
    opened and answers a run with a blank map at the model's input size."""

    opened: list[Any] = []

    def __init__(self, path: str, sess_options: Any = None, providers: Any = None) -> None:
        self.path, self.options, self.providers = path, sess_options, providers
        _Recorder.opened.append(self)

    def get_inputs(self) -> list[Any]:
        return [type("Input", (), {"name": "input"})()]

    def run(self, _outputs: Any, feeds: dict[str, np.ndarray]) -> list[np.ndarray]:
        (x,) = feeds.values()
        return [np.zeros((1, 1, *x.shape[2:]), np.float32)]


@pytest.fixture
def recorded_sessions(monkeypatch: pytest.MonkeyPatch, tmp_path):
    ort = pytest.importorskip("onnxruntime")
    _Recorder.opened = []
    monkeypatch.setattr(ort, "InferenceSession", _Recorder)
    monkeypatch.setattr(ml, "_sessions", {})
    monkeypatch.setattr(ml, "_download", lambda spec: tmp_path / f"{spec.name}{spec.suffix}")
    return _Recorder.opened


def _held_specs() -> tuple[ml.SubjectModelSpec, ...]:
    from fourier_analysis.contours.lines import LINE_MODEL
    from fourier_analysis.contours.parts import FACE_DETECTOR, FACE_PARSER

    return (FACE_DETECTOR, FACE_PARSER, LINE_MODEL)


def test_every_session_releases_its_activations(recorded_sessions) -> None:
    specs = (*ml.SUBJECT_MODELS, *_held_specs())
    for spec in specs:
        ml._open_session(spec)
    assert len(recorded_sessions) == len(specs)
    for session in recorded_sessions:
        assert session.options is not None, session.path
        assert session.options.enable_cpu_mem_arena is False, session.path
        assert session.options.enable_mem_pattern is False, session.path
        assert session.providers == ["CPUExecutionProvider"]


def test_a_held_session_is_opened_once(recorded_sessions) -> None:
    for spec in _held_specs():
        first = ml._get_session(spec)
        assert ml._get_session(spec) is first
    assert len(recorded_sessions) == len(_held_specs())
    assert set(ml._sessions) == {spec.name for spec in _held_specs()}


def test_a_subject_session_is_released_after_its_run(recorded_sessions) -> None:
    rgb = Image.new("RGB", (48, 32), (120, 90, 60))
    for _ in range(2):
        for spec in ml.SUBJECT_MODELS:
            out = ml._predict_one(spec, rgb, (32, 48))
            assert out.shape == (32, 48)
    # One session per model per run, none of them kept.
    assert len(recorded_sessions) == 2 * len(ml.SUBJECT_MODELS)
    assert ml._sessions == {}


def test_loading_the_sessions_holds_no_subject_session(recorded_sessions, monkeypatch) -> None:
    from fourier_analysis.contours import person

    monkeypatch.setattr(person, "load_person_session", lambda: None)
    ml.load_subject_sessions()
    assert set(ml._sessions) == {spec.name for spec in _held_specs()}


def test_no_subject_model_runs_at_a_megapixel_input() -> None:
    for spec in ml.SUBJECT_MODELS:
        assert spec.input_size < 1024, spec.name
