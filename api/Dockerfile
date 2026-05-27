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
ENV WORKERS=4
CMD ["sh", "-c", "uv run --no-sync uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers ${WORKERS} --proxy-headers --forwarded-allow-ips '172.16.0.0/12,10.0.0.0/8,192.168.0.0/16'"]
