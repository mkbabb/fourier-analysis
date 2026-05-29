#!/bin/bash
# E.W8 T-S3 — Constellation-wide GitHub webhook URL coordinator.
#
# Per Wα-R3 Δ-R3.3: T-S3 retires the host-side dispatcher
# (`/opt/deploy/scripts/dispatch.sh`) in favour of per-repo webhook URLs at
# `deploy.babb.dev/hooks/<repo>`. This script atomically registers the new
# per-repo URLs for the 5 sibling repos in the constellation. Each repo's
# existing single-multiplex webhook (pointing at the shared `/hooks/deploy`)
# is replaced with its repo-specific URL.
#
# The host-side flip is operator-coordinated (separate runbook):
#   1. Author 5 per-repo entries in `/opt/deploy/hooks.json` (each invoking
#      that repo's own `scripts/deploy-hook.sh` with the right working_dir).
#   2. Restart the webhook receiver.
#   3. Run THIS script to flip the 5 GitHub repo webhook URLs atomically.
#   4. Smoke-test each repo's deploy via `gh api repos/<owner>/<repo>/hooks/<id>/test`.
#   5. Remove `/opt/deploy/scripts/dispatch.sh` (the latent-broken
#      `mkbabb/value.js)` arm dies with it).
#
# Usage:
#   bash scripts/update-webhook-urls.sh         # dry-run (shows actions)
#   bash scripts/update-webhook-urls.sh --apply # actually flip URLs
#
# Pre-flight checklist (manual):
#   - gh auth status: authenticated for mkbabb
#   - Each /opt/deploy/hooks.json entry exists for the 5 repos
#   - Webhook receiver reloaded post-edit

set -euo pipefail

DRY_RUN=true
if [ "${1:-}" = "--apply" ]; then
    DRY_RUN=false
fi

REPOS=(
    "mkbabb/fourier-analysis"
    "mkbabb/words"
    "mkbabb/speedtest"
    "mkbabb/value.js"
    "mkbabb/csp-solver"
)

DEPLOY_HOOKS_BASE="https://deploy.babb.dev/hooks"

if ! gh auth status >/dev/null 2>&1; then
    echo "ERROR: gh auth status failed. Run 'gh auth login -h github.com' first."
    exit 1
fi

echo "==> Constellation webhook URL coordinator (T-S3)"
echo "    Mode: $([ "$DRY_RUN" = true ] && echo 'DRY-RUN' || echo 'APPLY')"
echo "    Target: per-repo URLs at ${DEPLOY_HOOKS_BASE}/<repo>"
echo

for repo in "${REPOS[@]}"; do
    repo_name="${repo##*/}"
    target_url="${DEPLOY_HOOKS_BASE}/${repo_name}"
    echo "--- ${repo} ---"

    # Find the existing deploy.babb.dev webhook by URL prefix match.
    hooks_json=$(gh api "repos/${repo}/hooks" 2>/dev/null || echo "[]")
    hook_id=$(echo "$hooks_json" | jq -r '.[] | select(.config.url | startswith("https://deploy.babb.dev")) | .id' | head -1)

    if [ -z "$hook_id" ] || [ "$hook_id" = "null" ]; then
        echo "  WARN: no deploy.babb.dev webhook found on ${repo}. Skipping."
        continue
    fi

    current_url=$(echo "$hooks_json" | jq -r ".[] | select(.id == ${hook_id}) | .config.url")
    echo "  Current: ${current_url}"
    echo "  Target:  ${target_url}"

    if [ "$current_url" = "$target_url" ]; then
        echo "  OK (already at target)."
        continue
    fi

    if [ "$DRY_RUN" = true ]; then
        echo "  DRY-RUN — would PATCH hooks/${hook_id} → ${target_url}"
        continue
    fi

    gh api -X PATCH "repos/${repo}/hooks/${hook_id}" \
        -f "config[url]=${target_url}" \
        -f "config[content_type]=json" \
        >/dev/null
    echo "  PATCHED to ${target_url}"
done

echo
if [ "$DRY_RUN" = true ]; then
    echo "==> Dry-run complete. Re-run with --apply to flip URLs."
else
    echo "==> Apply complete. Verify each repo via:"
    for repo in "${REPOS[@]}"; do
        echo "    gh api repos/${repo}/hooks/<id>/test"
    done
fi
