#!/usr/bin/env bash
# scripts/deploy.sh — fourier-analysis operator-facing deploy wrapper.
#
# The constellation deploy.sh standard (value.js:docs/dev-deploy-standard.md §5).
# A THIN wrapper over fourier's two independently-deployable surfaces — it WRAPS,
# does NOT replace, the hardened spine:
#   • api (backend)  — git push → GitHub webhook → deploy.babb.dev/hooks/fourier-analysis
#                      → the on-host scripts/deploy-hook.sh (flock + dirty-tree-
#                      fail-loud + bounded health-gate + rollback-on-rollback).
#                      No SSH, no secret herein; `git push` is the sole act.
#   • frontend (SPA) — Cloudflare Pages, via scripts/pages-deploy.sh
#                      (project pre-flight + rollback-target + ASCII commit-msg).
#
# SUBCOMMANDS: all (default) | api | frontend
# EXIT CODES:  0 success (+health where gated) · 1 deploy failed · 2 usage
#              5 missing-env · 6 missing-dep
#
# SAFETY: a push triggers a PROD deploy. This script prints exactly what it will
# do and REQUIRES explicit confirmation (interactive y/N, or --yes) before any
# `git push`. The frontend arm builds + ships to CF Pages; it is likewise gated.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ── CONFIG (fourier-fixed) ──
PROJECT_NAME="fourier-analysis"
REMOTE="${DEPLOY_REMOTE:-origin}"
BRANCH="${DEPLOY_BRANCH:-master}"
WEBHOOK_URL="https://deploy.babb.dev/hooks/${PROJECT_NAME}"
# Health-gate the live API after the webhook fires (bounded; non-fatal advisory:
# the on-host deploy-hook.sh runs the authoritative gate + rollback).
HEALTH_URL="${DEPLOY_HEALTH_URL:-https://api.fourier.babb.dev/api/health}"
GATE_RETRIES="${DEPLOY_GATE_RETRIES:-30}"
GATE_INTERVAL="${DEPLOY_GATE_INTERVAL:-2}"

ASSUME_YES=0

log()  { printf '[deploy] %s\n' "$*"; }
note() { printf '[deploy] %s\n' "$*" >&2; }
die()  { printf 'ERROR: %s\n' "$1" >&2; exit "${2:-1}"; }

require_bins() {
    local b
    for b in "$@"; do
        command -v "$b" >/dev/null 2>&1 || die "required binary '$b' not found on PATH (install it, then retry)" 6
    done
}

# Explicit confirmation gate — never push/ship without a yes.
confirm() {
    local prompt="$1"
    if [[ "$ASSUME_YES" == 1 ]]; then
        log "--yes given — proceeding without interactive confirmation."
        return 0
    fi
    if [[ ! -t 0 ]]; then
        die "refusing to proceed without confirmation (no TTY). Re-run with --yes to authorise." 1
    fi
    printf '[deploy] %s [y/N] ' "$prompt" >&2
    local reply; read -r reply
    case "$reply" in
        y|Y|yes|YES) return 0 ;;
        *) die "aborted by operator (no deploy performed)." 1 ;;
    esac
}

