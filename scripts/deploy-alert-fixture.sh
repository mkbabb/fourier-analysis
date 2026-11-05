#!/usr/bin/env bash
# deploy-alert-fixture.sh — the falsifier of F.REL .h1 (COHESION §0ge.4): a
# forced-failure deploy reaches the deploy-alert issue, offline, posting nothing.
#
# It drives the REAL producer and the REAL watcher — scripts/deploy-hook.sh is
# sourced (its own write_record / publish_record / require_alert_channel /
# notify, never a copy), scripts/deploy-alert.sh is run with --dry-run — and
# stubs only the two outward edges: the live edge reload (proven by
# scripts/deploy-switch-smoke.sh) and the network (`curl` to the webhook is a
# recording shim; `gh` on PATH is a tripwire that fails the run if anything
# would post). The edge's record is served to the watcher as a file:// URL cut
# from the very nginx location publish_record wrote.
#
#   scripts/deploy-alert-fixture.sh     # exit 0 = every case PASS
#
#   A  webhook unset  → require_alert_channel does not REFUSE (rc 0)
#   B  webhook set    → notify posts to it (the optional second sink)
#   C  ROLLED_BACK at SHA, no open issue  → dry-run `gh issue create --label deploy-alert`, exit 1
#   D  the same, issue #17 open           → dry-run `gh issue comment 17` (the same issue), exit 1
#   E  REFUSED at SHA past the bound      → TIMEOUT alert, exit 1
#   F  edge serves no record (HTML; a host hook that predates .h1) → TIMEOUT alert, exit 1
#   G  OK at SHA, API live                → exit 0, no gh call
#   H  OK at a newer tip that contains SHA (master moved past it; X §0hc.3),
#      API live                           → SUPERSEDED, exit 0, only the compare read
#   I  OK at a SHA that does not contain SHA (diverged) → TIMEOUT alert, exit 1
#   J  OK at a containing tip, API dead   → TIMEOUT alert, exit 1
#
# X·F F-D1 (DEPLOY-ALERT-5001d2f, issue #3) — every exit of the hook writes the
# record. The REAL main() runs against a scratch host (a bare origin and a clone
# under ${WORK}); only the build/switch, the CI query and the edge reload are
# stubbed. Each case asserts a record exists, its outcome, and that it was
# recorded after the case started:
#   K  dirty host tree                   → REFUSED naming the dirty path
#   L  `git fetch origin` fails          → ABORTED naming the failing command
#   M  the lock is held past LOCK_WAIT   → TIMEOUT naming the wait
#   N  SIGTERM mid-build                 → ABORTED (exit status 143)
#   O  the watcher reads a fresh ABORTED or TIMEOUT record as terminal (FAILED)
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK="${ROOT}/scripts/deploy-hook.sh"
ALERT="${ROOT}/scripts/deploy-alert.sh"
WORK="$(mktemp -d)"
trap 'rm -rf "${WORK}"' EXIT
SHA="1111111111111111111111111111111111111111"
PREV="2222222222222222222222222222222222222222"
NEWER="3333333333333333333333333333333333333333"
FAILS=0

pass() { printf 'PASS %s\n' "$*"; }
fail() { printf 'FAIL %s\n' "$*"; FAILS=$((FAILS + 1)); }

# The tripwire: a `gh` that records any real call.
mkdir -p "${WORK}/bin"
printf '#!/bin/sh\necho "$@" >>"%s/gh-posted"\nexit 0\n' "${WORK}" >"${WORK}/bin/gh"
chmod +x "${WORK}/bin/gh"
export PATH="${WORK}/bin:${PATH}"

printf '{"status":"ok"}' >"${WORK}/health.json"
printf '<!DOCTYPE html><html></html>' >"${WORK}/spa.html"
# The host's syslog is not this fixture's to write: logger is a no-op here.
printf '#!/bin/sh\nexit 0\n' >"${WORK}/bin/logger"
chmod +x "${WORK}/bin/logger"

# produce OUTCOME [AT] — run the hook's own write_record in a scratch "host" dir
# (deployed SHA AT, default SHA) and cut the JSON out of the nginx location it
# published; prints that file's path.
produce() {
    local outcome="$1" at="${2:-${SHA}}" host="${WORK}/host-${1}-${2:-${SHA}}"
    mkdir -p "${host}"
    (
        cd "${host}" || exit 1
        export FOURIER_DEPLOY_RECORD="${host}/fourier-deploy-record.json"
        # shellcheck source-path=SCRIPTDIR source=deploy-hook.sh
        source "${HOOK}"
        # shellcheck disable=SC2329 # invoked by the sourced hook's publish_record
        edge_reload() { :; }
        write_record "${outcome}" "${PREV}" "${at}" "424242" "fixture: forced ${outcome}"
    ) >/dev/null 2>&1
    sed -n "s/^location = \/deploy-record.json { default_type application\/json; return 200 '\(.*\)'; }$/\1/p" \
        "${host}/.deploy/edge/deploy-record.conf" 2>/dev/null >"${host}/edge-record.json"
    printf '%s' "${host}/edge-record.json"
}

