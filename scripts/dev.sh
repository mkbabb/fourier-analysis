#!/usr/bin/env bash
# scripts/dev.sh — fourier-analysis local-dev orchestrator.
#
# CONFORMANCE REWRITE onto the constellation canonical CLI template
# (value.js:docs/dev-deploy-standard.md §2). ONE SHAPE, PARAMETERIZED PER REPO:
# the runtime below the CONFIG/OVERRIDES blocks is the standard template; only
# the `# ── CONFIG ──` + `# ── OVERRIDES ──` blocks carry fourier's values.
#
# SUBCOMMANDS: up (default) | down | status | logs | build | test
# EXIT CODES:  0 ok · 1 fail · 2 usage · 3 status-partial · 4 status-down
#              5 missing-env · 6 missing-dep · 7 no-free-port
# EXPLICIT-FAILURE RULE: every prerequisite checked before work; a failure
# prints ONE actionable line to stderr + exits non-zero. No silent degrade.
#
# fourier CONFIG (the sanctioned per-repo divergence, dev-deploy-standard §1/§4):
#   • SHAPE=fullstack, ports 9100 (backend) : 9101 (frontend).
#   • `unset VIRTUAL_ENV` before `uv run` (the uv-in-a-venv shadowing guard).
#   • backend = `uv run uvicorn api.main:app --reload --reload-dir api`.
#   • frontend = `npx --prefix web vite web --strictPort`.
#   • Mongo is a BARE `mongo:8.0` (NOT a replica set). fourier-J's remix CORE is
#     deliberately ordered idempotent content-addressed writes — NO Mongo
#     transactions — so a standalone topology is correct (the inverse of
#     value.js's transaction-mandated `--replSet rs0`).
#   • The prod-TLS MONGO_URI is OPERATOR-OWNED: when .env carries a real
#     (non-localhost) MONGO_URI, dev does NOT provision a local mongo over it.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
unset VIRTUAL_ENV   # uv-in-a-venv shadowing guard (must precede any `uv run`)

# ╔══ CONFIG (set per repo; one of the two blocks an adopter edits) ══╗
PROJECT_NAME="fourier-analysis"
SHAPE="fullstack"                       # library | backend | fullstack | frontend | infra
REQUIRED_BINS=(uv npx node)             # docker is appended below iff NEEDS_MONGO=1
REQUIRED_ENV=()                         # fourier dev needs none — sentinels cover it
BACKEND_PORT_DEFAULT=9100
FRONTEND_PORT_DEFAULT=9101
PORT_FALLBACK_LIMIT=10
BACKEND_READY_TIMEOUT_S=30
NEEDS_MONGO=1
MONGO_CONTAINER="${PROJECT_NAME}-dev-mongo"
MONGO_IMAGE="mongo:8.0"                 # BARE standalone — NOT a replica set (J remix CORE)
MONGO_PORT=27017
MONGO_DB="fourier"
DEV_MONGO_DIR="$ROOT/.dev/mongo"        # native-mongod dbpath fallback
MONGO_READY_TIMEOUT_S=20
SIBLING_WATCH_BUILDS=()                 # fourier links no on-disk @mkbabb/* deps

# docker is a hard prereq only when we actually provision mongo.
[[ "$NEEDS_MONGO" == 1 ]] && REQUIRED_BINS+=(docker)
# ╚════════════════════════════════════════════════════════════════╝

DEV_DIR="$ROOT/.dev"; mkdir -p "$DEV_DIR"
LOG_DIR="$DEV_DIR/logs"; mkdir -p "$LOG_DIR"

log()  { printf '[dev] %s\n' "$*"; }
note() { printf '[dev] %s\n' "$*" >&2; }
die()  { printf 'ERROR: %s\n' "$1" >&2; exit "${2:-1}"; }

