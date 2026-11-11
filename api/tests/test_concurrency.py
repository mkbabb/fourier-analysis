"""F-L1-7 — one compute worker by default, stated in both compose files.

Each pool worker loads the ONNX contour models (GBs each), so the default is 1
and both compose files say so explicitly.
"""

from __future__ import annotations

from pathlib import Path

import yaml

from api.config import Settings

ROOT = Path(__file__).resolve().parents[2]


def test_default_is_one(monkeypatch):
    monkeypatch.delenv("COMPUTE_CONCURRENCY", raising=False)
    assert Settings().compute_concurrency == 1


class _ComposeLoader(yaml.SafeLoader):
    """Compose's merge tags (``!reset``, ``!override``) read as plain values."""


for _tag in ("!reset", "!override"):
    _ComposeLoader.add_constructor(
        _tag,
        lambda loader, node: loader.construct_sequence(node)
        if isinstance(node, yaml.SequenceNode)
        else loader.construct_mapping(node)
        if isinstance(node, yaml.MappingNode)
        else loader.construct_scalar(node),
    )


def _backend_env(name: str) -> dict[str, str]:
    doc = yaml.load((ROOT / name).read_text(), Loader=_ComposeLoader)
    env = doc["services"]["backend"].get("environment", [])
    return dict(e.split("=", 1) for e in env) if isinstance(env, list) else dict(env)


def test_both_compose_files_state_it():
    for name in ("docker-compose.yml", "docker-compose.prod.yml"):
        assert _backend_env(name).get("COMPUTE_CONCURRENCY") == "1", name
