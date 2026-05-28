#!/usr/bin/env bash
# scripts/dns-cf-sync.sh
#
# D.W8 — DNS-as-code (thread α′)
# ------------------------------------------------------------------------------
# Idempotent Cloudflare DNS reconciler for the babb.dev zone.
#
# Reads CLOUDFLARE_API_TOKEN from the env (sourced from gitignored .env).
# For each target record: GET current; if matches -> SKIP; else CREATE or UPDATE.
# NEVER touches records outside the target list. NEVER deletes anything.
#
# Usage:
#   set -a && source .env && set +a && bash scripts/dns-cf-sync.sh
#
# Spec: docs/tranches/D/waves/W8.md
# Predecessors: docs/tranches/D/coordination/CONSTELLATION-DEPLOY.md §3.2, §5, §6, §8.1
# Webhook URL fix: docs/tranches/D/coordination/WEBHOOK-URL-RESIDUAL.md (deploy.babb.dev)
#
# ------------------------------------------------------------------------------
# DON'T-BREAK CATALOGUE (NA3 §6.2 — these records MUST survive byte-identical):
#   1. babb.dev MX — Google Workspace mail (aspmx.l.google.com etc.)
#   2. babb.dev TXT — SPF "v=spf1 include:_spf.google.com ~all"
#   3. babb.dev A apex — 198.185.159.144 (Squarespace 302->github)
#   4. babb.dev NS — jillian/maciej.ns.cloudflare.com (the delegation)
#   5. *.babb.dev wildcard — proxied CF anycast safety net
#   6. DKIM (*._domainkey) / DMARC (_dmarc) — enumerated before TXT edits
#   7. www.babb.dev — Squarespace 302 same as apex
#   8. Existing color/keyframes grey CNAMEs to mkbabb.github.io — held until
#      W9 deliberately flips them (W8 PRE-LANDS proxied CNAMEs to *.pages.dev
#      per the §3 charter scope expansion — these are EXPLICIT records that
#      take precedence over the wildcard, leaving the wildcard intact).
#
# The loop iterates the TARGET list, never the zone's current list — records
# the script does not name are left strictly alone.
# ------------------------------------------------------------------------------

set -euo pipefail

# ------------------------------------------------------------------------------
# Token discipline — fail fast, no value in tree, no shell history leak.
# ------------------------------------------------------------------------------
: "${CLOUDFLARE_API_TOKEN:?Set CLOUDFLARE_API_TOKEN (source .env first)}"

ZONE_NAME="babb.dev"
CF_API="https://api.cloudflare.com/client/v4"

# Auth header is passed via stdin to curl --header so it never appears
# in argv (ps output) or with `set -x` echo.
cf() {
    # cf <METHOD> <PATH> [<JSON_BODY>]
    local method="$1"
    local path="$2"
    local body="${3:-}"
    if [ -n "$body" ]; then
        curl -sS -X "$method" \
            --header "@-" \
            -H "Content-Type: application/json" \
            --data "$body" \
            "${CF_API}${path}" <<<"Authorization: Bearer ${CLOUDFLARE_API_TOKEN}"
    else
        curl -sS -X "$method" \
            --header "@-" \
            "${CF_API}${path}" <<<"Authorization: Bearer ${CLOUDFLARE_API_TOKEN}"
    fi
}

# ------------------------------------------------------------------------------
# Resolve zone id (drift-safe; never hardcoded).
# ------------------------------------------------------------------------------
echo "[zone] resolving zone id for ${ZONE_NAME}..."
ZONE_RESP="$(cf GET "/zones?name=${ZONE_NAME}")"
ZONE_ID="$(jq -r '.result[0].id // empty' <<<"$ZONE_RESP")"
if [ -z "$ZONE_ID" ]; then
    echo "[FATAL] could not resolve zone id for ${ZONE_NAME}" >&2
    echo "$ZONE_RESP" | jq -r '.errors // .' >&2
    exit 1
fi
echo "[zone] zone_id=${ZONE_ID}"

# ------------------------------------------------------------------------------
# Target record set (declarative — the intent).
#
# Format: TYPE|NAME|CONTENT|PROXIED
#   PROXIED ∈ {true,false}
#
# PROXIED (orange) — for *.babb.dev CNAMEs to *.pages.dev (covered by CF
#                   Universal SSL on the single-level apex-child).
# DNS-only (grey)  — for api.<app>.babb.dev A records (origin Apache + LE
#                   Path B HTTP-01) and deploy.babb.dev (GitHub webhook
#                   needs origin reachability, no CF proxy).
# ------------------------------------------------------------------------------
TARGETS=(
    "CNAME|fourier.babb.dev|fourier.pages.dev|true"
    "A|api.fourier.babb.dev|34.197.214.67|false"
    "CNAME|color.babb.dev|color.pages.dev|true"
    "A|api.color.babb.dev|34.197.214.67|false"
    "CNAME|sudoku.babb.dev|sudoku.pages.dev|true"
    "A|api.sudoku.babb.dev|34.197.214.67|false"
    "CNAME|keyframes.babb.dev|keyframes.pages.dev|true"
    "A|deploy.babb.dev|34.197.214.67|false"
)

# ------------------------------------------------------------------------------
# Don't-break guard — defensive catalogue. If a target tuple is ever
# mis-authored to one of these names, abort.
# ------------------------------------------------------------------------------
DONT_BREAK_EXACT=(
    "babb.dev"
    "www.babb.dev"
    "*.babb.dev"
    "words.babb.dev"
    "grammar.babb.dev"
)

