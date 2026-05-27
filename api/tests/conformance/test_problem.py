"""Conformance — problem+json envelope (CONFORMANCE-MATRIX CS5.1–CS5.3; RFC 9457, invariant 22).

Exercises ``api/lib/crud/errors.py`` — the one ``problem`` builder + the closed
catalog of ``functools.partial`` helpers (SCHEMA §5). Every error path the
visualization/admin surface raises flows through this builder, so asserting the
envelope here binds the matrix's CS5 rows. Pure functions; no DB.
"""

import json
import re

from api.lib.crud import errors
from api.lib.crud.errors import ProblemDetails

# The closed SCHEMA §5 catalog: 20 ``partial`` helper rows + ``rate_limited`` = 21.
_CATALOG = [
    ("slug_invalid", 400, "urn:contract:slug-invalid"),
    ("slug_conflict", 409, "urn:contract:slug-conflict"),
    ("owner_required", 401, "urn:contract:owner-required"),
    ("not_owner", 403, "urn:contract:not-owner"),
    ("not_found", 404, "urn:contract:not-found"),
    ("visibility_illegal_transition", 409, "urn:contract:visibility-illegal-transition"),
    ("soft_deleted", 410, "urn:contract:soft-deleted"),
    ("etag_mismatch", 412, "urn:contract:etag-mismatch"),
    ("precondition_required", 428, "urn:contract:precondition-required"),
    ("idempotency_replay_conflict", 409, "urn:contract:idempotency-replay-conflict"),
    ("cursor_invalid", 400, "urn:contract:cursor-invalid"),
    ("validation_failed", 422, "urn:contract:validation-failed"),
    ("session_invalid", 401, "urn:contract:session-invalid"),
    ("account_suspended", 403, "urn:contract:account-suspended"),
    ("payload_too_large", 413, "urn:contract:payload-too-large"),
    ("admin_not_configured", 503, "urn:contract:admin-not-configured"),
    ("admin_forbidden", 403, "urn:contract:admin-forbidden"),
    ("flag_self", 400, "urn:contract:flag-self"),
    ("flag_duplicate", 409, "urn:contract:flag-duplicate"),
    ("slug_pool_exhausted", 503, "urn:contract:slug-exhausted"),
]


def _body(resp):
    return json.loads(resp.body)


def test_envelope():
    """CS5.1 — every catalogued error is ``application/problem+json`` + schema-valid."""
    for name, status, type_ in _CATALOG:
        resp = getattr(errors, name)()
        assert resp.media_type == "application/problem+json"
        body = _body(resp)
        assert body["type"] == type_ and body["status"] == status
        ProblemDetails.model_validate(body)
    # The 429 rate-limit envelope is built by the dedicated helper (Retry-After).
    limited = errors.rate_limited(30)
    assert limited.media_type == "application/problem+json"
    assert limited.headers["Retry-After"] == "30"
    ProblemDetails.model_validate(_body(limited))


def test_catalog_coverage():
    """CS5.2 — 21 catalogued ``type`` URNs, each in ``urn:contract:<kebab>`` form."""
    # 20 partial helpers + rate_limited = 21.
    assert len(_CATALOG) == 20
    assert errors.rate_limited(1).status_code == 429
    urn_re = re.compile(r"^urn:contract:[a-z]+(-[a-z]+)*$")
    seen = set()
    for name, _status, type_ in _CATALOG:
        assert urn_re.fullmatch(type_), type_
        seen.add(_body(getattr(errors, name)())["type"])
    seen.add(_body(errors.rate_limited(1))["type"])
    assert len(seen) == 21  # every catalogued type is emitted by at least one path


def test_slug_exhausted_503():
    """CS5.3 — the slug-mint retry-exhaust path emits 503 ``urn:contract:slug-exhausted``."""
    resp = errors.slug_pool_exhausted()
    assert resp.status_code == 503
    body = _body(resp)
    assert body["type"] == "urn:contract:slug-exhausted" and body["status"] == 503
