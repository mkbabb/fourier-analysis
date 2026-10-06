#!/usr/bin/env bash
# pages-smoke.sh — the post-deploy smoke for fourier.babb.dev (X §0eh, 2026-10-06).
#
# Run after `scripts/pages-deploy.sh` (the deploy-pages workflow does so). Exits
# non-zero unless ALL of:
#   1. the JS bundle served at $SMOKE_SITE contains $EXPECTED_API_BASE
#      (retried: the custom domain can lag the alias swap by a few seconds);
#   2. $EXPECTED_API_BASE/api/health returns 200 application/json with
#      {"status":"ok"} over strictly verified TLS (https only, TLS >= 1.2,
#      curl's default chain + hostname verification, never -k);
#   3. that response carries `Access-Control-Allow-Origin: $SMOKE_SITE`;
#   4. the API's certificate verifies and stays valid for > $SMOKE_CERT_MIN_DAYS days.
#
# Usage: bash scripts/pages-smoke.sh   (no secrets needed)

set -euo pipefail

SITE="${SMOKE_SITE:-https://fourier.babb.dev}"
API_BASE="${EXPECTED_API_BASE:-https://api.fourier.babb.dev}"
MIN_DAYS="${SMOKE_CERT_MIN_DAYS:-14}"
ATTEMPTS="${SMOKE_ATTEMPTS:-12}"
WAIT_S="${SMOKE_WAIT_S:-10}"

log() { printf '\033[0;32m[pages-smoke]\033[0m %s\n' "$1"; }
err() { printf '\033[0;31m[pages-smoke]\033[0m %s\n' "$1" >&2; }
CURL=(curl --fail --silent --show-error --proto '=https' --tlsv1.2 --max-time 30)

summary() { if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then echo "$1" >> "$GITHUB_STEP_SUMMARY"; fi; }
summary "### Post-deploy smoke (X §0eh)"

# ── 1. The served bundle carries the API base ────────────────────────────────
bundle_has_base() {
    local html src
    html="$("${CURL[@]}" -H 'Cache-Control: no-cache' "$SITE/?smoke=$(date +%s)")" || return 1
    for src in $(printf '%s' "$html" | grep -oE '/assets/[A-Za-z0-9._-]+\.js' | sort -u); do
        if "${CURL[@]}" "$SITE$src" | grep -qF "$API_BASE"; then
            log "bundle $src carries the API base $API_BASE"
            return 0
        fi
    done
    return 1
}
ok=""
for i in $(seq 1 "$ATTEMPTS"); do
    if bundle_has_base; then ok=1; break; fi
    log "attempt $i/$ATTEMPTS: the bundle at $SITE does not carry $API_BASE yet; retrying in ${WAIT_S}s"
    sleep "$WAIT_S"
done
if [ -z "$ok" ]; then
    err "FAIL: no entry script served at $SITE contains the API base $API_BASE."
    exit 1
fi
summary "- bundle at $SITE carries \`$API_BASE\`: PASS"

# ── 2 + 3. /api/health is JSON over strict TLS, with CORS for the site ───────
hdrs="$(mktemp)"; body="$(mktemp)"; trap 'rm -f "$hdrs" "$body"' EXIT
"${CURL[@]}" -H "Origin: $SITE" -H 'Accept: application/json' \
    -D "$hdrs" -o "$body" "$API_BASE/api/health" \
    || { err "FAIL: $API_BASE/api/health did not answer 2xx over verified TLS."; exit 1; }
ctype="$(grep -i '^content-type:' "$hdrs" | tail -1 | tr -d '\r' | cut -d' ' -f2-)"
case "$ctype" in
    application/json*) ;;
    *) err "FAIL: $API_BASE/api/health content-type is '$ctype', not application/json."; exit 1 ;;
esac
python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); sys.exit(0 if d.get("status")=="ok" else 1)' "$body" \
    || { err "FAIL: $API_BASE/api/health body is not {\"status\":\"ok\"}: $(head -c 200 "$body")"; exit 1; }
log "health: 200 $ctype $(head -c 200 "$body")"
acao="$(grep -i '^access-control-allow-origin:' "$hdrs" | tail -1 | tr -d '\r' | cut -d' ' -f2-)"
if [ "$acao" != "$SITE" ]; then
    err "FAIL: $API_BASE/api/health sends Access-Control-Allow-Origin '$acao', not '$SITE'."
    exit 1
fi
log "CORS: Access-Control-Allow-Origin $acao"
summary "- \`$API_BASE/api/health\`: 200 JSON over verified TLS, ACAO \`$acao\`: PASS"

# ── 4. Certificate verifies and has > MIN_DAYS left ──────────────────────────
host="${API_BASE#https://}"; host="${host%%/*}"
cert="$(openssl s_client -connect "$host:443" -servername "$host" -verify_hostname "$host" \
    -verify_return_error </dev/null 2>/dev/null | openssl x509 2>/dev/null)" \
    || { err "FAIL: the certificate for $host did not verify."; exit 1; }
enddate="$(printf '%s\n' "$cert" | openssl x509 -noout -enddate | cut -d= -f2)"
if ! printf '%s\n' "$cert" | openssl x509 -noout -checkend $((MIN_DAYS * 86400)) >/dev/null; then
    err "FAIL: the certificate for $host expires $enddate — within $MIN_DAYS days."
    exit 1
fi
log "cert: $host valid until $enddate (> $MIN_DAYS days)"
summary "- cert \`$host\` valid until $enddate (> $MIN_DAYS days): PASS"
log "PASS"