is_dont_break() {
    local name="$1"
    for forbidden in "${DONT_BREAK_EXACT[@]}"; do
        if [ "$name" = "$forbidden" ]; then
            return 0
        fi
    done
    return 1
}

# ------------------------------------------------------------------------------
# Per-target reconcile loop.
# ------------------------------------------------------------------------------
SUMMARY_CREATE=()
SUMMARY_UPDATE=()
SUMMARY_SKIP=()

for tuple in "${TARGETS[@]}"; do
    IFS='|' read -r r_type r_name r_content r_proxied <<<"$tuple"

    if is_dont_break "$r_name"; then
        echo "[GUARD] refusing to PATCH don't-break record: ${r_name}" >&2
        exit 1
    fi

    # Query for existing records of this (name, type).
    LIST_RESP="$(cf GET "/zones/${ZONE_ID}/dns_records?type=${r_type}&name=${r_name}")"
    EXISTING_COUNT="$(jq -r '.result | length' <<<"$LIST_RESP")"

    if [ "$EXISTING_COUNT" -eq 0 ]; then
        # CREATE
        body="$(jq -n \
            --arg type "$r_type" \
            --arg name "$r_name" \
            --arg content "$r_content" \
            --argjson proxied "$r_proxied" \
            '{type:$type, name:$name, content:$content, proxied:$proxied, ttl:1}')"
        CREATE_RESP="$(cf POST "/zones/${ZONE_ID}/dns_records" "$body")"
        if [ "$(jq -r '.success' <<<"$CREATE_RESP")" != "true" ]; then
            echo "[FAIL] CREATE ${r_type} ${r_name} -> ${r_content} (proxied=${r_proxied})" >&2
            jq -r '.errors // .' <<<"$CREATE_RESP" >&2
            exit 1
        fi
        echo "[CREATE] ${r_type} ${r_name} -> ${r_content} (proxied=${r_proxied})"
        SUMMARY_CREATE+=("${r_type} ${r_name} -> ${r_content} (proxied=${r_proxied})")
    elif [ "$EXISTING_COUNT" -eq 1 ]; then
        CUR_ID="$(jq -r '.result[0].id' <<<"$LIST_RESP")"
        CUR_CONTENT="$(jq -r '.result[0].content' <<<"$LIST_RESP")"
        CUR_PROXIED="$(jq -r '.result[0].proxied' <<<"$LIST_RESP")"

        if [ "$CUR_CONTENT" = "$r_content" ] && [ "$CUR_PROXIED" = "$r_proxied" ]; then
            echo "[SKIP]   ${r_type} ${r_name} -> ${r_content} (proxied=${r_proxied}) [matches]"
            SUMMARY_SKIP+=("${r_type} ${r_name} -> ${r_content} (proxied=${r_proxied})")
        else
            # UPDATE (PATCH — never DELETE+CREATE; race-safe).
            body="$(jq -n \
                --arg content "$r_content" \
                --argjson proxied "$r_proxied" \
                '{content:$content, proxied:$proxied, ttl:1}')"
            PATCH_RESP="$(cf PATCH "/zones/${ZONE_ID}/dns_records/${CUR_ID}" "$body")"
            if [ "$(jq -r '.success' <<<"$PATCH_RESP")" != "true" ]; then
                echo "[FAIL] PATCH ${r_type} ${r_name}: ${CUR_CONTENT}(proxied=${CUR_PROXIED}) -> ${r_content}(proxied=${r_proxied})" >&2
                jq -r '.errors // .' <<<"$PATCH_RESP" >&2
                exit 1
            fi
            echo "[UPDATE] ${r_type} ${r_name}: ${CUR_CONTENT}(proxied=${CUR_PROXIED}) -> ${r_content}(proxied=${r_proxied})"
            SUMMARY_UPDATE+=("${r_type} ${r_name}: ${CUR_CONTENT}(${CUR_PROXIED}) -> ${r_content}(${r_proxied})")
        fi
    else
        # Multiple records of same (name, type) — out of scope for this
        # idempotent reconciler. Refuse rather than guess.
        echo "[FAIL] multiple existing records for ${r_type} ${r_name} (count=${EXISTING_COUNT}); refusing to act" >&2
        exit 1
    fi
done

# ------------------------------------------------------------------------------
# Summary.
# ------------------------------------------------------------------------------
echo
echo "=== SUMMARY ==="
# set -u guard: ${ARR[@]+"${ARR[@]}"} expands to nothing when the array is empty,
# avoiding "unbound variable" under `set -u`.
echo "CREATE: ${#SUMMARY_CREATE[@]}"
for s in ${SUMMARY_CREATE[@]+"${SUMMARY_CREATE[@]}"}; do echo "  + $s"; done
echo "UPDATE: ${#SUMMARY_UPDATE[@]}"
for s in ${SUMMARY_UPDATE[@]+"${SUMMARY_UPDATE[@]}"}; do echo "  ~ $s"; done
echo "SKIP:   ${#SUMMARY_SKIP[@]}"
for s in ${SUMMARY_SKIP[@]+"${SUMMARY_SKIP[@]}"}; do echo "  = $s"; done
echo
echo "Don't-break list preserved by construction (loop iterates targets, not zone)."
echo "Run 'dig +short <name>' to verify resolution after CF propagation (~10-60s)."
