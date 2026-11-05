"""Admin-specific Pydantic models for user management and moderation."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from api.models.gallery import GalleryTier


# ---------------------------------------------------------------------------
# User management
# ---------------------------------------------------------------------------


class AdminUserInfo(BaseModel):
    user_slug: str
    created_at: datetime
    last_seen_at: datetime
    entry_count: int = 0
    status: str = "active"


class AdminUserListResponse(BaseModel):
    items: list[AdminUserInfo]
    total: int
    page: int
    pages: int


class SetUserStatusRequest(BaseModel):
    status: Literal["active", "suspended"]


# ---------------------------------------------------------------------------
# Batch operations
# ---------------------------------------------------------------------------


class BatchGalleryRequest(BaseModel):
    action: Literal["delete", "feature", "unfeature"]
    hashes: list[str] = Field(min_length=1, max_length=50)


class BatchUsersRequest(BaseModel):
    action: Literal["delete", "suspend", "unsuspend"]
    slugs: list[str] = Field(min_length=1, max_length=50)


class BatchResponse(BaseModel):
    """The CRUD-CONTRACT batch return. X·F F-D6 (FW6-G10): ``skipped`` names
    each slug the stated transition did not apply to (it was not in the
    action's ``from`` state), instead of an overwrite."""

    ok: bool = True
    affected: int
    skipped: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Plain admin responses (X·F F-D6 · FW6-G12: every admin route has one model)
# ---------------------------------------------------------------------------


class AdminVerifyResponse(BaseModel):
    ok: bool


class AdminDeleteResponse(BaseModel):
    ok: bool = True
    hard: bool
    noop: bool = False


class UserStatusResponse(BaseModel):
    ok: bool = True
    status: Literal["active", "suspended"]


class DeleteUserResponse(BaseModel):
    ok: bool = True
    deleted_entries: int


class PruneUsersResponse(BaseModel):
    ok: bool = True
    pruned: int


class DismissFlagsResponse(BaseModel):
    dismissed: int


class TieredVisualization(BaseModel):
    """``PUT …/tier`` answers the re-read row (with its fresh ETag). The fields
    the moderation surface reads are checked; the rest of the public row rides
    along as it is stored."""

    slug: str
    tier: GalleryTier

    model_config = ConfigDict(extra="allow")


# ---------------------------------------------------------------------------
# Content flagging
# ---------------------------------------------------------------------------

FlagReason = Literal["inappropriate", "spam", "copyright", "other"]


class FlagRequest(BaseModel):
    reason: FlagReason
    detail: str | None = Field(default=None, max_length=500)


class FlagInfo(BaseModel):
    reporter_slug: str
    reason: FlagReason
    detail: str | None = None
    created_at: datetime


class FlaggedEntryInfo(BaseModel):
    """One flagged visualization on ``GET /admin/flagged`` (the flag stream,
    grouped by the ``content_hash`` FK, joined to its live row)."""

    slug: str
    # The visualization's content_hash — the ``flags`` collection's FK key
    # (the renamed identity slot, fourier-D.W3 γ).
    content_hash: str
    image_slug: str | None = None
    owner_slug: str | None = None
    tier: GalleryTier | None = None
    created_at: datetime | None = None
    flag_count: int
    flags: list[FlagInfo]


class FlaggedPageResponse(BaseModel):
    items: list[FlaggedEntryInfo]
    next_cursor: str | None = None
    has_more: bool


# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------


class AuditActor(BaseModel):
    """Who wrote an audit row (X·F F-D6 · FW6-G9). An admin request is a
    ``user`` (its session's user slug, else ``admin``); the janitor is a
    ``system`` actor. The actor never rides ``ip_hash``."""

    kind: Literal["user", "system"]
    id: str


class AuditEntry(BaseModel):
    timestamp: datetime
    action: str
    target: str
    actor: AuditActor
    # The request's hashed IP; ``None`` for a system actor (no request).
    ip_hash: str | None


class AuditListResponse(BaseModel):
    items: list[AuditEntry]
    total: int
    page: int
    pages: int


# ---------------------------------------------------------------------------
# Gallery cursor pagination
# ---------------------------------------------------------------------------


class CursorInfo(BaseModel):
    next_cursor: str | None = None
    has_more: bool


class GalleryCursorResponse(BaseModel):
    items: list  # built ad-hoc in the router (public_doc projection)
    cursor: CursorInfo
