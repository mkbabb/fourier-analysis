"""The pinned-model directory: ``$FOURIER_MODEL_DIR``, else the user cache."""

from pathlib import Path

import pytest

from fourier_analysis.contours.lines import LINE_MODEL
from fourier_analysis.contours.ml import MODEL_DIR_ENV, U2NET, model_dir
from fourier_analysis.contours.parts import FACE_DETECTOR, FACE_PARSER
from fourier_analysis.contours.person import PERSON_PARSER


def test_defaults_to_the_user_cache(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.delenv(MODEL_DIR_ENV, raising=False)
    monkeypatch.setenv("HOME", str(tmp_path))
    assert model_dir() == tmp_path / ".cache" / "fourier-analysis" / "models"


def test_reads_the_configured_dir(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setenv(MODEL_DIR_ENV, str(tmp_path / "baked"))
    assert model_dir() == tmp_path / "baked"
    for spec in (U2NET, FACE_DETECTOR, FACE_PARSER, PERSON_PARSER, LINE_MODEL):
        assert spec.path.parent == tmp_path / "baked"