# watch RECORD_FILE [ENV…] — the watcher under --dry-run; output in ${WORK}/out.
watch() {
    local record="$1"; shift
    env "$@" bash "${ALERT}" --dry-run --sha "${SHA}" --repo mkbabb/fourier-analysis \
        --record-url "file://${record}" --health-url "file://${WORK}/health.json" \
        --timeout 2 --interval 1 >"${WORK}/out" 2>&1
}

# A — webhook unset is not a REFUSE.
if FOURIER_DEPLOY_ALERT_WEBHOOK="" bash -c 'source "$1" && require_alert_channel' _ "${HOOK}" >/dev/null 2>&1; then
    pass "A webhook unset: require_alert_channel rc 0 (no REFUSE)"
else
    fail "A webhook unset: require_alert_channel REFUSED"
fi

# B — webhook set: notify posts to it (curl is a recording shim).
FOURIER_DEPLOY_ALERT_WEBHOOK="https://sink.invalid/hook" CALLS="${WORK}/webhook-call" bash -c '
    source "$1"
    curl() { printf "%s\n" "$@" >"${CALLS}"; }
    require_alert_channel && notify err "fixture: second sink"' _ "${HOOK}" >/dev/null 2>&1
if grep -qx 'https://sink.invalid/hook' "${WORK}/webhook-call" 2>/dev/null \
        && grep -q 'fixture: second sink' "${WORK}/webhook-call"; then
    pass "B webhook set: notify posted to the second sink"
else
    fail "B webhook set: no post to FOURIER_DEPLOY_ALERT_WEBHOOK"
fi

# C — the forced failure, no open issue: the dry-run OPENS one.
rec="$(produce ROLLED_BACK)"
if jq -e --arg s "${SHA}" '.outcome == "ROLLED_BACK" and .deployed_sha == $s' "${rec}" >/dev/null 2>&1; then
    pass "C0 the edge location serves the hook's ROLLED_BACK record as JSON"
else
    fail "C0 publish_record served no parseable record"
fi
watch "${rec}" DEPLOY_ALERT_DRY_ISSUE=; rc=$?
if [[ ${rc} -eq 1 ]] && grep -q '^\[deploy-alert\] DRY-RUN gh issue create .*--label deploy-alert' "${WORK}/out" \
        && grep -q 'FAILED (ROLLED_BACK)' "${WORK}/out"; then
    pass "C forced failure: dry-run prints gh issue create --label deploy-alert (rc ${rc})"
else
    fail "C forced failure: no dry-run issue create (rc ${rc})"; sed 's/^/    /' "${WORK}/out"
fi

# D — the same failure with #17 open: the dry-run UPDATES that same issue.
watch "${rec}" DEPLOY_ALERT_DRY_ISSUE=17; rc=$?
if [[ ${rc} -eq 1 ]] && grep -q '^\[deploy-alert\] DRY-RUN gh issue comment 17 ' "${WORK}/out" \
        && ! grep -q 'DRY-RUN gh issue create' "${WORK}/out"; then
    pass "D open issue #17: dry-run prints gh issue comment 17, no second issue (rc ${rc})"
else
    fail "D open issue #17: not updated in place (rc ${rc})"; sed 's/^/    /' "${WORK}/out"
fi

# E — REFUSED is not terminal: past the bound it is a TIMEOUT alert.
watch "$(produce REFUSED)" DEPLOY_ALERT_DRY_ISSUE=; rc=$?
if [[ ${rc} -eq 1 ]] && grep -q 'DRY-RUN gh issue create' "${WORK}/out" \
        && grep -q 'TIMEOUT' "${WORK}/out" && grep -q 'outcome REFUSED' "${WORK}/out"; then
    pass "E REFUSED at SHA: TIMEOUT alert on the bound (rc ${rc})"
else
    fail "E REFUSED at SHA: no TIMEOUT alert (rc ${rc})"; sed 's/^/    /' "${WORK}/out"
fi

# F — the bootstrap: the edge serves the SPA, not a record (the host's hook
# predates .h1 and refused before it fetched) → TIMEOUT alert.
watch "${WORK}/spa.html" DEPLOY_ALERT_DRY_ISSUE=; rc=$?
if [[ ${rc} -eq 1 ]] && grep -q 'DRY-RUN gh issue create' "${WORK}/out" \
        && grep -q 'no deploy-of-record served' "${WORK}/out"; then
    pass "F no record served (bootstrap): TIMEOUT alert (rc ${rc})"
