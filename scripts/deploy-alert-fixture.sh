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
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOK="${ROOT}/scripts/deploy-hook.sh"
ALERT="${ROOT}/scripts/deploy-alert.sh"
WORK="$(mktemp -d)"
trap 'rm -rf "${WORK}"' EXIT
SHA="1111111111111111111111111111111111111111"
PREV="2222222222222222222222222222222222222222"
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

# produce OUTCOME — run the hook's own write_record in a scratch "host" dir and
# cut the JSON out of the nginx location it published; prints that file's path.
produce() {
    local outcome="$1" host="${WORK}/host-${1}"
    mkdir -p "${host}"
    (
        cd "${host}" || exit 1
        export FOURIER_DEPLOY_RECORD="${host}/fourier-deploy-record.json"
        # shellcheck source-path=SCRIPTDIR source=deploy-hook.sh
        source "${HOOK}"
        # shellcheck disable=SC2329 # invoked by the sourced hook's publish_record
        edge_reload() { :; }
        write_record "${outcome}" "${PREV}" "${SHA}" "424242" "fixture: forced ${outcome}"
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
