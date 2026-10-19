#!/usr/bin/env bash
# deploy-alert.sh — the off-host watcher of the API deploy (X·F F.REL .h1,
# COHESION §0ge.4: R-h1 ruled). Run by .github/workflows/deploy-alert.yml after
# every green master CI run; usable by hand with --dry-run.
#
# The host deploy (scripts/deploy-hook.sh, run by the webhook) has no
# GITHUB_TOKEN, so it cannot open an issue. It publishes its deploy-of-record at
# the edge instead (GET /deploy-record.json, publish_record), and THIS script
# reads that record from outside until it shows outcome OK at the CI-verified
# SHA with the API live. Anything else is alerted in ONE GitHub issue labelled
# `deploy-alert`: opened when none is open, commented on (the same issue) when
# one is. The verdicts:
#
#   OK        record.deployed_sha == SHA, outcome OK, /api/health live  → exit 0
#   FAILED    record.deployed_sha == SHA, outcome ROLLED_BACK or ALERT  → alert, exit 1
#   TIMEOUT   no OK at SHA within --timeout (a REFUSED record, a record at an
#             older SHA, a record the edge does not serve — e.g. a host whose
#             hook predates .h1 and refused before it fetched — or a dead API)
#                                                                       → alert, exit 1
#
# REFUSED is not terminal: the push-time hook run refuses a SHA whose CI has not
# finished (inv-28) and a later delivery deploys it; only the bound decides.
#
#   scripts/deploy-alert.sh --sha <40-hex> [--dry-run]
#       [--record-url URL] [--health-url URL] [--timeout S] [--interval S]
#       [--run-url URL] [--repo OWNER/NAME]
#
# --dry-run prints every gh call (the lookup and the write) and posts nothing;
# the lookup's answer is then DEPLOY_ALERT_DRY_ISSUE (an open issue number, or
# empty for none), so the open-then-update path is exercisable offline
# (scripts/deploy-alert-fixture.sh). Live, gh reads GH_TOKEN from the
# environment; it is never printed.
set -euo pipefail

SHA=""
DRY_RUN=0
RECORD_URL="${DEPLOY_RECORD_URL:-https://api.fourier.babb.dev/deploy-record.json}"
HEALTH_URL="${DEPLOY_HEALTH_URL:-https://api.fourier.babb.dev/api/health}"
TIMEOUT="${DEPLOY_ALERT_TIMEOUT:-1800}"
INTERVAL="${DEPLOY_ALERT_INTERVAL:-30}"
RUN_URL="${DEPLOY_ALERT_RUN_URL:-}"
REPO="${GITHUB_REPOSITORY:-mkbabb/fourier-analysis}"
readonly LABEL="deploy-alert"
readonly TITLE="deploy-alert: the fourier API deploy did not reach a healthy OK"

die() { printf '[deploy-alert] %s\n' "$*" >&2; exit 2; }
say() { printf '[deploy-alert] %s\n' "$*"; }

while (($#)); do
    case "$1" in
        --sha) SHA="${2:-}"; shift 2 ;;
        --dry-run) DRY_RUN=1; shift ;;
        --record-url) RECORD_URL="${2:-}"; shift 2 ;;
        --health-url) HEALTH_URL="${2:-}"; shift 2 ;;
        --timeout) TIMEOUT="${2:-}"; shift 2 ;;
        --interval) INTERVAL="${2:-}"; shift 2 ;;
        --run-url) RUN_URL="${2:-}"; shift 2 ;;
        --repo) REPO="${2:-}"; shift 2 ;;
        *) die "unknown argument: $1" ;;
    esac
done
[[ "${SHA}" =~ ^[0-9a-f]{40}$ ]] || die "--sha must be a full 40-hex commit SHA (got '${SHA}')"
[[ "${TIMEOUT}" =~ ^[0-9]+$ && "${INTERVAL}" =~ ^[1-9][0-9]*$ ]] || die "--timeout/--interval must be integers"
command -v jq >/dev/null 2>&1 || die "jq is required"

