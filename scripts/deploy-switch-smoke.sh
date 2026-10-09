#!/usr/bin/env bash
# F.REL .h — falsifier for the deploy hook's health-gated switch
# (scripts/deploy-hook.sh: switch_service · edge_apply). It boots the
# production stack (scripts/prod-compose-smoke.sh, KEEP_UP=1), sources the
# hook's own functions — never a copy of them — and, while a poller hits the
# edge every ~0.4 s, runs:
#
#   A. a GOOD switch of backend and frontend → each new container healthy, the
#      edge pin moved to it, each old one retired, the edge never failing a
#      request;
#   B. a FAILED switch of backend (its image re-tagged to one whose HEALTHCHECK
#      always fails) → switch_service returns non-zero, the new container is
#      removed, the SAME serving backend is still healthy, the edge pin never
#      left it, and the edge never failed a request;
#   C. an edge config change → `nginx -t` + graceful reload with zero failures.
#
#   scripts/deploy-switch-smoke.sh               # build, boot, run A-C, tear down
#   SKIP_BUILD=1 scripts/deploy-switch-smoke.sh  # reuse the project's images
# shellcheck disable=SC2319 # `[[ … ]]; rc=$?` captures the condition's status, by design
# shellcheck disable=SC2034 # NGINX_CFG_CHANGED is read by the sourced hook's edge_apply
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export COMPOSE_PROJECT_NAME="${PROJECT:-fourier-switch-smoke}"
export HTTP_PORT="${HTTP_PORT:-8193}"
export MONGO_USER="${MONGO_USER:-fourier-admin}"
export MONGO_PASSWORD="${MONGO_PASSWORD:-switch-smoke-$(od -An -N8 -tx1 /dev/urandom | tr -d ' \n')}"
BASE="http://127.0.0.1:${HTTP_PORT}"
WORK="$(mktemp -d)"
# The per-request poll record (timestamp, api code, spa code) is kept where a
# later reader can audit it: POLL_LOG, default under the work dir.
POLL_LOG="${POLL_LOG:-$WORK/poll}"
: >"$POLL_LOG"
BROKEN_TAG=""
ORIG_IMAGE=""

say() { printf '[deploy-switch-smoke] %s\n' "$*"; }

