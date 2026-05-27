"""MongoDB session/user documents and related models.

Per CRUD-CONTRACT §6: a session carries an opaque UUIDv4 token (header,
never a cookie), a 30-day TTL, and a ``last_seen_at`` touched on every
authenticated request; the *user* document carries an optional
``status == "suspended"`` flag. Suspension enforcement is a 60-second
in-memory cache (``api/dependencies.py``) — a single-replica constraint
(see ``api/README.md`` § Single-replica constraint).
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from api.models.shared import ContourSettings, AnimationSettings

# Suspension lifecycle on the user document (§6). ``None``/absent == active.
UserStatus = Literal["suspended"]


class SessionCreate(BaseModel):
    pass


class SessionUpdate(BaseModel):
    parameters: ContourSettings | None = None
    animation_settings: AnimationSettings | None = None


class SessionResponse(BaseModel):
    slug: str
    created_at: datetime
    parameters: ContourSettings
    animation_settings: AnimationSettings
    has_image: bool = False
    has_results: bool = False


class SessionDocument(BaseModel):
    """Persisted session row (``_id`` is the UUIDv4 token; §6)."""

    user_slug: str
    ip_hash: str | None = None
    created_at: datetime
    last_seen_at: datetime
    expires_at: datetime


class UserDocument(BaseModel):
    """Persisted user row (``_id`` is the ``user_slug``; §6).

    ``status`` is admin-set; ``"suspended"`` blocks the user's sessions and
    is enforced via the 60-second suspension cache. ``last_seen_at`` is
    touched on every authenticated request and drives the janitor's stale-user
    cascade.
    """

    created_at: datetime
    last_seen_at: datetime
    status: UserStatus | None = None
