#!/usr/bin/env bash
# Start the Fourier Analysis API + frontend dev servers.
# Kills any stale fourier dev processes, finds free ports, and coordinates proxy.
set -euo pipefail
cd "$(dirname "$0")/.."

# ── Cleanup stale processes ──────────────────────────────────────────
kill_stale() {
    # Kill any existing fourier vite dev servers
    local pids
    pids=$(pgrep -f "fourier_analysis/web/node_modules/.bin/vite" 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
        echo "Killing stale vite processes: $pids"
        kill $pids 2>/dev/null || true
        sleep 0.5
    fi

    # Kill any existing fourier uvicorn servers
    pids=$(pgrep -f "uvicorn api.main:app" 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
        echo "Killing stale API processes: $pids"
        kill $pids 2>/dev/null || true
        sleep 0.5
    fi
}

kill_stale

# ── Find free ports ──────────────────────────────────────────────────
find_free_port() {
    local port=${1:-8000}
    while lsof -iTCP:"$port" -sTCP:LISTEN -t &>/dev/null; do
        ((port++))
    done
    echo "$port"
}

API_PORT=$(find_free_port 8000)
WEB_PORT=$(find_free_port 3000)

echo "──────────────────────────────────────"
echo "  Fourier Analysis Dev Environment"
echo "──────────────────────────────────────"
echo "  API  → http://localhost:$API_PORT"
echo "  Web  → http://localhost:$WEB_PORT"
echo "  Web proxies /api → localhost:$API_PORT"
echo "──────────────────────────────────────"
echo ""

# ── Verify MongoDB ───────────────────────────────────────────────────
if ! lsof -iTCP:27017 -sTCP:LISTEN -t &>/dev/null; then
    echo "WARNING: MongoDB not detected on port 27017."
    echo "  Start it with: brew services start mongodb-community"
    echo ""
fi

# ── Trap to kill both on exit ────────────────────────────────────────
trap 'echo ""; echo "Shutting down..."; kill 0 2>/dev/null; wait 2>/dev/null' EXIT INT TERM

# ── Start API ────────────────────────────────────────────────────────
CORS_ORIGINS="http://localhost:$WEB_PORT,http://localhost:3000,http://localhost:5173" \
    uv run uvicorn api.main:app \
    --host 0.0.0.0 \
    --port "$API_PORT" \
    --reload \
    --reload-dir api \
    --reload-dir src &

API_PID=$!

# Wait briefly for API to start before launching vite
sleep 1
if ! kill -0 "$API_PID" 2>/dev/null; then
    echo "ERROR: API failed to start. Check logs above."
    exit 1
fi

# ── Start Vite ───────────────────────────────────────────────────────
(cd web && VITE_PROXY_API="http://localhost:$API_PORT" npx vite --port "$WEB_PORT" --strictPort) &

wait
