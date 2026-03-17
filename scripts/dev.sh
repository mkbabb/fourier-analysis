#!/usr/bin/env bash
# Start API + frontend dev servers on free ports. Cleans up on exit/kill.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
unset VIRTUAL_ENV

# ── Load .env if present ──────────────────────────────────
[[ -f "$ROOT/.env" ]] && set -o allexport && source "$ROOT/.env" && set +o allexport

# ── Remote / tunnel config (override via .env) ────────────
DEPLOY_HOST="${DEPLOY_HOST:-mbabb.fridayinstitute.net}"
DEPLOY_PORT="${DEPLOY_PORT:-1022}"
DEPLOY_USER="${DEPLOY_USER:-mbabb}"
MONGO_LOCAL_PORT="${MONGO_LOCAL_PORT:-27017}"

# ── Find a free port starting from $1 ───────────────────────
free_port() {
    local start=${1:-8000}
    local p
    for p in $(seq "$start" $((start + 100))); do
        if ! lsof -iTCP:"$p" -sTCP:LISTEN -P -n >/dev/null 2>&1; then
            echo "$p"
            return 0
        fi
    done
    echo "ERROR: no free port found starting from $start" >&2
    return 1
}

# ── Kill a process and all its descendants ───────────────────
kill_tree() {
    local pid=$1
    for child in $(pgrep -P "$pid" 2>/dev/null); do
        kill_tree "$child"
    done
    kill "$pid" 2>/dev/null || true
}

# ── Kill previous session if pid file exists ─────────────────
PIDFILE="$ROOT/.dev.pids"
if [[ -f "$PIDFILE" ]]; then
    while read -r pid; do
        kill_tree "$pid" && echo "Stopped stale process $pid" || true
    done < "$PIDFILE"
    rm -f "$PIDFILE"
    sleep 0.3
fi

# ── Pick ports ───────────────────────────────────────────────
MONGO_LOCAL_PORT=$(free_port "${MONGO_LOCAL_PORT}")
API_PORT=$(free_port 8000)
WEB_PORT=$(free_port 3000)
[[ "$API_PORT" == "$WEB_PORT" ]] && WEB_PORT=$(free_port $((WEB_PORT + 1)))

export API_PORT WEB_PORT
export MONGO_URI="${MONGO_URI:-mongodb://localhost:${MONGO_LOCAL_PORT}/fourier}"
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
  Mongo → localhost:$MONGO_LOCAL_PORT (tunnel → $DEPLOY_HOST)
──────────────────────────────────────

EOF

# ── Teardown ─────────────────────────────────────────────────
PIDS=()
cleanup() {
    echo ""
    echo "Shutting down..."
    [[ ${#PIDS[@]} -gt 0 ]] && for p in "${PIDS[@]}"; do kill_tree "$p"; done
    rm -f "$PIDFILE" "$ROOT/.dev.ports"
    wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# ── SSH tunnel to remote MongoDB ─────────────────────────────
# Resolve the Docker-internal IP of the mongo container on the remote host,
# then forward through it so we bypass any host-level auth.
echo "Resolving remote mongo container IP..."
MONGO_CONTAINER_IP=$(ssh -p "$DEPLOY_PORT" "${DEPLOY_USER}@${DEPLOY_HOST}" \
    "docker inspect fourier-analysis-mongo-1 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'" 2>/dev/null)
if [[ -z "$MONGO_CONTAINER_IP" ]]; then
    echo "ERROR: could not resolve remote mongo container IP"; exit 1
fi
echo "Opening SSH tunnel → ${MONGO_CONTAINER_IP}:27017 on localhost:${MONGO_LOCAL_PORT}..."
ssh -f -N \
    -L "${MONGO_LOCAL_PORT}:${MONGO_CONTAINER_IP}:27017" \
    -p "$DEPLOY_PORT" "${DEPLOY_USER}@${DEPLOY_HOST}" \
    -o ExitOnForwardFailure=yes \
    -o ServerAliveInterval=60
TUNNEL_PID=$(lsof -iTCP:"$MONGO_LOCAL_PORT" -sTCP:LISTEN -P -n -t 2>/dev/null | head -1)
if [[ -n "$TUNNEL_PID" ]]; then
    PIDS+=("$TUNNEL_PID")
    echo "$TUNNEL_PID" >> "$PIDFILE"
    echo "SSH tunnel up (pid $TUNNEL_PID)"
else
    echo "ERROR: SSH tunnel failed to start"; exit 1
fi

# ── Start API ────────────────────────────────────────────────
CORS_ORIGINS="http://localhost:$WEB_PORT" \
    uv run uvicorn api.main:app \
    --host 0.0.0.0 --port "$API_PORT" \
    --reload --reload-dir api --reload-dir src &
PIDS+=($!)
echo "$!" > "$PIDFILE"

sleep 1
kill -0 "${PIDS[0]}" 2>/dev/null || { echo "ERROR: API failed to start"; exit 1; }

# ── Start Vite ───────────────────────────────────────────────
VITE_PROXY_API="http://localhost:$API_PORT" \
    npx --prefix web vite web --port "$WEB_PORT" --strictPort &
PIDS+=($!)
echo "$!" >> "$PIDFILE"

wait
