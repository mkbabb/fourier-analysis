"""Admin-specific Pydantic models for user management and moderation."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


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
    snapshot_hash: str
    flag_count: int
    flags: list[FlagInfo]
    # Palette metadata (joined)
    image_slug: str | None = None
    user_slug: str | None = None
    tier: str | None = None
    created_at: datetime | None = None


class FlaggedListResponse(BaseModel):
    items: list[FlaggedEntryInfo]
    total: int
    page: int
    pages: int


# ---------------------------------------------------------------------------
# Audit log
# ---------------------------------------------------------------------------


class AuditEntry(BaseModel):
    timestamp: datetime
    action: str
    target: str
    ip_hash: str


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
    items: list  # GalleryEntryResponse list, imported at usage site
    cursor: CursorInfo
    total: int
