"""RFC 9457 problem+json envelope + closed-set catalog (CRUD-CONTRACT §0 SOTA-3, SCHEMA §5).

One ``problem`` builder + one ``functools.partial`` helper per catalog row (R3 §3.1).
"""

from functools import partial
from typing import Any

from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict


class FieldError(BaseModel):
    path: str  # JSON pointer to the offending field
    message: str


class ProblemDetails(BaseModel):
    """RFC 9457 Problem Details (SCHEMA §2)."""

    type: str  # URN: 'urn:contract:<slug>'
    title: str
    status: int
    detail: str | None = None
    instance: str | None = None
    errors: list[FieldError] | None = None
    model_config = ConfigDict(extra="allow")  # extras flow through


def problem(
    type_: str,
    status: int,
    title: str,
    *,
    detail: str | None = None,
    instance: str | None = None,
    headers: dict[str, str] | None = None,
    **extras: Any,
) -> JSONResponse:
    """JSONResponse (``application/problem+json``); ``extras`` merge into the body verbatim."""
    body: dict[str, Any] = {"type": type_, "title": title, "status": status}
    if detail is not None:
        body["detail"] = detail
    if instance is not None:
        body["instance"] = instance
    body.update(extras)
    return JSONResponse(
        body, status_code=status, media_type="application/problem+json", headers=headers
    )


# Per-error helpers — one ``partial(problem, type_, status, title)`` per SCHEMA §5 row.
# fmt: off
slug_invalid = partial(problem, "urn:contract:slug-invalid", 400, "Invalid slug shape")
slug_conflict = partial(problem, "urn:contract:slug-conflict", 409, "Slug already in use")
owner_required = partial(problem, "urn:contract:owner-required", 401, "Owner required")
not_owner = partial(problem, "urn:contract:not-owner", 403, "Not the owner")
not_found = partial(problem, "urn:contract:not-found", 404, "Resource not found")
visibility_illegal_transition = partial(problem, "urn:contract:visibility-illegal-transition", 409, "Illegal visibility transition")
soft_deleted = partial(problem, "urn:contract:soft-deleted", 410, "Resource soft-deleted")
etag_mismatch = partial(problem, "urn:contract:etag-mismatch", 412, "ETag precondition failed")
precondition_required = partial(problem, "urn:contract:precondition-required", 428, "Precondition required")
idempotency_replay_conflict = partial(problem, "urn:contract:idempotency-replay-conflict", 409, "Idempotency-Key body mismatch")
cursor_invalid = partial(problem, "urn:contract:cursor-invalid", 400, "Invalid pagination cursor")
validation_failed = partial(problem, "urn:contract:validation-failed", 422, "Request validation failed")
session_invalid = partial(problem, "urn:contract:session-invalid", 401, "Session invalid or expired")
account_suspended = partial(problem, "urn:contract:account-suspended", 403, "Account suspended")
payload_too_large = partial(problem, "urn:contract:payload-too-large", 413, "Payload too large")
admin_not_configured = partial(problem, "urn:contract:admin-not-configured", 503, "Admin not configured")
admin_forbidden = partial(problem, "urn:contract:admin-forbidden", 403, "Admin token invalid")
flag_self = partial(problem, "urn:contract:flag-self", 400, "Cannot flag own resource")
flag_duplicate = partial(problem, "urn:contract:flag-duplicate", 409, "Already flagged")
slug_pool_exhausted = partial(problem, "urn:contract:slug-exhausted", 503, "Slug-mint retry exhausted")
# fmt: on


def rate_limited(retry_after: int, **extras: Any) -> JSONResponse:
    """429 with a ``Retry-After`` header (SCHEMA §5 ``urn:contract:rate-limited``)."""
    headers = {"Retry-After": str(retry_after)}
    return problem("urn:contract:rate-limited", 429, "Rate limit exceeded", headers=headers, **extras)  # fmt: skip
