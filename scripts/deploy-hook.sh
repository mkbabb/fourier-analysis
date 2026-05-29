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
# It carries NO secret — the HMAC secret lives only in GitHub's webhook config
# and the host's un-tracked hooks.json (see the precepts note staged in
# DEPLOY-RECONCILE.md). It carries NO SSH key and NO password.

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
# The deploy target and the compose invocation mirror the retired deploy.sh
# (lines 26, 29) verbatim — build --parallel then up -d, the same two-file
# compose overlay.
readonly REPO_DIR="/var/www/fourier-analysis"
readonly COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)

# The health-gate port is sourced from ${HTTP_PORT:-8100} — the SAME default the
# compose nginx bind uses (docker-compose.prod.yml:72,
# "127.0.0.1:${HTTP_PORT:-8100}:80") — so the gate and the bind cannot drift.
# This is the structural fix for the wrong-port class of bug (the retired
# deploy.sh curled a stale, hard-coded port and swallowed the failure with
# `|| echo`, so a dead service "passed").
readonly HEALTH_PORT="${HTTP_PORT:-8100}"
readonly HEALTH_URL="http://127.0.0.1:${HEALTH_PORT}/api/health"
# F.W1 (inv-22): the API host root is intentionally a 404 problem+json — NOT an
# SPA index. The gate probes it for exactly that, so the gate now also
# co-enforces inv-22 on every deploy (a stale SPA-fallback regression fails the
# gate and rolls back). The real frontend is CF-Pages-served; the origin nginx
# serves the API surface.
readonly ROOT_URL="http://127.0.0.1:${HEALTH_PORT}/"

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

log() {
    printf '[deploy-hook %s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

# ── Health gate ──────────────────────────────────────────────────────────────
# Polls /api/health (expecting {"status":"ok"} — backend liveness) AND the API
# root (expecting HTTP 404 — the inv-22 contract: the API host root is NOT an
# SPA index). Returns 0 only when BOTH are green; non-zero on timeout. NO
# swallow — the caller relies on the exit status as the rollback trigger.
health_gate() {
    local attempt
    for ((attempt = 1; attempt <= GATE_RETRIES; attempt++)); do
        local body root_code
        body="$(curl -fsS --max-time 5 "${HEALTH_URL}" 2>/dev/null || true)"
        root_code="$(curl -sS --max-time 5 -o /dev/null -w '%{http_code}' "${ROOT_URL}" 2>/dev/null || true)"
        if [[ "${body}" == *'"status"'*'"ok"'* ]] && [[ "${root_code}" == "404" ]]; then
            log "health gate GREEN on :${HEALTH_PORT} (attempt ${attempt}/${GATE_RETRIES}; /api/health ok, / → 404 inv-22)"
            return 0
        fi
        sleep "${GATE_INTERVAL}"
    done
    log "health gate FAILED on :${HEALTH_PORT} after ${GATE_RETRIES} attempts (~$((GATE_RETRIES * GATE_INTERVAL))s)"
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
    log "bringing up (up -d)…"
    "${COMPOSE[@]}" up -d
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

    # 3. Advance to the pushed SHA.
    git fetch origin
    git reset --hard origin/master
    local new
    new="$(git rev-parse HEAD)"
    log "advancing ${prev} -> ${new}"

    # 4. Build + up.
    build_and_up

    # 5. The REAL health gate. Its failure is the rollback trigger.
    if health_gate; then
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
        log "DEPLOY OK ${prev} -> ${new} (recorded green)"
        return 0
    fi

    # 6. Rollback-on-rollback: reset to $PREV, REBUILD, up, and RE-GATE to
    #    confirm the prior SHA came back green. Exit non-zero so the receiver
    #    logs a failed deploy.
    log "ROLLBACK — health gate failed for ${new}; reverting to ${prev}"
    git reset --hard "${prev}"
    build_and_up
    if health_gate; then
        log "ROLLBACK OK — site restored to last-known-good ${prev}; deploy of ${new} rejected"
    else
        log "ALERT — rollback to ${prev} ALSO failed the health gate; the site has no green target. Manual intervention required."
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
