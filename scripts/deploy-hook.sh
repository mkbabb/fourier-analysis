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
# X·F F.W9 unit `a` (2026-09-19) re-homes M.W2 and M.W3 out of the dead M board
# and executes them here.
#
#   M.W2 — READINESS != LIVENESS. The gate conflated two different questions in
#     one boolean: "is the backend process up?" (LIVENESS) and "is the edge
#     serving the API contract?" (READINESS, i.e. inv-22's root-404). A single
#     fused verdict cannot say WHICH failed, so an inv-22 regression and a dead
#     uvicorn produced the identical log line and the identical rollback. The
#     two probes are now separate functions with separate verdicts, separately
#     reported; the container half of the same cure is the image-level
#     HEALTHCHECKs (api/Dockerfile, web/Dockerfile) plus `depends_on:
#     condition: service_healthy` in the compose overlay, so the stack orders on
#     READINESS rather than on container-started, and `up -d --wait` reports
#     that ordering as its own exit status.
#
#   M.W3 — FAIL-CLOSED inv-28. The API arm shipped whatever `origin/master`
#     pointed at, on a bare webhook, with ZERO verification — while the SPA arm
#     (.github/workflows/deploy-pages.yml) has been inv-28-gated since H.W2 on
#     `conclusion == 'success' && head_branch == 'master' && event == 'push'`
#     with every checkout pinned to `head_sha`. That guard is MIRRORED here; it
#     is never edited there. The API now refuses any SHA without a covering
#     green CI run, and advances to that exact verified SHA rather than to a
#     moving ref. Fail-closed means REFUSAL is the default: a query that cannot
#     be answered refuses exactly as a red run does.
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
# file is the reference implementation and is READ here, never edited: its `if:`
# requires workflow_run.conclusion == 'success' && head_branch == 'master' &&
# event == 'push', and every checkout pins ref: head_sha. The three conjuncts
# map onto the REST query below one-for-one (status=success, branch=…,
# event=push), and the head_sha pin becomes `reset --hard <sha>` against the
# verified SHA instead of against a ref that may move between query and reset.
readonly REPO_SLUG="${FOURIER_REPO_SLUG:-mkbabb/fourier-analysis}"
readonly CI_WORKFLOW_FILE="${FOURIER_CI_WORKFLOW:-ci.yml}"
readonly DEPLOY_BRANCH="${FOURIER_DEPLOY_BRANCH:-master}"

log() {
    printf '[deploy-hook %s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
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
# real path, not a courtesy. Only two values are read this way: total_count,
# and the id of the first workflow run.
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

# CI_RUN_ID is set by require_green_ci on success — the covering run id, so every
# shipped SHA can cite the run that cleared it.
CI_RUN_ID=""

require_green_ci() {
    local sha="$1" body count
    local query="repos/${REPO_SLUG}/actions/workflows/${CI_WORKFLOW_FILE}/runs"
    query+="?head_sha=${sha}&branch=${DEPLOY_BRANCH}&event=push&status=success&per_page=1"

    log "inv-28 — asking GitHub for a covering green ${CI_WORKFLOW_FILE} run for ${sha} on ${DEPLOY_BRANCH}…"
    if ! body="$(gh_api "${query}")"; then
        log "inv-28 REFUSE — the covering-CI query could not be answered for ${sha}; the deploy is fail-closed and did NOT run. (Transport/API failure, or a rate limit with no GITHUB_TOKEN set.)"
        return 1
    fi

    count="$(printf '%s' "${body}" | json_scalar total_count)"
    if [[ -z "${count}" ]]; then
        log "inv-28 REFUSE — the covering-CI response for ${sha} carried no total_count; refusing rather than guessing."
        return 1
    fi
    if [[ "${count}" -lt 1 ]]; then
        log "inv-28 REFUSE — no green ${CI_WORKFLOW_FILE} push run on ${DEPLOY_BRANCH} covers ${sha}. The API is NOT shipped. (This is the demonstrable refusal the SPA arm has had since H.W2.)"
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
# GATE_FAILURE carries the named reason out to the caller: "liveness" (the
# backend never came up), "readiness" (the backend is up but the edge is serving
# the wrong contract — the inv-22 regression the fused gate could not
# distinguish), or "liveness+readiness".
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
        log "ABORT — host working tree is DIRTY; tracked changes would be discarded by reset --hard:"
        printf '%s\n' "${dirty}" >&2
        log "reconcile the host tree (commit, stash, or revert the listed paths) before deploying."
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
    # an aborting bring-up would skip the rollback entirely. A failed BUILD is a
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
        log "inv-28 — the host stays on ${prev}; nothing was built, nothing was brought up."
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
            log "WARNING — pending migrations returned non-zero; deploy STAYS GREEN (live container ran the at-rest schema); next deploy will retry"
        fi

        printf '%s\n' "${new}" >"${GREEN_MARKER}"
        log "DEPLOY OK ${prev} -> ${new} (recorded green; liveness ok, readiness ok)"
        return 0
    fi

    # 6. Rollback-on-rollback: reset to $PREV, REBUILD, up, and RE-GATE to
    #    confirm the prior SHA came back green. Exit non-zero so the receiver
    #    logs a failed deploy. Each arm names WHICH probe failed.
    local failed_probe="${GATE_FAILURE}"
    log "ROLLBACK — the ${failed_probe} probe failed for ${new}; reverting to ${prev}"
    git reset --hard "${prev}"
    local restored=1
    if build_and_up; then
        if health_gate; then restored=0; fi
    else
        GATE_FAILURE="bring-up (compose --wait: a service never became healthy)"
    fi
    if [[ ${restored} -eq 0 ]]; then
        log "ROLLBACK OK — site restored to last-known-good ${prev}; deploy of ${new} rejected (failing probe: ${failed_probe})"
    else
        log "ALERT — rollback to ${prev} ALSO failed the health gate (failing probe: ${GATE_FAILURE}); the site has no green target. Manual intervention required."
    fi
    return 1
}

# ── Entry point — serialise the whole deploy under the fourier lock ──────────
main() {
    log "fourier deploy-hook invoked (repo arg: ${1:-<none>})"
    exec 9>"${LOCKFILE}"
    flock 9
    deploy
}

main "$@"
