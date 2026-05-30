#!/usr/bin/env bash
# pages-deploy.sh — fourier's tracked Cloudflare Pages deploy (the SPA half).
#
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║ G.α (tranche G) — the deploy-of-record for fourier.babb.dev's SPA.        ║
# ║ Adopted from the constellation spine `mkbabb/deploy` cf/pages-deploy.sh   ║
# ║ per that recipe's own "HOW AN APP ADOPTS THIS: copy to the app's          ║
# ║ scripts/" instruction. fourier-tuned: PAGES_PROJECT=fourier-682,          ║
# ║ BUILD in web/, BUILD_DIR=web/dist, + a NEW-deployment-ID capture so the    ║
# ║ automated run is citable (inv-25 deploy-of-record-automated).             ║
# ╚══════════════════════════════════════════════════════════════════════════╝
#
# WHY THIS EXISTS (G.α / inv-25)
# ------------------------------
# The constellation auto-deploy (webhook → host deploy-hook) drives ONLY the API
# (origin Apache → docker nginx → FastAPI). The SPA is Cloudflare-Pages-served
# and was, before G, shipped by a MANUAL `wrangler pages deploy` that nobody ran
# after F's δ work — so prod never served F's δ (font-SHA pin, robots.txt,
# meta-description, a11y). This script is the SPA's standing automated path:
# invoked by `.github/workflows/deploy-pages.yml` on every push to master that
# touches `web/**`. The CF deployment ID it captures is the inv-25 deploy_run_id.
#
# THREE PROPERTIES INHERITED FROM THE SPINE RECIPE
#   1. PROJECT pre-flight — assert the Pages slug exists BEFORE the build so a
#      wrong slug fails fast instead of 404-ing after a wasted build.
#   2. ROLLBACK-target capture — record the current-live deployment ID BEFORE
#      the alias swap (recover via `wrangler pages deployment rollback <id>`).
#   3. COMMIT-MESSAGE sanitisation — transliterate the HEAD body to printable
#      ASCII (this codebase uses U+2014 em-dashes; wrangler 4.x rejects them).
#
# SECRET DISCIPLINE
#   CLOUDFLARE_API_TOKEN (Pages:Edit + Read) + CLOUDFLARE_ACCOUNT_ID come from
#   the env (a GH Actions repo secret in CI, or the local `.env` for a manual
#   break-glass run). NEVER committed, NEVER inlined, NEVER echoed.
#
# Usage (CI): the workflow exports the two CF env vars, then `bash scripts/pages-deploy.sh`.
# Usage (local break-glass): `set -a && source web/.env && set +a && bash scripts/pages-deploy.sh`

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ── Configuration (fourier-fixed) ─────────────────────────────────────────────
: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN (Pages:Edit + Read scope)}"
CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:?Set CLOUDFLARE_ACCOUNT_ID}"
export CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID
PAGES_PROJECT="${PAGES_PROJECT:-fourier}"       # CF project NAME (verified live; `fourier-682` is only the .pages.dev subdomain)
PAGES_BRANCH="${PAGES_BRANCH:-master}"
BUILD_DIR="${BUILD_DIR:-web/dist}"              # vite default outDir under web/

log() { printf '\033[0;32m[pages-deploy]\033[0m %s\n' "$1"; }
err() { printf '\033[0;31m[pages-deploy]\033[0m %s\n' "$1" >&2; }

WRANGLER=(npx --yes wrangler)

# ── 1. Project pre-flight — fail fast on a wrong/missing slug ──────────────────
log "Pre-flight: confirming Pages project '$PAGES_PROJECT' exists..."
if ! "${WRANGLER[@]}" pages project list 2>/dev/null \
    | grep -qE "(^|[[:space:]])${PAGES_PROJECT}([[:space:]]|$)"; then
    err "Pages project '$PAGES_PROJECT' not found under account $CLOUDFLARE_ACCOUNT_ID."
    err "Run \`npx wrangler pages project list\` to see available slugs."
    err "Verify CLOUDFLARE_API_TOKEN scope includes Pages:Read."
    exit 1
fi

# ── 2. Capture the current live deployment as the rollback target ──────────────
log "Recording current live deployment as rollback target..."
ROLLBACK_ID="$("${WRANGLER[@]}" pages deployment list \
    --project-name "$PAGES_PROJECT" --json 2>/dev/null \
    | jq -r '.[0].id // empty' 2>/dev/null || true)"
if [ -n "$ROLLBACK_ID" ]; then
    log "Rollback target: $ROLLBACK_ID"
    log "  recover with: npx wrangler pages deployment rollback $ROLLBACK_ID --project-name $PAGES_PROJECT"
else
    err "Could not capture rollback target (first deploy, or list failed) — read it from the CF dashboard if needed."
fi

# ── 3. Build the SPA (in web/) ────────────────────────────────────────────────
log "Building the SPA (npm run build in web/)..."
npm --prefix web run build
[ -d "$BUILD_DIR" ] || { err "build dir '$BUILD_DIR' not found after build"; exit 1; }

# ── 4. Sanitise the commit message (wrangler 4.x rejects non-printable bytes) ──
raw_msg="$(git -C "$ROOT" log -1 --pretty=%B)"
sanitized_msg=""
if command -v iconv >/dev/null 2>&1; then
    sanitized_msg="$(printf '%s' "$raw_msg" | iconv -f utf-8 -t ascii//TRANSLIT 2>/dev/null || true)"
fi
if [ -z "${sanitized_msg:-}" ]; then
    sanitized_msg="$(printf '%s' "$raw_msg" | LC_ALL=C tr -cd '\11\12\15\40-\176')"
fi
[ -z "$sanitized_msg" ] && sanitized_msg="$raw_msg"

# ── 5. Deploy ─────────────────────────────────────────────────────────────────
log "Deploying $BUILD_DIR → Cloudflare Pages project '$PAGES_PROJECT'..."
"${WRANGLER[@]}" pages deploy "$BUILD_DIR" \
    --project-name "$PAGES_PROJECT" \
    --branch "$PAGES_BRANCH" \
    --commit-dirty=true \
    --commit-message "$sanitized_msg"

# ── 6. Capture the NEW live deployment ID — the inv-25 deploy_run_id ───────────
DEPLOY_ID="$("${WRANGLER[@]}" pages deployment list \
    --project-name "$PAGES_PROJECT" --json 2>/dev/null \
    | jq -r '.[0].id // empty' 2>/dev/null || true)"
log "Deployed: https://${PAGES_PROJECT}.pages.dev/ (custom domain fourier.babb.dev)"
if [ -n "$DEPLOY_ID" ]; then
    log "CF deployment ID (inv-25 deploy_run_id): $DEPLOY_ID"
    # Surface to GH Actions: job output + step summary (never the token, only the id).
    if [ -n "${GITHUB_OUTPUT:-}" ]; then echo "cf_deployment_id=$DEPLOY_ID" >> "$GITHUB_OUTPUT"; fi
    if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
        {
            echo "### Cloudflare Pages deploy"
            echo "- project: \`$PAGES_PROJECT\`"
            echo "- CF deployment ID (inv-25 deploy_run_id): \`$DEPLOY_ID\`"
            echo "- rollback target (prior live): \`${ROLLBACK_ID:-none}\`"
        } >> "$GITHUB_STEP_SUMMARY"
    fi
fi
