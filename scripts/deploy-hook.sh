#!/usr/bin/env bash
# deploy-hook.sh — the tracked, on-host deploy logic for fourier-analysis.
#
# This script REPLACES the retired scripts/deploy.sh (the manual SSH-push
# surface). It runs ON the target host, in /var/www/fourier-analysis, invoked
# by the host-resident adnanh/webhook receiver's fourier hook arm. There is NO
# SSH herein — the receiver invokes this script locally after verifying the
# GitHub HMAC-SHA256 signature; the dev's sole manual act is `git push`.
#
# Invocation contract (matches the live /opt/deploy/ dispatcher, per
# docs/tranches/C/coordination/DEPLOY-RECONCILE.md): the hook calls this with
# command-working-directory: /opt/deploy and passes repository.full_name; the
# fourier arm cd's into /var/www/fourier-analysis and runs this script. It
# carries the four improvements the live dispatcher provably lacks:
#   1. flock serialisation (the live dispatcher has none);
#   2. a REAL health-gate sourced from ${HTTP_PORT:-8100}, no `|| echo` swallow;
#   3. rebuild-on-rollback (reset --hard $PREV + rebuild + re-gate);
#   4. dirty-tree-fail-loud (never a silent reset --hard over local edits).
#
# X·F F.W9 unit `a` (2026-09-19) re-homes M.W2 / M.W3 / M.W4 here and executes
# them. The three chronics they name, and the shape of each cure:
#
#   M.W2 — READINESS != LIVENESS. The gate conflated two different questions in
#     one boolean: "is the backend process up?" (LIVENESS) and "is the edge
#     serving the API contract?" (READINESS, i.e. inv-22's root-404). A single
#     fused verdict cannot say WHICH failed, so an inv-22 regression and a dead
#     uvicorn produced the identical log line and the identical rollback. The
#     two probes are now separate functions with separate verdicts, separately
#     reported and separately recorded; the container half of the same cure is
#     the image-level HEALTHCHECKs (api/Dockerfile, web/Dockerfile) plus
#     `depends_on: condition: service_healthy` in the compose overlay, so the
#     stack orders on READINESS rather than on container-started.
#
#   M.W3 — FAIL-CLOSED inv-28. The API arm shipped whatever `origin/master`
#     pointed at, on a bare webhook, with ZERO verification — while the SPA arm
#     (.github/workflows/deploy-pages.yml) has been inv-28-gated since H.W2 on
#     `conclusion == 'success' && head_branch == 'master' && event == 'push'`
#     with every checkout pinned to `head_sha`. That guard is MIRRORED here (it
#     is never edited there): the API now refuses any SHA without a covering
#     green CI run, and advances to that exact verified SHA rather than to a
#     moving ref. Fail-closed means the REFUSAL is the default: a query that
#     cannot be answered refuses just as a red run does.
#
#   M.W4 — THE SILENT ROLLBACK IS KILLED, and the inv-31 observability floor
#     stands up. The rollback was already loud on stdout, but stdout here is
#     the webhook receiver's log, which nothing watches — and the spec's own
#     words are that "an ALERT line in an unwatched log does not clear this
#     gate". Every terminal outcome now goes to a WATCHED channel and leaves a
#     durable, machine-readable deploy-of-record; the channel is REQUIRED, so
#     an unobservable deploy refuses to start rather than running blind. The
#     deploy-of-record is also the surface that makes the host's SHA readable
#     at all: before it, "which commit is the host on?" had no answer from
#     anywhere off the host, which is why the drift went 24 days unnoticed.
#
# It carries NO secret — the HMAC secret lives only in GitHub's webhook config
# and the host's un-tracked hooks.json (see the precepts note staged in
# DEPLOY-RECONCILE.md). It carries NO SSH key and NO password. GITHUB_TOKEN, if
# set, is read from the environment and NEVER logged or echoed.

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
# The deploy target and the compose invocation mirror the retired deploy.sh
# (lines 26, 29) verbatim — build --parallel then up -d, the same two-file
# compose overlay.
readonly REPO_DIR="/var/www/fourier-analysis"
readonly COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)