# gh_call ARGS… — run gh, or under --dry-run print the exact call and post nothing.
gh_call() {
    if ((DRY_RUN)); then
        printf '[deploy-alert] DRY-RUN gh'
        printf ' %q' "$@"
        printf '\n'
        return 0
    fi
    gh "$@"
}

# open_issue — the number of the open deploy-alert issue, or empty for none.
open_issue() {
    if ((DRY_RUN)); then
        gh_call issue list --repo "${REPO}" --label "${LABEL}" --state open \
            --json number --jq '.[0].number // empty' >&2
        printf '%s' "${DEPLOY_ALERT_DRY_ISSUE:-}"
        return 0
    fi
    gh issue list --repo "${REPO}" --label "${LABEL}" --state open \
        --json number --jq '.[0].number // empty' --limit 1
}

# alert VERDICT DETAIL — open the deploy-alert issue, or update the open one.
alert() {
    local verdict="$1" detail="$2" body number
    # shellcheck disable=SC2016 # the backticks are Markdown code spans, not expansions
    body="$(printf '**%s** - the API deploy of `%s` did not reach outcome OK with a live API.\n\n%s\n\n- deploy-of-record: %s\n- health: %s\n- watcher run: %s\n- observed: %s\n' \
        "${verdict}" "${SHA}" "${detail}" "${RECORD_URL}" "${HEALTH_URL}" \
        "${RUN_URL:-<local>}" "$(date -u +%Y-%m-%dT%H:%M:%SZ)")"
    gh_call label create "${LABEL}" --repo "${REPO}" --color B60205 \
        --description "A fourier API deploy did not reach a healthy OK (scripts/deploy-alert.sh)" --force
    number="$(open_issue)"
    if [[ -n "${number}" ]]; then
        say "updating the open ${LABEL} issue #${number}"
        gh_call issue comment "${number}" --repo "${REPO}" --body "${body}"
    else
        say "opening a ${LABEL} issue"
        gh_call issue create --repo "${REPO}" --title "${TITLE}" --label "${LABEL}" --body "${body}"
    fi
}

# read_record — the edge's deploy-of-record as compact JSON, or empty when the
# edge does not serve one (absent, HTML, unreachable).
read_record() {
    local body
    body="$(curl -fsS --max-time 15 -H 'Cache-Control: no-cache' "${RECORD_URL}" 2>/dev/null || true)"
    printf '%s' "${body}" | jq -ce 'select(type == "object" and has("deployed_sha") and has("outcome"))' 2>/dev/null || true
}

health_live() {
    local body
    body="$(curl -fsS --max-time 10 "${HEALTH_URL}" 2>/dev/null || true)"
    [[ "${body}" == *'"status"'*'"ok"'* ]]
}

say "watching the API deploy of ${SHA} (record ${RECORD_URL}; bound ${TIMEOUT}s, every ${INTERVAL}s)"
deadline=$((SECONDS + TIMEOUT))
last="no deploy-of-record served"
while :; do
    record="$(read_record)"
    if [[ -n "${record}" ]]; then
        at="$(printf '%s' "${record}" | jq -r '.deployed_sha')"
        outcome="$(printf '%s' "${record}" | jq -r '.outcome')"
        last="outcome ${outcome} at ${at} ($(printf '%s' "${record}" | jq -r '.detail // ""'))"
        if [[ "${at}" == "${SHA}" ]]; then
            case "${outcome}" in
                OK)
                    if health_live; then
                        say "OK - ${SHA} deployed (CI run $(printf '%s' "${record}" | jq -r '.ci_run_id')) and the API is live"
                        exit 0
                    fi
                    last="${last}; /api/health is not live"
                    ;;
                ROLLED_BACK | ALERT)
                    alert "FAILED (${outcome})" "The host recorded ${last}."
                    exit 1
                    ;;
            esac
        fi
    fi
    if ((SECONDS >= deadline)); then
        alert "TIMEOUT" "No outcome OK at this SHA within ${TIMEOUT}s. Last reading - ${last}."
        exit 1
    fi
    say "waiting - ${last}"
    sleep "${INTERVAL}"
done
