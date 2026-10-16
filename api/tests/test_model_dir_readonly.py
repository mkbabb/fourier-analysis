"""F.REL .m falsifier: contour extraction under a read-only HOME.

Production runs the backend with a read-only root filesystem
(``docker-compose.prod.yml`` ``read_only: true``; only ``/tmp`` is writable).
Before the cure, ``contours.ml`` cached its models under ``$HOME/.cache`` and the
first extraction died with ``OSError: Read-only file system``.  The cure bakes
every pinned model into ``FOURIER_MODEL_DIR`` at image build; this test runs the
API's own contour service in a fresh interpreter whose HOME and model directory
are both read-only, and asserts it extracts contours.
"""

from __future__ import annotations

import json
import os
import stat
import subprocess
import sys
from pathlib import Path

import pytest

from fourier_analysis.contours.ml import MODEL_DIR_ENV, ensure_model_downloaded

_REPO_ROOT = Path(__file__).resolve().parents[2]
_PORTRAIT = _REPO_ROOT / "assets" / "portraits" / "joseph-fourier.png"

_EXTRACT = """
import asyncio, json, sys
from pathlib import Path
from fourier_analysis.contours import ContourConfig
from api.services.computation import compute_contours

result = asyncio.run(compute_contours(Path(sys.argv[1]), ContourConfig()))
print(json.dumps({"n_contours": result["n_contours"],
                  "points": sum(c["n_points"] for c in result["contours"])}))
"""

_READ_ONLY_DIR = stat.S_IRUSR | stat.S_IXUSR | stat.S_IRGRP | stat.S_IXGRP


@pytest.fixture
def read_only_model_dir(tmp_path: Path):
    """A read-only directory holding (links to) every pinned model, verified
    against its SubjectModelSpec sha256 by the loader that fetched it."""
    models = tmp_path / "models"
    models.mkdir()
    for source in ensure_model_downloaded():
        (models / source.name).symlink_to(source.resolve())
    models.chmod(_READ_ONLY_DIR)
    yield models
    models.chmod(stat.S_IRWXU)


@pytest.fixture
def read_only_home(tmp_path: Path):
    home = tmp_path / "home"
    home.mkdir()
    home.chmod(_READ_ONLY_DIR)
    yield home
    home.chmod(stat.S_IRWXU)


def test_extracts_contours_with_read_only_home_and_model_dir(
    read_only_home: Path, read_only_model_dir: Path
) -> None:
    # The premise: nothing can be written under either directory.
    for directory in (read_only_home, read_only_model_dir):
        with pytest.raises(PermissionError):
            (directory / "probe").write_bytes(b"")

    env = {
        **os.environ,
        "HOME": str(read_only_home),
        MODEL_DIR_ENV: str(read_only_model_dir),
        "PYTHONDONTWRITEBYTECODE": "1",
    }
    run = subprocess.run(
        [sys.executable, "-c", _EXTRACT, str(_PORTRAIT)],
        cwd=_REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        timeout=600,
    )
    assert run.returncode == 0, run.stderr[-4000:]
    reading = json.loads(run.stdout.strip().splitlines()[-1])
    assert reading["n_contours"] > 0
    assert reading["points"] > 0
    assert list(read_only_home.iterdir()) == []