else
    fail "F no record served: no alert (rc ${rc})"; sed 's/^/    /' "${WORK}/out"
fi

# G — the green deploy: OK at SHA with the API live → exit 0, nothing alerted.
watch "$(produce OK)" DEPLOY_ALERT_DRY_ISSUE=; rc=$?
if [[ ${rc} -eq 0 ]] && ! grep -q 'DRY-RUN gh' "${WORK}/out"; then
    pass "G OK at SHA: exit 0, no gh call"
else
    fail "G OK at SHA: rc ${rc} or an alert was printed"; sed 's/^/    /' "${WORK}/out"
fi

# H — master moved past SHA: the hook deployed the newer tip, which contains
# SHA, and recorded OK there. That deploy shipped SHA: resolved, not alerted.
watch "$(produce OK "${NEWER}")" DEPLOY_ALERT_DRY_ISSUE= DEPLOY_ALERT_DRY_COMPARE=ahead; rc=$?
if [[ ${rc} -eq 0 ]] && grep -q 'SUPERSEDED' "${WORK}/out" \
        && grep -q "^\[deploy-alert\] DRY-RUN gh api repos/mkbabb/fourier-analysis/compare/${SHA}\.\.\.${NEWER} " "${WORK}/out" \
        && ! grep -Eq 'DRY-RUN gh (issue|label)' "${WORK}/out"; then
    pass "H OK at a containing tip: SUPERSEDED, exit 0, no alert"
else
    fail "H OK at a containing tip: rc ${rc} or alerted"; sed 's/^/    /' "${WORK}/out"
fi

# I — OK at a SHA that does not contain SHA: never resolves it; the bound alerts.
watch "$(produce OK "${NEWER}")" DEPLOY_ALERT_DRY_ISSUE= DEPLOY_ALERT_DRY_COMPARE=diverged; rc=$?
if [[ ${rc} -eq 1 ]] && grep -q 'DRY-RUN gh issue create' "${WORK}/out" \
        && grep -q 'TIMEOUT' "${WORK}/out" && ! grep -q 'SUPERSEDED' "${WORK}/out"; then
    pass "I OK at a non-containing SHA: TIMEOUT alert (rc ${rc})"
else
    fail "I OK at a non-containing SHA: no TIMEOUT alert (rc ${rc})"; sed 's/^/    /' "${WORK}/out"
fi

# J — a containing OK with a dead API is not a healthy OK: the bound alerts.
printf '<html>502</html>' >"${WORK}/dead.json"
rec="$(produce OK "${NEWER}")"
env DEPLOY_ALERT_DRY_ISSUE= DEPLOY_ALERT_DRY_COMPARE=ahead bash "${ALERT}" --dry-run --sha "${SHA}" \
    --repo mkbabb/fourier-analysis --record-url "file://${rec}" --health-url "file://${WORK}/dead.json" \
    --timeout 2 --interval 1 >"${WORK}/out" 2>&1; rc=$?
if [[ ${rc} -eq 1 ]] && grep -q 'TIMEOUT' "${WORK}/out" && grep -q 'api/health is not live' "${WORK}/out"; then
    pass "J containing OK, API dead: TIMEOUT alert (rc ${rc})"
else
    fail "J containing OK, API dead: no TIMEOUT alert (rc ${rc})"; sed 's/^/    /' "${WORK}/out"
fi

# ── F-D1: the hook's exits ───────────────────────────────────────────────────
# scratch_host NAME — a bare origin with one commit, cloned as the host checkout.
scratch_host() {
    local h="${WORK}/host-exit-$1"
    mkdir -p "${h}"
    git init -q --bare "${h}/origin.git"
    git init -q -b master "${h}/seed"
    printf 'seed\n' >"${h}/seed/tracked.txt"
    git -C "${h}/seed" add tracked.txt
    git -C "${h}/seed" -c user.name=fixture -c user.email=fixture@invalid commit -qm seed
    git -C "${h}/seed" push -q "${h}/origin.git" master
    git clone -q "${h}/origin.git" "${h}/repo"
    printf '%s' "${h}"
}

# hook_main HOST [ENV…] — the hook's own main(), its outward edges stubbed. Runs
# in the foreground unless HOOK_BG=1 (then prints nothing and leaves $! set).
hook_env() {
    local h="$1"
    printf '%s\n' "FOURIER_REPO_DIR=${h}/repo" "FOURIER_DEPLOY_LOCKFILE=${h}/deploy.lock" \
        "FOURIER_GREEN_MARKER=${h}/green" "FOURIER_DEPLOY_RECORD=${h}/record.json"
}
# shellcheck disable=SC2016 # expanded by the inner bash
HOOK_STUBS='source "$1"
edge_reload() { :; }
require_green_ci() { CI_RUN_ID=424242; return 0; }
switch_stack() { sleep "${FIXTURE_BUILD_SECONDS:-0}"; }
health_gate() { return 0; }
main fixture'

