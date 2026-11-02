#!/usr/bin/env bash
# scripts/deploy.sh — fourier-analysis operator-facing deploy wrapper.
#
# The constellation deploy.sh standard (value.js:docs/dev-deploy-standard.md §5).
# A THIN wrapper over fourier's two independently-deployable surfaces — it WRAPS,
# does NOT replace, the hardened spine:
#   • api (backend)  — git push → ci.yml green → deploy-trigger.yml (X §0hc.3)
#                      → HMAC-signed `ci-green` POST to deploy.babb.dev/hooks/fourier-analysis
#                      → the on-host scripts/deploy-hook.sh (inv-28 + flock + dirty-
#                      tree-fail-loud + bounded health-gate + rollback-on-rollback).
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
# The deploy-of-record the host publishes; deploy-alert.yml watches it for OK.
RECORD_URL="${DEPLOY_RECORD_URL:-https://api.fourier.babb.dev/deploy-record.json}"

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

# ── api: git push; the deploy is requested after CI is green (X §0hc.3) ──
deploy_api() {
    require_bins git
    local head_sha; head_sha="$(git rev-parse --short HEAD)"
    local dirty; dirty="$(git status --porcelain --untracked-files=no)"

    cat >&2 <<EOF
──────────────────────────────────────
  ${PROJECT_NAME} — API deploy (PROD)
──────────────────────────────────────
  WILL: git push ${REMOTE} ${BRANCH}   (HEAD ${head_sha})
  THEN: ci.yml runs; once it is GREEN, deploy-trigger.yml POSTs the signed
        ci-green request to ${WEBHOOK_URL}
        → on-host scripts/deploy-hook.sh (inv-28 + flock + health-gate + rollback)
  THEN: deploy-alert.yml watches ${RECORD_URL} for OK at the SHA
        (and opens a deploy-alert issue if it does not get there)
  This pushes ${BRANCH} and, once CI is green, triggers a PRODUCTION deploy.
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

    # Nothing to poke or health-gate here: the host deploys only on the
    # ci-green request, which CI sends once it is green (minutes from now), and
    # until then the live API is still the previous SHA.
    log "pushed. The deploy is requested when CI is green; watch: gh run list --workflow deploy-trigger.yml"
    log "the deploy-of-record (OK at the SHA when done): ${RECORD_URL}"
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
    note "  api       git push → CI green → deploy-trigger.yml → on-host deploy-hook.sh"
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
