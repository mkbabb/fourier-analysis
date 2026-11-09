"""The model fetch retries a transient gateway failure and nothing else."""

import urllib.error
import urllib.request
from pathlib import Path

import pytest

from fourier_analysis.contours import ml

URL = "https://example.invalid/model.onnx"


def _http(code: int) -> urllib.error.HTTPError:
    return urllib.error.HTTPError(URL, code, "x", {}, None)  # type: ignore[arg-type]


def _scripted(monkeypatch: pytest.MonkeyPatch, outcomes: list[Exception | None]) -> list[str]:
    calls: list[str] = []

    def urlretrieve(url: str, dest: Path) -> None:
        calls.append(url)
        outcome = outcomes.pop(0)
        if outcome is not None:
            raise outcome
        Path(dest).write_bytes(b"weights")

    monkeypatch.setattr(urllib.request, "urlretrieve", urlretrieve)
    return calls


def test_a_gateway_timeout_is_retried(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    calls = _scripted(monkeypatch, [_http(504), urllib.error.URLError("reset"), None])
    waits: list[float] = []
    ml._fetch(URL, tmp_path / "m", sleep=waits.append)
    assert len(calls) == 3
    assert waits == [2.0, 4.0]
    assert (tmp_path / "m").read_bytes() == b"weights"


def test_a_client_error_is_raised_at_once(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    calls = _scripted(monkeypatch, [_http(404)])
    with pytest.raises(urllib.error.HTTPError):
        ml._fetch(URL, tmp_path / "m", sleep=lambda _: None)
    assert len(calls) == 1


def test_a_persistent_outage_is_raised(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    calls = _scripted(monkeypatch, [_http(503)] * ml._FETCH_ATTEMPTS)
    with pytest.raises(urllib.error.HTTPError):
        ml._fetch(URL, tmp_path / "m", sleep=lambda _: None)
    assert len(calls) == ml._FETCH_ATTEMPTS