# G.W7 (T3) — set when the pulled diff touched nginx/, so the bring-up
# force-recreates nginx (see build_and_up). The nginx config is a single-file
# bind-mount (:ro); `git reset` replaces it via atomic rename (new inode) but
# the running container keeps the old inode, and `up -d` won't recreate a service
# whose compose def is unchanged — so a config-only change is silently NOT
# applied (found live at G.W3). force-recreate re-binds it.
NGINX_CFG_CHANGED=0

# The health-gate port is sourced from ${HTTP_PORT:-8100} — the SAME default the
# compose nginx bind uses (docker-compose.prod.yml, the nginx service's
# "127.0.0.1:${HTTP_PORT:-8100}:80" publish) — so the gate and the bind cannot
# drift. This is the structural fix for the wrong-port class of bug (the retired
# deploy.sh curled a stale, hard-coded port and swallowed the failure with
# `|| echo`, so a dead service "passed").
readonly HEALTH_PORT="${HTTP_PORT:-8100}"

# M.W2 — the two probes, named apart because they answer different questions.
#
#   LIVENESS_URL — is the backend process up and reachable through the edge?
#     /api/health is proxied to uvicorn; a 200 {"status":"ok"} means the
#     application answered. This says NOTHING about whether the edge is serving
#     the right contract.
#
#   READINESS_URL — is the edge serving the API contract? F.W1 (inv-22): the API
#     host root is intentionally a 404 problem+json, NOT an SPA index. A stale
#     SPA-fallback regression makes the root 200 while the backend stays
#     perfectly live, which is exactly the failure the fused gate could not name.
readonly LIVENESS_URL="http://127.0.0.1:${HEALTH_PORT}/api/health"
readonly READINESS_URL="http://127.0.0.1:${HEALTH_PORT}/"

# Bounded poll — ~60 s total at ~2 s intervals (replaces deploy.sh's blind
# `sleep 5`). The gate's non-zero exit is load-bearing: it IS the rollback
# trigger. There is NO `|| echo` swallow anywhere in this gate.
readonly GATE_RETRIES=30
readonly GATE_INTERVAL=2

# Serialisation: a fourier-scoped lockfile so overlapping fourier triggers
# serialise (the replay / two-rapid-push contract). It is fourier-named so it
# does NOT block sibling-repo deploys on the shared host.
readonly LOCKFILE="/run/lock/fourier-deploy.lock"

# The last-known-GREEN marker — a host-side, out-of-tree file the script
# reads/writes so the SECOND and subsequent rollbacks pin last-known-green
# rather than bare HEAD. (For the first deploy the dirty-tree clause forces the
# operator to reconcile the host tree, so the first baseline is reproducible.)
readonly GREEN_MARKER="/opt/deploy/fourier-last-green"

# ── M.W3 (inv-28) — the covering-CI query ────────────────────────────────────
# The mirror of .github/workflows/deploy-pages.yml's `changes` job guard. That
# file is the reference implementation and is READ here, never edited: its
# `if:` requires workflow_run.conclusion == 'success' && head_branch ==
# 'master' && event == 'push', and every checkout pins ref: head_sha. The three
# conjuncts map onto the REST query below one-for-one (status=success,
# branch=..., event=push), and the head_sha pin becomes `reset --hard <sha>`
# against the verified SHA instead of against a moving ref.
readonly REPO_SLUG="${FOURIER_REPO_SLUG:-mkbabb/fourier-analysis}"
readonly CI_WORKFLOW_FILE="${FOURIER_CI_WORKFLOW:-ci.yml}"
readonly DEPLOY_BRANCH="${FOURIER_DEPLOY_BRANCH:-master}"

# ── M.W4 (inv-31) — the observability floor ──────────────────────────────────
# DEPLOY_RECORD is the deploy-of-record: a durable, machine-readable JSON
# document rewritten atomically on EVERY terminal outcome (OK, REFUSED,
# ROLLED_BACK, ALERT). It is the answer to "which commit is the host on, and
# how did it get there?" — a question that had no answer anywhere before this.
#
# ALERT_WEBHOOK is the WATCHED channel. It is REQUIRED: fail-closed on
# observability. A deploy that cannot report its own failure is precisely the
# chronic M.W4 names, and adding one more line to an unwatched log does not
# cure it. The operator sets FOURIER_DEPLOY_ALERT_WEBHOOK in the host's
# un-tracked hooks.json environment (a Slack/Discord/ntfy-compatible endpoint
# accepting {"text": "..."}); it is a URL, not a secret this script may print.
readonly DEPLOY_RECORD="${FOURIER_DEPLOY_RECORD:-/opt/deploy/fourier-deploy-record.json}"
readonly ALERT_WEBHOOK="${FOURIER_DEPLOY_ALERT_WEBHOOK:-}"
readonly SYSLOG_TAG="fourier-deploy"