# ── api: git-push-driven webhook deploy + bounded advisory health-gate ──
deploy_api() {
    require_bins git
    local head_sha; head_sha="$(git rev-parse --short HEAD)"
    local dirty; dirty="$(git status --porcelain --untracked-files=no)"

    cat >&2 <<EOF
──────────────────────────────────────
  ${PROJECT_NAME} — API deploy (PROD)
──────────────────────────────────────
  WILL: git push ${REMOTE} ${BRANCH}   (HEAD ${head_sha})
  THEN: GitHub webhook → ${WEBHOOK_URL}
        → on-host scripts/deploy-hook.sh (flock + health-gate + rollback)
  THEN: advisory health-gate ${HEALTH_URL}
        (~$((GATE_RETRIES * GATE_INTERVAL))s; the AUTHORITATIVE gate is on-host)
  This pushes ${BRANCH} and triggers a PRODUCTION deploy.
──────────────────────────────────────
EOF
    if [[ -n "$dirty" ]]; then
        note "working tree has uncommitted tracked changes — they will NOT be pushed:"
        printf '%s\n' "$dirty" >&2
        note "commit or stash them first if they are meant to deploy."
    fi

    confirm "Push ${BRANCH} and trigger the prod API deploy?"

    log "pushing ${REMOTE} ${BRANCH}..."
    git push "$REMOTE" "$BRANCH" || die "git push failed — nothing deployed." 1

    # Belt-and-braces poke of the per-repo webhook. The GitHub push-trigger is
    # authoritative, so a manual-GET non-200 is NON-FATAL (the hook still fired
    # from the push). Only attempted if curl exists.
    if command -v curl >/dev/null 2>&1; then
        log "poking webhook ${WEBHOOK_URL} (advisory; push-trigger is authoritative)..."
        if curl -fsS --max-time 10 "$WEBHOOK_URL" >/dev/null 2>&1; then
            log "webhook responded 2xx"
        else
            note "webhook GET non-2xx — non-fatal (the GitHub push event already triggered the deploy)"
        fi
    fi

    # Bounded advisory health-gate. The on-host deploy-hook.sh runs the real gate
    # + rollback; this is operator feedback, not the rollback trigger.
    if command -v curl >/dev/null 2>&1; then
        log "health-gating ${HEALTH_URL} (advisory)..."
        local attempt body
        for ((attempt = 1; attempt <= GATE_RETRIES; attempt++)); do
            body="$(curl -fsS --max-time 5 "$HEALTH_URL" 2>/dev/null || true)"
            if [[ "$body" == *'"status"'*'"ok"'* ]]; then
                log "health gate GREEN (attempt ${attempt}/${GATE_RETRIES})"
                return 0
            fi
            sleep "$GATE_INTERVAL"
        done
        note "advisory health gate did not go green within ~$((GATE_RETRIES * GATE_INTERVAL))s."
        note "check the on-host deploy-hook log; it ran the authoritative gate + any rollback."
        return 1
    fi
    log "curl absent — skipping advisory health-gate (deploy was triggered by the push)."
}

# ── frontend: Cloudflare Pages, via scripts/pages-deploy.sh ──
deploy_frontend() {
    local pages="$ROOT/scripts/pages-deploy.sh"
    [[ -f "$pages" ]] || die "missing $pages (the CF Pages deploy spine)." 1

    cat >&2 <<EOF
──────────────────────────────────────
  ${PROJECT_NAME} — frontend deploy (CF Pages, PROD)
──────────────────────────────────────
  WILL: build the SPA (npm --prefix web run build)
  THEN: scripts/pages-deploy.sh → Cloudflare Pages (fourier.babb.dev)
  Requires CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in the env.
  This ships a PRODUCTION frontend deploy.
──────────────────────────────────────
EOF
    confirm "Build and ship the prod frontend to Cloudflare Pages?"

    log "delegating to scripts/pages-deploy.sh..."
    bash "$pages" || die "frontend deploy failed (see pages-deploy.sh output)." 1
    log "frontend deploy complete."
}

usage() {
    note "usage: scripts/deploy.sh [all|api|frontend] [--yes]"
    note "  api       git push → webhook → on-host deploy-hook.sh + advisory health-gate"
    note "  frontend  build SPA → Cloudflare Pages (scripts/pages-deploy.sh)"
    note "  all       both (default)"
    note "  --yes     skip the interactive confirmation (required deploys non-interactively)"
}

# ── Arg parse: one subcommand + optional --yes (any order) ──
SUB=""
for arg in "$@"; do
    case "$arg" in
        --yes|-y) ASSUME_YES=1 ;;
        all|api|frontend) [[ -n "$SUB" ]] && { usage; exit 2; }; SUB="$arg" ;;
        -h|--help) usage; exit 0 ;;
        *) usage; exit 2 ;;
    esac
done
SUB="${SUB:-all}"

case "$SUB" in
    api)      deploy_api ;;
    frontend) deploy_frontend ;;
    all)      deploy_api; deploy_frontend ;;
    *)        usage; exit 2 ;;
esac
