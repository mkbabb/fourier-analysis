"""Shared fixtures for the api test suite.

The W3 ``api/lib/crud`` DB-backed specs (softdelete, pinned_cron, idempotency)
need a live Mongo collection. ``mongomock``/``mongomock_motor`` are not in the
dependency set, so we connect to a real Mongo if one is reachable (env
``MONGO_TEST_URI`` or localhost) and otherwise skip — no Docker required.

Each DB-backed test runs its own ``asyncio.run`` body; the ``run_db`` helper
wraps "open a throwaway database → run the coroutine → drop it" so no test
manages event loops or cleanup by hand.
"""

import asyncio
import os
import sys
import uuid
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any

import pytest

# Ensure the repo root is importable so ``import api`` resolves regardless of
# pytest's rootdir-based sys.path insertion (there is no ``api/tests`` package).
_REPO_ROOT = str(Path(__file__).resolve().parents[2])
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

_MONGO_URI = os.environ.get("MONGO_TEST_URI", "mongodb://localhost:27017")


def _mongo_reachable() -> bool:
    from motor.motor_asyncio import AsyncIOMotorClient

    async def _ping() -> bool:
        client = AsyncIOMotorClient(_MONGO_URI, serverSelectionTimeoutMS=800, tz_aware=True)
        try:
            await client.admin.command("ping")
            return True
        except Exception:
            return False
        finally:
            client.close()

    try:
        return asyncio.run(_ping())
    except Exception:
        return False


requires_mongo = pytest.mark.skipif(
    not _mongo_reachable(),
    reason="live MongoDB unavailable (set MONGO_TEST_URI or start localhost:27017)",
)


@pytest.fixture(autouse=True)
def _reset_rate_limiters():
    """Clear the process-singleton sliding-window limiters before each test.

    The limiters in ``api.services.rate_limiter`` are module-level singletons
    (the production single-replica posture, invariant 12). Direct-call endpoint
    tests share that process state, so without a reset the write/admin
    budgets accumulate across tests and spuriously 429. Resetting per-test
    isolates them without weakening the production limits.
    """
    from api.services import rate_limiter as _rl

    for _name in (
        "login_limiter",
        "write_limiter",
        "admin_limiter",
        "compute_limiter",
    ):
        _lim = getattr(_rl, _name, None)
        if _lim is not None and hasattr(_lim, "_buckets"):
            _lim._buckets.clear()
    yield


def run_db(body: Callable[[Any], Awaitable[Any]]) -> Any:
    """Run ``body(db)`` against a throwaway database, dropping it afterwards."""
    from motor.motor_asyncio import AsyncIOMotorClient

    async def _runner() -> Any:
        client = AsyncIOMotorClient(_MONGO_URI, serverSelectionTimeoutMS=800, tz_aware=True)
        name = f"fourier_crudlib_test_{uuid.uuid4().hex[:8]}"
        try:
            return await body(client[name])
        finally:
            await client.drop_database(name)
            client.close()

    return asyncio.run(_runner())
