"""In-memory sliding-window rate limiter keyed by hashed IP with LRU eviction."""

from __future__ import annotations

import hashlib
import math
import time
from collections import OrderedDict
from dataclasses import dataclass, field

from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware

from api.config import settings
from api.lib.crud.errors import rate_limited

# ---------------------------------------------------------------------------
# IP hashing helper
# ---------------------------------------------------------------------------

MAX_ENTRIES = 50_000


def hash_ip(ip: str) -> str:
    """Return the SHA-256 hex digest of a raw IP string."""
    return hashlib.sha256(ip.encode()).hexdigest()


# ---------------------------------------------------------------------------
# Sliding-window rate limiter
# ---------------------------------------------------------------------------


@dataclass
class _BucketEntry:
    """Timestamps of requests inside the current window."""

    timestamps: list[float] = field(default_factory=list)


class SlidingWindowLimiter:
    """Sliding-window rate limiter with LRU eviction.

    Parameters
    ----------
    max_requests:
        Maximum number of requests allowed inside *window_seconds*.
    window_seconds:
        Length of the sliding window in seconds.
    """

    def __init__(self, max_requests: int, window_seconds: float) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # OrderedDict gives us O(1) move-to-end (LRU refresh) and popitem(last=False)
        self._buckets: OrderedDict[str, _BucketEntry] = OrderedDict()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _evict_expired(self, now: float) -> None:
        """Remove the oldest expired entries until we are under *MAX_ENTRIES*."""
        while len(self._buckets) > MAX_ENTRIES:
            # Pop the least-recently-used key
            key, entry = self._buckets.popitem(last=False)
            # Keep only timestamps still inside the window
            cutoff = now - self.window_seconds
            alive = [t for t in entry.timestamps if t > cutoff]
            if alive:
                # Still active — put it back at the *end* (most-recent)
                entry.timestamps = alive
                self._buckets[key] = entry
            # If no alive timestamps, the entry stays evicted (dropped)

    def _prune_bucket(self, entry: _BucketEntry, now: float) -> None:
        cutoff = now - self.window_seconds
        entry.timestamps = [t for t in entry.timestamps if t > cutoff]

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def check(self, hashed_key: str) -> None:
        """Record a hit and raise *HTTPException(429)* if over limit."""
        now = time.monotonic()

        # Evict if we are at capacity
        if len(self._buckets) >= MAX_ENTRIES:
            self._evict_expired(now)

        entry = self._buckets.get(hashed_key)
        if entry is None:
            entry = _BucketEntry()
            self._buckets[hashed_key] = entry
        else:
            # Move to end (mark as recently used)
            self._buckets.move_to_end(hashed_key)

        self._prune_bucket(entry, now)

        if len(entry.timestamps) >= self.max_requests:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later.",
            )

        entry.timestamps.append(now)

    def snapshot(self, hashed_key: str) -> tuple[int, int, int]:
        """Return ``(limit, remaining, reset_seconds)`` without recording a hit.

        ``reset_seconds`` is the whole-second budget until the window's oldest
        live timestamp ages out (0 when the bucket is empty). Read-only: it
        prunes the looked-up bucket but never appends — the honest budget at
        the response boundary (RFC 9239), distinct from ``check`` which both
        enforces and records.
        """
        now = time.monotonic()
        entry = self._buckets.get(hashed_key)
        if entry is None:
            return self.max_requests, self.max_requests, 0

        self._prune_bucket(entry, now)
        used = len(entry.timestamps)
        remaining = max(0, self.max_requests - used)
        if entry.timestamps:
            oldest = min(entry.timestamps)
            reset = max(0, math.ceil(oldest + self.window_seconds - now))
        else:
            reset = 0
        return self.max_requests, remaining, reset


# ---------------------------------------------------------------------------
# Pre-configured limiter instances
# ---------------------------------------------------------------------------

