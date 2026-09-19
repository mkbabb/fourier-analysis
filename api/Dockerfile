FROM python:3.13-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

FROM ghcr.io/astral-sh/uv:latest AS uv

FROM base AS deps
COPY --from=uv /uv /usr/local/bin/
COPY pyproject.toml uv.lock ./
COPY src/ src/
RUN uv sync --frozen --no-dev --extra web

FROM deps AS development
RUN uv sync --frozen --extra web --extra dev
COPY . .
CMD ["uv", "run", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--reload-dir", "api"]

FROM deps AS production
RUN adduser --disabled-password app
COPY . .
RUN chown -R app:app /app/.venv
# C2 (C.W5): pre-create the blob-backend mount point owned by the unprivileged
# ``app`` user (UID 1000). A fresh, EMPTY named Docker volume inherits the
# ownership + permissions of the image's mount-point directory on first mount,
# so this makes ``image_blobs`` ``app``-writable — without which every
# ``write_bytes`` from the ``app`` process would EACCES against a root-owned
# volume (the migration aborts on the first write; uploads 500). Scoped to the
# data path only; the runtime CMD is unchanged.
RUN mkdir -p /data/blobs && chown -R app:app /data
ENV UV_CACHE_DIR=/tmp/uv-cache
USER app
# H.β (inv-12): WORKERS=1 — single authoritative replica. WORKERS>1 forks N
# independent processes, each with its OWN in-memory state, which silently
# breaks three per-process subsystems: (1) the rate_limiter singletons (each
# worker keeps a separate per-client bucket → up to Nx the honest ceiling),
# (2) the _suspended_cache (dependencies.py — a suspend toggled on one worker
# stays stale on the other N-1 for <=60s), and (3) the janitor loop (runs once
# per worker → duplicate audit rows). One process collapses all three to a
# single source of truth. No Redis / no shared store needed: compute_cache and
# idempotency are Mongo-backed; nginx is the per-client edge governor.
ENV WORKERS=1
# G.β.2: NO uvicorn --proxy-headers. nginx `real_ip` is the SOLE client-IP
# rewriter (one trust boundary, not two): it resolves the real client through the
# Apache→nginx XFF chain and stamps X-Real-IP, which get_client_ip reads. A second
# uvicorn-side XFF rewriter would re-introduce the two-identity ambiguity β.2 removes.
#
# X·F F.W9 (M.W2) — the image's own LIVENESS contract, declared where the image
# is built rather than inferred by whatever polls it. This answers exactly one
# question — "did uvicorn come up and can it answer?" — and deliberately NOT the
# readiness question, which is about what the EDGE serves (inv-22's root-404) and
# is asked at the gateway. Compose reads this to satisfy `depends_on: condition:
# service_healthy`, so the stack now orders on health rather than on
# container-started. Python's own urllib: no curl/wget in python:3.13-slim, and
# adding a package to run a healthcheck would be the wrong cure. `retries` is
# bounded so an unhealthy container ENDS `compose up --wait` non-zero instead of
# hanging it — the deploy hook's rollback depends on that termination.
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
    CMD ["python", "-c", "import sys, urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3).status == 200 else 1)"]
CMD ["sh", "-c", "uv run --no-sync uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers ${WORKERS}"]
