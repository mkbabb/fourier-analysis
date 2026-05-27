#!/usr/bin/env bash
# Start fourier-analysis dev environment. Cleans up on exit/kill.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
unset VIRTUAL_ENV

# ── Load .env if present ──────────────────────────────────
[[ -f "$ROOT/.env" ]] && set -o allexport && source "$ROOT/.env" && set +o allexport

# ── Config ────────────────────────────────────────────────
PROJECT_NAME="fourier-analysis"
BACKEND_PORT_DEFAULT=9100
FRONTEND_PORT_DEFAULT=9101

# ── Find a free port starting from $1 ────────────────────
find_free_port() {
    local p=${1:-8000}
    for _ in $(seq 1 20); do
        lsof -iTCP:"$p" -sTCP:LISTEN -P -n >/dev/null 2>&1 || { echo "$p"; return 0; }
        ((p++))
    done
    echo "ERROR: no free port from $1" >&2; return 1
}

# ── Kill process tree ─────────────────────────────────────
kill_tree() {
    local pid=$1
    for child in $(pgrep -P "$pid" 2>/dev/null); do kill_tree "$child"; done
    kill "$pid" 2>/dev/null || true
}

# ── Pick ports ────────────────────────────────────────────
API_PORT=$(find_free_port "${API_PORT:-$BACKEND_PORT_DEFAULT}")
WEB_PORT=$(find_free_port "${WEB_PORT:-$FRONTEND_PORT_DEFAULT}")
[[ "$API_PORT" == "$WEB_PORT" ]] && WEB_PORT=$(find_free_port $((WEB_PORT + 1)))

export API_PORT WEB_PORT

# MONGO_URI comes from .env — points to production MongoDB via TLS.
# Falls back to local Docker mongo for offline dev.
export MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/fourier}"
export ADMIN_TOKEN="${ADMIN_TOKEN:-dev}"
export PLAYWRIGHT_BASE_URL="http://localhost:$WEB_PORT"

echo "$WEB_PORT" > "$ROOT/.dev.ports"
echo "$API_PORT" >> "$ROOT/.dev.ports"

cat <<EOF
──────────────────────────────────────
  Fourier Analysis Dev Environment
──────────────────────────────────────
  API   → http://localhost:$API_PORT
  Web   → http://localhost:$WEB_PORT
  Mongo → $MONGO_URI
──────────────────────────────────────

EOF

# ── Teardown ──────────────────────────────────────────────
PIDS=()
cleanup() {
    echo ""
    echo "Shutting down..."
    [[ ${#PIDS[@]} -gt 0 ]] && for p in "${PIDS[@]}"; do kill_tree "$p"; done
    rm -f "$ROOT/.dev.pids" "$ROOT/.dev.ports"
    wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# ── Start API ─────────────────────────────────────────────
CORS_ORIGINS="http://localhost:$WEB_PORT" \
    uv run uvicorn api.main:app \
    --host 0.0.0.0 --port "$API_PORT" \
    --reload --reload-dir api &
PIDS+=($!)

sleep 1
kill -0 "${PIDS[-1]}" 2>/dev/null || { echo "ERROR: API failed to start"; exit 1; }

# ── Start Vite ────────────────────────────────────────────
VITE_PROXY_API="http://localhost:$API_PORT" \
    npx --prefix web vite web --port "$WEB_PORT" --strictPort &
PIDS+=($!)

wait