# Read budget for GET/HEAD: high-volume browsing must not be throttled at the
# tight write budget (10/min). 240/min ≈ 4 r/s sustained per IP — generous for a
# user clicking through the gallery, yet far below the nginx ``api_general`` edge
# cap (30 r/s) so this layer governs the honest RFC 9239 RateLimit-* headers
# rather than ever denying normal traffic. (value.js parity: readLimiter ≫ writeLimiter.)
read_limiter = SlidingWindowLimiter(max_requests=240, window_seconds=60)
login_limiter = SlidingWindowLimiter(max_requests=5, window_seconds=60)
like_limiter = SlidingWindowLimiter(max_requests=10, window_seconds=60)
write_limiter = SlidingWindowLimiter(max_requests=10, window_seconds=60)
admin_limiter = SlidingWindowLimiter(max_requests=30, window_seconds=60)


compute_limiter = SlidingWindowLimiter(
    max_requests=settings.compute_rate_limit, window_seconds=60
)


# ---------------------------------------------------------------------------
# RFC 9239 RateLimit-header middleware (CRUD-CONTRACT §0 SOTA-6, Invariant 24)
# ---------------------------------------------------------------------------


def _limiter_for_path(path: str, method: str) -> SlidingWindowLimiter:
    """Pick the limiter whose budget governs *path*/*method* so enforcement and
    the emitted headers are one honest thing.

    Path-specific budgets win for the surfaces they guard (admin/login/like/
    compute). Otherwise the method decides: GET/HEAD reads ride the generous
    ``read_limiter`` (high-volume browsing must not hit the tight write budget),
    every other method (POST/PUT/PATCH/DELETE) rides ``write_limiter`` — the
    broadest mutation budget. This is the value.js single-pick gestalt.
    """
    if path.startswith("/api/admin"):
        return admin_limiter
    if path.startswith("/api/sessions/login"):
        return login_limiter
    if "/like" in path:
        return like_limiter
    # The expensive compute surfaces — exactly the nginx ``api_compute`` zone:
    # /api/equations/{compute,simplify}, /api/contours/.../compute/..., and the
    # image extract-contour pipeline. (Bare GET reads on these prefixes are NOT
    # compute — they fall through to the read budget below.)
    if (
        path.startswith(("/api/equations/compute", "/api/equations/simplify"))
        or "/compute/" in path
        or path.endswith("/extract-contour")
    ):
        return compute_limiter
    if method in ("GET", "HEAD"):
        return read_limiter
    return write_limiter


def _stamp(response, limit: int, remaining: int, reset: int) -> None:
    response.headers["RateLimit-Limit"] = str(limit)
    response.headers["RateLimit-Remaining"] = str(remaining)
    response.headers["RateLimit-Reset"] = str(reset)


class RateLimitHeaderMiddleware(BaseHTTPMiddleware):
    """The single enforce+report path (RFC 9239 / Invariant 24).

    Calls ``limiter.check()`` — the one place that both records the hit and
    enforces the budget — then stamps ``RateLimit-Limit`` / ``-Remaining`` /
    ``-Reset`` from the post-check snapshot. A breach surfaces as the catalog's
    ``application/problem+json`` 429 envelope (``errors.rate_limited``) carrying
    ``Retry-After`` plus the same RateLimit-* fields. This is the transposition
    of the value.js I.W4 unified middleware: no GET route is left uncounted, no
    bucket reports a stale fallback budget. Single-replica posture (Invariant 12)
    is unchanged — one in-memory limiter, one count per request.
    """

    async def dispatch(self, request: Request, call_next):
        # CORS preflights are not real requests — never let one consume budget
        # (a preflight + its POST would otherwise double-count the write limiter).
        if request.method == "OPTIONS":
            return await call_next(request)

        limiter = _limiter_for_path(request.url.path, request.method)
        client_ip = request.client.host if request.client else "unknown"
        hashed = hash_ip(client_ip)

        try:
            limiter.check(hashed)
        except HTTPException:
            _limit, _remaining, reset = limiter.snapshot(hashed)
            retry_after = reset or int(limiter.window_seconds)
            response = rate_limited(retry_after)
            _stamp(response, limiter.max_requests, 0, reset)
            return response

        response = await call_next(request)
        limit, remaining, reset = limiter.snapshot(hashed)
        _stamp(response, limit, remaining, reset)
        return response