# ── .env discovery ──
load_env() {
    if [[ -f "$ROOT/.env" ]]; then
        set -o allexport; source "$ROOT/.env"; set +o allexport; log "loaded .env"
    elif [[ -f "$ROOT/.env.example" ]]; then
        note "no .env (using .env.example defaults + dev sentinels); cp .env.example .env to customise"
    fi
    # Dev sentinels — safe-to-default laptop values, exported + logged.
    export ADMIN_TOKEN="${ADMIN_TOKEN:-dev}"
    export MONGO_URI="${MONGO_URI:-mongodb://localhost:${MONGO_PORT}/${MONGO_DB}}"
    [[ "$ADMIN_TOKEN" == "dev" ]] && log "ADMIN_TOKEN sentinel = dev (override in .env for non-default)"
}
require_env() {
    local missing=0 v
    for v in "${REQUIRED_ENV[@]:-}"; do
        [[ -z "$v" ]] && continue
        if [[ -z "${!v:-}" ]]; then
            note "$v is unset. Copy .env.example to .env and set it, or export inline: $v=... scripts/dev.sh"
            missing=1
        fi
    done
    [[ $missing -eq 0 ]] || exit 5
}

# ── Dep checks ──
require_bins() {
    local b
    for b in "${REQUIRED_BINS[@]}"; do
        command -v "$b" >/dev/null 2>&1 || die "required binary '$b' not found on PATH (install it, then retry)" 6
    done
    if printf '%s\n' "${REQUIRED_BINS[@]}" | grep -qx docker; then
        docker info >/dev/null 2>&1 || die "docker daemon is not responding (start Docker, then retry)" 6
    fi
}

