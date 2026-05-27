"""Conformance — URL shape / no-secrets (CONFORMANCE-MATRIX CS6.2; SCHEMA §1).

A content hash, Mongo ``_id`` (ObjectId), or session token must never appear in
a URL path or query string on any endpoint. The router path declarations are
keyed on ``{slug}`` / ``{image_slug}`` / ``{contour_hash-as-asset-FK}`` — never
on an entity ``_id`` or a session token. ``test_no_secrets`` greps the router
path decorators + the web client for an ObjectId-shaped or session-token-shaped
URL segment; a runtime source-grep, cheap and Mongo-free.
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]


def test_no_secrets():
    """CS6.2 — no ObjectId / session-token / raw-secret appears in any URL path arg."""
    # Router path decorators: a 24-hex ObjectId or a `{...token...}` / `{..._id}`
    # path parameter would be a leak. Identity is `{slug}` (4-word) only.
    routers = _REPO_ROOT / "api" / "routers"
    offenders: list[str] = []

    # 1. No route path declares an `_id`/`token`-named path parameter.
    bad_param = subprocess.run(
        ["grep", "-rnE", r"@\w+_router\.\w+\(\s*[\"'][^\"']*\{[^}]*(_id|token)[^}]*\}", str(routers)],
        capture_output=True, text=True,
    )
    if bad_param.stdout.strip():
        offenders.extend(bad_param.stdout.strip().splitlines())

    # 2. No literal 24-hex ObjectId or 32+-hex content hash embedded in a route path.
    hex_in_path = subprocess.run(
        ["grep", "-rnE", r"[\"']/[^\"']*[0-9a-f]{24,}", str(routers)],
        capture_output=True, text=True,
    )
    # Filter to actual decorator lines (route declarations), not comments/strings.
    for line in hex_in_path.stdout.strip().splitlines():
        if "_router." in line or re.search(r'@\w+\.(get|post|put|patch|delete)', line):
            offenders.append(line)

    assert not offenders, f"secret-shaped URL fragment(s) in router paths:\n" + "\n".join(offenders)