# record_ok HOST CASE OUTCOME STARTED PATTERN — the record exists, reads OUTCOME,
# was recorded at or after STARTED, and its detail matches PATTERN.
record_ok() {
    local h="$1" case="$2" want="$3" started="$4" pattern="$5"
    if jq -e --arg o "${want}" --arg t "${started}" --arg p "${pattern}" \
            '.outcome == $o and .recorded_at >= $t and (.detail | test($p))' \
            "${h}/record.json" >/dev/null 2>&1; then
        pass "${case} record ${want}: $(jq -r .detail "${h}/record.json")"
    else
        fail "${case} no ${want} record (want detail ~ /${pattern}/); record: $(cat "${h}/record.json" 2>/dev/null || echo '<none>')"
        sed 's/^/    /' "${h}/log" 2>/dev/null | tail -5
    fi
}

stamp() { date -u +%Y-%m-%dT%H:%M:%SZ; }

# K — a dirty host tree is REFUSED, and the record names the path.
h="$(scratch_host K)"; printf 'host edit\n' >>"${h}/repo/tracked.txt"; t0="$(stamp)"
# shellcheck disable=SC2046 # one KEY=VALUE per line
(cd "${h}" && env $(hook_env "${h}") bash -c "${HOOK_STUBS}" _ "${HOOK}") >"${h}/log" 2>&1
record_ok "${h}" K REFUSED "${t0}" "tracked\\.txt"

# L — `git fetch origin` fails (the remote is gone): ABORTED, naming the command.
h="$(scratch_host L)"; git -C "${h}/repo" remote set-url origin "${h}/gone.git"; t0="$(stamp)"
# shellcheck disable=SC2046
(cd "${h}" && env $(hook_env "${h}") bash -c "${HOOK_STUBS}" _ "${HOOK}") >"${h}/log" 2>&1
record_ok "${h}" L ABORTED "${t0}" "git fetch origin"

# M — another deploy holds the lock past LOCK_WAIT: TIMEOUT, naming the wait.
h="$(scratch_host M)"; : >"${h}/deploy.lock"
flock "${h}/deploy.lock" sleep 8 & holder=$!
sleep 0.5; t0="$(stamp)"
# shellcheck disable=SC2046
(cd "${h}" && env $(hook_env "${h}") LOCK_WAIT=2 bash -c "${HOOK_STUBS}" _ "${HOOK}") >"${h}/log" 2>&1
kill "${holder}" 2>/dev/null; wait "${holder}" 2>/dev/null
record_ok "${h}" M TIMEOUT "${t0}" "lock held"

# N — SIGTERM mid-build (the receiver's own timeout): ABORTED, status 143.
h="$(scratch_host N)"; t0="$(stamp)"
# shellcheck disable=SC2046
(cd "${h}" && exec env $(hook_env "${h}") FIXTURE_BUILD_SECONDS=3 bash -c "${HOOK_STUBS}" _ "${HOOK}") >"${h}/log" 2>&1 &
victim=$!
sleep 1; kill -TERM "${victim}" 2>/dev/null; wait "${victim}" 2>/dev/null
record_ok "${h}" N ABORTED "${t0}" "status 143"

# O — the watcher treats a fresh ABORTED or TIMEOUT record as terminal: FAILED
# at once, not a wait out to the bound.
for outcome in ABORTED TIMEOUT; do
    watch "$(produce "${outcome}")" DEPLOY_ALERT_DRY_ISSUE=; rc=$?
    if [[ ${rc} -eq 1 ]] && grep -q "FAILED (${outcome})" "${WORK}/out" && ! grep -q 'waiting' "${WORK}/out"; then
        pass "O ${outcome} at SHA: FAILED at once (rc ${rc})"
    else
        fail "O ${outcome} at SHA: not terminal (rc ${rc})"; sed 's/^/    /' "${WORK}/out"
    fi
done

# The tripwire: a dry-run never posts.
if [[ -e "${WORK}/gh-posted" ]]; then
    fail "tripwire: gh was really invoked: $(cat "${WORK}/gh-posted")"
else
    pass "tripwire: no real gh call in any case"
fi

if ((FAILS)); then
    printf 'deploy-alert-fixture: RED (%d failing)\n' "${FAILS}"
    exit 1
fi
printf 'deploy-alert-fixture: GREEN\n'