# ── Port resolution (TCP probe, IPv4+IPv6 — no lsof dependency) ──
port_in_use() {
    (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && return 0
    (exec 3<>"/dev/tcp/::1/$1") 2>/dev/null && return 0
    return 1
}
find_free_port() {
    local label=$1 desired=$2 reserved=${3:-} p attempts=0
    p=$desired
    while [[ $attempts -lt $PORT_FALLBACK_LIMIT ]]; do
        if [[ "$p" != "$reserved" ]] && ! port_in_use "$p"; then
            [[ $p -ne $desired ]] && note "$label default :$desired busy — using :$p"
            echo "$p"; return 0
        fi
        note "$label :$p in use — trying :$((p + 1))"
        p=$((p + 1)); attempts=$((attempts + 1))
    done
    die "$label — no free port within $PORT_FALLBACK_LIMIT slots from :$desired (recover: scripts/dev.sh down)" 7
}

# ── Process management — recursive kill_tree + self-disarming trap ──
PIDS=()
track() { PIDS+=("$1"); }
kill_tree() {
    local pid=$1 child
    for child in $(pgrep -P "$pid" 2>/dev/null); do kill_tree "$child"; done
    kill "$pid" 2>/dev/null || true
}
MONGO_SOURCE="none"
cleanup() {
    trap - EXIT INT TERM
    exec 2>/dev/null
    printf '\n[dev] shutting down...\n'
    local pid
    for pid in "${PIDS[@]:-}"; do [[ -n "$pid" ]] && kill_tree "$pid"; done
    [[ "$NEEDS_MONGO" == 1 && "$MONGO_SOURCE" == docker ]] && docker rm -f "$MONGO_CONTAINER" >/dev/null 2>&1
    rm -f "$DEV_DIR"/*.ports "$DEV_DIR"/*.pids 2>/dev/null || true
    wait 2>/dev/null || true
    exit 0
}

# ── Mongo: operator-owned prod URI → reuse → docker bare mongo:8.0 → native mongod (announced) → fail ──
ensure_mongo() {
    [[ "$NEEDS_MONGO" == 1 ]] || return 0
    # fourier divergence: a real prod-TLS MONGO_URI is OPERATOR-OWNED. When .env
    # carries a non-localhost URI, NEVER provision a local mongo over it.
    if [[ -n "${MONGO_URI:-}" && "${MONGO_URI}" != *localhost* && "${MONGO_URI}" != *127.0.0.1* ]]; then
        log "MONGO_URI is non-local — operator owns that target; not provisioning local mongo"
        MONGO_SOURCE="external"; return 0
    fi
    if port_in_use "$MONGO_PORT"; then
        log "mongo already listening on :$MONGO_PORT — reusing it"
        MONGO_SOURCE="reused"; return 0
    fi
    if docker info >/dev/null 2>&1; then
        log "starting local docker $MONGO_IMAGE (bare standalone — no replica set)..."
        docker rm -f "$MONGO_CONTAINER" >/dev/null 2>&1 || true
        docker run -d --name "$MONGO_CONTAINER" -p "127.0.0.1:${MONGO_PORT}:27017" \
            "$MONGO_IMAGE" >/dev/null || die "failed to start docker mongo (check: docker logs $MONGO_CONTAINER)" 6
        MONGO_SOURCE="docker"
        wait_mongo_ready || die "docker mongo did not become ready within ${MONGO_READY_TIMEOUT_S}s" 6
        return 0
    fi
    if command -v mongod >/dev/null 2>&1; then
        note "docker unavailable — FALLING BACK to native mongod at $DEV_MONGO_DIR (announced, not silent)"
        mkdir -p "$DEV_MONGO_DIR"
        mongod --dbpath "$DEV_MONGO_DIR" --port "$MONGO_PORT" --bind_ip 127.0.0.1 >"$LOG_DIR/mongod.log" 2>&1 &
        track $!; MONGO_SOURCE="native"
        wait_mongo_ready || die "native mongod did not become ready (see $LOG_DIR/mongod.log)" 6
        return 0
    fi
    die "no mongo available: docker daemon down AND no native mongod (start Docker, or: brew install mongodb-community)" 6
}
wait_mongo_ready() {
    local i
    for ((i = 0; i < MONGO_READY_TIMEOUT_S; i++)); do
        port_in_use "$MONGO_PORT" && { sleep 1; return 0; }
        sleep 1
    done
    return 1
}

# ── Backend-before-frontend gate ──
wait_port_bound() {
    local label=$1 port=$2 timeout=${3:-$BACKEND_READY_TIMEOUT_S} i
    for ((i = 0; i < timeout; i++)); do
        port_in_use "$port" && { log "$label bound on :$port"; return 0; }
        sleep 1
    done
    die "$label failed to bind :$port within ${timeout}s (see $LOG_DIR/api.log)" 1
}

# ╔══ OVERRIDES (the other block an adopter edits) ══╗
# fourier: uv-run uvicorn backend + npx vite frontend; logs tee'd to .dev/logs.
start_backend() {
    CORS_ORIGINS="http://localhost:$FRONTEND_PORT" \
    MONGO_URI="$MONGO_URI" ADMIN_TOKEN="$ADMIN_TOKEN" \
        uv run uvicorn api.main:app \
        --host 0.0.0.0 --port "$BACKEND_PORT" \
        --reload --reload-dir api >"$LOG_DIR/api.log" 2>&1 &
    track $!
}
start_frontend() {
    VITE_PROXY_API="http://localhost:$BACKEND_PORT" \
        npx --prefix web vite web --port "$FRONTEND_PORT" --strictPort >"$LOG_DIR/web.log" 2>&1 &
    track $!
}
do_build() {
    log "building SPA (npm run build in web/)..."
    npm --prefix web run build
}
do_test() {
    # fourier test gate: backend pytest (the CI api/ gate) + e2e where requested.
    log "running backend tests (uv run pytest api/)..."
    uv run pytest api/ "$@"
}
# ╚════════════════════════════════════════════════╝

cmd_up() {
    require_bins; load_env; require_env
    trap cleanup EXIT INT TERM
    [[ "${#SIBLING_WATCH_BUILDS[@]}" -gt 0 ]] && ensure_sibling_watch_builds
    ensure_mongo
    BACKEND_PORT=$(find_free_port "backend" "${BACKEND_PORT:-$BACKEND_PORT_DEFAULT}")
    FRONTEND_PORT=$(find_free_port "frontend" "${FRONTEND_PORT:-$FRONTEND_PORT_DEFAULT}" "$BACKEND_PORT")
    export BACKEND_PORT FRONTEND_PORT
    # Keep the historical port-handoff file the e2e/conformance harness reads.
    { echo "$FRONTEND_PORT"; echo "$BACKEND_PORT"; } > "$DEV_DIR/dev.ports"
    export PLAYWRIGHT_BASE_URL="http://localhost:$FRONTEND_PORT"
    if [[ "$SHAPE" == "fullstack" || "$SHAPE" == "backend" ]]; then
        start_backend; wait_port_bound "backend" "$BACKEND_PORT"
    fi
    [[ "$SHAPE" != "backend" ]] && start_frontend
    print_summary
    while true; do sleep 2; done   # idle (bash defers traps inside a bare `wait`)
}
print_summary() {
    cat <<EOF

──────────────────────────────────────
  ${PROJECT_NAME} dev environment
──────────────────────────────────────
  Frontend → http://localhost:${FRONTEND_PORT:-n/a}
  Backend  → http://localhost:${BACKEND_PORT:-n/a}
  Mongo    → ${MONGO_SOURCE} (:${MONGO_PORT})  [${MONGO_URI}]
  Logs     → ${LOG_DIR}/   (scripts/dev.sh logs)
  Ctrl-C to tear down
──────────────────────────────────────

EOF
}
cmd_down() {
    log "tearing down ${PROJECT_NAME}..."
    docker rm -f "$MONGO_CONTAINER" >/dev/null 2>&1 || true
    pkill -f "uvicorn api.main:app" 2>/dev/null || true
    pkill -f "vite web --port" 2>/dev/null || true
    rm -f "$DEV_DIR"/*.pids "$DEV_DIR"/*.ports 2>/dev/null || true
    log "down."
}
cmd_status() {
    local up=0 total=0
    if [[ "$NEEDS_MONGO" == 1 ]]; then
        total=$((total + 1))
        if port_in_use "$MONGO_PORT"; then log "mongo    UP   (:$MONGO_PORT)"; up=$((up+1)); else log "mongo    DOWN"; fi
    fi
    total=$((total + 1))
    if port_in_use "${BACKEND_PORT:-$BACKEND_PORT_DEFAULT}"; then log "backend  UP   (:${BACKEND_PORT:-$BACKEND_PORT_DEFAULT})"; up=$((up+1)); else log "backend  DOWN (:${BACKEND_PORT:-$BACKEND_PORT_DEFAULT})"; fi
    if [[ "$SHAPE" != "backend" ]]; then
        total=$((total + 1))
        if port_in_use "${FRONTEND_PORT:-$FRONTEND_PORT_DEFAULT}"; then log "frontend UP   (:${FRONTEND_PORT:-$FRONTEND_PORT_DEFAULT})"; up=$((up+1)); else log "frontend DOWN (:${FRONTEND_PORT:-$FRONTEND_PORT_DEFAULT})"; fi
    fi
    [[ $up -eq 0 ]] && exit 4
    [[ $up -lt $total ]] && exit 3
    exit 0
}
cmd_logs() {
    [[ -d "$LOG_DIR" && -n "$(ls -A "$LOG_DIR" 2>/dev/null)" ]] || die "no logs at $LOG_DIR — is the stack up? (scripts/dev.sh up)" 1
    tail -n +1 -f "$LOG_DIR"/*.log
}

SUB="${1:-up}"; shift || true
case "$SUB" in
    up)     cmd_up "$@" ;;
    down)   cmd_down ;;
    status) cmd_status ;;
    logs)   cmd_logs ;;
    build)  require_bins; load_env; do_build ;;
    test)   require_bins; load_env; do_test "$@" ;;
    *)      note "usage: scripts/dev.sh [up|down|status|logs|build|test]"; exit 2 ;;
esac
