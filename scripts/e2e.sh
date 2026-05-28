#!/usr/bin/env bash
# D.W6 — local e2e launcher with COMPUTE_RATE_LIMIT harness.
#
# Sister of scripts/dev.sh. The only difference is that the backend is launched
# with COMPUTE_RATE_LIMIT=1000 (or the operator's override) so the contour-
# extraction suite doesn't 429-cascade after 5 compute calls in 60s.
#
# Usage:
#   ./scripts/e2e.sh              # boots backend + vite + runs playwright once
#   ./scripts/e2e.sh --no-tests   # boots stack only (useful if you want to iterate
#                                 # on specs against an already-warmed backend)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
unset VIRTUAL_ENV

[[ -f "$ROOT/.env" ]] && set -o allexport && source "$ROOT/.env" && set +o allexport

PROJECT_NAME="fourier-analysis"
BACKEND_PORT_DEFAULT=8000
FRONTEND_PORT_DEFAULT=3000

# COMPUTE_RATE_LIMIT — raise to 1000 by default for the e2e arm. The prod
# api/config.py:23 default (5) is byte-identical pre/post-W6; only this script
# (and the CI workflow) sets the override.
export COMPUTE_RATE_LIMIT="${COMPUTE_RATE_LIMIT:-1000}"

find_free_port() {
    local p=${1:-8000}
    for _ in $(seq 1 20); do
        lsof -iTCP:"$p" -sTCP:LISTEN -P -n >/dev/null 2>&1 || { echo "$p"; return 0; }
        ((p++))
    done
    echo "ERROR: no free port from $1" >&2; return 1
}

kill_tree() {
    local pid=$1
    for child in $(pgrep -P "$pid" 2>/dev/null); do kill_tree "$child"; done
    kill "$pid" 2>/dev/null || true
}

API_PORT=$(find_free_port "${API_PORT:-$BACKEND_PORT_DEFAULT}")
WEB_PORT=$(find_free_port "${WEB_PORT:-$FRONTEND_PORT_DEFAULT}")
[[ "$API_PORT" == "$WEB_PORT" ]] && WEB_PORT=$(find_free_port $((WEB_PORT + 1)))

export API_PORT WEB_PORT
export MONGO_URI="${MONGO_URI:-mongodb://localhost:27017/fourier}"
export ADMIN_TOKEN="${ADMIN_TOKEN:-dev}"
export BASE_URL="http://localhost:$WEB_PORT"
export PLAYWRIGHT_BASE_URL="$BASE_URL"

cat <<EOF
──────────────────────────────────────
  Fourier Analysis e2e Harness (D.W6)
──────────────────────────────────────
  API   → http://localhost:$API_PORT
  Web   → $BASE_URL
  Mongo → $MONGO_URI
  COMPUTE_RATE_LIMIT → $COMPUTE_RATE_LIMIT (prod default = 5; this is the e2e override)
──────────────────────────────────────

EOF

PIDS=()
cleanup() {
    echo ""
    echo "Shutting down e2e stack..."
    [[ ${#PIDS[@]} -gt 0 ]] && for p in "${PIDS[@]}"; do kill_tree "$p"; done
    wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

CORS_ORIGINS="http://localhost:$WEB_PORT" \
    COMPUTE_RATE_LIMIT="$COMPUTE_RATE_LIMIT" \
    uv run uvicorn api.main:app \
    --host 0.0.0.0 --port "$API_PORT" &
PIDS+=($!)

# Wait for backend health
for i in $(seq 1 30); do
    if curl -fsS "http://localhost:$API_PORT/api/health" >/dev/null 2>&1; then
        echo "Backend healthy on :$API_PORT (attempt $i)"
        break
    fi
    sleep 1
    [[ "$i" -eq 30 ]] && { echo "ERROR: backend health timed out"; exit 1; }
done

VITE_PROXY_API="http://localhost:$API_PORT" \
    npx --prefix web vite web --port "$WEB_PORT" --strictPort &
PIDS+=($!)

# Wait for vite
for i in $(seq 1 30); do
    if curl -fsS "$BASE_URL" >/dev/null 2>&1; then
        echo "Vite serving on :$WEB_PORT (attempt $i)"
        break
    fi
    sleep 1
    [[ "$i" -eq 30 ]] && { echo "ERROR: vite did not start"; exit 1; }
done

if [[ "${1:-}" == "--no-tests" ]]; then
    echo "Stack up. Press Ctrl-C to tear down."
    wait
    exit 0
fi

cd "$ROOT/web"
BASE_URL="$BASE_URL" npx playwright test --project=chromium "${@}"