cleanup() {
  [[ -n "${POLLER_PID:-}" ]] && kill "$POLLER_PID" 2>/dev/null || true
  if [[ -n "$BROKEN_TAG" && -n "$ORIG_IMAGE" ]]; then
    docker tag "$ORIG_IMAGE" "$BROKEN_TAG" >/dev/null 2>&1 || true
  fi
  docker compose -f docker-compose.yml -f docker-compose.prod.yml down -v --remove-orphans >/dev/null 2>&1 || true
  rm -f .deploy/edge/*.conf
  rm -rf "$WORK"
}
trap cleanup EXIT

KEEP_UP=1 PROJECT="$COMPOSE_PROJECT_NAME" bash scripts/prod-compose-smoke.sh

# The hook's functions, as the webhook arm runs them (its `main` only runs when
# executed, not sourced).
# shellcheck source=deploy-hook.sh
source scripts/deploy-hook.sh
set +e  # every assertion below is explicit

# The poller: one line per request, "<api code> <spa code>", until stopped.
poll() {
  while [[ ! -e "$WORK/stop" ]]; do
    a="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$BASE/api/health")"
    s="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$BASE/index.html")"
    printf '%s %s %s\n' "$a" "$s" "$(date -u +%H:%M:%S)" >>"$POLL_LOG"
    # ≤ ~2.5 api requests/s: under the backend's per-client read budget
    # (api/services/rate_limiter.py read_limiter, 180/min), so a 429 here is
    # never the poller's own doing.
    sleep 0.4
  done
}
poll &
POLLER_PID=$!

failures() { awk '$1 != "200" || $2 != "200"' "$POLL_LOG" | wc -l | tr -d ' '; }
requests() { wc -l <"$POLL_LOG" | tr -d ' '; }
fail=0
check() { # check <label> <condition-exit-status>
  if [[ "$2" -eq 0 ]]; then say "PASS  $1"; else say "FAIL  $1"; fail=1; fi
}
sleep 2

# ── A. a good switch ──────────────────────────────────────────────────────
for svc in backend frontend; do
  before="$(service_ids "$svc")"
  switch_service "$svc"; rc=$?
  after="$(service_ids "$svc")"
  check "A $svc: switch_service returned 0" "$rc"
  [[ -n "$after" && -z "$(comm -12 <(printf '%s\n' "$before") <(printf '%s\n' "$after"))" ]]; rc=$?
  check "A $svc: the old container retired, a new one serves ($(printf '%.12s' "$before") → $(printf '%.12s' "$after"))" "$rc"
  [[ "$(container_state "$after")" == "healthy" ]]; rc=$?
  check "A $svc: the serving container is healthy" "$rc"
  grep -q " $(container_name "$after"):" ".deploy/edge/$svc.conf"; rc=$?
  check "A $svc: the edge pin names the new container ($(cat ".deploy/edge/$svc.conf"))" "$rc"
done
check "A: the edge failed 0 of $(requests) polled requests through both switches (failed: $(failures))" "$(failures)"

# ── B. a failed switch never takes the serving backend down ────────────────
serving="$(service_ids backend)"
BROKEN_TAG="$(docker inspect -f '{{.Config.Image}}' "$serving")"
ORIG_IMAGE="$(docker image inspect -f '{{.Id}}' "$BROKEN_TAG")"
# BuildKit cannot FROM a bare image id, so the original is named first.
docker tag "$ORIG_IMAGE" "${BROKEN_TAG%:*}:switch-smoke-orig"
if ! printf 'FROM %s\nHEALTHCHECK --interval=2s --timeout=2s --start-period=2s --retries=2 CMD ["false"]\n' \
  "${BROKEN_TAG%:*}:switch-smoke-orig" | docker build -q -t "$BROKEN_TAG" - >/dev/null; then
  say "FAIL  B: could not build the never-healthy backend image"; exit 1
fi
[[ "$(docker image inspect -f '{{.Id}}' "$BROKEN_TAG")" != "$ORIG_IMAGE" ]] || { say "FAIL  B: the tag still names the original image"; exit 1; }
n_before="$(requests)"; f_before="$(failures)"
switch_service backend; rc=$?
[[ "$rc" -ne 0 ]]; ok=$?
check "B: switch_service refused the never-healthy backend (rc $rc)" "$ok"
[[ "$(service_ids backend)" == "$serving" ]]; ok=$?
check "B: the same backend ($(printf '%.12s' "$serving")) is the only one serving" "$ok"
[[ "$(container_state "$serving")" == "healthy" ]]; ok=$?
check "B: the serving backend is still healthy" "$ok"
grep -q " $(container_name "$serving"):" .deploy/edge/backend.conf; ok=$?
check "B: the edge pin never left the serving backend ($(cat .deploy/edge/backend.conf))" "$ok"
docker tag "$ORIG_IMAGE" "$BROKEN_TAG"; docker rmi "${BROKEN_TAG%:*}:switch-smoke-orig" >/dev/null; BROKEN_TAG=""
check "B: the edge failed 0 of $(($(requests) - n_before)) requests during the refused switch" "$(($(failures) - f_before))"

# ── C. an edge config reload ──────────────────────────────────────────────
n_before="$(requests)"; f_before="$(failures)"
NGINX_CFG_CHANGED=1
edge_apply; rc=$?
check "C: edge_apply validated and reloaded the edge config (rc $rc)" "$rc"
sleep 6
check "C: the edge failed 0 of $(($(requests) - n_before)) requests through the reload" "$(($(failures) - f_before))"

touch "$WORK/stop"; wait "$POLLER_PID" 2>/dev/null; POLLER_PID=""
say "polled $(requests) request pairs through the edge; failed: $(failures)"
if [[ "$fail" -ne 0 ]]; then say "FAIL"; exit 1; fi
say "PASS"
