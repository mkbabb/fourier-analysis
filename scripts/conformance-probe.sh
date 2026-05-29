#!/bin/bash
# E.W10 δ T7 — Cross-repo CRUD-CONTRACT v2.0.0 conformance probe.
#
# Per `coordination/CONSUMER-HARDENING.md §7` + Wχ-P5 binding-doc refinement
# (T7 spec adds palette-envelope field-presence assertion).
#
# Probes both APIs + the cross-repo `palette_slug` FK seam:
#   - fourier viz API (https://api.fourier.babb.dev)
#   - palette API     (https://api.color.babb.dev) — value.js-I
#   - Cross-repo CORS preflight from fourier origin
#   - Palette envelope field-presence (per CRUD-CONTRACT §1.3 + §3 + §4 + §5)
#
# Designed cron-runnable: silent on full PASS; verbose on any FAIL; exits
# non-zero on FAIL so CI / cron can alert.
#
# Usage:
#   bash scripts/conformance-probe.sh                          # all probes
#   bash scripts/conformance-probe.sh --slug=hey-v2-...        # named palette
#   PALETTE_API=https://staging.color... bash conformance-probe.sh

set -euo pipefail

PALETTE_API="${PALETTE_API:-https://api.color.babb.dev}"
FOURIER_API="${FOURIER_API:-https://api.fourier.babb.dev}"
FOURIER_ORIGIN="${FOURIER_ORIGIN:-https://fourier.babb.dev}"
PROBE_SLUG="${PROBE_SLUG:-neon-cyberpunk}"

# Parse --slug=... argument (optional).
for arg in "$@"; do
    case "$arg" in
        --slug=*) PROBE_SLUG="${arg#--slug=}" ;;
    esac
done

PASS=0
FAIL=0
LOG_LINES=()

log() { LOG_LINES+=("$1"); }
ok()  { PASS=$((PASS + 1)); log "  PASS: $1"; }
err() { FAIL=$((FAIL + 1)); log "  FAIL: $1"; }

probe_palette_api_health() {
    log "── palette API ${PALETTE_API} ──"
    local code
    code=$(curl -sS -o /dev/null -w "%{http_code}" "${PALETTE_API}/palettes")
    if [ "$code" = "200" ]; then ok "GET /palettes → 200"
    else err "GET /palettes → ${code} (expected 200)"; fi
}

probe_palette_envelope_fields() {
    local body
    body=$(curl -sS -i "${PALETTE_API}/palettes/${PROBE_SLUG}")
    # Field-presence assertions per CRUD-CONTRACT v2.0.0 + I.W1-W4.
    if echo "$body" | grep -q '"slug"'; then ok "envelope carries slug"; else err "envelope missing slug"; fi
    if echo "$body" | grep -q '"visibility"'; then ok "envelope carries visibility (I.W1)"; else err "envelope missing visibility (I.W1)"; fi
    if echo "$body" | grep -q '"tier"'; then ok "envelope carries tier (I.W1)"; else err "envelope missing tier (I.W1)"; fi
    if echo "$body" | grep -q '"deletedAt"'; then ok "envelope carries deletedAt (I.W2)"; else err "envelope missing deletedAt (I.W2)"; fi
    if echo "$body" | grep -iq "^etag:"; then ok "ETag header present (I.W4)"; else err "ETag header missing (I.W4)"; fi
    if echo "$body" | grep -iq "^ratelimit-limit:"; then ok "RateLimit-Limit header present (I.W4)"; else err "RateLimit-Limit header missing (I.W4)"; fi
    if echo "$body" | grep -iq "^ratelimit-remaining:"; then ok "RateLimit-Remaining present (I.W4)"; else err "RateLimit-Remaining missing (I.W4)"; fi
}

probe_palette_problem_json() {
    local body
    body=$(curl -sS -i "${PALETTE_API}/palettes/__definitely-not-a-real-slug__zzz999")
    if echo "$body" | grep -iq "content-type: application/problem+json"; then
        ok "404 carries application/problem+json (I.W4)"
    else
        err "404 missing application/problem+json content-type (I.W4)"
    fi
    if echo "$body" | grep -q 'urn:palette-api:problem:not_found'; then
        ok "404 problem type URN scheme (I.W4)"
    else
        err "404 missing urn:palette-api:problem:not_found"
    fi
}

probe_cross_repo_cors() {
    log "── cross-repo CORS (fourier → palette) ──"
    local headers
    headers=$(curl -sS -X OPTIONS "${PALETTE_API}/palettes/${PROBE_SLUG}" \
        -H "Origin: ${FOURIER_ORIGIN}" \
        -H "Access-Control-Request-Method: GET" \
        -D - -o /dev/null)
    if echo "$headers" | grep -iq "access-control-allow-origin: ${FOURIER_ORIGIN}"; then
        ok "preflight ACAO echoes ${FOURIER_ORIGIN} (E.W1 T4)"
    else
        err "preflight ACAO does NOT echo ${FOURIER_ORIGIN} (E.W1 T4 regression)"
    fi
}

probe_fourier_health() {
    log "── fourier viz API ${FOURIER_API} ──"
    local code
    code=$(curl -sS -o /dev/null -w "%{http_code}" "${FOURIER_API}/health")
    if [ "$code" = "200" ]; then ok "GET /health → 200"
    else err "GET /health → ${code} (expected 200)"; fi
}

probe_palette_api_health
probe_palette_envelope_fields
probe_palette_problem_json
probe_cross_repo_cors
probe_fourier_health

TOTAL=$((PASS + FAIL))
if [ "$FAIL" -eq 0 ]; then
    echo "T7 conformance probe: ${PASS}/${TOTAL} PASS"
    exit 0
else
    echo "T7 conformance probe: ${PASS}/${TOTAL} PASS; ${FAIL} FAIL"
    for line in "${LOG_LINES[@]}"; do echo "$line"; done
    exit 1
fi
