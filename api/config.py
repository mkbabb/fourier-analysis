"""Application configuration via environment variables."""

from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongo_uri: str = "mongodb://localhost:27017/fourier"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    max_upload_mb: int = 10
    compute_timeout_s: int = 300
    compute_concurrency: int = 4
    # Compute (extract-contour / epicycles / bases) requests per minute per IP.
    # Production default is conservative; dev/e2e raise it via COMPUTE_RATE_LIMIT
    # since a full lifecycle run issues several compute calls in quick succession.
    compute_rate_limit: int = 5
    asset_max_age_days: int = 30
    # NOTE: ``storage_budget_gb`` retired at B.W3 (the inline-blob eviction
    # band-aid — CRUD-CONTRACT §8 / Wχ P3-B). The principled storage bound is
    # the recency prune ``{pinned: False, last_accessed_at: {$lt: cutoff}}``
    # plus the ``deleted_at``-grace cascade; image-blob redesign is deferred
    # to fourier tranche C. The per-doc ``bytes`` field survives for
    # observability, not eviction.
    admin_token: str = ""
    gallery_page_size: int = 20
    # 30-day session TTL per CRUD-CONTRACT §6 (was 7). The live-session
    # backfill is W4's; this is the config default for newly minted sessions.
    session_ttl_days: int = 30
    user_max_age_days: int = 90
    # Soft-delete grace window (CRUD-CONTRACT §5). Rows with
    # ``deleted_at < now() - grace`` are hard-deleted by the janitor.
    soft_delete_grace_days: int = 30

    model_config = {"env_prefix": "", "case_sensitive": False}


settings = Settings()


def get_settings() -> Settings:
    return settings
