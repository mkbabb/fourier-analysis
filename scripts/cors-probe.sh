#!/usr/bin/env bash
# F.REL .c — CORS falsifier against a local stack: a headless Chrome page on
# one origin (Vite dev, serving web/src/lib/api.ts) edits and deletes a
# visualization on the API at ANOTHER origin, so every request crosses CORS
# and every non-simple one is preflighted. Then the API's access log is read
# for the preflights it answered.
#
# Usage: scripts/cors-probe.sh
# Env:   MONGO_URI   (default mongodb://localhost:27018/fourier_cors_probe — a
#                     throwaway database on the dev Mongo; dropped at exit)
#        API_PORT    (default 8077) · WEB_PORT (default 5187)
#        PROBE_DIR   (default ~/.dev-logs/frel/cors-probe — logs + blobs)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_PORT="${API_PORT:-8077}"
WEB_PORT="${WEB_PORT:-5187}"
MONGO_URI="${MONGO_URI:-mongodb://localhost:27018/fourier_cors_probe}"
PROBE_DIR="${PROBE_DIR:-$HOME/.dev-logs/frel/cors-probe}"
SPA="http://localhost:$WEB_PORT"
API="http://localhost:$API_PORT"
mkdir -p "$PROBE_DIR/blobs"
: >"$PROBE_DIR/api.log"
: >"$PROBE_DIR/web.log"

for port in "$API_PORT" "$WEB_PORT"; do
    if nc -z localhost "$port" 2>/dev/null; then
        echo "cors-probe: port $port is in use; set API_PORT / WEB_PORT" >&2
        exit 2
    fi
done

pids=()
cleanup() {
    for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done
    wait 2>/dev/null || true
    (cd "$ROOT" && MONGO_URI="$MONGO_URI" uv run --no-sync python -c \
        "import os,pymongo; c=pymongo.MongoClient(os.environ['MONGO_URI']); c.drop_database(c.get_default_database().name)" \
        2>/dev/null) || true
}
trap cleanup EXIT

(cd "$ROOT" && CORS_ORIGINS="$SPA" MONGO_URI="$MONGO_URI" BLOB_DIR="$PROBE_DIR/blobs" \
    WRITE_RATE_LIMIT=1000 COMPUTE_RATE_LIMIT=1000 \
    exec uv run uvicorn api.main:app --host 127.0.0.1 --port "$API_PORT" >"$PROBE_DIR/api.log" 2>&1) &
pids+=($!)
(cd "$ROOT" && VITE_API_URL="$API" \
    exec npx --prefix web vite web --port "$WEB_PORT" --strictPort >"$PROBE_DIR/web.log" 2>&1) &
pids+=($!)

wait_for() {
    local url=$1 i
    for ((i = 0; i < 90; i++)); do
        curl -fsS -o /dev/null "$url" 2>/dev/null && return 0
        sleep 1
    done
    echo "cors-probe: $url did not answer within 90 s (logs in $PROBE_DIR)" >&2
    exit 1
}
wait_for "$API/api/health"
wait_for "$SPA/"

node "$ROOT/scripts/cors-probe.mjs" "$SPA" "$API" "$ROOT/assets/portraits/joseph-fourier.png"

echo "preflights answered (API access log):"
grep -E '"OPTIONS /api/[^"]*" 200' "$PROBE_DIR/api.log" | sed -E 's/.*"(OPTIONS [^ ]+) [^"]*" ([0-9]+).*/  \1 \2/' | sort | uniq -c
if grep -E '"OPTIONS [^"]*" [45][0-9][0-9]' "$PROBE_DIR/api.log"; then
    echo "cors-probe: FAIL — a preflight was refused" >&2
    exit 1
fi
grep -qE '"OPTIONS /api/visualizations/[^"]*" 200' "$PROBE_DIR/api.log" || {
    echo "cors-probe: FAIL — no visualization preflight reached the API" >&2
    exit 1
}
echo "cors-probe.sh: PASS"
