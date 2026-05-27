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

login_limiter = SlidingWindowLimiter(max_requests=5, window_seconds=60)
like_limiter = SlidingWindowLimiter(max_requests=10, window_seconds=60)
write_limiter = SlidingWindowLimiter(max_requests=10, window_seconds=60)
admin_limiter = SlidingWindowLimiter(max_requests=30, window_seconds=60)


# ---------------------------------------------------------------------------
# FastAPI dependency factories
# ---------------------------------------------------------------------------


def _make_dependency(limiter: SlidingWindowLimiter):
    """Return an async FastAPI dependency that enforces *limiter*."""

    async def _dependency(request: Request) -> None:
        client_ip = request.client.host if request.client else "unknown"
        hashed = hash_ip(client_ip)
        limiter.check(hashed)

    return _dependency


compute_limiter = SlidingWindowLimiter(
    max_requests=settings.compute_rate_limit, window_seconds=60
)

require_login_limit = _make_dependency(login_limiter)
require_like_limit = _make_dependency(like_limiter)
require_write_limit = _make_dependency(write_limiter)
require_admin_limit = _make_dependency(admin_limiter)
require_compute_limit = _make_dependency(compute_limiter)


# ---------------------------------------------------------------------------
# RFC 9239 RateLimit-header middleware (CRUD-CONTRACT §0 SOTA-6, Invariant 24)
# ---------------------------------------------------------------------------


def _limiter_for_path(path: str) -> SlidingWindowLimiter:
    """Pick the limiter whose budget governs *path* so the headers are honest.

    Falls back to the write limiter (the broadest mutation budget) for paths
    that no per-surface limiter guards, so every response still carries a
    truthful default budget rather than omitting the headers.
    """
    if path.startswith("/api/admin"):
        return admin_limiter
    if path.startswith("/api/sessions/login"):
        return login_limiter
    if "/like" in path:
        return like_limiter
    if path.startswith(("/api/contours", "/api/equations")):
        return compute_limiter
    return write_limiter


class RateLimitHeaderMiddleware(BaseHTTPMiddleware):
    """Emit RFC 9239 ``RateLimit-*`` fields on every response (~15 LOC of logic).

    Reads (does not record) the per-key budget from the surface's limiter and
    stamps ``RateLimit-Limit`` / ``RateLimit-Remaining`` / ``RateLimit-Reset``
    on the outgoing response. A 429 additionally carries ``Retry-After`` (the
    reset window). Single-replica posture (Invariant 12) is unchanged — the
    middleware only surfaces the budget the existing limiter already tracks.
    """

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        limiter = _limiter_for_path(request.url.path)
        client_ip = request.client.host if request.client else "unknown"
        limit, remaining, reset = limiter.snapshot(hash_ip(client_ip))
        response.headers["RateLimit-Limit"] = str(limit)
        response.headers["RateLimit-Remaining"] = str(remaining)
        response.headers["RateLimit-Reset"] = str(reset)
        if response.status_code == 429 and "Retry-After" not in response.headers:
            response.headers["Retry-After"] = str(reset or int(limiter.window_seconds))
        return response