log() {
    printf '[deploy-hook %s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

# notify LEVEL MESSAGE — the LOUD half of M.W4.
#
# Writes the same message to four places, because the chronic was a message
# that reached exactly one place nobody reads:
#   1. stdout/stderr (the webhook receiver's log — kept, never relied on);
#   2. syslog via logger, at daemon.<level> (journald; host-queryable);
#   3. the ALERT_WEBHOOK (the watched channel);
#   4. the caller then records the outcome in DEPLOY_RECORD (see write_record).
#
# A failed webhook POST is itself escalated to stderr + syslog rather than
# swallowed — the one thing this function may never do is go quiet.
notify() {
    local level="$1"; shift
    local message="$*"
    local stamp; stamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

    if [[ "${level}" == "err" ]]; then
        printf '[deploy-hook %s] %s\n' "${stamp}" "${message}" >&2
    else
        log "${message}"
    fi

    if command -v logger >/dev/null 2>&1; then
        logger -t "${SYSLOG_TAG}" -p "daemon.${level}" -- "${message}" || true
    fi

    if [[ -n "${ALERT_WEBHOOK}" ]]; then
        local payload
        # JSON-escape the message: backslashes first, then quotes, then newlines.
        payload="$(printf '%s' "${message}" \
            | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' \
            | awk 'BEGIN{ORS=""} NR>1{print "\\n"} {print}')"
        if ! curl -fsS --max-time 15 -X POST \
                -H 'Content-Type: application/json' \
                -d "{\"text\":\"[fourier deploy ${level}] ${payload}\"}" \
                "${ALERT_WEBHOOK}" >/dev/null 2>&1; then
            printf '[deploy-hook %s] ALERT-CHANNEL POST FAILED — the message above reached syslog only\n' \
                "${stamp}" >&2
            if command -v logger >/dev/null 2>&1; then
                logger -t "${SYSLOG_TAG}" -p daemon.err -- \
                    "ALERT-CHANNEL POST FAILED for: ${message}" || true
            fi
        fi
    fi
}

# require_alert_channel — the BLOCKING half of M.W4.
#
# Fail-closed on observability. An unobservable deploy is refused before it can
# touch the tree, because the alternative is the exact chronic: a rollback that
# happened, worked or did not, and told nobody.
require_alert_channel() {
    if [[ -z "${ALERT_WEBHOOK}" ]]; then
        printf '[deploy-hook %s] REFUSE — inv-31: FOURIER_DEPLOY_ALERT_WEBHOOK is unset.\n' \
            "$(date -u +%Y-%m-%dT%H:%M:%SZ)" >&2
        printf '  A deploy that cannot report its own failure in a watched channel does not run.\n' >&2
        printf '  Set FOURIER_DEPLOY_ALERT_WEBHOOK in the host hooks.json environment for this arm.\n' >&2
        if command -v logger >/dev/null 2>&1; then
            logger -t "${SYSLOG_TAG}" -p daemon.err -- \
                "REFUSE — inv-31: FOURIER_DEPLOY_ALERT_WEBHOOK unset; deploy not attempted" || true
        fi
        return 1
    fi
}

# write_record OUTCOME PREV NEW CI_RUN_ID DETAIL — the DURABLE half of inv-31.
#
# Atomic (write-temp-then-rename) so a reader never sees a half-written record.
# Best-effort on the write itself: if /opt/deploy is not writable the deploy
# must still report through the watched channel rather than die here.
write_record() {
    local outcome="$1" prev="$2" new="$3" ci_run_id="$4" detail="$5"
    local stamp tmp
    stamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    tmp="${DEPLOY_RECORD}.tmp.$$"

    detail="$(printf '%s' "${detail}" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')"

    if ! {
        printf '{\n'
        printf '  "repo": "%s",\n' "${REPO_SLUG}"
        printf '  "outcome": "%s",\n' "${outcome}"
        printf '  "deployed_sha": "%s",\n' "${new}"
        printf '  "previous_sha": "%s",\n' "${prev}"
        printf '  "ci_run_id": "%s",\n' "${ci_run_id}"
        printf '  "recorded_at": "%s",\n' "${stamp}"
        printf '  "detail": "%s"\n' "${detail}"
        printf '}\n'
    } >"${tmp}" 2>/dev/null; then
        rm -f "${tmp}" 2>/dev/null || true
        notify warning "inv-31 — could not write the deploy-of-record at ${DEPLOY_RECORD} (outcome ${outcome} for ${new})"
        return 0
    fi
    mv -f "${tmp}" "${DEPLOY_RECORD}" 2>/dev/null \
        || notify warning "inv-31 — could not install the deploy-of-record at ${DEPLOY_RECORD}"
}

# ── M.W3 — inv-28: the API arm is fail-closed on a same-SHA green CI run ─────
# gh_api PATH_AND_QUERY — one read-only GitHub REST call. `curl -f` makes every
# non-2xx a non-zero exit, which is what fail-closed needs: the caller cannot
# mistake an error body for an answer. GITHUB_TOKEN is used when present (higher
# rate limit / private repos) and is never echoed.
gh_api() {
    local url="https://api.github.com/$1"
    local -a auth=()
    if [[ -n "${GITHUB_TOKEN:-}" ]]; then
        auth=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
    fi
    curl -fsS --max-time 20 \
        -H 'Accept: application/vnd.github+json' \
        -H 'X-GitHub-Api-Version: 2022-11-28' \
        "${auth[@]}" "${url}"
}

# json_scalar KEY < JSON — jq when the host has it, a sed fallback when it does
# not. The host provably lacks jq (the same reason scripts/pages-deploy.sh
# parses wrangler's stdout rather than `--json | jq`), so the fallback is the
# real path, not a courtesy. Only flat top-level scalars are read this way —
# total_count, and the first workflow-run id.
json_scalar() {
    local key="$1" body; body="$(cat)"
    if command -v jq >/dev/null 2>&1; then
        printf '%s' "${body}" | jq -r --arg k "${key}" '
            if $k == "run_id" then (.workflow_runs[0].id // empty)
            else (.[$k] // empty) end' 2>/dev/null
        return 0
    fi
    case "${key}" in
        total_count)
            printf '%s' "${body}" | tr ',' '\n' \
                | sed -n 's/.*"total_count"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p' | head -1
            ;;
        run_id)
            printf '%s' "${body}" \
                | sed -n 's/.*"workflow_runs"[[:space:]]*:[[:space:]]*\[[[:space:]]*{[[:space:]]*"id"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p' | head -1
            ;;
    esac
}

# CI_RUN_ID is set by require_green_ci on success — the covering run id, carried
# into the deploy-of-record so every shipped SHA cites the run that cleared it.
CI_RUN_ID=""

require_green_ci() {
    local sha="$1" body count
    local query="repos/${REPO_SLUG}/actions/workflows/${CI_WORKFLOW_FILE}/runs"
    query+="?head_sha=${sha}&branch=${DEPLOY_BRANCH}&event=push&status=success&per_page=1"

    log "inv-28 — asking GitHub for a covering green ${CI_WORKFLOW_FILE} run for ${sha} on ${DEPLOY_BRANCH}…"
    if ! body="$(gh_api "${query}")"; then
        notify err "inv-28 REFUSE — the covering-CI query could not be answered for ${sha}; the deploy is fail-closed and did NOT run. (Transport/API failure, or a rate limit with no GITHUB_TOKEN set.)"
        return 1
    fi

    count="$(printf '%s' "${body}" | json_scalar total_count)"
    if [[ -z "${count}" ]]; then
        notify err "inv-28 REFUSE — the covering-CI response for ${sha} carried no total_count; refusing rather than guessing."
        return 1
    fi
    if [[ "${count}" -lt 1 ]]; then
        notify err "inv-28 REFUSE — no green ${CI_WORKFLOW_FILE} push run on ${DEPLOY_BRANCH} covers ${sha}. The API is NOT shipped. (This is the demonstrable refusal the SPA arm has had since H.W2.)"
        return 1
    fi

    CI_RUN_ID="$(printf '%s' "${body}" | json_scalar run_id)"
    CI_RUN_ID="${CI_RUN_ID:-unknown}"
    log "inv-28 GREEN — ${sha} is covered by ${CI_WORKFLOW_FILE} run ${CI_RUN_ID}"
}

# ── M.W2 — the two probes, asked and answered separately ─────────────────────
# Each returns 0/1 on its OWN question. Neither knows about the other, which is
# the whole point: the gate below can name which one failed.
probe_liveness() {
    local body
    body="$(curl -fsS --max-time 5 "${LIVENESS_URL}" 2>/dev/null || true)"
    [[ "${body}" == *'"status"'*'"ok"'* ]]
}

probe_readiness() {
    local code
    code="$(curl -sS --max-time 5 -o /dev/null -w '%{http_code}' "${READINESS_URL}" 2>/dev/null || true)"
    [[ "${code}" == "404" ]]
}

# health_gate — polls both probes and returns 0 only when BOTH are green, but
# reports them APART so a failure names its own cause. NO swallow — the caller
# relies on the exit status as the rollback trigger.
#
# GATE_FAILURE carries the named reason out to the caller for the alert and the
# deploy-of-record: "liveness" (the backend never came up), "readiness" (the
# backend is up but the edge is serving the wrong contract — the inv-22
# regression the fused gate could not distinguish), or "liveness+readiness".
GATE_FAILURE=""

health_gate() {
    local attempt live=1 ready=1
    GATE_FAILURE=""
    for ((attempt = 1; attempt <= GATE_RETRIES; attempt++)); do
        live=1; ready=1
        if probe_liveness; then live=0; fi
        if probe_readiness; then ready=0; fi
        if [[ ${live} -eq 0 && ${ready} -eq 0 ]]; then
            log "health gate GREEN on :${HEALTH_PORT} (attempt ${attempt}/${GATE_RETRIES}) — LIVENESS ok (/api/health) · READINESS ok (/ → 404, inv-22)"
            return 0
        fi
        sleep "${GATE_INTERVAL}"
    done

    if [[ ${live} -ne 0 && ${ready} -ne 0 ]]; then
        GATE_FAILURE="liveness+readiness"
    elif [[ ${live} -ne 0 ]]; then
        GATE_FAILURE="liveness"
    else
        GATE_FAILURE="readiness"
    fi
    log "health gate FAILED on :${HEALTH_PORT} after ${GATE_RETRIES} attempts (~$((GATE_RETRIES * GATE_INTERVAL))s) — failing probe: ${GATE_FAILURE}"
    log "  LIVENESS  (${LIVENESS_URL}): $([[ ${live} -eq 0 ]] && echo ok || echo FAILED)"
    log "  READINESS (${READINESS_URL} → 404, inv-22): $([[ ${ready} -eq 0 ]] && echo ok || echo FAILED)"
    return 1
}

# ── Dirty-tree guard (improvement 4, C7) ─────────────────────────────────────
# A blind `git reset --hard` would silently discard locally-modified tracked
# files (e.g. host-specific compose overrides applied out-of-band). Before ANY
# reset, fail loud — non-zero exit naming the dirty paths — so the operator
# reconciles the host tree rather than the deploy silently destroying config.
assert_clean_tree() {
    local dirty
    dirty="$(git status --porcelain --untracked-files=no)"
    if [[ -n "${dirty}" ]]; then
        notify err "ABORT — host working tree is DIRTY; tracked changes would be discarded by reset --hard. Reconcile the host tree (commit, stash, or revert) before deploying."
        printf '%s\n' "${dirty}" >&2
        return 1
    fi
}

# ── Build + bring up the stack ───────────────────────────────────────────────
# NO `build … || build …` fallback (the live-dispatcher defect that defeats
# set -e: the `||` makes the compound succeed on a failed primary build, so
# control falls through to `up -d` with a half-built image set). set -euo
# pipefail therefore aborts the whole script on a partial build, leaving the
# running stack untouched.
build_and_up() {
    log "building (build --parallel)…"
    "${COMPOSE[@]}" build --parallel
    # M.W2's container half: the overlay's `depends_on: condition:
    # service_healthy` makes the bring-up BLOCK on each dependency's HEALTHCHECK
    # rather than on "container started", so the ordering is on READINESS.
    # `--wait` makes compose report that ordering as its own exit status instead
    # of returning the moment the last container is created — and a service that
    # goes `unhealthy` ends the wait non-zero rather than hanging, because every
    # healthcheck in this stack is `retries`-bounded.
    #
    # That non-zero is returned to the CALLER, never allowed to abort the script:
    # an aborting bring-up would skip the rollback and the watched-channel alert,
    # which is precisely the silence M.W4 exists to kill. A failed BUILD is a
    # different case and keeps the abort (see above) — nothing has been brought
    # up yet, so the running stack is untouched and there is nothing to roll back.
    log "bringing up (up -d --wait — blocks on each service's HEALTHCHECK)…"
    if ! "${COMPOSE[@]}" up -d --wait; then
        log "bring-up FAILED — a service never reached a healthy state (compose --wait)"
        return 1
    fi
    # G.W7 (T3): a config-only nginx change is invisible to `up -d` (unchanged
    # service def + stale single-file bind-mount inode). When the pulled diff
    # touched nginx/, force-recreate nginx so it re-binds to the current config.
    # Runs on BOTH the forward bring-up and the rollback bring-up (NGINX_CFG_CHANGED
    # is true for either direction across the same nginx/ delta). The subsequent
    # health gate then validates the new nginx config (the readiness probe goes
    # through nginx), so a broken config trips the rollback like any other bad
    # bring-up.
    if [[ "${NGINX_CFG_CHANGED}" == "1" ]]; then
        log "nginx/ changed in this deploy — force-recreating nginx to re-bind the bind-mounted config"
        if ! "${COMPOSE[@]}" up -d --wait --force-recreate nginx; then
            log "nginx force-recreate FAILED — the new config did not come up healthy"
            return 1
        fi
    fi
}

# ── The deploy body (runs under the flock) ───────────────────────────────────
deploy() {
    cd "${REPO_DIR}"

    # 1. Dirty-tree-fail-loud BEFORE any reset.
    assert_clean_tree

    # 2. Record the rollback target BEFORE the reset. Prefer the recorded
    #    last-known-GREEN SHA; fall back to current HEAD on the first deploy.
    local prev
    if [[ -r "${GREEN_MARKER}" ]] && prev="$(cat "${GREEN_MARKER}")" && [[ -n "${prev}" ]]; then
        log "rollback target = last-known-green ${prev} (from ${GREEN_MARKER})"
    else
        prev="$(git rev-parse HEAD)"
        log "rollback target = current HEAD ${prev} (no green marker yet — first deploy)"
    fi

    # 3. M.W3 (inv-28) — resolve the candidate SHA, then REFUSE it unless a
    #    same-SHA green CI run covers it. The fetch is read-only; nothing in the
    #    working tree moves until the gate has passed. This is the head_sha pin:
    #    the deploy advances to a NAMED, VERIFIED commit, never to a ref that
    #    may have moved between the query and the reset.
    git fetch origin
    local new
    new="$(git rev-parse "origin/${DEPLOY_BRANCH}")"
    if ! require_green_ci "${new}"; then
        write_record "REFUSED" "${prev}" "${new}" "none" \
            "inv-28: no covering green ${CI_WORKFLOW_FILE} run; the host stays on ${prev}"
        return 1
    fi

    log "advancing ${prev} -> ${new} (covered by CI run ${CI_RUN_ID})"
    git reset --hard "${new}"

    # 3b. G.W7 (T3) — did this delta touch the bind-mounted nginx config? If so
    # the bring-up must force-recreate nginx (a plain `up -d` would leave the
    # running container on the stale config inode). Computed BEFORE build so it
    # governs both the forward and any rollback bring-up.
    if git diff --name-only "${prev}" "${new}" | grep -q '^nginx/'; then
        NGINX_CFG_CHANGED=1
        log "nginx/ changed in ${prev}..${new} — nginx will be force-recreated on bring-up"
    fi

    # 4. Build + up, then 5. the REAL health gate. Either one failing is the
    #    rollback trigger, and each names its own cause: a bring-up that never
    #    went healthy is a distinct fact from a stack that came up and then
    #    served the wrong contract.
    local gate_ok=1
    if build_and_up; then
        if health_gate; then gate_ok=0; fi
    else
        GATE_FAILURE="bring-up (compose --wait: a service never became healthy)"
    fi

    if [[ ${gate_ok} -eq 0 ]]; then
        # 5a. E.W9 ε.1 — auto-migration (Variant C: post-up post-health-gate).
        # Per Wχ-P4 §8 design substrate: the new container is up and serving;
        # the health gate just proved it can boot on the at-rest schema.
        # NOW invoke the idempotent runner. The migrations themselves are
        # field-selector idempotent (document-level safety); the runner adds
        # run-level tracking via the `migrations` collection (unique on
        # `(name, version)`). Fail-non-zero leaves the live deploy intact;
        # the next deploy attempt re-runs (idempotent).
        log "running pending migrations (post-up post-gate)…"
        # F.W8: the compose service is `backend` (not `api`) — the prior `api`
        # target silently no-op'd every deploy ("service api is not running"),
        # so the auto-migration runner never actually executed. This is the
        # one-token fix that upgrades W9-from-E (GREEN-pending-real-test) to
        # GREEN-verified: the runner now runs in the live backend container.
        if "${COMPOSE[@]}" exec -T -e DEPLOY_COMMIT_SHA="${new}" backend \
                uv run --no-sync python -m api.scripts.run_pending_migrations; then
            log "migrations OK"
        else
            # M.W4: a non-fatal anomaly still reaches the watched channel. It
            # does not fail the deploy (the live container runs the at-rest
            # schema), but it may never again be something only stdout knows.
            notify warning "pending migrations returned non-zero after a GREEN deploy of ${new}; the deploy STAYS GREEN (live container ran the at-rest schema) and the next deploy retries."
        fi

        printf '%s\n' "${new}" >"${GREEN_MARKER}"
        write_record "OK" "${prev}" "${new}" "${CI_RUN_ID}" \
            "health gate GREEN: liveness ok, readiness ok (inv-22)"
        notify info "DEPLOY OK ${prev} -> ${new} (CI run ${CI_RUN_ID}; liveness ok, readiness ok)"
        return 0
    fi

    # 6. Rollback-on-rollback: reset to $PREV, REBUILD, up, and RE-GATE to
    #    confirm the prior SHA came back green. M.W4 — every arm below is LOUD
    #    in the watched channel and BLOCKING (non-zero exit; the green marker is
    #    NOT advanced), and each leaves a durable deploy-of-record naming WHICH
    #    probe failed.
    local failed_probe="${GATE_FAILURE}"
    notify err "ROLLBACK — the ${failed_probe} probe failed for ${new} (CI run ${CI_RUN_ID}); reverting to ${prev}."
    git reset --hard "${prev}"
    local restored=1
    if build_and_up; then
        if health_gate; then restored=0; fi
    else
        GATE_FAILURE="bring-up (compose --wait: a service never became healthy)"
    fi
    if [[ ${restored} -eq 0 ]]; then
        write_record "ROLLED_BACK" "${prev}" "${new}" "${CI_RUN_ID}" \
            "the ${failed_probe} probe failed for ${new}; the host is serving ${prev}"
        notify err "ROLLBACK OK — the site is restored to last-known-good ${prev}; the deploy of ${new} is REJECTED (failing probe: ${failed_probe}). The host is NOT at the pushed SHA."
    else
        write_record "ALERT" "${prev}" "${new}" "${CI_RUN_ID}" \
            "rollback to ${prev} ALSO failed the ${GATE_FAILURE} probe; no green target"
        notify err "ALERT — the rollback to ${prev} ALSO failed the health gate (failing probe: ${GATE_FAILURE}). The site has NO green target. MANUAL INTERVENTION REQUIRED."
    fi
    return 1
}

# ── Entry point — serialise the whole deploy under the fourier lock ──────────
main() {
    # M.W4 — fail-closed on observability, BEFORE the lock and before any act
    # that could change the host's state.
    require_alert_channel

    log "fourier deploy-hook invoked (repo arg: ${1:-<none>})"
    exec 9>"${LOCKFILE}"
    flock 9
    deploy
}

main "$@"
